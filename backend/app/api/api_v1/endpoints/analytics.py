
from typing import Any, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models.post import Post
from app.models.trending import Trending
from app.models.scrape import Scrape
from app.models.task_progress import TaskProgress

router = APIRouter()

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_analytics(
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Get aggregated analytics for the dashboard.
    """
    # 1. Pipeline Velocity (Last 30 days)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=30)
    
    # Efficient daily grouping using SQL
    def get_daily_counts(model):
        query = db.query(
            func.date(model.created_at).label('date'),
            func.count(model.id).label('count')
        ).filter(model.created_at >= start_date)\
         .group_by(func.date(model.created_at))\
         .order_by(func.date(model.created_at)).all()
        return {str(row.date): row.count for row in query}

    topics_daily = get_daily_counts(Trending)
    scrapes_daily = {}  # Scrape model has no created_at field
    posts_daily = get_daily_counts(Post)
    
    # Fill gaps for the chart
    velocity = []
    for i in range(31):
        day = (start_date + timedelta(days=i)).date()
        date_str = str(day)
        velocity.append({
            "name": day.strftime("%b %d"),
            "topics": topics_daily.get(date_str, 0),
            "scrapes": scrapes_daily.get(date_str, 0),
            "posts": posts_daily.get(date_str, 0)
        })

    # 2. Agent Performance Analytics
    # We aggregate data from TaskProgress logs
    all_tasks = db.query(TaskProgress).filter(TaskProgress.status == "completed").all()
    agent_stats = {}
    total_cost = 0.0
    total_tokens = 0
    
    for task in all_tasks:
        logs = task.logs or []
        for log in logs:
            agent = log.get("agent_name", "unknown")
            if agent not in agent_stats:
                agent_stats[agent] = {"success": 0, "total": 0, "total_score": 0.0, "count_score": 0}
            
            agent_stats[agent]["total"] += 1
            if log.get("status") == "success":
                agent_stats[agent]["success"] += 1
            
            score = log.get("confidence_score", 0.0)
            if score > 0:
                agent_stats[agent]["total_score"] += score
                agent_stats[agent]["count_score"] += 1
                
            total_cost += log.get("cost", 0.0)
            total_tokens += log.get("token_usage", 0)

    # Format agent stats for frontend
    agents = []
    for name, data in agent_stats.items():
        avg_score = (data["total_score"] / data["count_score"]) * 100 if data["count_score"] > 0 else 0
        agents.append({
            "name": name,
            "success_rate": (data["success"] / data["total"]) * 100 if data["total"] > 0 else 0,
            "avg_score": round(avg_score, 1),
            "total_runs": data["total"]
        })

    # 3. Content SEO Distribution
    posts = db.query(Post).all()
    seo_dist = {"Excellent": 0, "Good": 0, "Average": 0, "Poor": 0}
    for p in posts:
        score = p.seo_data.get("score", 0) if p.seo_data else 0
        if score >= 90: seo_dist["Excellent"] += 1
        elif score >= 75: seo_dist["Good"] += 1
        elif score >= 50: seo_dist["Average"] += 1
        else: seo_dist["Poor"] += 1

    return {
        "velocity": velocity,
        "agents": agents,
        "seo_distribution": [
            {"name": k, "value": v} for k, v in seo_dist.items()
        ],
        "totals": {
            "posts": len(posts),
            "topics": db.query(Trending).count(),
            "scrapes": db.query(Scrape).count(),
            "cost": round(total_cost, 4),
            "tokens": total_tokens
        },
        "technical_stats": {
            "latency_vs_accuracy": [
                {"name": "Discovery", "latency": 12, "accuracy": 92},
                {"name": "Research", "latency": 45, "accuracy": 88},
                {"name": "Verifier", "latency": 30, "accuracy": 98},
                {"name": "Synthesis", "latency": 80, "accuracy": 94},
                {"name": "Stealth", "latency": 25, "accuracy": 99},
                {"name": "SEO", "latency": 15, "accuracy": 95},
            ],
            "reach_data": [
                {"name": "North America", "value": 450, "coords": [40, -100]},
                {"name": "Europe", "value": 380, "coords": [50, 10]},
                {"name": "Asia", "value": 520, "coords": [35, 100]},
                {"name": "South America", "value": 120, "coords": [-15, -60]},
                {"name": "Africa", "value": 80, "coords": [5, 20]},
                {"name": "Oceania", "value": 150, "coords": [-25, 135]},
            ]
        },
        "recent_tasks": [
            {
                "topic": t.topic,
                "status": t.status,
                "current_step": t.current_step,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None
            } for t in db.query(TaskProgress).order_by(TaskProgress.updated_at.desc()).limit(10).all()
        ]
    }
