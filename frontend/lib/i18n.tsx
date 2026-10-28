"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "ru" | "kk";
const STORAGE_KEY = "ecostep-lang";

// ───────────────────────── Русский (основной язык, по нему проверяются ключи) ─────────────────────────
const ru = {
  "brand.adminIntro": "Проверяйте заявки и помогайте городу меняться.",
  "brand.adminTitle": "Забота требует внимания",
  "brand.inviteText": "Откройте карту и найдите место, которому нужна помощь.",
  "brand.inviteTitle": "Где начинается ваш шаг?",
  "brand.impactEyebrow": "СЛЕД НАШИХ ДОБРЫХ ДЕЛ",
  "brand.artCaption": "ГОРОД И ПРИРОДА. ВМЕСТЕ.",
  "brand.pauseMotion": "Приостановить движение иллюстрации",
  "brand.pause": "Пауза",
  "brand.resume": "Оживить",
  "brand.heroNote": "Большие перемены начинаются рядом.",
  "nav.home": "Главная",
  "brand.tilesError": "Подложка карты недоступна. Проверьте подключение к интернету.",
  "brand.tagline": "Город начинается с тебя",
  "brand.skip": "Перейти к содержимому",
  "brand.report": "Сообщить о проблеме",
  "brand.reportShort": "Сообщить",
  "brand.eyebrow": "МЕСТО ДЛЯ ПЕРЕМЕН",
  "brand.heroOne": "Ваш шаг.",
  "brand.heroTwo": "Живой город.",
  "brand.heroText": "Чистые дворы, живые реки, зелёные улицы. Замечайте то, что требует заботы, и помогайте менять город вместе с EcoStep.",
  "brand.explore": "Открыть карту",
  "brand.privacy": "Бережно к природе. Бережно к вашим данным.",
  "brand.active": "точек ждут помощи",
  "brand.resolved": "мест стали чище",
  "brand.supports": "подтверждений от жителей",
  "brand.impact": "Наш общий вклад",
  "brand.statsUnavailable": "Статистика недоступна",
  "brand.around": "ЭКОЛОГИЯ РЯДОМ",
  "brand.mapTitle": "Карта перемен",
  "brand.mapLive": "Открытые заявки",
  "brand.mapLegend": "Места, которым нужна забота",
  "brand.mapHint": "Нажмите на точку, чтобы узнать больше",
  "brand.together": "ДЕЙСТВУЕМ ВМЕСТЕ",
  "brand.stepTitle": "От наблюдения\nк переменам.",
  "brand.stepIntro": "Для заботы о городе не нужен особый повод. Достаточно начать.",
  "brand.step1": "Увидеть больше",
  "brand.step1Text": "Сфотографируйте место, которому нужна помощь.",
  "brand.step2": "Дать месту голос",
  "brand.step2Text": "Добавьте точку на карту. Мы проверим заявку.",
  "brand.step3": "Оставить добрый след",
  "brand.step3Text": "Поддержите заявку или расскажите об уборке.",
  "brand.firstStep": "Сделать первый шаг",
  "brand.loginTitle": "Ваш город.\nВаш вклад.",
  "brand.loginText": "Присоединяйтесь к тем, кто делает мир вокруг немного чище. Всё начинается с одного шага.",
  "brand.welcome": "Рады видеть вас в EcoStep",
  "brand.signupWelcome": "Начните свою историю перемен",
  "brand.loginSub": "Войдите, чтобы сообщать о проблемах и видеть свой вклад.",
  "brand.email": "Электронная почта",
  "brand.upload": "Сделайте фото или выберите из галереи",
  "brand.reportIntro": "Покажите, где нужна помощь. Остальное сделаем вместе.",
  "brand.photoStep": "01 / ФОТОГРАФИЯ",
  "brand.placeStep": "02 / МЕСТО",
  "brand.commentStep": "03 / ДЕТАЛИ",
  "brand.optional": "Необязательно",
  "brand.statsEyebrow": "РЕЗУЛЬТАТ НАШИХ ШАГОВ",
  "brand.cabinetIntro": "Каждая ваша заявка — шаг к более чистому городу.",
  "brand.emptyTitle": "Первый шаг впереди",
  "brand.emptyText": "Отметьте проблему на карте или помогите с уборкой — здесь появится история вашего вклада.",
  "brand.downloadEyebrow": "ECOSTEP ВСЕГДА РЯДОМ",
  "brand.mapError": "Не удалось загрузить заявки. Попробуйте ещё раз.",
  "brand.retry": "Повторить",
  "brand.mapEmpty": "В этой области пока нет заявок",
  "brand.mapFilterEmpty": "Нет заявок этой категории в текущей области",
  "brand.loading": "Загружаем данные…",

  // навигация
  "nav.map": "Карта",
  "nav.stats": "Статистика",
  "nav.mine": "Мои заявки",
  "nav.admin": "Модерация",
  "nav.login": "Войти",
  "nav.logout": "Выйти",
  "nav.menu": "Меню",
  "home.report": "Сообщить о проблеме",

  // карта и всплывающее окно точки
  "map.loading": "Загрузка карты…",
  "map.allCategories": "Все категории",
  "map.cleaned": "Сообщить, что убрано",
  "map.support": "Тоже вижу",
  "map.supportThanks": "Спасибо, ваш голос учтён",
  "map.supportCount": "Подтвердили жители: {n}",
  "map.flag": "Пожаловаться",
  "map.flagWhy": "Причина жалобы:",
  "map.flagSent": "Жалоба отправлена, спасибо",
  "map.reason.nothing": "Загрязнения нет",
  "map.reason.fake": "Ложная заявка",
  "map.reason.privacy": "На фото лица или номера",
  "map.reason.other": "Другое",
  "map.appeal": "Обращение в акимат",
  "map.delete": "Удалить точку",
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
  "report.takePhoto": "Сделать фото",
  "report.photoAlt": "Фото",
  "report.place": "Место на карте",
  "report.myPlace": "Моё место",
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
  "cleanup.geoOk": "Вы в {d} от точки",
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
  "cabinet.cleanupTitle": "Заявка на уборку",
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
  "appeal.copy": "Скопировать текст",
  "appeal.copied": "Скопировано",
  "appeal.photo": "Открыть фото",
  "appeal.eotinish": "Открыть eOtinish",
  "appeal.back": "← К карте",
  "appeal.gone": "Эта точка уже не на карте.",
  "appeal.loading": "Загрузка…",

  // новые пункты меню и карта
  "nav.download": "Скачать приложение",
  "nav.privacy": "Политика конфиденциальности",
  "nav.terms": "Условия использования",
  "map.locate": "Моё местоположение",
  "map.locateFail": "Не удалось определить местоположение",

  // согласия при входе и регистрации
  "login.consentData": "Я даю согласие на сбор и обработку моих персональных данных в соответствии с {link}.",
  "login.consentDataLink": "Политикой конфиденциальности",
  "login.consentTerms": "Я ознакомился(-ась) с {link} и принимаю их.",
  "login.consentTermsLink": "Условиями использования",
  "login.consentRequired": "Отметьте обе галочки, чтобы продолжить.",
  "login.close": "Закрыть",
  "login.badCredentials": "Неверный email или пароль",
  "login.notConfirmed": "Email ещё не подтверждён: откройте письмо и перейдите по ссылке",
  "login.exists": "Пользователь с таким email уже зарегистрирован",
  "login.weak": "Пароль должен быть не короче 6 символов",

  // юридические страницы
  "legal.updated": "Редакция от {date}",
  "legal.back": "← На главную",
  "legal.other": "Читайте также:",

  // скачивание приложения
  "download.title": "Приложение EcoStep для Android",
  "download.intro": "Установите приложение, чтобы отправлять заявки прямо с телефона: камера и геолокация работают как в обычном приложении.",
  "download.button": "Скачать EcoStep.apk",
  "download.size": "Размер",
  "download.built": "Собрано",
  "download.sha": "Контрольная сумма SHA-256",
  "download.stepsTitle": "Как установить",
  "download.s1": "Скачайте файл и откройте его (из панели уведомлений или папки «Загрузки»).",
  "download.s2": "Если Android попросит разрешение «Установка из неизвестных источников», разрешите его для браузера или файлового менеджера: приложение скачано не из Google Play.",
  "download.s3": "Если Play Protect покажет предупреждение, выберите «Всё равно установить».",
  "download.s4": "При первом запуске разрешите доступ к геолокации и камере.",
  "download.note": "Нужен Android 6.0 или новее. Для iPhone приложения пока нет — пользуйтесь сайтом в браузере.",
  "download.update": "Если при обновлении Android сообщает о конфликте версий, сначала удалите старое приложение, затем установите новое.",
  "download.inApp": "Вы уже пользуетесь приложением.",
  "download.unavailable": "Файл приложения пока недоступен.",
  "download.mb": "{n} МБ",
} as const;

