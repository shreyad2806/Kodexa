from fastapi import APIRouter, HTTPException

from app.models.request import DebugRequest
from app.models.response import DebugResponse
from app.graph.state import DebugState
from app.graph.graph import run_debug_graph
from app.nodes.debug_node import debug_node
from app.utils.logger import get_logger


logger = get_logger("nexora")
router = APIRouter()


@router.post("/debug", response_model=DebugResponse)
async def debug_code(request: DebugRequest) -> DebugResponse:
    try:
        logger.info(f"Debug endpoint called with error: {request.error[:50]}...")
        logger.info(f"Code length: {len(request.code)}")
        
        state: DebugState = {
            "error": request.error,
            "code": request.code
        }
        
        result_state = await run_debug_graph(state, debug_node)
        
        response = DebugResponse(
            explanation=result_state.get("explanation"),
            fixed_code=result_state.get("fixed_code"),
            summary=result_state.get("summary"),
            metadata={
                "file_path": request.file_path,
                "language": request.language
            }
        )
        
        logger.info("Debug workflow completed successfully")
        return response
    
    except ConnectionError as e:
        logger.error(f"Connection error in debug endpoint: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to LLM service: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in debug endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Debugging failed: {str(e)}"
        )
