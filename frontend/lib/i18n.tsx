"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "ru" | "kk";
const STORAGE_KEY = "ecostep-lang";

// ───────────────────────── Русский (основной язык, по нему проверяются ключи) ─────────────────────────
const ru = {
  // навигация
  "nav.map": "Карта",
  "nav.stats": "Статистика",
  "nav.mine": "Мои заявки",
  "nav.admin": "Модерация",
  "nav.login": "Войти",
  "nav.logout": "Выйти",
  "nav.menu": "Меню",
  "home.report": "📷 Сообщить о проблеме",

  // карта и всплывающее окно точки
  "map.loading": "Загрузка карты…",
  "map.allCategories": "Все категории",
  "map.cleaned": "🧹 Сообщить, что убрано",
  "map.support": "👁 Тоже вижу",
  "map.supportThanks": "Спасибо, ваш голос учтён",
  "map.supportCount": "Подтвердили жители: {n}",
  "map.flag": "⚑ Пожаловаться",
  "map.flagWhy": "Причина жалобы:",
  "map.flagSent": "Жалоба отправлена, спасибо",
  "map.reason.nothing": "Загрязнения нет",
  "map.reason.fake": "Ложная заявка",
  "map.reason.privacy": "На фото лица или номера",
  "map.reason.other": "Другое",
  "map.appeal": "📨 Обращение в акимат",
  "map.delete": "🗑 Удалить точку",
  "map.deleting": "Удаление…",
  "map.deleteConfirm": "Удалить точку с карты без возможности восстановить?",
  "map.needLogin": "Войдите в аккаунт, чтобы это сделать",
  "map.deleteFail": "Не удалось удалить",

  // вход
  "login.signin": "Вход",
  "login.signup": "Регистрация",
  "login.email": "Email",
  "login.password": "Пароль",
  "login.doSignin": "Войти",
  "login.doSignup": "Создать аккаунт",
  "login.toSignup": "Нет аккаунта? Зарегистрироваться",
  "login.toSignin": "Уже есть аккаунт? Войти",
  "login.checkMail": "Проверьте почту и подтвердите email, затем войдите.",

  // новая заявка
  "report.title": "Сообщить о проблеме",
  "report.takePhoto": "📷 Сделать фото",
  "report.photoAlt": "Фото",
  "report.place": "Место на карте",
  "report.myPlace": "📍 Моё место",
  "report.locating": "Определяем…",
  "report.placeAuto": "Место определено автоматически",
  "report.placeManual": "Место выбрано вручную",
  "report.placeWait": "Определяем геопозицию…",
  "report.placeFail": "Не удалось определить геопозицию. Отметьте место на карте вручную.",
  "report.placeHint": "Перетащите метку или нажмите на карту, чтобы указать точное место проблемы.",
  "report.privacy": "Не снимайте лица людей и номера автомобилей. Если они всё же попадут в кадр, система автоматически скроет их размытием перед публикацией.",
  "report.comment": "Комментарий (необязательно)",
  "report.send": "Отправить на проверку",
  "report.sending": "Отправка…",
  "report.failed": "Не удалось отправить",
  "report.photoFailed": "Не удалось получить фото",
  "report.doneTitle": "Заявка отправлена",
  "report.doneText": "ИИ анализирует фото. Статус можно посмотреть в личном кабинете.",
  "report.nearTitle": "Рядом уже есть заявки",
  "report.nearText": "Похоже, эту проблему уже отметили (в радиусе ~{r} м). Поддержите существующую заявку, чтобы не создавать дубликат.",
  "report.nearOpen": "На карте",

  // подтверждение уборки
  "cleanup.title": "Подтвердить уборку",
  "cleanup.hint": "Сфотографируйте это же место сейчас — ИИ сравнит фото с исходной заявкой.",
  "cleanup.geoWait": "Определяем ваше местоположение…",
  "cleanup.geoOk": "✓ Вы в {d} от точки",
  "cleanup.geoFar": "Вы слишком далеко от точки ({d}). Подтвердить уборку можно, находясь не дальше {max} от места.",
  "cleanup.geoFail": "Не удалось определить ваше местоположение. Разрешите доступ к геопозиции и нажмите «Обновить».",
  "cleanup.refresh": "Обновить",
  "cleanup.send": "Отправить на проверку",
  "cleanup.doneTitle": "Фото отправлено",
  "cleanup.doneText": "ИИ сравнивает его с исходной заявкой. Если место действительно убрано, точка исчезнет с карты. Статус виден в разделе «Мои заявки».",
  "cleanup.gone": "Эта точка уже не на карте — возможно, её уже убрали.",
  "cleanup.noPoint": "Не указана точка на карте — откройте эту страницу по ссылке «Сообщить, что убрано» из окна точки на карте.",
  "cleanup.toMap": "На карту",

  // личный кабинет
  "cabinet.title": "Мои заявки",
  "cabinet.clear": "Очистить всё",
  "cabinet.clearing": "Очистка…",
  "cabinet.empty": "Пока пусто. Сообщите о первой проблеме!",
  "cabinet.delete": "Удалить",
  "cabinet.deleting": "Удаление…",
  "cabinet.analyzing": "Анализ…",
  "cabinet.cleanupTitle": "🧹 Заявка на уборку",
  "cabinet.point": "Точка: {c}",
  "cabinet.confirmReport": "Удалить эту заявку из истории? Действие необратимо.",
  "cabinet.confirmCleanup": "Удалить эту заявку на уборку из истории?",
  "cabinet.confirmAll": "Очистить всю историю? Действие необратимо: ваши заявки пропадут вместе с точками на карте, а заявки на уборку — из списка.",
  "cabinet.deleteFail": "Не удалось удалить",
  "cabinet.clearFail": "Не удалось очистить историю",
  "cabinet.pointDefault": "загрязнение",

  // статусы
  "status.pending": "Анализ ИИ…",
  "status.approved": "На карте",
  "status.rejected": "Отклонена",
  "status.needs_review": "На проверке",
  "status.resolved": "Убрана",
  "cstatus.confirmed": "Уборка подтверждена",
  "cstatus.rejected": "Не подтверждено",

  // статистика
  "stats.title": "Статистика проекта",
  "stats.subtitle": "Открытые данные о том, как жители находят и убирают загрязнения в городе.",
  "stats.loading": "Загрузка…",
  "stats.loadFail": "Не удалось загрузить статистику",
  "stats.total": "Всего заявок на карте",
  "stats.active": "Сейчас на карте",
  "stats.resolved": "Убрано",
  "stats.rate": "Доля убранных",
  "stats.avgDays": "Среднее время до уборки",
  "stats.days": "{n} дн.",
  "stats.supports": "Голосов «Тоже вижу»",
  "stats.cleanups": "Уборок, подтверждённых по фото",
  "stats.byCategory": "По категориям",
  "stats.legendActive": "На карте",
  "stats.legendResolved": "Убрано",
  "stats.byDay": "Динамика за 30 дней",
  "stats.legendNew": "Новые заявки",
  "stats.aiTitle": "Как работает искусственный интеллект",
  "stats.aiReports": "Проверка заявок о загрязнении",
  "stats.aiCleanups": "Проверка уборки по фото",
  "stats.aiAuto": "Обработано ИИ без участия человека",
  "stats.aiAgree": "Совпадение решения ИИ и администратора на спорных случаях",
  "stats.aiConf": "Средняя уверенность ИИ при автоматических решениях",
  "stats.aiNoData": "Пока недостаточно данных",
  "stats.archive": "Убранные места: было → стало",
  "stats.before": "Было",
  "stats.after": "Стало",
  "stats.adminCleaned": "Убрано — подтверждено администратором",
  "stats.archiveEmpty": "Пока нет убранных мест — первые появятся после подтверждённой уборки.",

  // обращение в органы
  "appeal.title": "Обращение в государственные органы",
  "appeal.intro": "Готовый текст обращения по этой точке. Скопируйте его и подайте через eOtinish (нужен вход через eGov) или в акимат района.",
  "appeal.lang": "Язык обращения",
  "appeal.copy": "📋 Скопировать текст",
  "appeal.copied": "Скопировано ✓",
  "appeal.photo": "🖼 Открыть фото",
  "appeal.eotinish": "Открыть eOtinish",
  "appeal.back": "← К карте",
  "appeal.gone": "Эта точка уже не на карте.",
  "appeal.loading": "Загрузка…",
} as const;

