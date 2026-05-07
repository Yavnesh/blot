from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.modules.orchestrator.langgraph.state import ArticleState
from app.modules.orchestrator.langgraph.nodes.research import discovery_node, research_node, credibility_node
from app.modules.orchestrator.langgraph.nodes.strategy import strategy_node
from app.modules.orchestrator.langgraph.nodes.writing import writing_node
from app.modules.orchestrator.langgraph.nodes.optimization import optimization_node
from app.modules.orchestrator.langgraph.nodes.evaluation import evaluation_node
from app.modules.orchestrator.langgraph.nodes.approval_gate import approval_gate_node

from loguru import logger
from celery.contrib import rdb

import asyncio

def debug_node(node_func, node_name):
    async def wrapper(state: ArticleState):
        logger.info(f"=== [DEBUG] ENTERING NODE: {node_name} ===")
        logger.info(f"[{node_name}] INPUT STATE:\n{state}")
        
        # 🐛 DEBUGGER: Uncomment the line below to pause execution in the Celery worker
        # Once it pauses, you can telnet into it: `telnet 127.0.0.1 6900`
        # rdb.set_trace()
        
        if asyncio.iscoroutinefunction(node_func):
            result = await node_func(state)
        else:
            result = node_func(state)
        
        logger.info(f"=== [DEBUG] EXITING NODE: {node_name} ===")
        logger.info(f"[{node_name}] OUTPUT RESULT:\n{result}")
        return result
    return wrapper

def compile_orchestrator_graph():
    """
    Constructs and compiles the cyclic agentic graph for Blot.ai.
    This replaces the rigid, procedural DeterministicPipelineEngine loops.
    """
    
    # 1. Initialize StateGraph with our ArticleState TypedDict
    workflow = StateGraph(ArticleState)
    
    # 2. Add Lifecycle Nodes (Wrapped with Debugger)
    workflow.add_node("discovery", debug_node(discovery_node, "discovery"))
    workflow.add_node("research", debug_node(research_node, "research"))
    workflow.add_node("credibility", debug_node(credibility_node, "credibility"))
    workflow.add_node("strategy", debug_node(strategy_node, "strategy"))
    workflow.add_node("writing", debug_node(writing_node, "writing"))
    workflow.add_node("optimization", debug_node(optimization_node, "optimization"))
    workflow.add_node("evaluation", debug_node(evaluation_node, "evaluation"))
    workflow.add_node("approval", debug_node(approval_gate_node, "approval"))
    
    # 3. Define the DAG Execution Order
    workflow.set_entry_point("discovery")
    workflow.add_edge("discovery", "research")
    workflow.add_edge("research", "credibility")
    workflow.add_edge("credibility", "strategy")
    workflow.add_edge("strategy", "writing")
    workflow.add_edge("writing", "optimization")
    workflow.add_edge("optimization", "evaluation")
    
    # 4. Define AI Reflection Logic
    def should_continue_ai(state: ArticleState):
        if state.get("is_approved"):
            return "hitl"
        return "rewrite"

    workflow.add_conditional_edges(
        "evaluation",
        should_continue_ai,
        {
            "hitl": "approval",
            "rewrite": "writing"
        }
    )

    # 5. Define Human Reflection Logic (HITL)
    def should_continue_human(state: ArticleState):
        if state.get("human_approved"):
            return "publish"
        return "rework"

    workflow.add_conditional_edges(
        "approval",
        should_continue_human,
        {
            "publish": END,
            "rework": "writing"
        }
    )
    
    # 6. Final Compilation with Checkpointer and HITL Interrupt
    return workflow.compile(
        checkpointer=MemorySaver(),
        interrupt_before=["approval"]
    )



# Global singleton or generator for the graph
orchestrator_app = compile_orchestrator_graph()
