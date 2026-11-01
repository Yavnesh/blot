from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class JobRewindRequest(BaseModel):
    target_node: str # e.g. "research", "strategy", "writing", "discovery"
    feedback: Optional[str] = None
    state_overrides: Optional[Dict[str, Any]] = None
    reset_subsequent_steps: bool = True

class JobCheckpointInfo(BaseModel):
    checkpoint_id: str
    node_name: Optional[str] = None
    created_at: Optional[str] = None
    next_nodes: List[str] = []

class JobHistoryResponse(BaseModel):
    job_id: str
    current_node: Optional[str] = None
    available_rewind_nodes: List[str] = [
        "discovery",
        "research",
        "credibility",
        "strategy",
        "writing",
        "image",
        "optimization",
        "evaluation"
    ]
    checkpoints: List[JobCheckpointInfo] = []
