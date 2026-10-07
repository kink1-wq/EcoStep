"""Показывает точные названия моделей Gemini, доступных для вашего ключа.
Запуск (из папки backend, окружение активировано):
    python scripts/list_gemini_models.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings  # noqa: E402
from google import genai  # noqa: E402

client = genai.Client(api_key=settings.gemini_api_key)
print("Модели, поддерживающие generateContent (анализ фото/текста):\n")
for m in client.models.list():
    actions = getattr(m, "supported_actions", None) or []
    if "generateContent" in actions:
        print(" ", m.name)
