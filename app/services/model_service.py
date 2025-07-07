import json
import requests
import time
from flask import current_app


def test_model_connection(api_url, api_key=None, model_name=None, timeout=10):
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'

        payload = {
            'model': model_name or 'default',
            'messages': [
                {"role": "system", "content": "Вы - полезный ассистент."},
                {"role": "user", "content": "Привет, это тест. Пожалуйста, ответьте 'Соединение успешно'."}
            ],
            'max_tokens': 50,
            'temperature': 0.1
        }

        start_time = time.time()

        response = requests.post(
            f"{api_url.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=timeout
        )

        response_time = time.time() - start_time

        if response.status_code == 200:
            response_data = response.json()

            content = "Не удалось извлечь ответ"
            if 'choices' in response_data and len(response_data['choices']) > 0:
                if 'message' in response_data['choices'][0]:
                    content = response_data['choices'][0]['message'].get('content', content)
                elif 'text' in response_data['choices'][0]:
                    content = response_data['choices'][0]['text']

            return {
                "success": True,
                "message": f"Соединение успешно! Время ответа: {response_time:.2f}с",
                "response": {
                    "content": content,
                    "model": response_data.get('model', model_name),
                    "status_code": response.status_code
                }
            }
        else:
            return {
                "success": False,
                "message": f"Ошибка API: HTTP {response.status_code} - {response.text[:200]}"
            }

    except requests.exceptions.ConnectionError as e:
        return {
            "success": False,
            "message": f"Ошибка соединения: Не удалось подключиться к API: {str(e)}"
        }
    except requests.exceptions.Timeout as e:
        return {
            "success": False,
            "message": f"Соединение прервано по тайм-ауту после {timeout} секунд: {str(e)}"
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Ошибка запроса: {str(e)}"
        }
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "message": f"Ошибка декодирования JSON ответа: {str(e)}"
        }
    except Exception as e:
        current_app.logger.error(f"Ошибка при тестировании соединения с моделью: {str(e)}")
        return {
            "success": False,
            "message": f"Непредвиденная ошибка: {str(e)}"
        }
