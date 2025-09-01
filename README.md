# Pascalite UK Compliance Calculator для Shopify

Приложение для расчёта обязательств UK EPR (упаковка, WEEE, батареи) в экосистеме Shopify.

## Описание

Pascalite UK Compliance Calculator - это веб-приложение, интегрируемое в админ-панель Shopify, которое позволяет продавцам рассчитывать свои обязательства по UK EPR (Extended Producer Responsibility) для упаковки, электронных отходов (WEEE) и батарей.

### Основные функции:

- Загрузка CSV файлов с данными о продуктах
- Расчёт обязательств на основе актуальных тарифов
- Генерация отчётов в формате CSV/ZIP
- Управление профилем организации

## Технический стек

- **Frontend**: React (Next.js 14+), ShadCN/UI + Tailwind CSS, Lucide Icons
- **Backend**: Node.js (Next.js API Routes)
- **Интеграция с Shopify**: Shopify App Bridge
- **Хранение данных**: Shopify GraphQL API (метаполя магазина), JSON-файлы для тарифов

## Установка и запуск

### Предварительные требования

- Node.js 18+ и npm
- Аккаунт разработчика Shopify (для полной интеграции)

### Шаги по установке

1. Клонируйте репозиторий:

   ```
   git clone [URL репозитория]
   cd pascalite-uk-calculator
   ```

2. Установите зависимости:

   ```
   npm install --legacy-peer-deps
   ```

3. Создайте файл `.env.local` в корне проекта:

   ```
   NEXT_PUBLIC_SHOPIFY_API_KEY=your_key
   SHOPIFY_API_SECRET=your_secret
   SCOPES=write_metafields,read_shop
   ```

4. Запустите приложение в режиме разработки:

   ```
   npm run dev
   ```

5. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Архитектура приложения

### Взаимодействие фронтенда и бэкенда

Приложение использует Next.js API Routes для обработки запросов:

1. **Фронтенд** (React компоненты):

   - `/src/app/(shopify)/page.tsx` - Главная страница с калькулятором
   - `/src/app/profile/page.tsx` - Страница профиля организации
   - `/src/components/calculator/Dropzone.tsx` - Компонент для загрузки файлов

2. **Бэкенд** (API Routes):

   - `/src/pages/api/calculate.ts` - Обрабатывает CSV и возвращает расчёты
   - `/src/pages/api/profile.ts` - CRUD операции для профиля организации

3. **Взаимодействие**:

   - Фронтенд отправляет CSV файл через FormData в `/api/calculate`
   - API обрабатывает данные, применяет тарифы из JSON файлов
   - Результаты возвращаются как JSON с предварительными данными и ZIP-архивом

4. **Интеграция с Shopify**:
   - App Bridge используется для встраивания в админ-панель Shopify
   - Метаполя магазина хранят профиль организации через GraphQL API

## Структура проекта

```
src/
├── app/
│   ├── (shopify)/           # Shopify-специфичные роуты
│   │   ├── layout.tsx       # Общий layout с AppBridgeProvider
│   │   ├── page.tsx         # Главная (калькулятор)
│   ├── profile/page.tsx     # Профиль организации
├── components/              # UI-компоненты
│   ├── calculator/          # Компоненты калькулятора
│   ├── profile/             # Компоненты профиля
│   └── ui/                  # Базовые UI компоненты (ShadCN)
├── lib/
│   ├── epr-calculator.ts    # Логика расчётов
│   ├── csv-handler.ts       # Обработка CSV
│   └── shopify-auth.ts      # Интеграция с Shopify API
├── data/
│   └── fees/                # Тарифы в JSON формате
└── pages/
    └── api/                 # API-эндпоинты
        ├── calculate.ts     # POST /api/calculate
        └── profile.ts       # CRUD для профиля
```

## Процесс расчёта

1. Пользователь загружает CSV файл через Dropzone
2. Файл отправляется на `/api/calculate` через FormData
3. Бэкенд парсит CSV, валидирует данные с помощью Zod
4. Для каждой строки применяется формула: `units * unit_weight_kg * fee_per_kg`
5. Тарифы берутся из JSON файлов в `/data/fees/`
6. Результаты группируются, рассчитывается VAT
7. Генерируется ZIP архив с отчётами
8. Фронтенд получает JSON с итогами и ссылкой на скачивание

## Тестирование без Shopify ключей (Mock Mode)

