"""Метрики работы ИИ-модерации — по пометкам, которые модерация ставит на каждую заявку."""
from app.schemas.stats import AIBlock
from app.services.notes import AUTO_NOTES_CLEANUP, AUTO_NOTES_REPORT, ESCALATED_NOTES, NOTE_ADMIN_PREFIX


def _block(rows, auto_notes: set[str], verdict_agrees) -> AIBlock:
    """rows: (final_ok: bool | None, ai_verdict: bool | None, ai_confidence: float | None, note: str | None).
    final_ok — итоговое решение (True = подтверждено); верно только для строк, решённых ИИ или администратором."""
    auto = escalated = reviewed = agree = 0
    conf: list[float] = []
    for final_ok, verdict, confidence, note in rows:
        note = note or ""
        if note in auto_notes:
            auto += 1
            if confidence is not None:
                conf.append(confidence)
        elif note in ESCALATED_NOTES or note.startswith(NOTE_ADMIN_PREFIX):
            escalated += 1
            if note.startswith(NOTE_ADMIN_PREFIX) and verdict is not None and final_ok is not None:
                reviewed += 1
                agree += 1 if verdict_agrees(final_ok, verdict) else 0
    analyzed = auto + escalated
    return AIBlock(
        analyzed=analyzed, auto=auto, escalated=escalated,
        auto_share=round(auto / analyzed, 4) if analyzed else None,
        reviewed_with_verdict=reviewed,
        agreement=round(agree / reviewed, 4) if reviewed else None,
        avg_confidence_auto=round(sum(conf) / len(conf), 4) if conf else None,
    )


def report_ai_metrics(rows) -> AIBlock:
    """rows: (status, ai_is_polluted, ai_confidence, moderation_note). Решение администратора «подтвердить» совпадает с ИИ, если ИИ видел загрязнение."""
    from app.models.report import ReportStatus

    prepared = []
    for status, polluted, conf, note in rows:
        final_ok = True if status == ReportStatus.approved else False if status == ReportStatus.rejected else None
        prepared.append((final_ok, polluted, conf, note))
    return _block(prepared, AUTO_NOTES_REPORT, lambda ok, verdict: ok == bool(verdict))


def cleanup_ai_metrics(rows) -> AIBlock:
    """rows: (status, ai_is_clean, ai_confidence, moderation_note)."""
    from app.models.cleanup import CleanupStatus

    prepared = []
    for status, clean, conf, note in rows:
        final_ok = True if status == CleanupStatus.confirmed else False if status == CleanupStatus.rejected else None
        prepared.append((final_ok, clean, conf, note))
    return _block(prepared, AUTO_NOTES_CLEANUP, lambda ok, verdict: ok == bool(verdict))
