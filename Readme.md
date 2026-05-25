# Backend AI-компаньона

Этот сервис отвечает за аккаунты пользователей, авторизацию, хранение пользовательского контекста для AI-бэка и выдачу минимальных данных мобильному приложению.

Проект построен на Express, tsoa, Prisma/PostgreSQL и MinIO.

## Роли сервисов

- Мобильное приложение работает с пользовательской cookie/JWT-авторизацией.
- AI-бэк обращается к ручкам `/ai-service/*` без service-to-service авторизации.
- Этот бэк хранит данные пользователя и является единственным источником правды для onboarding, AI-памяти, событий, todo и reminders.

## Политика доступа

Ручки `/ai-service/*` предназначены для интеграции с AI-бэком. Пользовательские сценарии мобильного приложения используют отдельные cookie/JWT-ручки.

Пользователю доступны только:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `POST /onboarding/answers`
- `GET /onboarding/answers/me`
- `GET /chat/messages`
- `POST /chat/messages`
- `WS /ws/chat`
- `POST /assistant/suggest-date` (`{ "budget": 2000 }`)
- `POST /assistant/recommend` (`{ "type": "gift" }`)
- `POST /assistant/analyze-relationship`
- `GET /events`
- `GET /todos`
- `GET /reminders`

Пользователь может добавлять информацию о себе только через onboarding. Это намеренное ограничение: onboarding считается явным пользовательским вводом, а вся AI-память формируется и нормализуется AI-бэком.

AI-бэку доступны ручки:

- `GET /ai-service/sponsor-context`
- `POST /ai-service/users/{userId}/chat`
- `GET /ai-service/users/{userId}/chat_history`
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
- `GET /ai-service/users/{userId}/sponsor-suggestions`
- `DELETE /ai-service/users/{userId}/reset`

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
PostgreSQL также хранит контекст AI-сервиса:

- `AiServiceState` - профиль и нормализованные факты пользователя.
- `AiServiceEvent`, `AiServiceTodo`, `AiServiceReminder` - действия и напоминания AI-бэка.
- `AiServiceSponsorSuggestion`, `AiServiceChatMessage` - рекомендации и история сообщений.
- `UserChatMessage` - история сообщений, отображаемая мобильному приложению.

Мобильное приложение не имеет прямых ручек для изменения AI-контекста.

### Контекст для AI-бэка

`GET /ai-service/users/{userId}/context` формируется из двух источников:

- значения, записанные AI через `profile` и `facts`;
- явные ответы пользователя из onboarding и история пользовательского чата.

Профиль партнёра из onboarding (`partner.basic`, `partner.hobbies`,
`partner.likes`, `partner.dislikes`, `partner.notes`, `partner.completed`)
возвращается одновременно как `profile.partner` и `facts.partner`.
Это необходимо для текущего контракта AI-бэка: сценарий свидания читает весь
context, а `ChatAgent` передаёт модели только поле `facts`.

В `facts.recent_conversation` возвращаются последние 50 успешно доставленных
сообщений чата с полями `role`, `message` и `timestamp`. Текущая реплика в
статусе `pending` не включается, поскольку AI уже получает её полем `message`
в запросе `POST /ml/chat`. В отличие от этого,
`/ai-service/users/{userId}/chat_history` хранит сообщения, которые AI-бэк
записывает для собственного анализа sentiment/отношений.

Поток чата:

1. Приложение вызывает `POST /chat/messages` с исходным пользовательским текстом.
2. Backend сохраняет его в `UserChatMessage` и вызывает `POST /ml/chat` с
   `user_id`, исходным `message` и `timestamp`.
3. Реализация `ml_agent_system` при обработке чата вызывает
   `GET /ai-service/users/{userId}/context`, но использует именно `facts`.
4. AI-бэк записывает проанализированное пользовательское сообщение через
   `POST /ai-service/users/{userId}/chat`.