export type TKey = keyof typeof ru;

// ───────────────────────── Қазақша ─────────────────────────
const kk: Record<TKey, string> = {
  "nav.map": "Карта",
  "nav.stats": "Статистика",
  "nav.mine": "Менің өтінімдерім",
  "nav.admin": "Модерация",
  "nav.login": "Кіру",
  "nav.logout": "Шығу",
  "nav.menu": "Мәзір",
  "home.report": "📷 Мәселе туралы хабарлау",

  "map.loading": "Карта жүктелуде…",
  "map.allCategories": "Барлық санаттар",
  "map.cleaned": "🧹 Тазаланды деп хабарлау",
  "map.support": "👁 Мен де көріп тұрмын",
  "map.supportThanks": "Рахмет, дауысыңыз есепке алынды",
  "map.supportCount": "Тұрғындар растады: {n}",
  "map.flag": "⚑ Шағымдану",
  "map.flagWhy": "Шағым себебі:",
  "map.flagSent": "Шағым жіберілді, рахмет",
  "map.reason.nothing": "Ластану жоқ",
  "map.reason.fake": "Жалған өтінім",
  "map.reason.privacy": "Фотода адамдар немесе нөмірлер бар",
  "map.reason.other": "Басқа",
  "map.appeal": "📨 Әкімдікке өтініш",
  "map.delete": "🗑 Нүктені жою",
  "map.deleting": "Жойылуда…",
  "map.deleteConfirm": "Нүктені картадан қайтарусыз жою керек пе?",
  "map.needLogin": "Мұны орындау үшін аккаунтқа кіріңіз",
  "map.deleteFail": "Жою мүмкін болмады",

  "login.signin": "Кіру",
  "login.signup": "Тіркелу",
  "login.email": "Email",
  "login.password": "Құпиясөз",
  "login.doSignin": "Кіру",
  "login.doSignup": "Аккаунт жасау",
  "login.toSignup": "Аккаунтыңыз жоқ па? Тіркелу",
  "login.toSignin": "Аккаунтыңыз бар ма? Кіру",
  "login.checkMail": "Поштаңызды тексеріп, email-ді растаңыз, содан кейін кіріңіз.",

  "report.title": "Мәселе туралы хабарлау",
  "report.takePhoto": "📷 Суретке түсіру",
  "report.photoAlt": "Фото",
  "report.place": "Картадағы орын",
  "report.myPlace": "📍 Менің орным",
  "report.locating": "Анықталуда…",
  "report.placeAuto": "Орын автоматты түрде анықталды",
  "report.placeManual": "Орын қолмен таңдалды",
  "report.placeWait": "Геопозиция анықталуда…",
  "report.placeFail": "Геопозицияны анықтау мүмкін болмады. Орынды картада қолмен белгілеңіз.",
  "report.placeHint": "Мәселенің нақты орнын көрсету үшін белгіні сүйреңіз немесе картаны басыңыз.",
  "report.privacy": "Адамдардың бет-әлпетін және көлік нөмірлерін түсірмеңіз. Олар кадрға түссе, жүйе жариялар алдында оларды автоматты түрде бұлдыратады.",
  "report.comment": "Пікір (міндетті емес)",
  "report.send": "Тексеруге жіберу",
  "report.sending": "Жіберілуде…",
  "report.failed": "Жіберу мүмкін болмады",
  "report.photoFailed": "Фотоны алу мүмкін болмады",
  "report.doneTitle": "Өтінім жіберілді",
  "report.doneText": "ЖИ фотоны талдап жатыр. Күйін жеке кабинеттен көре аласыз.",
  "report.nearTitle": "Жақын жерде өтінімдер бар",
  "report.nearText": "Бұл мәселе бұрын белгіленген сияқты (~{r} м радиуста). Қайталанбау үшін бар өтінімді қолдаңыз.",
  "report.nearOpen": "Картада",

  "cleanup.title": "Тазалауды растау",
  "cleanup.hint": "Дәл осы орынды қазір суретке түсіріңіз — ЖИ фотоны бастапқы өтінімімен салыстырады.",
  "cleanup.geoWait": "Орналасқан жеріңіз анықталуда…",
  "cleanup.geoOk": "✓ Сіз нүктеден {d} қашықтықтасыз",
  "cleanup.geoFar": "Сіз нүктеден тым алыссыз ({d}). Тазалауды орыннан {max} артық емес қашықтықта тұрып растауға болады.",
  "cleanup.geoFail": "Орналасқан жеріңізді анықтау мүмкін болмады. Геопозицияға рұқсат беріп, «Жаңарту» түймесін басыңыз.",
  "cleanup.refresh": "Жаңарту",
  "cleanup.send": "Тексеруге жіберу",
  "cleanup.doneTitle": "Фото жіберілді",
  "cleanup.doneText": "ЖИ оны бастапқы өтіліммен салыстырады. Орын шынымен тазаланған болса, нүкте картадан жоғалады. Күйі «Менің өтінімдерім» бөлімінде көрінеді.",
  "cleanup.gone": "Бұл нүкте енді картада жоқ — мүмкін, оны бұрын тазалап қойған.",
  "cleanup.noPoint": "Картадағы нүкте көрсетілмеген — бұл бетті картадағы нүкте терезесіндегі «Тазаланды деп хабарлау» сілтемесі арқылы ашыңыз.",
  "cleanup.toMap": "Картаға",

  "cabinet.title": "Менің өтінімдерім",
  "cabinet.clear": "Барлығын тазалау",
  "cabinet.clearing": "Тазаланып жатыр…",
  "cabinet.empty": "Әзірге бос. Алғашқы мәселе туралы хабарлаңыз!",
  "cabinet.delete": "Жою",
  "cabinet.deleting": "Жойылуда…",
  "cabinet.analyzing": "Талдау…",
  "cabinet.cleanupTitle": "🧹 Тазалау өтінімі",
  "cabinet.point": "Нүкте: {c}",
  "cabinet.confirmReport": "Бұл өтінімді тарихтан жою керек пе? Әрекетті қайтару мүмкін емес.",
  "cabinet.confirmCleanup": "Бұл тазалау өтінімін тарихтан жою керек пе?",
  "cabinet.confirmAll": "Бүкіл тарихты тазалау керек пе? Әрекетті қайтару мүмкін емес: өтінімдеріңіз картадағы нүктелермен бірге жойылады, ал тазалау өтінімдері тізімнен жоғалады.",
  "cabinet.deleteFail": "Жою мүмкін болмады",
  "cabinet.clearFail": "Тарихты тазалау мүмкін болмады",
  "cabinet.pointDefault": "ластану",

  "status.pending": "ЖИ талдауда…",
  "status.approved": "Картада",
  "status.rejected": "Қабылданбады",
  "status.needs_review": "Тексерілуде",
  "status.resolved": "Тазаланды",
  "cstatus.confirmed": "Тазалау расталды",
  "cstatus.rejected": "Расталмады",

  "stats.title": "Жоба статистикасы",
  "stats.subtitle": "Тұрғындардың қалада ластануды қалай тауып, тазалайтыны туралы ашық деректер.",
  "stats.loading": "Жүктелуде…",
  "stats.loadFail": "Статистиканы жүктеу мүмкін болмады",
  "stats.total": "Картадағы барлық өтінімдер",
  "stats.active": "Қазір картада",
  "stats.resolved": "Тазаланды",
  "stats.rate": "Тазаланғандар үлесі",
  "stats.avgDays": "Тазалауға дейінгі орташа уақыт",
  "stats.days": "{n} күн",
  "stats.supports": "«Мен де көріп тұрмын» дауыстары",
  "stats.cleanups": "Фото арқылы расталған тазалаулар",
  "stats.byCategory": "Санаттар бойынша",
  "stats.legendActive": "Картада",
  "stats.legendResolved": "Тазаланды",
  "stats.byDay": "30 күндегі серпін",
  "stats.legendNew": "Жаңа өтінімдер",
  "stats.aiTitle": "Жасанды интеллект қалай жұмыс істейді",
  "stats.aiReports": "Ластану туралы өтінімдерді тексеру",
  "stats.aiCleanups": "Тазалауды фото бойынша тексеру",
  "stats.aiAuto": "Адам қатысуынсыз ЖИ өңдегені",
  "stats.aiAgree": "Даулы жағдайларда ЖИ мен әкімші шешімдерінің сәйкестігі",
  "stats.aiConf": "Автоматты шешімдердегі ЖИ-дің орташа сенімділігі",
  "stats.aiNoData": "Әзірге деректер жеткіліксіз",
  "stats.archive": "Тазаланған орындар: бұрын → қазір",
  "stats.before": "Бұрын",
  "stats.after": "Қазір",
  "stats.adminCleaned": "Тазаланды — әкімші растады",
  "stats.archiveEmpty": "Әзірге тазаланған орындар жоқ — алғашқылары расталған тазалаудан кейін пайда болады.",

  "appeal.title": "Мемлекеттік органдарға өтініш",
  "appeal.intro": "Осы нүкте бойынша дайын өтініш мәтіні. Оны көшіріп, eOtinish арқылы (eGov арқылы кіру қажет) немесе аудан әкімдігіне беріңіз.",
  "appeal.lang": "Өтініш тілі",
  "appeal.copy": "📋 Мәтінді көшіру",
  "appeal.copied": "Көшірілді ✓",
  "appeal.photo": "🖼 Фотоны ашу",
  "appeal.eotinish": "eOtinish ашу",
  "appeal.back": "← Картаға",
  "appeal.gone": "Бұл нүкте енді картада жоқ.",
  "appeal.loading": "Жүктелуде…",
};

