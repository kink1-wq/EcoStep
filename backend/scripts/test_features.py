"""Проверка новых функций бэкенда на временной базе SQLite (без Supabase и без обращений к Gemini).
Запуск из папки backend:
    PYTHONPATH=. DATABASE_URL=sqlite:///test.db SUPABASE_URL=https://x.supabase.co SUPABASE_SERVICE_KEY=k GEMINI_API_KEY=k python scripts/test_features.py
(в PowerShell переменные задаются командами $env:ИМЯ="значение" перед запуском). После проверки удалите файл test.db."""
import io, uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from PIL import Image
from fastapi.testclient import TestClient

from app.main import app, Base, engine, SessionLocal
import app.core.security as sec
from app.core.security import CurrentUser
from app.models.report import Report, ReportStatus
from app.models.cleanup import CleanupSubmission, CleanupStatus
from app.models.social import BlockedUser, ReportFlag, ReportSupport
from app.schemas.report import AIResult, PrivacyBox
from app.services import notes as N

Base.metadata.create_all(engine)
c = TestClient(app)
ok = True
def check(name, cond, extra=""):
    global ok
    ok &= bool(cond)
    print(("✔" if cond else "✘ ПРОВАЛ"), name, extra)

def as_user(uid, role="user"):
    app.dependency_overrides[sec.get_current_user] = lambda: CurrentUser(id=uid, role=role)

def jpeg():
    b = io.BytesIO(); Image.new("RGB", (64, 64), (120, 160, 90)).save(b, "JPEG"); return b.getvalue()

LAT, LNG = 52.3481, 71.8811
def mk(user, status=ReportStatus.approved, lat=LAT, lng=LNG, **kw):
    with SessionLocal() as db:
        r = Report(user_id=user, photo_path=f"p/{uuid.uuid4()}", photo_url="http://x/p.jpg", latitude=lat, longitude=lng, status=status, **kw)
        db.add(r); db.commit(); db.refresh(r); return r.id

# ---------- 1. лимит 3 в минуту ----------
with patch("app.api.reports.upload_photo", return_value="http://x/u.jpg"), patch("app.api.reports.process_report"):
    as_user("spammer")
    codes = [c.post("/api/reports", files={"photo": ("a.jpg", jpeg(), "image/jpeg")}, data={"latitude": LAT, "longitude": LNG}).status_code for _ in range(4)]
    check("лимит: 3 заявки проходят, 4-я в течение минуты → 429", codes == [202, 202, 202, 429], codes)
    as_user("other")
    check("лимит считается на пользователя (другой может)", c.post("/api/reports", files={"photo": ("a.jpg", jpeg(), "image/jpeg")}, data={"latitude": LAT, "longitude": LNG}).status_code == 202)

# ---------- 2. блокировка ----------
with SessionLocal() as db:
    db.add(BlockedUser(user_id="bad", reason="спам")); db.commit()
with patch("app.api.reports.upload_photo", return_value="http://x/u.jpg"), patch("app.api.reports.process_report"):
    as_user("bad")
    r = c.post("/api/reports", files={"photo": ("a.jpg", jpeg(), "image/jpeg")}, data={"latitude": LAT, "longitude": LNG})
    check("заблокированный не может отправить заявку", r.status_code == 403 and "заблокирован" in r.json()["detail"])

# ---------- 3. «Тоже вижу» ----------
owner_rid = mk("owner", category="бытовой мусор", description="куча")
as_user("fan1"); r = c.post(f"/api/reports/{owner_rid}/support")
check("голос «Тоже вижу» принят", r.status_code == 200 and r.json()["count"] == 1, r.json())
check("повторный голос → 409", c.post(f"/api/reports/{owner_rid}/support").status_code == 409)
as_user("owner"); check("за свою заявку голосовать нельзя → 400", c.post(f"/api/reports/{owner_rid}/support").status_code == 400)
as_user("fan2"); c.post(f"/api/reports/{owner_rid}/support")
pub = [x for x in c.get("/api/reports").json() if x["id"] == str(owner_rid)][0]
check("в публичном списке видно число голосов", pub["support_count"] == 2, pub["support_count"])
as_user("bad"); check("заблокированный не может голосовать", c.post(f"/api/reports/{owner_rid}/support").status_code == 403)

