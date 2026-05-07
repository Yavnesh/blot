from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from loguru import logger

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

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        """
        Entry point for agent execution. Handles observability and error wrapping.
        """
        logger.info(f"Agent [{self.role}] started execution.")
        try:
            output = await self._execute(input_data, context)
            logger.info(f"Agent [{self.role}] completed successfully.")
            return output
        except Exception as e:
            logger.error(f"Agent [{self.role}] failed: {str(e)}")
            return AgentOutput(data={}, status="error", feedback=str(e))

    @abstractmethod
    async def _execute(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        """
        Core logic to be implemented by sub-agents.
        """
        pass


    def add_rule(self, rule: str):
        self.rules.append(rule)

    def __repr__(self):
        return f"<{self.__class__.__name__} role={self.role}>"
