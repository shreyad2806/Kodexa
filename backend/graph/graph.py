from typing import Optional
from langgraph.graph import StateGraph

from app.graph.state import DebugState
from app.graph.builder import build_graph


_debug_graph: Optional[StateGraph] = None


def get_debug_graph(debug_node) -> StateGraph:
    global _debug_graph
    if _debug_graph is None:
        _debug_graph = build_graph(workflow_type="debug", debug=debug_node)
    return _debug_graph


async def run_debug_graph(initial_state: DebugState, debug_node) -> DebugState:
    graph = get_debug_graph(debug_node)
    result = await graph.ainvoke(initial_state)
    return result
