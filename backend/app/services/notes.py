"""Тексты служебных пометок модерации. Используются и при принятии решений, и при подсчёте метрик ИИ —
поэтому живут в одном месте, чтобы не разойтись."""

NOTE_AUTO_APPROVED = "Автоматически подтверждено ИИ"
NOTE_AUTO_REJECTED = "Загрязнение на фото не обнаружено"
NOTE_LOW_CONFIDENCE = "Низкая уверенность ИИ — нужна проверка"
NOTE_AI_ERROR = "Ошибка анализа ИИ — нужна проверка"
NOTE_STUCK = "Анализ не завершился — нужна проверка"
NOTE_BLUR_FAILED = "Не удалось скрыть лица/номера на фото — нужна проверка"
NOTE_ADMIN_PREFIX = "Решение администратора"
NOTE_ADMIN_RESOLVED = "Снята администратором вручную"

NOTE_CLEANUP_CONFIRMED = "Автоматически подтверждено ИИ: место убрано"
NOTE_CLEANUP_REJECTED = "ИИ всё ещё видит загрязнение на фото"

AUTO_NOTES_REPORT = {NOTE_AUTO_APPROVED, NOTE_AUTO_REJECTED}
AUTO_NOTES_CLEANUP = {NOTE_CLEANUP_CONFIRMED, NOTE_CLEANUP_REJECTED}
ESCALATED_NOTES = {NOTE_LOW_CONFIDENCE, NOTE_AI_ERROR, NOTE_STUCK, NOTE_BLUR_FAILED}