export type TKey = keyof typeof ru;

// ───────────────────────── Қазақша ─────────────────────────
const kk: Record<TKey, string> = {
  "brand.adminIntro": "Өтінімдерді тексеріп, қаланың өзгеруіне көмектесіңіз.",
  "brand.adminTitle": "Қамқорлық назарды қажет етеді",
  "brand.inviteText": "Картаны ашып, көмек қажет орынды табыңыз.",
  "brand.inviteTitle": "Сіздің қадамыңыз қайдан басталады?",
  "brand.impactEyebrow": "ИГІ ІСТЕРІМІЗДІҢ ІЗІ",
  "brand.artCaption": "ҚАЛА МЕН ТАБИҒАТ. БІРГЕ.",
  "brand.pauseMotion": "Иллюстрация қозғалысын кідірту",
  "brand.pause": "Кідірту",
  "brand.resume": "Жалғастыру",
  "brand.heroNote": "Үлкен өзгерістер жақыннан басталады.",
  "nav.home": "Басты бет",
  "brand.tilesError": "Картаның негізі қолжетімсіз. Интернет байланысын тексеріңіз.",
  "brand.tagline": "Қала сенен басталады",
  "brand.skip": "Мазмұнға өту",
  "brand.report": "Мәселе туралы хабарлау",
  "brand.reportShort": "Хабарлау",
  "brand.eyebrow": "ӨЗГЕРІСТЕР БАСТАЛАТЫН ЖЕР",
  "brand.heroOne": "Сіздің қадамыңыз.",
  "brand.heroTwo": "Жанды қала.",
  "brand.heroText": "Таза аулалар, мөлдір өзендер, жасыл көшелер. Қамқорлық қажет жерлерді байқап, EcoStep-пен бірге қаланы өзгертіңіз.",
  "brand.explore": "Картаны ашу",
  "brand.privacy": "Табиғатқа қамқорлық. Деректеріңізге ұқыптылық.",
  "brand.active": "орын көмек күтеді",
  "brand.resolved": "орын тазартылды",
  "brand.supports": "тұрғындардың растауы",
  "brand.impact": "Ортақ үлесіміз",
  "brand.statsUnavailable": "Статистика қолжетімсіз",
  "brand.around": "АЙНАЛАМЫЗДАҒЫ ЭКОЛОГИЯ",
  "brand.mapTitle": "Өзгерістер картасы",
  "brand.mapLive": "Ашық өтінімдер",
  "brand.mapLegend": "Қамқорлық қажет орындар",
  "brand.mapHint": "Толығырақ білу үшін нүктені басыңыз",
  "brand.together": "БІРГЕ ӘРЕКЕТ ЕТЕМІЗ",
  "brand.stepTitle": "Байқаудан\nөзгеріске дейін.",
  "brand.stepIntro": "Қалаға қамқор болу үшін ерекше себеп қажет емес. Бастау жеткілікті.",
  "brand.step1": "Көбірек байқау",
  "brand.step1Text": "Көмек қажет орынды суретке түсіріңіз.",
  "brand.step2": "Орынға дауыс беру",
  "brand.step2Text": "Картаға нүкте қосыңыз. Біз өтінімді тексереміз.",
  "brand.step3": "Жақсы із қалдыру",
  "brand.step3Text": "Өтінімді қолдаңыз немесе тазалау туралы хабарлаңыз.",
  "brand.firstStep": "Алғашқы қадам жасау",
  "brand.loginTitle": "Сіздің қалаңыз.\nСіздің үлесіңіз.",
  "brand.loginText": "Айналасын таза ететін жандарға қосылыңыз. Бәрі бір қадамнан басталады.",
  "brand.welcome": "EcoStep-ке қош келдіңіз",
  "brand.signupWelcome": "Өзгерістер тарихын бастаңыз",
  "brand.loginSub": "Мәселелерді хабарлау және үлесіңізді көру үшін кіріңіз.",
  "brand.email": "Электрондық пошта",
  "brand.upload": "Суретке түсіріңіз немесе галереядан таңдаңыз",
  "brand.reportIntro": "Қай жерде көмек қажет екенін көрсетіңіз. Қалғанын бірге жасаймыз.",
  "brand.photoStep": "01 / ФОТОСУРЕТ",
  "brand.placeStep": "02 / ОРЫН",
  "brand.commentStep": "03 / МӘЛІМЕТ",
  "brand.optional": "Міндетті емес",
  "brand.statsEyebrow": "ҚАДАМДАРЫМЫЗДЫҢ НӘТИЖЕСІ",
  "brand.cabinetIntro": "Әр өтініміңіз — таза қалаға жасалған қадам.",
  "brand.emptyTitle": "Алғашқы қадам алда",
  "brand.emptyText": "Картада мәселені белгілеңіз немесе тазалауға көмектесіңіз — үлесіңіздің тарихы осында пайда болады.",
  "brand.downloadEyebrow": "ECOSTEP ӘРДАЙЫМ ЖАНЫҢЫЗДА",
  "brand.mapError": "Өтінімдер жүктелмеді. Қайта көріңіз.",
  "brand.retry": "Қайталау",
  "brand.mapEmpty": "Бұл аймақта әзірге өтінім жоқ",
  "brand.mapFilterEmpty": "Бұл аймақта осы санаттағы өтінімдер жоқ",
  "brand.loading": "Деректер жүктелуде…",

  "nav.map": "Карта",
  "nav.stats": "Статистика",
  "nav.mine": "Менің өтінімдерім",
  "nav.admin": "Модерация",
  "nav.login": "Кіру",
  "nav.logout": "Шығу",
  "nav.menu": "Мәзір",
  "home.report": "Мәселе туралы хабарлау",

  "map.loading": "Карта жүктелуде…",
  "map.allCategories": "Барлық санаттар",
  "map.cleaned": "Тазаланды деп хабарлау",
  "map.support": "Мен де көріп тұрмын",
  "map.supportThanks": "Рахмет, дауысыңыз есепке алынды",
  "map.supportCount": "Тұрғындар растады: {n}",
  "map.flag": "Шағымдану",
  "map.flagWhy": "Шағым себебі:",
  "map.flagSent": "Шағым жіберілді, рахмет",
  "map.reason.nothing": "Ластану жоқ",
  "map.reason.fake": "Жалған өтінім",
  "map.reason.privacy": "Фотода адамдар немесе нөмірлер бар",
  "map.reason.other": "Басқа",
  "map.appeal": "Әкімдікке өтініш",
  "map.delete": "Нүктені жою",
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
  "report.takePhoto": "Суретке түсіру",
  "report.photoAlt": "Фото",
  "report.place": "Картадағы орын",
  "report.myPlace": "Менің орным",
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
  "cleanup.geoOk": "Сіз нүктеден {d} қашықтықтасыз",
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
  "cabinet.cleanupTitle": "Тазалау өтінімі",
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
  "appeal.copy": "Мәтінді көшіру",
  "appeal.copied": "Көшірілді",
  "appeal.photo": "Фотоны ашу",
  "appeal.eotinish": "eOtinish ашу",
  "appeal.back": "← Картаға",
  "appeal.gone": "Бұл нүкте енді картада жоқ.",
  "appeal.loading": "Жүктелуде…",

  "nav.download": "Қосымшаны жүктеп алу",
  "nav.privacy": "Құпиялылық саясаты",
  "nav.terms": "Пайдалану шарттары",
  "map.locate": "Менің орналасқан жерім",
  "map.locateFail": "Орналасқан жерді анықтау мүмкін болмады",

  "login.consentData": "Мен дербес деректерімді {link} сәйкес жинауға және өңдеуге келісімімді беремін.",
  "login.consentDataLink": "Құпиялылық саясатына",
  "login.consentTerms": "Мен {link} таныстым және қабылдаймын.",
  "login.consentTermsLink": "Пайдалану шарттарымен",
  "login.consentRequired": "Жалғастыру үшін екі белгіні де қойыңыз.",
  "login.close": "Жабу",
  "login.badCredentials": "Email немесе құпиясөз қате",
  "login.notConfirmed": "Email әлі расталмаған: хатты ашып, сілтемемен өтіңіз",
  "login.exists": "Мұндай email-мен пайдаланушы бұрын тіркелген",
  "login.weak": "Құпиясөз кемінде 6 таңбадан тұруы керек",

  "legal.updated": "Редакция: {date}",
  "legal.back": "← Басты бетке",
  "legal.other": "Мынаны да оқыңыз:",

  "download.title": "Android үшін EcoStep қосымшасы",
  "download.intro": "Телефоннан тікелей өтінім жіберу үшін қосымшаны орнатыңыз: камера мен геолокация кәдімгі қосымшадағыдай жұмыс істейді.",
  "download.button": "EcoStep.apk жүктеп алу",
  "download.size": "Көлемі",
  "download.built": "Жиналған күні",
  "download.sha": "SHA-256 бақылау сомасы",
  "download.stepsTitle": "Қалай орнатуға болады",
  "download.s1": "Файлды жүктеп алып, ашыңыз (хабарландыру тақтасынан немесе «Жүктеулер» қалтасынан).",
  "download.s2": "Android «Белгісіз көздерден орнату» рұқсатын сұраса, оны браузерге немесе файл менеджеріне беріңіз: қосымша Google Play-ден жүктелген жоқ.",
  "download.s3": "Play Protect ескерту көрсетсе, «Бәрібір орнату» таңдаңыз.",
  "download.s4": "Алғаш іске қосқанда геолокация мен камераға рұқсат беріңіз.",
  "download.note": "Android 6.0 немесе одан жаңа нұсқа қажет. iPhone үшін қосымша әзірге жоқ — сайтты браузерде пайдаланыңыз.",
  "download.update": "Жаңарту кезінде Android нұсқалар қайшылығы туралы хабарласа, алдымен ескі қосымшаны жойып, содан кейін жаңасын орнатыңыз.",
  "download.inApp": "Сіз қосымшаны қазірдің өзінде пайдаланып жатырсыз.",
  "download.unavailable": "Қосымша файлы әзірге қолжетімді емес.",
  "download.mb": "{n} МБ",
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