// ───────────────────────── Категории, которые возвращает ИИ (хранятся по-русски) ─────────────────────────
const CATEGORY_KK: Record<string, string> = {
  "бытовой мусор": "тұрмыстық қоқыс",
  "стихийная свалка": "стихиялық қоқыс үйіндісі",
  "строительный мусор": "құрылыс қоқысы",
  "загрязнение воды": "суды ластау",
  "пятна/разлив": "дақтар / төгінді",
  "другое": "басқа",
  "нет загрязнения": "ластану жоқ",
};

// ───────────────────────── Тексты ошибок сервера (он отвечает по-русски) ─────────────────────────
const ERRORS_KK: [string, string][] = [
  ["Слишком много заявок", "Тым көп өтінім: минутына 3-тен артық емес. Біраз күтіп, қайталаңыз."],
  ["Ваш аккаунт заблокирован", "Аккаунтыңызды әкімші бұғаттады."],
  ["Вы слишком далеко", "Сіз нүктеден тым алыссыз. Тазалауды орыннан 1 км-ден артық емес қашықтықта тұрып растауға болады."],
  ["Не удалось определить ваше местоположение", "Орналасқан жеріңізді анықтау мүмкін болмады: геопозицияға рұқсат беріңіз."],
  ["Не удалось определить геопозицию", "Геопозицияны анықтау мүмкін болмады: GPS-ке рұқсат беріңіз."],
  ["Это ваша собственная заявка", "Бұл — сіздің өз өтініміңіз."],
  ["Вы уже подтверждали", "Сіз бұл нүктені бұрын растағансыз."],
  ["Нельзя пожаловаться", "Өз өтініміңізге шағымдануға болмайды."],
  ["Вы уже отправляли жалобу", "Сіз бұл нүктеге бұрын шағым жібергенсіз."],
  ["Заявка не найдена", "Өтінім табылмады немесе ол енді картада жоқ."],
  ["Нужно войти в аккаунт", "Аккаунтқа кіру қажет."],
  ["Недействительный токен", "Сессия жарамсыз — қайта кіріңіз."],
  ["Допустимы JPEG", "Тек JPEG, PNG, WebP форматтарына рұқсат етіледі."],
  ["Файл больше", "Файл тым үлкен."],
  ["Файл не является изображением", "Файл сурет емес."],
  ["Failed to fetch", "Серверге қосылу мүмкін болмады. Интернетті тексеріңіз."],
];
const ERRORS_RU: [string, string][] = [["Failed to fetch", "Не удаётся связаться с сервером. Проверьте интернет."]];

