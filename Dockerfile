# Dockerfile
FROM python:3.9

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода приложения
COPY . .

# Создание пустого файла данных
RUN echo '{"top_models": []}' > data.json

# Переменные окружения
ENV FLASK_APP=run.py
ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1

# Открываем порт
EXPOSE 5000

# Запуск приложения
CMD ["flask", "run", "--host=0.0.0.0"]