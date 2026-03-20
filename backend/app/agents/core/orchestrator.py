import asyncio
from typing import Dict, Any, List, Type, Union, Optional
from loguru import logger
from datetime import datetime
from app.agents.core.base_agent import BaseAgent, AgentOutput

class Orchestrator:
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.state: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []
        self._db_lock = asyncio.Lock() # Prevent race conditions on DB progress updates

    def register_agent(self, name: str, agent: BaseAgent):
        self.agents[name] = agent
        logger.info(f"Registered agent: {name}")

    def _is_permanent_error(self, e: Exception) -> bool:
        """Determines if an error is non-retryable (Auth, Validation, Logic)."""
        err = str(e).lower()
        if any(mark in err for mark in ["401", "403", "unauthorized", "invalid_api_key", "validationerror"]):
            return True
        if isinstance(e, (TypeError, ValueError, KeyError)):
            return True
        return False

    async def execute_task(self, agent_name: str, input_data: Dict[str, Any]) -> AgentOutput:
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not registered")

        agent = self.agents[agent_name]
        logger.info(f"Orchestrator: Initiating {agent_name}")
        
        db = self.state.get("db")
        task_id = self.state.get("task_id")
        start_time = datetime.utcnow().isoformat()
        
        # 1. Update Progress to 'Running' (with Lock for parallel safety)
        if db and task_id:
            async with self._db_lock:
                from app.models.task_progress import TaskProgress
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    progress.current_step = agent_name
                    new_steps = []
                    for step in (progress.steps or []):
                        if step["name"] == agent_name:
                            new_steps.append({
                                "name": step["name"], 
                                "status": "running",
                                "start_time": start_time,
                                "end_time": None
                            })
                        else:
                            new_steps.append(step)
                    progress.steps = new_steps
                    db.commit()

        # 2. Execution Loop with Transient Error Handling
        max_retries = 3
        last_failure_cause = ""
        output = None

        for attempt in range(max_retries):
            try:
                output = await agent.run(input_data, context=self.state)
                
                if output.status in ["success", "requires_review"]:
                    break 
                else:
                    last_failure_cause = f"Status error: {output.feedback}"
                    logger.warning(f"Agent {agent_name} failed attempt {attempt+1}: {last_failure_cause}")
                    # Logic: If agent explicitly says 'error_type: validation', we could stop here
            except Exception as e:
                last_failure_cause = f"Exception: {str(e)}"
                if self._is_permanent_error(e):
                    logger.error(f"Permanent error in {agent_name}: {e}. Aborting retries.")
                    output = AgentOutput(data={}, status="error", feedback=str(e))
                    break
                
                logger.warning(f"Transient error in {agent_name} (Attempt {attempt+1}): {e}")
                await asyncio.sleep(2 ** attempt) # Exponential backoff
                output = AgentOutput(data={}, status="error", feedback=str(e))

        # 3. Finalize Progress (with Lock)
        if db and task_id:
            async with self._db_lock:
                end_time = datetime.utcnow().isoformat()
                from app.models.task_progress import TaskProgress
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    final_status = "completed" if output and output.status == "success" else "error"
                    if output and output.status == "requires_review":
                        final_status = "awaiting_human"
                        progress.status = "awaiting_human"

                    new_steps = []
                    for step in (progress.steps or []):
                        if step["name"] == agent_name:
                            new_steps.append({
                                "name": step["name"], 
                                "status": final_status,
                                "start_time": step.get("start_time", start_time),
                                "end_time": end_time
                            })
                        else:
                            new_steps.append(step)
                    progress.steps = new_steps
                    
                    log_entry = {"agent": agent_name, "status": final_status, "timestamp": end_time}
                    if final_status == "error":
                        log_entry.update({"failure_point": agent_name, "cause": last_failure_cause})
                    progress.logs = (progress.logs or []) + [log_entry]
                    db.commit()

        if output and output.status in ["success", "requires_review"]:
            # Namespaced state storage to avoid "State Bloat" and collisions
            self.state[agent_name] = output.data
            
            self.history.append({
                "agent": agent_name,
                "input": input_data,
                "prompt": output.prompt,
                "output": output.model_dump()
            })
            return output
            
        return output or AgentOutput(data={}, status="error", feedback="Max retries reached")

    async def run_pipeline(self, pipeline: List[Union[str, List[str]]], initial_input: Dict[str, Any]) -> Dict[str, Any]:
        """Runs sequential or parallel agent steps."""
        self.state.update(initial_input)
        
        for step in pipeline:
            # Flatten context so agents can find 'draft_content' or 'serp_blueprint' easily
            current_input = self._get_flattened_state()
            
            if isinstance(step, list):
                logger.info(f"Orchestrator: Executing parallel group: {step}")
                tasks = [self.execute_task(name, current_input) for name in step]
                results = await asyncio.gather(*tasks)
                
                # Check for blockers
                for res in results:
                    if res.status == "error": return self.state
                    if res.status == "requires_review": return self.state
            else:
                result = await self.execute_task(step, current_input)
                if result.status == "error": break
                if result.status == "requires_review": break
                
        return self.state

    def _get_flattened_state(self) -> Dict[str, Any]:
        """Provides agents with a flat view of available data for backward compatibility."""
        flat = {}
        # Initial keys (db, task_id, topic)
        for k, v in self.state.items():
            if k not in self.agents:
                flat[k] = v
        
        # Aggregate agent outputs (Namespaced)
        for agent_name in self.agents:
            if agent_name in self.state and isinstance(self.state[agent_name], dict):
                flat.update(self.state[agent_name])
        return flat