# ---------- 4. дубликаты рядом ----------
near_rid = mk("u9", lat=LAT + 0.0001, lng=LNG)        # ~11 м
far_rid = mk("u9", lat=LAT + 0.01, lng=LNG)            # ~1,1 км
res = c.get("/api/reports/nearby", params={"lat": LAT, "lng": LNG}).json()
ids = {x["id"] for x in res}
check("nearby: находит точки в радиусе 30 м", str(owner_rid) in ids and str(near_rid) in ids and str(far_rid) not in ids, len(res))
check("nearby: ближайшие первыми", res[0]["id"] == str(owner_rid))

# ---------- 5. жалобы: 3 жалобы скрывают точку ----------
target = mk("victim", category="бытовой мусор")
for i in range(1, 4):
    as_user(f"flagger{i}")
    r = c.post(f"/api/reports/{target}/flag", json={"reason": "Загрязнения нет"})
    check(f"жалоба {i} принята", r.status_code == 200 and r.json()["count"] == i)
    if i == 1:
        check("повторная жалоба от того же пользователя → 409", c.post(f"/api/reports/{target}/flag", json={}).status_code == 409)
visible = {x["id"] for x in c.get("/api/reports").json()}
check("после 3 жалоб точка скрыта с публичной карты", str(target) not in visible)
as_user("anyone"); check("скрытая точка недоступна по прямой ссылке", c.get(f"/api/reports/{target}").status_code == 404)
as_user("adm", "admin")
fl = c.get("/api/admin/flags").json()
check("админ видит жалобы с причинами", fl and fl[0]["id"] == str(target) and fl[0]["flag_count"] == 3 and fl[0]["flag_reasons"] == ["Загрязнения нет"] * 3, fl[0]["flag_count"])
r = c.post(f"/api/admin/reports/{target}/dismiss-flags")
check("админ отклонил жалобы → точка снова видна", r.json()["count"] == 3 and str(target) in {x["id"] for x in c.get("/api/reports").json()})

# ---------- 6. блокировка админом ----------
as_user("adm", "admin")
check("админ блокирует пользователя", c.post("/api/admin/users/spammer/block", json={"reason": "спам"}).status_code == 200)
check("нельзя заблокировать себя", c.post("/api/admin/users/adm/block", json={}).status_code == 400)
check("список заблокированных", {x["user_id"] for x in c.get("/api/admin/blocked").json()} >= {"bad", "spammer"})
check("разблокировка", c.delete("/api/admin/users/spammer/block").status_code == 204 and "spammer" not in {x["user_id"] for x in c.get("/api/admin/blocked").json()})
as_user("user1"); check("обычный пользователь не попадёт в админ-API", c.get("/api/admin/blocked").status_code == 403)

# ---------- 7. уборка: расстояние 1 км ----------
clean_rid = mk("own2", category="бытовой мусор", description="свалка")
def cleanup(uid, lat, lng, role="user"):
    as_user(uid, role)
    data = {} if lat is None else {"latitude": lat, "longitude": lng}
    return c.post(f"/api/reports/{clean_rid}/cleanup", files={"photo": ("c.jpg", jpeg(), "image/jpeg")}, data=data)
with patch("app.api.reports.upload_photo", return_value="http://x/c.jpg"), patch("app.api.reports.process_cleanup"):
    r = cleanup("cleaner1", LAT + 0.0045, LNG)   # ~500 м
    check("уборка: 500 м от точки — можно", r.status_code == 202, r.status_code)
    r = cleanup("cleaner2", LAT + 0.02, LNG)     # ~2,2 км
    check("уборка: 2,2 км от точки — нельзя (403)", r.status_code == 403 and "слишком далеко" in r.json()["detail"], r.json().get("detail"))
    check("уборка без координат — нельзя (422)", cleanup("cleaner3", None, None).status_code == 422)
    check("администратору расстояние не важно", cleanup("adm", None, None, "admin").status_code == 202)

