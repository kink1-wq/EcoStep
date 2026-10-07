# Использовать сертификаты Windows/системы (нужно, если антивирус или сеть подменяет
# HTTPS-сертификаты). Выполняется автоматически при первом импорте пакета app —
# то есть раньше любого кода, который делает сетевые запросы (uvicorn, скрипты).
import ssl

import truststore

truststore.inject_into_ssl()
_system_ctx = ssl.create_default_context()
# httpx (его использует google-genai) сам строит контекст с cafile=certifi.where(),
# из-за чего обход truststore не применялся — здесь эти попытки перехватываются.
ssl.create_default_context = lambda *a, **kw: _system_ctx  # type: ignore[assignment]
