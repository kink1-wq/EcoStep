"""Отдельная проверка ключа и модели Gemini, без всего остального бэкенда.
Запуск (из папки backend, окружение активировано):
    python scripts/test_gemini.py
"""
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings  # noqa: E402
from google import genai  # noqa: E402
from google.genai import types  # noqa: E402

print(f"GEMINI_MODEL = {settings.gemini_model}")
print(f"Ключ начинается с: {settings.gemini_api_key[:6]}... (длина {len(settings.gemini_api_key)})")
print("Отправляю тестовый запрос…\n")

try:
    client = genai.Client(api_key=settings.gemini_api_key)
    resp = client.models.generate_content(
        model=settings.gemini_model,
        contents="Ответь одним словом: работает",
        config=types.GenerateContentConfig(temperature=0),
    )
    print("УСПЕХ. Ответ модели:", resp.text)
except Exception:
    print("ОШИБКА:\n")
    traceback.print_exc()