# ---------- 8. архив «до/после» ----------
arch_rid = mk("own3", status=ReportStatus.resolved, category="стихийная свалка", description="была свалка")
with SessionLocal() as db:
    rr = db.get(Report, arch_rid); rr.resolved_at = datetime.now(timezone.utc)
    db.add(CleanupSubmission(report_id=arch_rid, user_id="x", photo_path="a", photo_url="http://x/after.jpg", status=CleanupStatus.confirmed)); db.commit()
a = [x for x in c.get("/api/reports/archive").json() if x["id"] == str(arch_rid)]
check("архив: есть фото «до» и «после»", a and a[0]["after_photo_url"] == "http://x/after.jpg", a and a[0]["after_photo_url"])

# ---------- 9. статистика и метрики ИИ ----------
with SessionLocal() as db:
    db.query(Report).delete(); db.query(CleanupSubmission).delete(); db.commit()
def mk2(status, note, polluted=None, conf=None, cat="бытовой мусор", resolved=False):
    rid = mk("u", status=status, category=cat, moderation_note=note, ai_is_polluted=polluted, ai_confidence=conf)
    if resolved:
        with SessionLocal() as db:
            r = db.get(Report, rid); r.created_at = datetime.now(timezone.utc) - timedelta(days=4); r.resolved_at = datetime.now(timezone.utc); db.commit()
mk2(ReportStatus.approved, N.NOTE_AUTO_APPROVED, True, 0.9)
mk2(ReportStatus.approved, N.NOTE_AUTO_APPROVED, True, 0.95)
mk2(ReportStatus.rejected, N.NOTE_AUTO_REJECTED, False, 0.9)
mk2(ReportStatus.approved, f"{N.NOTE_ADMIN_PREFIX}: —", True, 0.5)     # админ согласился с ИИ
mk2(ReportStatus.rejected, f"{N.NOTE_ADMIN_PREFIX}: —", True, 0.5)     # админ не согласился с ИИ
mk2(ReportStatus.needs_review, N.NOTE_LOW_CONFIDENCE, True, 0.5)       # ждёт проверки
mk2(ReportStatus.resolved, N.NOTE_AUTO_APPROVED, True, 0.85, cat="стихийная свалка", resolved=True)
s = c.get("/api/stats").json()
check("статистика: опубликовано 5 (4 approved + 1 resolved... )", s["total"] == 4 and s["active"] == 3 and s["resolved"] == 1, (s["total"], s["active"], s["resolved"]))
check("статистика: доля убранных 25%", s["resolution_rate"] == 0.25)
check("статистика: среднее время уборки ≈ 4 дня", s["avg_days_to_resolve"] == 4.0, s["avg_days_to_resolve"])
check("статистика: категории", {x["category"] for x in s["by_category"]} == {"бытовой мусор", "стихийная свалка"})
check("статистика: график за 30 дней", len(s["by_day"]) == 30 and sum(d["reported"] for d in s["by_day"]) == 4 and sum(d["resolved"] for d in s["by_day"]) == 1)
ai = s["ai_reports"]
check("метрики ИИ: 4 решено ИИ самостоятельно", ai["auto"] == 4, ai["auto"])
check("метрики ИИ: 3 передано человеку (2 решено + 1 ждёт)", ai["escalated"] == 3, ai["escalated"])
check("метрики ИИ: доля автоматических 4/7", abs(ai["auto_share"] - 4 / 7) < 1e-3, ai["auto_share"])
check("метрики ИИ: совпадение с админом 1 из 2 = 50%", ai["reviewed_with_verdict"] == 2 and ai["agreement"] == 0.5, (ai["reviewed_with_verdict"], ai["agreement"]))

