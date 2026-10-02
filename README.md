# Дом дела

Семейное веб-приложение для домашних задач: видно, кто что делает, что запланировано и что уже выполнено. В центре главной страницы — семейный дом, сад которого меняется вместе с выполненными делами.

## Стек и структура

Frontend: React, TypeScript, Vite, React Router, CSS. `src/stranitsy` — страницы, `src/komponenty` — общие компоненты, `src/api` — операции и демо-хранилище, `src/dannye` — стартовые данные, `src/dom` — визуальный дом, `src/stili` — стили. Backend: PHP 8.1+ и MySQL/MariaDB в `backend/`; схема — `backend/schema.sql`. `public/` содержит PWA manifest, иконку и базовый service worker.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173/dom-dela/`. Для проверок: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run preview`. Если используете pnpm, подходят `pnpm install` и `pnpm run dev`.

## Демо-режим

На экране входа выберите одного из четырёх участников семьи Соколовых. Задачи, сообщения, события, баллы, семейное состояние и настройки сохраняются в `localStorage` данного браузера. Можно зарегистрировать отдельный локальный аккаунт, создать семью или присоединиться к существующей по коду. Взрослому для вступления нужно подтверждение другого взрослого. Демо-данные не синхронизируются между устройствами и не предназначены для конфиденциальной информации.

## PHP API и база

Создайте базу командой `mysql -u root -p < backend/schema.sql`. Настройте переменные `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, затем запустите `php -S localhost:8000 -t backend/public backend/public/index.php`. Маршруты JSON API начинаются с `/api/`; после входа используйте сессионную cookie и заголовок `X-CSRF-Token`, выданный `/api/login` или `/api/auth/me`. Backend содержит регистрацию, авторизацию, семейные запросы, задачи, резервы, баллы, события, сообщения и уведомления. Публичный сайт GitHub Pages работает в локальном демо-режиме: GitHub Pages не исполняет PHP и не предоставляет MySQL.

## Публикация

Workflow `.github/workflows/pages.yml` собирает frontend при push в `main` и публикует `dist` через GitHub Pages. В настройках репозитория Pages источником должен быть выбран GitHub Actions. Адрес сайта: `https://annacfr.github.io/dom-dela/`.
