from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.models.fine_tune_data import FineTuneData
from sqlalchemy.orm import Session

class DatasetAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Dataset Refinery Agent",
            rules=[
                "Extract clean instruction-completion pairs from orchestrator history.",
                "Filter for high-quality data based on evaluator scores.",
                "Structure data for various training formats (SFT, DPO)."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        db: Session = input_data.get("db")
        history: List[Dict[str, Any]] = input_data.get("history", [])
        score: float = input_data.get("score", 0.0)
        
        if not db or not history:
            return AgentOutput(data={}, status="error", feedback="DB or history missing")

        logger.info(f"DatasetAgent: Sifting through {len(history)} items for fine-tuning data")
        
        saved_count = 0
        for entry in history:
            agent_role = entry.get("agent")
            prompt = entry.get("prompt")
            # The output model_dump contains the completion
            output = entry.get("output", {})
            # Priority extraction of completion text from various agents
            output_data = output.get("data", {})
            completion = output_data.get("draft_content") or \
                         output_data.get("final_draft") or \
                         output_data.get("final_publish_ready_content") or \
                         output_data.get("original_content") or \
                         output_data.get("clear_content") or \
                         output_data.get("strategy_doc") or \
                         output_data.get("critique") or \
                         output_data.get("verification_report") or \
                         output_data.get("research_data") or \
                         (str(output_data) if output_data else None)

            if prompt and completion:
                # Save as an SFT pair
                ft_entry = FineTuneData(
                    agent_role=agent_role,
                    prompt=prompt,
                    completion=completion,
                    score=score,
                    format="instruction",
                    metadata_json={"eval_score": score}
                )
                db.add(ft_entry)
                saved_count += 1
        
        try:
            db.commit()
            logger.success(f"DatasetAgent: Saved {saved_count} training pairs to DB")
            return AgentOutput(
                data={
                    "saved_count": saved_count,
                    "confidence_score": 100.0
                },
                status="success"
            )
        except Exception as e:
            logger.error(f"DatasetAgent error: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))
