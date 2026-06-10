from typing import Any, List
from datetime import datetime
import re


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def sanitize_filename(filename: str) -> str:
    sanitized = re.sub(r'[<>:"/\\|?*]', '', filename)
    return sanitized.strip()


def format_timestamp(timestamp: datetime, format: str = "%Y-%m-%d %H:%M:%S") -> str:
    return timestamp.strftime(format)


def parse_timestamp(timestamp_str: str, format: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    return datetime.strptime(timestamp_str, format)


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def merge_dicts(*dicts: dict) -> dict:
    result = {}
    for d in dicts:
        result.update(d)
    return result


def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def calculate_age(birth_date: datetime) -> int:
    today = datetime.utcnow()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
