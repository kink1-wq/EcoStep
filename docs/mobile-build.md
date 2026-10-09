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
CORS_ORIGINS=["http://localhost:3000","capacitor://localhost","http://localhost"]
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

После `npx cap add android` откройте
`android/app/src/main/AndroidManifest.xml` и добавьте перед закрывающим
тегом `</manifest>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

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
(скрипт `frontend/scripts/apply-android-icons.mjs`). Отдельно применить можно командой
`npm run cap:icons`. Чтобы старая иконка не осталась в кэше телефона — удалите прежнюю версию
приложения перед установкой новой.
