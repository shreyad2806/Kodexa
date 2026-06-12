from typing import TypedDict
from typing_extensions import NotRequired


class DebugState(TypedDict):
    error: str
    code: str
    explanation: NotRequired[str]
    fixed_code: NotRequired[str]
    summary: NotRequired[str]
