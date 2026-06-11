from typing import Callable, Any
from langgraph.graph import StateGraph, END, START

from backend.graph.state import DebugState


def build_debug_graph(debug_node: Callable) -> Any:
    workflow = StateGraph(DebugState)
    workflow.add_node("debug", debug_node)
    workflow.set_entry_point(START)
    workflow.add_edge(START, "debug")
    workflow.add_edge("debug", END)
    return workflow.compile()


def build_graph(workflow_type: str = "debug", **node_functions: Callable) -> Any:
    if workflow_type == "debug":
        debug_node = node_functions.get("debug")
        if not debug_node:
            raise ValueError("debug_node function required for debug workflow")
        return build_debug_graph(debug_node)
    else:
        raise ValueError(f"Unsupported workflow type: {workflow_type}")
