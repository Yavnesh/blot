from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.api import deps
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, Post as PostSchema
from app.services.agent_service import AgentService
from app.models.user import Organization

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PostSchema])
def read_posts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    pipeline_type: Optional[str] = None,
    current_org: Organization = Depends(deps.get_current_active_org)
) -> Any:
    query = db.query(Post).filter(Post.org_id == current_org.id)
    if pipeline_type == "instagram":
        query = query.filter(Post.pub_platform == "instagram")
    elif pipeline_type == "blog":
        query = query.filter(Post.pub_platform != "instagram")
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.post("/", response_model=PostSchema)
def create_post(
    *, 
    db: Session = Depends(deps.get_db), 
    post_in: PostCreate,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    post = Post(**post_in.model_dump(exclude={"org_id"}), org_id=current_org.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.put("/{id}", response_model=PostSchema)
def update_post(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int, 
    post_in: PostUpdate,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    update_data = post_in.model_dump(exclude_unset=True)
    
    # --- PHASE 3: FEEDBACK LOOP / CORRECTION LOGGING ---
    # If the user is modifying the content of a generated draft, capture a CorrectionLog
    if "content" in update_data and post.content:
        old_content = post.content[0] if isinstance(post.content, list) and len(post.content) > 0 else str(post.content)
        new_content = update_data["content"][0] if isinstance(update_data["content"], list) and len(update_data["content"]) > 0 else str(update_data["content"])
        
        # Only log if there's a meaningful change and it's not a tiny typo fix
        if old_content and new_content and old_content != new_content and len(new_content) > 100:
            from app.models.correction import CorrectionLog
            try:
                import diff_match_patch as dmp_module
                dmp = dmp_module.diff_match_patch()
                diffs = dmp.diff_main(old_content, new_content)
                dmp.diff_cleanupSemantic(diffs)
                # Count significant changes as a heuristic
                if len(diffs) > 1:
                    log = CorrectionLog(
                        org_id=current_org.id,
                        post_id=post.id,
                        original_ai_draft=old_content,
                        human_edited_draft=new_content,
                        edit_category="General Edit",
                        computed_diff=[{"operation": op, "text": text} for op, text in diffs[:50]]
                    )
                    db.add(log)
            except ImportError:
                # Fallback if diff_match_patch isn't installed properly
                log = CorrectionLog(
                    org_id=current_org.id,
                    post_id=post.id,
                    original_ai_draft=old_content,
                    human_edited_draft=new_content,
                    edit_category="General Edit"
                )
                db.add(log)

    for field, value in update_data.items():
        setattr(post, field, value)
        
    db.add(post)
    db.commit()
    db.refresh(post)
    return post
@router.delete("/{id}", response_model=PostSchema)
def delete_post(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return post

# ─────────────────────────────────────────────────────────────────────────────
# BLOG-SPECIFIC ENDPOINTS (RERUN & PUBLISH)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{id}/rerun-agent", response_model=dict)
async def rerun_agent(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int, 
    agent_key: str,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    """Rerun a specific agent for an existing post."""
    result = await AgentService.rerun_agent_for_post(db, id, agent_key, current_org.id)
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
    return result

@router.post("/{id}/confirm-rerun", response_model=PostSchema)
def confirm_rerun(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    agent_key: str,
    new_data: dict,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    """Confirm and save rerun data."""
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Apply new data based on agent
    if agent_key == "seo":
        post.seo_data = new_data.get("seo_data", post.seo_data)
        if "score" in new_data:
            post.seo_data["score"] = new_data["score"]
    elif agent_key in ["draft", "voice", "readability"]:
        # Update content array
        new_content = new_data.get("final_draft") or new_data.get("content_with_seo")
        if new_content:
            post.content = [new_content]
    elif agent_key == "evaluator":
        post.meta = str(new_data.get("critique", post.meta))
        if "score" in new_data:
            if not post.seo_data:
                post.seo_data = {}
            post.seo_data["score"] = new_data["score"]
            
    # Update telemetry log for this agent
    logs = list(post.agent_telemetry) if post.agent_telemetry else []
    for log in logs:
        if isinstance(log, dict) and log.get("agent_name") == agent_key:
            log["status"] = "success"
            log["confidence_score"] = new_data.get("confidence_score") or new_data.get("seo_score") or new_data.get("score") or 0.0
            break
    post.agent_telemetry = logs
    
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/{id}/publish", response_model=PostSchema)
def publish_post(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    """Set post status to Published."""
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "Published"
    db.add(post)
    db.commit()
    return post

@router.post("/{id}/unpublish", response_model=PostSchema)
def unpublish_post(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int,
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    """Set post status back to Draft."""
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "Draft"
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC BLOG ENDPOINTS  (consumed by the public blog website — no auth)
# ─────────────────────────────────────────────────────────────────────────────

def _slug_for(post: Post) -> str:
    seo = post.seo_data or {}
    title = (post.title[0] if isinstance(post.title, list) and post.title else post.title) or ""
    return seo.get("url_slug") or str(title).lower().replace(" ", "-").replace("'", "").replace('"', "")[:80]

def _serialize_public(p: Post, full_content: bool = False) -> dict:
    seo = p.seo_data or {}
    title = (p.title[0] if isinstance(p.title, list) and p.title else p.title) or "Untitled"
    content = (p.content[0] if isinstance(p.content, list) and p.content else p.content) or ""
    slug = _slug_for(p)
    # Calculate exact read time based on 250 wpm
    word_count = p.word_count or 0
    read_minutes = max(1, round(word_count / 250))
    real_score = seo.get("score", 85)

    base = {
        "id": p.id,
        "title": title,
        "slug": slug,
        "excerpt": str(content)[:280],
        "image_url": p.image_crm[0] if p.image_crm and len(p.image_crm) > 0 else None,
        "category": (p.category[0] if isinstance(p.category, list) and p.category else p.category) or "Intelligence",
        "focus_keyword": seo.get("focus_keyword", ""),
        "meta_description": seo.get("meta_description", ""),
        "hashtags": list(p.tags) if p.tags else seo.get("hashtags", []),
        "schema_type": seo.get("schema_type", "Article"),
        "coverage_score": seo.get("coverage_score", 0),
        "seo_score": real_score,
        "word_count": word_count,
        "read_time": f"{read_minutes} min",
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
    if full_content:
        base["content"] = content
        base["research_sources"] = p.research_sources or []
        base["title_variants"] = seo.get("title_variants", [])
        base["internal_link_suggestions"] = seo.get("internal_link_suggestions", [])
        base["image_alt_text"] = seo.get("image_alt_text_suggestion", "")
        base["all_images"] = p.all_image_data or []
    return base

@router.get("/public/{org_slug}/published", response_model=List[dict])
def get_published_posts(
    org_slug: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """Public — all Published posts for the blog listing page."""
    posts = (
        db.query(Post)
        .join(Organization, Post.org_id == Organization.id)
        .filter(Post.status == "Published", Organization.slug == org_slug)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_public(p) for p in posts]

@router.get("/public/{org_slug}/{slug}", response_model=dict)
def get_post_by_slug(org_slug: str, slug: str, db: Session = Depends(deps.get_db)) -> Any:
    """Public — single Published post by its SEO slug."""
    posts = db.query(Post).join(Organization, Post.org_id == Organization.id).filter(Post.status == "Published", Organization.slug == org_slug).all()
    for p in posts:
        if _slug_for(p) == slug:
            return _serialize_public(p, full_content=True)
    raise HTTPException(status_code=404, detail="Post not found")

@router.get("/sitemap.xml", response_class=Response)
def get_sitemap(db: Session = Depends(deps.get_db)) -> Response:
    """XML sitemap for Google Search Console submission."""
    BLOG_BASE = "https://yourblog.com"   # ← replace with your production domain
    posts = db.query(Post).filter(Post.status == "Published").all()

    entries = [f"""  <url>
    <loc>{BLOG_BASE}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>"""]

    for p in posts:
        slug = _slug_for(p)
        date = p.created_at.strftime("%Y-%m-%d") if p.created_at else "2025-01-01"
        entries.append(f"""  <url>
    <loc>{BLOG_BASE}/blog/{slug}</loc>
    <lastmod>{date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>""")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{"".join(entries)}
</urlset>"""
    return Response(content=xml, media_type="application/xml")

# Keep this below public routes to avoid slug collision with "/{id}"
@router.get("/{id}", response_model=PostSchema)
def read_post(
    *, 
    db: Session = Depends(deps.get_db), 
    id: int,
    current_org: Organization = Depends(deps.get_current_active_org)
) -> Any:
    post = db.query(Post).filter(Post.id == id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