Для локального тестирования без реальных Shopify ключей используйте mock режим:

1. В `.env.local` используйте dummy значения или оставьте поля пустыми:

   ```
   NEXT_PUBLIC_SHOPIFY_API_KEY=dummy-api-key
   SHOPIFY_API_SECRET=dummy-secret
   ```

2. Запустите `npm run dev`.
3. Приложение будет работать с mock данными профиля (без реальной интеграции с Shopify). Тестируйте загрузку CSV, расчёты и форму профиля.

## Подключение к реальному Shopify

Для работы с реальным Shopify API выполните следующие шаги:

1. Создайте приложение в [партнерском кабинете Shopify](https://partners.shopify.com):

   - Выберите тип "Custom app" или "Public app"
   - Настройте OAuth scopes (разрешения): `write_metafields,read_shop`
   - Настройте URL для редиректов (например, `https://your-app-domain.com/api/auth/callback`)

2. Получите API ключи:

   - API Key (Client ID)
   - API Secret Key

3. Создайте файл `.env.local` в корне проекта на основе `.env.local.example`:

   ```
   NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SCOPES=write_metafields,read_shop
   ```

4. Перезапустите приложение:

   ```
   npm run dev
   ```

5. Для тестирования в локальной среде используйте туннелирование (например, ngrok):
   ```
   ngrok http 3000
   ```
   И обновите URL редиректа в настройках приложения Shopify на полученный URL.

### Проверка подключения

Когда приложение запущено с реальными ключами:

1. В консоли браузера вы увидите сообщение "Using real Shopify API: true"
2. Приложение будет использовать Provider из @shopify/app-bridge-react
3. Данные профиля будут сохраняться и загружаться из метаполей магазина

## Оффлайн запуск (без интернета)

Приложение может работать полностью оффлайн после статического билда, так как все константы (тарифы) встроены, а расчёты перенесены на клиент.

1. Соберите статическую версию:

   ```
   npm run build
   npx next export
   ```

2. Откройте `out/index.html` в браузере (даже без сервера, просто через file://).

Все функции (расчёты, профиль) будут работать локально без сети.

## Для разработчиков

- Для добавления новых тарифов обновите JSON файлы в `/data/fees/`
- Для расширения схемы данных отредактируйте Zod схемы в `lib/epr-calculator.ts`
- Для полной интеграции с Shopify настройте приложение в партнёрском кабинете

## Развёртывание

### Netlify (рекомендуется для статического сайта)

Проект настроен для развертывания на Netlify как статический сайт:

1. **Автоматическое развертывание:**
   - Подключите репозиторий к Netlify
   - Настройки сборки уже находятся в `netlify.toml`
   - Команда сборки: `npm run build && npm run export`
   - Папка публикации: `out`

2. **Переменные окружения в Netlify:**
   - Перейдите в Site settings > Environment variables
   - Добавьте: `NEXT_PUBLIC_SHOPIFY_API_KEY` (опционально)

3. **Локальная сборка для тестирования:**
   ```bash
   npm run deploy
   npm run serve
   ```

### Vercel (для полной функциональности с API)

Для production развёртывания с API роутами используйте Vercel:

```bash
npm run build
vercel deploy
```

**Примечание:** На Netlify API роуты не поддерживаются, поэтому приложение работает полностью на клиентской стороне с localStorage для сохранения данных профиля.

## Текущий функционал (на момент 30.07.2025)

На данный момент приложение реализует следующий функционал:

- Аутентификация через Shopify OAuth (API роуты: /api/auth и /api/auth/callback).
- Управление профилем организации (страница /profile, API: /api/profile).
- Калькулятор UK EPR: загрузка CSV через Dropzone, расчёты сборов (упаковка, WEEE, батареи) на основе JSON-тарифов в /data/fees/.
- Интеграция с Shopify: работа с metafields через /api/shopify/metafields.
- Деплой на Vercel: production-версия доступна по URL https://y-e1y4f863b-zzzips-projects-0122dd31.vercel.app (с активной защитой аутентификацией, которую нужно отключить для полной интеграции).
- Локальное тестирование: mock-режим без реальных ключей, оффлайн-работа после статического экспорта.

Дальнейшие шаги: отключение защиты на Vercel, полная установка в Shopify-магазине и тестирование end-to-end.

## Лицензия

[Укажите вашу лицензию]
