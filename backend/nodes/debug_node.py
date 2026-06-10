import json
from typing import Dict, Any, Optional

from app.graph.state import DebugState
from app.services.llm_service import get_llm_service
from app.prompts.debug_prompt import get_debug_prompt
from app.utils.logger import get_logger


logger = get_logger("nexora")


def parse_llm_response(response: str) -> Optional[Dict[str, Any]]:
    try:
        response = response.strip()
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = response[start_idx:end_idx + 1]
            return json.loads(json_str)
        
        return json.loads(response)
    
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON response: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error parsing response: {e}")
        return None


async def debug_node(state: DebugState) -> DebugState:
    try:
        error = state.get("error", "")
        code = state.get("code", "")
        
        if not error or not code:
            logger.warning("Missing error or code in state")
            state["explanation"] = "Error: Missing error or code in state"
            return state
        
        prompt = get_debug_prompt(error, code)
        llm_service = get_llm_service()
        response = await llm_service.invoke(prompt)
        
        parsed_response = parse_llm_response(response)
        
        if parsed_response:
            state["explanation"] = parsed_response.get("explanation", "")
            state["fixed_code"] = parsed_response.get("fixed_code", "")
            state["summary"] = parsed_response.get("summary", "")
            logger.info("Successfully parsed LLM response")
        else:
            state["explanation"] = response
            state["fixed_code"] = ""
            state["summary"] = "Failed to parse structured response"
            logger.warning("JSON parsing failed, using raw response")
        
        return state
    
    except ConnectionError as e:
        logger.error(f"Connection error in debug node: {e}")
        state["explanation"] = f"Error: Unable to connect to LLM service. {str(e)}"
        state["fixed_code"] = ""
        state["summary"] = "LLM service unavailable"
        return state
    
    except Exception as e:
        logger.error(f"Unexpected error in debug node: {e}")
        state["explanation"] = f"Error: {str(e)}"
        state["fixed_code"] = ""
        state["summary"] = "Debugging failed"
        return state
