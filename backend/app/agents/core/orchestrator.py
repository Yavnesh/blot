from typing import Dict, Any, List, Type
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput

class Orchestrator:
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.state: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []

    def register_agent(self, name: str, agent: BaseAgent):
        self.agents[name] = agent
        logger.info(f"Registered agent: {name}")

    async def execute_task(self, agent_name: str, input_data: Dict[str, Any]) -> AgentOutput:
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not registered")

        agent = self.agents[agent_name]
        logger.info(f"Executing agent: {agent_name}")
        
        # Update progress if db and task_id are present
        db = self.state.get("db")
        task_id = self.state.get("task_id")
        start_time = None
        
        if db and task_id:
            from datetime import datetime
            from app.models.task_progress import TaskProgress
            
            start_time = datetime.utcnow().isoformat()
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                progress.current_step = agent_name
                # Update status of this step in steps list with start_time
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

        max_retries = 3
        last_failure_cause = ""
        output = None

        for attempt in range(max_retries):
            try:
                output = await agent.run(input_data, context=self.state)
                
                if output.status == "success":
                    break # Success, we can break out of retry loop
                else:
                    last_failure_cause = f"Status error: {output.feedback}"
                    logger.warning(f"Agent {agent_name} failed on attempt {attempt + 1}/{max_retries}: {last_failure_cause}")
                    
            except Exception as e:
                last_failure_cause = f"Exception: {str(e)}"
                logger.error(f"Agent {agent_name} failed on attempt {attempt + 1}/{max_retries} with exception: {e}")
                output = AgentOutput(data={}, status="error", feedback=str(e))

        # Update progress after completion or ultimate failure
        if db and task_id:
            from datetime import datetime
            end_time = datetime.utcnow().isoformat()
            
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                new_steps = []
                final_status = "completed" if output and output.status == "success" else "error"
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
                
                log_entry = {
                    "agent": agent_name, 
                    "status": final_status, 
                }
                if final_status == "error":
                    # provide proper point and cause of the failure
                    logger.error(f"Orchestrator: Agent '{agent_name}' failed at failure point: Execution. Cause: {last_failure_cause}")
                    log_entry["failure_point"] = agent_name
                    log_entry["cause"] = last_failure_cause
                    log_entry["feedback"] = output.feedback if output else "Max retries reached"
                else:
                    log_entry["feedback"] = output.feedback if output else "Success"
                    
                progress.logs = (progress.logs or []) + [log_entry]
                db.commit()

        if output and output.status == "success":
            # Update state with internal findings if needed
            self.state.update(output.data)
            
            self.history.append({
                "agent": agent_name,
                "input": input_data,
                "prompt": output.prompt,
                "output": output.model_dump()
            })
            
            return output
            
        return output or AgentOutput(data={}, status="error", feedback="Unknown error after retries")

    async def run_pipeline(self, pipeline: List[str], initial_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs a sequence of agents.
        """
        current_input = initial_input
        for step in pipeline:
            result = await self.execute_task(step, current_input)
            if result.status != "success":
                logger.error(f"Pipeline failed at step {step}: {result.feedback}")
                break
            # Logic to derive next input can be more complex, but for now we pass state
            current_input = self.state 
            
        return self.state
