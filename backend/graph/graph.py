from typing import Optional, Callable, Any
from langgraph.graph import StateGraph

from backend.graph.state import DebugState
from backend.graph.builder import build_graph


_debug_graph: Optional[Any] = None


def get_debug_graph(debug_node: Callable) -> Any:
    global _debug_graph
    if _debug_graph is None:
        _debug_graph = build_graph(workflow_type="debug", debug=debug_node)
    return _debug_graph


async def run_debug_graph(initial_state: DebugState, debug_node: Callable) -> DebugState:
    graph = get_debug_graph(debug_node)
    result = await graph.ainvoke(initial_state)
    return result
