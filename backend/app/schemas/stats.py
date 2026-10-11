from pydantic import BaseModel


class CategoryStat(BaseModel):
    category: str
    active: int
    resolved: int


class DayStat(BaseModel):
    date: str  # YYYY-MM-DD (местное время, UTC+5)
    reported: int
    resolved: int


class AIBlock(BaseModel):
    analyzed: int                    # сколько случаев ИИ разобрал (авто + переданные человеку)
    auto: int                        # решено ИИ без участия человека
    escalated: int                   # передано администратору
    auto_share: float | None         # доля auto от analyzed (0..1)
    reviewed_with_verdict: int       # решено администратором и у ИИ был свой вердикт
    agreement: float | None          # доля совпадений вердикта ИИ и решения администратора (0..1)
    avg_confidence_auto: float | None


class StatsOut(BaseModel):
    total: int
    active: int
    resolved: int
    resolution_rate: float | None
    avg_days_to_resolve: float | None
    supports: int
    cleanups_confirmed: int
    by_category: list[CategoryStat]
    by_day: list[DayStat]
    ai_reports: AIBlock
    ai_cleanups: AIBlock