5. Backend берёт `reply` из HTTP-ответа `/ml/chat`, сохраняет его в
   `UserChatMessage` как сообщение `assistant` и отправляет его клиенту через
   WebSocket.

Из этого следует, что сведения onboarding для чат-агента должны находиться в
`facts.partner`; передача их только через `profile` недостаточна.

## Переменные окружения

Минимально нужны:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/db?schema=public

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123
MINIO_BUCKET=media

JWT_SECRET=super-secret-dev-key-with-32-symbols
JWT_REFRESH_SECRET=super-secret-refresh-dev-key-with-32-symbols

AI_BACKEND_BASE_URL=http://100.99.60.109:3001
AI_BACKEND_TIMEOUT_MS=10000
```

Полный пример находится в `.env.example`.

### Локальный mock AI

Для проверки чата без запущенного AI-бэка можно использовать локальный mock:

```bash
APP_BACKEND_BASE_URL=http://localhost:3000 npm run mock:ai
```

Backend должен использовать `AI_BACKEND_BASE_URL=http://localhost:3001`.
Mock повторяет порядок `ChatAgent`: читает
`/ai-service/users/{userId}/context`, сохраняет входное сообщение в служебную
`/ai-service/users/{userId}/chat` и возвращает отличающийся ответ из
`POST /ml/chat`. В ответе mock показывает имя и аллергию партнёра из
`facts.partner`, а также число сообщений в `facts.recent_conversation`.

## Локальный запуск

Поднять инфраструктуру:

```bash
npm run docker
```

Это поднимет PostgreSQL, MinIO и Adminer из [docker/docker-compose.dev.yml](docker/docker-compose.dev.yml).


### Запуск на хосте

1. Установить Docker Desktop или Docker Engine с поддержкой `docker compose` v2.
2. Проверить, что Docker умеет скачивать образы:

```bash
docker pull node:22-bookworm-slim
```

3. Убедиться, что свободны порты `3000`, `5432`, `8080`, `9000`, `9001`.
4. Создать `.env` на основе `.env.example` и проверить локальные dev-значения.
5. Поднять инфраструктуру:

```powershell
docker compose -f docker/docker-compose.dev.yml up -d
```

6. Дождаться, пока запустятся PostgreSQL, MinIO и Adminer.
7. Запустить backend:

```powershell
npm run dev
```

8. Проверить, что backend жив:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

9. Если надо посмотреть базу вручную, открыть Adminer на `http://localhost:8080`.

### dev compose

[docker/docker-compose.dev.yml](docker/docker-compose.dev.yml) для локальной разработки:

- `postgres` - база данных PostgreSQL.
- `minio` - объектное хранилище для файлов.
- `adminer` - веб-интерфейс для просмотра PostgreSQL.


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

[docker/docker-compose.prod.yml](docker/docker-compose.prod.yml) поднимает backend-контейнер без монтирования исходников и подключает его к зависимостям по именам сервисов: `postgres`, `minio`.

Команда запуска:

```bash
docker compose -f docker/docker-compose.prod.yml up --build -d
```

### Docker

```bash
docker ps
docker compose -f docker/docker-compose.dev.yml ps
docker compose -f docker/docker-compose.dev.yml logs -f
docker logs mtuci-backend
docker stop mtuci-backend
docker compose -f docker/docker-compose.dev.yml down
```

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
- Ручки интеграции, изменяющие AI-контекст, должны жить под `/ai-service/*`.
- Каталог спонсорских товаров не должен быть публичным. Управление каталогом требует `sponsors.manage`; AI получает только active товары через `/ai-service/sponsor-context`.
- AI выбирает товар из sponsor context по `id` и создает `SponsorSuggestion` для пользователя. Мобильное приложение не выбирает рекламный товар само.
- Если мобильному приложению нужно показать данные, добавляется read-only endpoint с `cookieAuth`.
- Любые данные должны быть scoped by `userId`; AI-бэк передает `userId` явно в path.
- Soft-delete используется для событий и todo, чтобы AI-контекст не терял историю.
