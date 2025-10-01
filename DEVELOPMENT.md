# Инструкции по разработке

## Hot Reload для фронтенда

Проект настроен для автоматической перезагрузки изменений во фронтенде без перебилда контейнера.

### Как это работает

1. **Development Dockerfile** (`frontend/Dockerfile.dev`) - использует `npm start` вместо production сборки
2. **Volume Mapping** - исходный код монтируется в контейнер в реальном времени
3. **File Watching** - React Dev Server отслеживает изменения и автоматически перезагружает браузер

### Использование

#### Первый запуск
```bash
# Остановить и удалить существующие контейнеры
docker-compose down

# Пересобрать и запустить контейнеры
docker-compose up --build
```

#### Разработка
После первого запуска просто редактируйте файлы в `frontend/src/` - изменения будут применяться автоматически:

```bash
# Перезапуск контейнеров (без пересборки)
docker-compose restart frontend

# Или просто запустите, если контейнеры остановлены
docker-compose up
```

#### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Только фронтенд
docker-compose logs -f frontend
```

### Что монтируется

- `frontend/src` - исходный код React компонентов
- `frontend/public` - публичные файлы
- `frontend/package.json` - зависимости
- `frontend/tsconfig.json` - конфигурация TypeScript

**Важно:** `node_modules` не монтируется - используется версия из контейнера.

### Если изменения не применяются

1. Проверьте логи фронтенда:
   ```bash
   docker-compose logs -f frontend
   ```

2. Перезапустите контейнер фронтенда:
   ```bash
   docker-compose restart frontend
   ```

3. Если проблема сохраняется, пересоберите контейнер:
   ```bash
   docker-compose up --build frontend
   ```

### Production сборка

Для production сборки используйте оригинальный Dockerfile:

```bash
# Изменить docker-compose.yml, заменив:
# dockerfile: Dockerfile.dev
# на:
# dockerfile: Dockerfile

docker-compose up --build frontend
```

### Порты

- Frontend (dev): http://localhost:3000
- Backend: http://localhost:5001
- PostgreSQL: localhost:5432

### Переменные окружения

Фронтенд использует следующие переменные:
- `REACT_APP_API_URL` - URL бэкенда (по умолчанию: http://localhost:5001)
- `CHOKIDAR_USEPOLLING` - включает polling для file watching (для Docker)
- `WATCHPACK_POLLING` - включает polling для Webpack (для Docker)
