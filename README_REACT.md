# LLM Benchmark Platform - React Frontend

Это обновленная версия платформы тестирования LLM с React фронтендом.

## Структура проекта

```
.
├── app/                    # Flask backend (API)
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── services/     # API сервисы
│   │   ├── contexts/     # React контексты
│   │   ├── types/        # TypeScript типы
│   │   ├── utils/        # Утилиты
│   │   └── css/          # Стили (скопированы из оригинального проекта)
│   ├── public/           # Статические файлы
│   └── Dockerfile        # Docker конфигурация для фронтенда
├── docker-compose.yml    # Полная конфигурация стека
└── Dockerfile            # Docker конфигурация для бэкенда
```

## Быстрый старт

### Вариант 1: Запуск с Docker (Рекомендуется)

1. Убедитесь, что Docker и Docker Compose установлены
2. Запустите все сервисы:

```bash
docker-compose up --build
```

3. Откройте браузер:
   - React приложение: http://localhost:3000
   - Flask API: http://localhost:5001

### Вариант 2: Локальная разработка

#### Backend (Flask)

1. Установите Python зависимости:

```bash
pip install -r requirements.txt
```

2. Установите PostgreSQL или запустите через Docker:

```bash
docker run -d \
  --name llm-benchmark-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=llm_benchmark \
  -p 5432:5432 \
  postgres:16-alpine
```

3. Запустите Flask приложение:

```bash
export FLASK_APP=run.py
flask run --host=0.0.0.0 --port=5001
```

#### Frontend (React)

1. Перейдите в директорию frontend:

```bash
cd frontend
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите development сервер:

```bash
npm start
```

4. Откройте http://localhost:3000

## Основные изменения

### Frontend

- ✅ Полностью переписан на **React + TypeScript**
- ✅ Использование **React Router** для навигации
- ✅ **Context API** для управления состоянием аутентификации
- ✅ **Axios** для HTTP запросов
- ✅ Компонентная архитектура с переиспользуемыми компонентами
- ✅ Сохранен **весь оригинальный дизайн и стили**
- ✅ Полная типизация с TypeScript

### Backend

- ✅ Добавлена поддержка **CORS** (Flask-CORS)
- ✅ API endpoints теперь поддерживают **JSON** запросы/ответы
- ✅ Сохранена обратная совместимость с template-based views
- ✅ Добавлен endpoint `/auth/current-user` для проверки аутентификации

### Docker

- ✅ Отдельные Dockerfile для backend и frontend
- ✅ Multi-stage build для React (оптимизация размера)
- ✅ Nginx для production deploy фронтенда
- ✅ Proxy настройка в nginx для API запросов

## Доступные страницы

- `/` - Главная панель (Dashboard)
- `/login` - Вход в систему
- `/register` - Регистрация
- `/models` - Управление моделями (в разработке)
- `/datasets` - Управление датасетами (в разработке)
- `/settings` - Настройки (в разработке)

## API Endpoints

### Аутентификация
- `POST /auth/login` - Вход
- `POST /auth/register` - Регистрация
- `GET /auth/logout` - Выход
- `GET /auth/current-user` - Получить текущего пользователя

### Бенчмарки
- `GET /api/benchmarks` - Получить список тестов
- `POST /api/run-benchmark` - Запустить тестирование
- `POST /api/blind-test/vote` - Голосование в слепом тесте
- `POST /api/blind-test/reveal` - Раскрыть модели в слепом тесте

### Модели
- `GET /api/user-models` - Получить модели пользователя
- `GET /api/all-models` - Получить все доступные модели
- `GET /api/judge-model` - Получить модель-судью

### Датасеты
- `GET /api/user-datasets` - Получить датасеты пользователя

## Технологии

### Frontend
- React 18
- TypeScript
- React Router DOM
- Axios
- CSS (оригинальные стили сохранены)

### Backend
- Flask 2.3
- Flask-CORS
- Flask-Login
- Flask-SQLAlchemy
- PostgreSQL

### DevOps
- Docker
- Docker Compose
- Nginx

## Разработка

### Добавление новых компонентов

1. Создайте компонент в `frontend/src/components/`
2. Используйте TypeScript для типизации props
3. Импортируйте существующие стили из `src/css/`

### Добавление новых страниц

1. Создайте страницу в `frontend/src/pages/`
2. Добавьте маршрут в `frontend/src/App.tsx`
3. Обновите навигацию в `frontend/src/components/Navbar.tsx`

### Добавление новых API endpoints

1. Добавьте функцию в соответствующий API сервис в `frontend/src/services/api.ts`
2. Добавьте типы в `frontend/src/types/index.ts` если необходимо
3. Реализуйте endpoint в Flask backend

## Troubleshooting

### CORS ошибки
Убедитесь, что Flask-CORS правильно настроен в `app/__init__.py` и URL фронтенда добавлен в список origins.

### Проблемы с аутентификацией
Проверьте, что cookies передаются корректно (withCredentials: true в axios).

### Стили не загружаются
Убедитесь, что все CSS файлы скопированы в `frontend/src/css/` и импортированы в `App.tsx`.

## Дальнейшая разработка

Следующие страницы требуют полной реализации:
- [ ] Models page - полное управление моделями
- [ ] Datasets page - полное управление датасетами  
- [ ] Settings page - настройки пользователя и API интеграций
- [ ] Results visualization - улучшенная визуализация результатов тестирования

## Лицензия

MIT
