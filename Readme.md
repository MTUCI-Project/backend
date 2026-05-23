# Backend AI-компаньона

Этот сервис отвечает за аккаунты пользователей, авторизацию, хранение пользовательского контекста для AI-бэка и выдачу минимальных данных мобильному приложению.

Проект построен на Express, tsoa, Prisma/PostgreSQL, MongoDB и MinIO.

## Роли сервисов

- Мобильное приложение работает с пользовательской cookie/JWT-авторизацией.
- AI-бэк работает только через service-to-service Bearer token.
- Этот бэк хранит данные пользователя и является единственным источником правды для onboarding, AI-памяти, событий, todo и reminders.

## Политика доступа

Главное правило: пользователь не может напрямую читать, добавлять или изменять AI-память о себе. Память, события, todo/reminders mutations и sponsor-предложения доступны только AI-бэку по Bearer token.

Пользователю доступны только:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `POST /onboarding/answers`
- `GET /onboarding/answers/me`
- `GET /todos`
- `GET /reminders`

Пользователь может добавлять информацию о себе только через onboarding. Это намеренное ограничение: onboarding считается явным пользовательским вводом, а вся AI-память формируется и нормализуется AI-бэком.

AI-бэку доступны ручки:

- `GET /ai-service/sponsor-context`
- `GET /ai-service/users/{userId}/context`
- `PATCH /ai-service/users/{userId}/profile`
- `POST /ai-service/users/{userId}/facts`
- `DELETE /ai-service/users/{userId}/facts/{key}`
- `POST /ai-service/users/{userId}/events`
- `PATCH /ai-service/users/{userId}/events/{id}`
- `DELETE /ai-service/users/{userId}/events/{id}`
- `POST /ai-service/users/{userId}/todos`
- `PATCH /ai-service/users/{userId}/todos/{id}`
- `DELETE /ai-service/users/{userId}/todos/{id}`
- `PATCH /ai-service/users/{userId}/reminders/{id}`
- `POST /ai-service/users/{userId}/sponsor-suggestions`
- `PATCH /ai-service/users/{userId}/sponsor-suggestions/{id}`

Все `/ai-service/*` ручки требуют заголовок:

```http
Authorization: Bearer <AI_SERVICE_TOKEN>
```

В Swagger UI этот токен вводится через схему `serviceBearerAuth`.

Админские ручки каталога спонсоров доступны только пользователям с permission `sponsors.manage`:

- `GET /sponsor-products`
- `GET /sponsor-products/{id}`
- `POST /sponsor-products`
- `PATCH /sponsor-products/{id}`
- `DELETE /sponsor-products/{id}`

Seed назначает `sponsors.manage` роли `admin`, потому что admin получает все permission из enum `Permission`.

## Данные

PostgreSQL хранит структурированные сущности:

- `User` - пользователь и auth-данные.
- `Role`, `Permission`, `RoleAssignment` - RBAC.
- `OnboardingAnswer` - ответы пользователя на вопросы приложения.
- `UserEvent` - личные события пользователя, созданные AI-бэком.
- `Todo` - действия, которые видит пользователь.
- `Reminder` - напоминания, которые видит пользователь.
- `SponsorProduct` - каталог спонсорских товаров: описание, реферальная ссылка, спонсор, категория, теги и metadata.
- `SponsorOffer` - спонсорские предложения, связанные с событием или todo.
- `SponsorSuggestion` - результат контекстного рекламного выбора AI для конкретного пользователя.
- `CoupleLink` - техническая модель связи пары. На текущей публичной поверхности она не открыта пользователю.

MongoDB хранит AI-профиль пользователя:

- `summary` - сжатое описание контекста пользователя.
- `facts[]` - нормализованные факты.
- `metadata` - дополнительный машинный контекст.

Мобильное приложение не имеет прямых ручек к MongoDB AI-профилю.

## Переменные окружения

Минимально нужны:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/db?schema=public
MONGODB_URL=mongodb://admin:admin123@localhost:27017/db?authSource=admin
MONGODB_DB_NAME=db
MONGODB_USER_AI_PROFILES_COLLECTION=user_ai_profiles

JWT_SECRET=super-secret-dev-key-with-32-symbols
JWT_REFRESH_SECRET=super-secret-refresh-dev-key-with-32-symbols

AI_SERVICE_TOKEN=local-ai-service-token-change-me
```

Полный пример находится в `.env.example`.

## Локальный запуск

Поднять инфраструктуру:

```bash
npm run docker
```

Это поднимет PostgreSQL, MongoDB, MinIO и Adminer из [docker/docker-compose.dev.yml](docker/docker-compose.dev.yml).

Применить миграции:

```bash
npx prisma migrate dev
```

Запустить dev-сервер:

```bash
npm run dev
```

Swagger UI доступен в development на:

```text
http://localhost:3000/docs
```

## Docker для production

Для сборки backend-контейнера используется [Dockerfile](Dockerfile). Он собирает TypeScript, генерирует Prisma client и запускает `dist/server.js`.

GPU проброшен на уровне compose-файла [docker/docker-compose.prod.yml](docker/docker-compose.prod.yml) через `gpus: all` и переменные `NVIDIA_VISIBLE_DEVICES` / `NVIDIA_DRIVER_CAPABILITIES`.

Команда запуска:

```bash
docker compose -f docker/docker-compose.prod.yml up --build -d
```

Важно: сейчас backend не содержит CUDA-кода. GPU-проброс сделан как инфраструктурная готовность для будущих GPU-зависимых библиотек или сервисов.

## Генерация и проверки

После изменения контроллеров tsoa:

```bash
npm run tsoa:gen
```

После изменения Prisma schema:

```bash
npx prisma migrate dev
```

Проверить сборку:

```bash
npm run build
```

## Правила разработки API

- Новые пользовательские ручки не должны давать пользователю возможность менять AI-память, события, todo, reminders или sponsor-предложения.
- Если ручка меняет AI-контекст, она должна жить под `/ai-service/*` и использовать `@Security('serviceBearerAuth')`.
- Каталог спонсорских товаров не должен быть публичным. Управление каталогом требует `sponsors.manage`; AI получает только active товары через `/ai-service/sponsor-context`.
- AI выбирает товар из sponsor context по `id` и создает `SponsorSuggestion` для пользователя. Мобильное приложение не выбирает рекламный товар само.
- Если мобильному приложению нужно показать данные, добавляется read-only endpoint с `cookieAuth`.
- Любые данные должны быть scoped by `userId`; AI-бэк передает `userId` явно в path.
- Soft-delete используется для событий и todo, чтобы AI-контекст не терял историю.