# ---------- 10. CSV ----------
mk("u", category="=cmd|' /C calc'!A0", description="обычное, с «ё» и ; точкой с запятой")
as_user("adm", "admin")
r = c.get("/api/admin/export.csv?scope=active")
text = r.content.decode("utf-8")
check("CSV: заголовок attachment и BOM", "attachment" in r.headers["content-disposition"] and r.content.startswith(b"\xef\xbb\xbf"))
check("CSV: защита от формул (= → '=)", "'=cmd" in text and ";=cmd" not in text)
check("CSV: есть кириллица и ссылка на карту", "Категория" in text and "openstreetmap.org" in text)
check("CSV: неверный scope отклоняется", c.get("/api/admin/export.csv?scope=evil").status_code == 422)

# ---------- 11. размытие лиц/номеров ----------
from app.services.privacy import blur_regions
import numpy as np
base = Image.effect_noise((200, 200), 80).convert("RGB")
b = io.BytesIO(); base.save(b, "PNG")
out = blur_regions(b.getvalue(), [PrivacyBox(kind="face", ymin=250, xmin=250, ymax=500, xmax=500)])
res_img = np.array(Image.open(io.BytesIO(out)).convert("RGB")).astype(int); orig = np.array(base).astype(int)
inside = np.abs(res_img[60:90, 60:90] - orig[60:90, 60:90]).mean()
outside = np.abs(res_img[150:195, 5:45] - orig[150:195, 5:45]).mean()
check("размытие: область с лицом изменена, остальное фото — почти нет (JPEG-шум)", inside > 3 * outside, (round(inside, 1), round(outside, 1)))
check("размытие: без рамок вернёт None", blur_regions(b.getvalue(), []) is None and blur_regions(b.getvalue(), [PrivacyBox(kind="face", ymin=5, xmin=5, ymax=6, xmax=6)]) is None)

# ---------- 12. process_report: скрытие лиц и сценарии ошибок ----------
from app.services import moderation as M
def run_pipeline(boxes, blur_error=False):
    rid = mk("pp", status=ReportStatus.pending)
    with SessionLocal() as db:
        r = db.get(Report, rid); r.photo_path = "orig/path.jpg"; db.commit()
    ai = AIResult(is_polluted=True, confidence=0.95, category="бытовой мусор", description="Куча мусора", description_kk="Қоқыс үйіндісі", privacy_boxes=boxes)
    deleted = []
    with patch.object(M, "analyze_photo", return_value=ai), patch.object(M, "upload_photo", return_value="http://x/blurred.jpg") as up, \
         patch.object(M, "delete_photo", side_effect=lambda p: deleted.append(p)), \
         patch.object(M, "blur_regions", side_effect=(RuntimeError("boom") if blur_error else M.blur_regions)):
        M.process_report(rid, b.getvalue(), "image/png")
    with SessionLocal() as db:
        return db.get(Report, rid), deleted
r, deleted = run_pipeline([PrivacyBox(kind="face", ymin=100, xmin=100, ymax=400, xmax=400)])
check("пайплайн: подтверждено, казахское описание сохранено", r.status == ReportStatus.approved and r.description_kk == "Қоқыс үйіндісі")
check("пайплайн: публичное фото заменено размытым, оригинал удалён", r.photo_url == "http://x/blurred.jpg" and deleted == ["orig/path.jpg"], (r.photo_url, deleted))
r, deleted = run_pipeline([])
check("пайплайн: лиц нет — фото не трогаем", r.photo_path == "orig/path.jpg" and deleted == [] and r.status == ReportStatus.approved)
r, deleted = run_pipeline([PrivacyBox(kind="face", ymin=100, xmin=100, ymax=400, xmax=400)], blur_error=True)
check("пайплайн: сбой размытия → на проверку, оригинал не публикуем", r.status == ReportStatus.needs_review and r.moderation_note == N.NOTE_BLUR_FAILED and deleted == [])

print("\nИТОГ:", "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" if ok else "ЕСТЬ ПРОВАЛЫ")
