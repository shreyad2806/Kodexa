from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class DebugResponse(BaseModel):
    explanation: Optional[str] = Field(None, description="Explanation of the root cause")
    fixed_code: Optional[str] = Field(None, description="Fixed version of the code")
    summary: Optional[str] = Field(None, description="Brief summary of the fix")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
