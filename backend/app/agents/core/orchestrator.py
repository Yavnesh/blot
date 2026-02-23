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

        try:
            output = await agent.run(input_data, context=self.state)
            
            # Update progress after completion
            if db and task_id:
                from datetime import datetime
                end_time = datetime.utcnow().isoformat()
                
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    new_steps = []
                    for step in (progress.steps or []):
                        if step["name"] == agent_name:
                            new_steps.append({
                                "name": step["name"], 
                                "status": "completed" if output.status == "success" else "error",
                                "start_time": step.get("start_time", start_time),
                                "end_time": end_time
                            })
                        else:
                            new_steps.append(step)
                    progress.steps = new_steps
                    progress.logs = (progress.logs or []) + [{"agent": agent_name, "status": output.status, "feedback": output.feedback}]
                    db.commit()

            # Update state with internal findings if needed
            self.state.update(output.data)
            
            self.history.append({
                "agent": agent_name,
                "input": input_data,
                "prompt": output.prompt,
                "output": output.model_dump()
            })
            
            return output

        except Exception as e:
            logger.error(f"Orchestrator: Agent {agent_name} failed with exception: {e}")
            if db and task_id:
                from datetime import datetime
                end_time = datetime.utcnow().isoformat()
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    new_steps = []
                    for step in (progress.steps or []):
                        if step["name"] == agent_name:
                            new_steps.append({
                                "name": step["name"], 
                                "status": "error",
                                "start_time": step.get("start_time", start_time),
                                "end_time": end_time
                            })
                        else:
                            new_steps.append(step)
                    progress.steps = new_steps
                    progress.logs = (progress.logs or []) + [{"agent": agent_name, "status": "error", "feedback": str(e)}]
                    db.commit()
            
            return AgentOutput(data={}, status="error", feedback=str(e))

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
