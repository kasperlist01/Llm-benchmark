# Платформа тестирования LLM

Веб-платформа для комплексного тестирования и сравнения больших языковых моделей (LLM). Предоставляет удобный интерфейс для проведения различных типов бенчмарков с использованием пользовательских датасетов.

## 🚀 Возможности

### Типы тестирования
- **Слепой тест** - Сравнение ответов анонимных моделей с пользовательским голосованием
- **Оценка модели-судьи** - Автоматическое сравнение моделей с использованием выбранной модели в качестве беспристрастного судьи
- **Сравнение с эталоном** - Оценка ответов моделей по сравнению с эталонными ответами из датасетов
- **Метрическое сравнение** - Количественная оценка с использованием метрик ROUGE, семантического сходства и BERTScore

### Управление данными
- **Модели** - Добавление и настройка пользовательских LLM моделей с API интеграциями
- **Датасеты** - Загрузка и управление CSV файлами с тестовыми данными
- **API интеграции** - Подключение к различным API провайдерам (OpenAI, Anthropic, custom endpoints)

## 🛠 Технологический стек

- **Backend**: Flask 2.3.3, SQLAlchemy, PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Аутентификация**: Flask-Login
- **Формы**: Flask-WTF, WTForms
- **База данных**: PostgreSQL 16
- **Контейнеризация**: Docker, Docker Compose

## 📋 Требования

- Docker и Docker Compose
- Python 3.11+ (для локальной разработки)
- PostgreSQL 16+ (если запуск без Docker)

## 🚀 Быстрый старт

### Запуск с Docker Compose (рекомендуется)

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/kasperlist01/Llm-benchmark.git
   cd Llm-benchmark
   ```

2. **Запустите приложение**
   ```bash
   docker-compose up -d
   ```

3.**Откройте браузер**
   ```
   http://localhost:5000
   ```

### Локальная разработка

1. **Установите зависимости**
   ```bash
   pip install -r requirements.txt
   ```

2. **Настройте переменные окружения**
   ```bash
   export FLASK_APP=run.py
   export FLASK_ENV=development
   export SECRET_KEY=your-secret-key
   export POSTGRES_USER=postgres
   export POSTGRES_PASSWORD=postgres
   export POSTGRES_HOST=localhost
   export POSTGRES_PORT=5432
   export POSTGRES_DB=llm_benchmark
   ```

3. **Запустите PostgreSQL**
   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=llm_benchmark \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Запустите приложение**
   ```bash
   python run.py
   ```

## 📖 Использование

### 1. Регистрация и настройка

1. Зарегистрируйте аккаунт на главной странице
2. Перейдите в **Настройки** для конфигурации:
   - Добавьте API интеграции (OpenAI, Anthropic, custom endpoints)
   - Настройте модель-судью для автоматической оценки

### 2. Добавление моделей

1. Перейдите в раздел **Мои модели**
2. Нажмите **Добавить новую модель**
3. Заполните информацию:
   - Название модели
   - Описание
   - Выберите API интеграцию
   - Настройте цвет для визуального отображения
4. Проверьте соединение с API

### 3. Загрузка датасетов

1. Перейдите в раздел **Мои датасеты**
2. Нажмите **Загрузить датасет**
3. Загрузите CSV файл с требованиями:
   - Первая строка - заголовки колонок
   - Колонки с промптами (prompt, question, query и т.д.)
   - Колонки с эталонными ответами (answer, reference, solution и т.д.)
   - Кодировка UTF-8
   - Максимум 50 МБ

### 4. Проведение тестирования

1. На главной панели выберите:
   - **Модели** для тестирования
   - **Типы тестов** (слепой тест, оценка судьёй, сравнение с эталоном, метрики)
   - **Датасеты** для использования
2. Настройте параметры (веса метрик для количественного сравнения)
3. Нажмите **Запустить тестирование**
4. Дождитесь завершения и изучите результаты

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SECRET_KEY` | Секретный ключ Flask | `dev-key-for-llm-benchmark` |
| `POSTGRES_USER` | Пользователь PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL | `postgres` |
| `POSTGRES_HOST` | Хост PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Порт PostgreSQL | `5432` |
| `POSTGRES_DB` | База данных PostgreSQL | `llm_benchmark` |

### Формат датасетов

Платформа автоматически определяет колонки с промптами и эталонными ответами по ключевым словам:

**Промпты**: prompt, question, query, input, instruction, task, запрос, вопрос, задача
**Эталонные ответы**: reference, answer, response, output, solution, result, эталон, ответ, решение

Пример CSV файла:
```csv
prompt,reference_answer,category
"Что такое машинное обучение?","Машинное обучение - это область ИИ...","Технологии"
"Объясните принцип работы нейронных сетей","Нейронные сети состоят из узлов...","ИИ"
```

## 🏗 Архитектура проекта

```
app/
├── __init__.py           # Инициализация Flask приложения
├── config.py            # Конфигурация
├── routes.py            # Основные маршруты API
├── auth/                # Аутентификация
│   ├── routes.py
│   └── forms.py
├── user/                # Пользовательские функции
│   ├── routes.py
│   └── forms.py
├── models/              # Модели данных
│   ├── user.py
│   ├── user_model.py
│   ├── user_dataset.py
│   ├── api_integration.py
│   └── benchmark_data.py
├── services/            # Бизнес-логика
│   ├── benchmark_service.py
│   └── model_service.py
├── static/              # Статические файлы
│   ├── css/
│   └── js/
└── templates/           # HTML шаблоны
    ├── base.html
    ├── index.html
    ├── auth/
    ├── user/
    └── components/
```