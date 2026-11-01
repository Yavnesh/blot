from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_org, require_role, require_project_access
from app.models.user import User, Organization
from app.models.project import Project, ProjectMember
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectMemberBase, ProjectMemberOut

router = APIRouter()

@router.get("/", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager", "creator"))
):
    """List all projects belonging to the active organization."""
    return db.query(Project).filter(Project.org_id == current_org.id).all()

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager"))
):
    """Admins and Managers can create a new project within the organization."""
    existing = db.query(Project).filter(Project.org_id == current_org.id, Project.slug == project_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="A project with this slug already exists.")

    project = Project(
        org_id=current_org.id,
        name=project_in.name,
        slug=project_in.slug,
        description=project_in.description,
        brand_overrides=project_in.brand_overrides or {},
        target_audience=project_in.target_audience,
        preferred_keywords=project_in.preferred_keywords or []
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project: Project = Depends(require_project_access)
):
    """Retrieve details for a specific project."""
    return project

@router.post("/{project_id}/members", response_model=ProjectMemberOut)
def assign_member_to_project(
    project_id: int,
    member_in: ProjectMemberBase,
    db: Session = Depends(get_db),
    project: Project = Depends(require_project_access),
    _role: User = Depends(require_role("admin", "manager"))
):
    """Assign a user to a project with a specific project-level role."""
    # Verify user exists
    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_assignment = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_in.user_id
    ).first()
    if existing_assignment:
        existing_assignment.role = member_in.role
        db.commit()
        db.refresh(existing_assignment)
        return existing_assignment

    assignment = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role=member_in.role
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
