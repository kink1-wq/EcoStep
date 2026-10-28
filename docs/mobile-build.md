# EcoStep для Android — сборка установочного файла

Фронтенд один и тот же для сайта и приложения — Capacitor оборачивает уже
готовый Next.js-сайт в нативную оболочку с доступом к камере и GPS через
системные диалоги Android.

**На ПК ничего не меняется**: `npm run dev` в `frontend/` работает как раньше.

## Важно: телефон должен «видеть» бэкенд

`localhost` на телефоне — это сам телефон, а не ваш ПК. Есть два варианта:

- **Для теста, тот же Wi-Fi.** Узнайте IP ПК командой `ipconfig` (строка
  `IPv4-адрес`, например `192.168.1.50`). В `frontend/.env.local` укажите
  `NEXT_PUBLIC_API_URL=http://192.168.1.50:8000`. Разрешите порт 8000 в
  брандмауэре Windows (Панель управления → Брандмауэр → Дополнительные
  параметры → Правило для входящих подключений → порт 8000, TCP).
- **Для реального использования** — разверните бэкенд на бесплатном
  хостинге (Render, Railway, Fly.io) и укажите его публичный адрес
  (`https://...`) в `NEXT_PUBLIC_API_URL`. Тогда приложение будет работать
  из любой сети, а не только рядом с вашим ПК.

В `backend/.env` в `CORS_ORIGINS` должны быть перечислены источники запросов:
```
CORS_ORIGINS=["http://localhost:3000","capacitor://localhost","http://localhost","https://localhost"]
```

## Что понадобится на ПК

- [Android Studio](https://developer.android.com/studio) (бесплатно). При
  первом запуске он сам предложит поставить Android SDK — согласитесь со
  всем по умолчанию.
- Уже установленные Node.js и npm.

## Сборка

```powershell
cd frontend
npm install
npx cap add android        # один раз — создаёт папку android/
npm run cap:sync           # собирает сайт и копирует в приложение
npm run cap:android        # открывает проект в Android Studio
```

Первый запуск Android Studio после `cap add android` может попросить
установить недостающие компоненты SDK — согласитесь и дождитесь загрузки.

## Разрешения камеры и геопозиции

Добавляются **автоматически** в конце `npm run cap:sync` (скрипт `frontend/scripts/setup-android.mjs`):
геолокация (точная и приблизительная), камера. Вручную править `AndroidManifest.xml` не нужно.
Если вы раньше отказали приложению в доступе, включите его в настройках телефона:
**Настройки → Приложения → EcoStep → Разрешения → Геолокация / Камера**.

## Если бэкенд на http:// (не https)

Android по умолчанию блокирует нешифрованные запросы. Создайте файл
`android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.50</domain>
    </domain-config>
</network-security-config>
```
(впишите свой IP вместо примера) и подключите его в том же
`AndroidManifest.xml`, в теге `<application ...>` добавьте атрибут:
```xml
android:networkSecurityConfig="@xml/network_security_config"
```
Если бэкенд развёрнут на `https://`, этот шаг не нужен.

## Галерея и камера

В новой заявке и подтверждении уборки доступны отдельные кнопки «Сделать фото»
и «Из галереи». В Android галерея открывается через системный Photo Picker,
в браузере — через выбор файла без `capture`. Нажатие на область фотографии
также открывает галерею. Отмена оставляет прежний снимок, замена освобождает
память его предпросмотра. Дополнительный доступ ко всем файлам телефона
для этого не запрашивается.

Проверка адаптера камеры: `npm run test:photos` из `frontend`.

## Сборка из командной строки

Нужны JDK 21, Android SDK Platform 35, Build Tools 35.0.0 и настроенные
`JAVA_HOME` / `ANDROID_HOME`. Gradle скачивается штатным wrapper проекта.
Версия задаётся в `frontend/android-version.json` и применяется при `cap:sync`.

Публичные настройки фронтенда должны быть заполнены **до** сборки:

- `NEXT_PUBLIC_API_URL` — полный HTTPS-адрес FastAPI, а не адрес сайта.
- `NEXT_PUBLIC_SITE_URL` — HTTPS-адрес сайта для подтверждения регистрации.
- `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` — адрес проекта
  и публичный publishable/anon-ключ. Серверный service key в APK не нужен.

```bash
cd frontend
npm run test:photos
npm run cap:sync
cd android
./gradlew --no-daemon assembleDebug
cd ..
npm run publish:apk
```

Последняя команда обновляет `public/downloads/EcoStep.apk` и `apk-info.json`
с версией, размером, датой и SHA-256. При следующем `cap:sync` каталог downloads
удаляется из мобильных assets, чтобы предыдущий APK не попадал внутрь нового.

## Сборка 1.1.0

Собрана debug-версия 1.1.0 (versionCode 2), пакет `kz.ecostep.app`, Android 6.0+.
Backend взят из прежнего APK: `https://ecostep-backend-otb5.onrender.com`;
сайт для возврата после регистрации: `https://eco-step-anj7.vercel.app`.
Настройки облачного окружения при этом не изменялись.

Сборка подписана новым локальным тестовым ключом. Подпись отличается от
прежнего APK в репозитории: для установки поверх него нужен прежний ключ,
иначе Android потребует удалить старое приложение. При удалении теряются
локальный вход и несохранённые данные приложения. Ключ подписи хранится вне
Git; для последующих обновлений следует сохранить и использовать тот же ключ.

Проверены сборка Next.js, типы, пять проверок фотоадаптера, браузерные сценарии
обеих форм с камерой/галереей, отменой, ошибкой и тестовой отправкой, а также
версия, разрешения, подпись и состав APK. Нативный мост в браузерной проверке
имитировался; установка на физический телефон и настоящий вход не проверялись.

## Установка на телефон

В Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
Готовый файл появится в
`android/app/build/outputs/apk/debug/app-debug.apk`. Перекиньте его на
телефон (кабелем, почтой, облаком) и откройте — Android спросит
разрешение «Установить из неизвестных источников» для этого файла,
подтвердите. Публикация в Google Play не нужна для личного использования.

## Про iPhone

Собрать `.ipa` без Mac и Xcode невозможно — это ограничение Apple, не
Capacitor. Если появится Mac, добавляется так же просто:
```powershell
npx cap add ios
npm run cap:sync
npx cap open ios
```
и дальше сборка через Xcode. Также для установки на реальный iPhone (не
симулятор) нужен аккаунт Apple Developer Program — 99 $/год.

## Логотип приложения

Иконки Android и экран загрузки с логотипом EcoStep лежат в `frontend/resources/android/res/`.
Они копируются в Android-проект **автоматически** в конце `npm run cap:sync`
(скрипт `frontend/scripts/setup-android.mjs`). Отдельно применить можно командой
`npm run cap:setup`. Чтобы старая иконка не осталась в кэше телефона — удалите прежнюю версию
приложения перед установкой новой.
