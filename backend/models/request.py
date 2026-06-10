from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class DebugRequest(BaseModel):
    error: str = Field(..., description="Error message or stack trace")
    code: str = Field(..., description="Code to debug")
    file_path: Optional[str] = Field(None, description="Path to the file")
    language: Optional[str] = Field(None, description="Programming language")
    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context"
    )
