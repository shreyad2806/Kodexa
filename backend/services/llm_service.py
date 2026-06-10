import asyncio
from typing import Optional
from langchain_ollama import ChatOllama

from app.config import settings
from app.utils.logger import get_logger


logger = get_logger("nexora")


class LLMService:
    _instance: Optional["LLMService"] = None
    _llm: Optional[ChatOllama] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._llm is None:
            try:
                logger.info(f"Initializing Ollama LLM with model: {settings.OLLAMA_MODEL}")
                logger.info(f"Ollama base URL: {settings.OLLAMA_BASE_URL}")
                
                self._llm = ChatOllama(
                    model=settings.OLLAMA_MODEL,
                    base_url=settings.OLLAMA_BASE_URL,
                    temperature=0.7,
                )
                
                logger.info("Ollama LLM initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama LLM: {e}")
                raise
    
    async def invoke(self, prompt: str) -> str:
        max_retries = 2
        retry_delays = [1, 2]
        
        for attempt in range(max_retries + 1):
            try:
                logger.debug(f"Invoking LLM with prompt length: {len(prompt)}")
                
                response = await asyncio.wait_for(
                    asyncio.to_thread(self._llm.invoke, prompt),
                    timeout=30
                )
                
                result = response.content if hasattr(response, 'content') else str(response)
                logger.debug(f"LLM response length: {len(result)}")
                return result
                
            except asyncio.TimeoutError:
                logger.warning(f"LLM invocation timeout (attempt {attempt + 1}/{max_retries + 1})")
                if attempt < max_retries:
                    delay = retry_delays[attempt]
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    logger.error("LLM invocation timeout after all retries")
                    raise Exception("LLM invocation timed out after 30 seconds")
                    
            except ConnectionError as e:
                logger.warning(f"Connection error (attempt {attempt + 1}/{max_retries + 1}): {e}")
                if attempt < max_retries:
                    delay = retry_delays[attempt]
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Connection error after all retries: {e}")
                    raise ConnectionError(f"Unable to connect to Ollama server at {settings.OLLAMA_BASE_URL}. Please ensure Ollama is running.")
                    
            except Exception as e:
                logger.warning(f"Error invoking LLM (attempt {attempt + 1}/{max_retries + 1}): {e}")
                if attempt < max_retries:
                    delay = retry_delays[attempt]
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"LLM invocation failed after all retries: {e}")
                    raise Exception(f"LLM invocation failed: {str(e)}")
    
    def get_llm(self) -> ChatOllama:
        return self._llm


_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