// ───────────────────────── Провайдер и хук ─────────────────────────
type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
  /** Название категории на выбранном языке */
  category: (c: string | null | undefined) => string;
  /** Описание заявки на выбранном языке (казахское, если есть, иначе русское) */
  desc: (r: { description: string | null; description_kk?: string | null }) => string;
  /** Понятный текст ошибки на выбранном языке */
  err: (message: string) => string;
  date: (iso: string, withTime?: boolean) => string;
  distance: (meters: number) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ru" || saved === "kk") setLangState(saved);
      else if (navigator.language?.toLowerCase().startsWith("kk")) setLangState("kk");
    } catch {
      /* хранилище недоступно — остаёмся на русском */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ничего страшного: язык просто не запомнится */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const t = (key: TKey, vars?: Vars) => {
      let s: string = (lang === "kk" ? kk[key] : ru[key]) ?? ru[key];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    };
    return {
      lang,
      setLang,
      t,
      category: (c) => (!c ? "" : lang === "kk" ? CATEGORY_KK[c] ?? c : c),
      desc: (r) => (lang === "kk" && r.description_kk ? r.description_kk : r.description ?? ""),
      err: (message) => {
        const table = lang === "kk" ? ERRORS_KK : ERRORS_RU;
        return table.find(([prefix]) => message.startsWith(prefix))?.[1] ?? message;
      },
      date: (iso, withTime = false) => {
        const d = new Date(iso);
        const locale = lang === "kk" ? "kk-KZ" : "ru-RU";
        return withTime ? d.toLocaleString(locale) : d.toLocaleDateString(locale);
      },
      distance: (m) => (m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n должен вызываться внутри <I18nProvider>");
  return v;
}
