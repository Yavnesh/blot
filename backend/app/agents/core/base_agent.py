from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AgentOutput(BaseModel):
    data: Dict[str, Any]
    prompt: Optional[str] = None # Capture the instruction for fine-tuning
    metrics: Dict[str, Any] = Field(default_factory=dict)
    feedback: Optional[str] = None
    status: str = "success"

class BaseAgent(ABC):
    def __init__(self, role: str, rules: List[str] = None):
        self.role = role
        self.rules = rules or []
        self.evaluation_metrics = []

    @abstractmethod
    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        """
        Executes the agent's logic.
        """
        pass

    def add_rule(self, rule: str):
        self.rules.append(rule)

    def __repr__(self):
        return f"<{self.__class__.__name__} role={self.role}>"
