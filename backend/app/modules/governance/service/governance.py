from typing import Dict, Any
from app.agents.governance.legal_agent import LegalAgent
from app.agents.core.evaluator import EvaluationAgent

class GovernanceService:
    def __init__(self):
        self.legal_agent = LegalAgent()
        self.evaluator_agent = EvaluationAgent()

    async def run_governance_audit(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs legal and E-E-A-T quality audits.
        """
        legal_result = await self.legal_agent.run(state)
        eval_result = await self.evaluator_agent.run(state)
        
        return {
            "legal_compliance": legal_result.status == "success",
            "eeat_score": eval_result.data.get("score", 0),
            "critique": eval_result.data.get("critique", ""),
            "verification_passed": eval_result.status == "success"
        }
