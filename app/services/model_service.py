from flask import current_app
import time
import openai


def test_model_connection(api_url, api_key=None, model_name=None, timeout=10):
    """
    Test connection to a model API using OpenAI client

    Args:
        api_url (str): The API URL to test
        api_key (str, optional): API key if required
        model_name (str, optional): Model name to use for testing
        timeout (int, optional): Request timeout in seconds

    Returns:
        dict: Result of the test with success flag and message
    """
    try:
        # Create OpenAI client with the provided API URL and key
        client = openai.OpenAI(
            api_key=api_key,
            base_url=api_url,
            timeout=timeout
        )

        start_time = time.time()
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "Вы - полезный ассистент."},
                {"role": "user", "content": "Привет, это тест. Пожалуйста, ответьте 'Соединение успешно'."}
            ],
            max_tokens=10
        )
        response_time = time.time() - start_time

        # Process successful response
        return {
            "success": True,
            "message": f"Соединение успешно! Время ответа: {response_time:.2f}с",
            "response": {
                "content": response.choices[0].message.content,
                "model": response.model
            }
        }

    except openai.APIError as e:
        return {
            "success": False,
            "message": f"Ошибка API: {str(e)}"
        }
    except openai.APIConnectionError as e:
        return {
            "success": False,
            "message": f"Ошибка соединения: Не удалось подключиться к API: {str(e)}"
        }
    except openai.RateLimitError as e:
        return {
            "success": False,
            "message": f"Превышен лимит запросов: {str(e)}"
        }
    except openai.AuthenticationError as e:
        return {
            "success": False,
            "message": f"Ошибка аутентификации: {str(e)}"
        }
    except openai.APITimeoutError as e:
        return {
            "success": False,
            "message": f"Соединение прервано по тайм-ауту после {timeout} секунд: {str(e)}"
        }
    except Exception as e:
        current_app.logger.error(f"Ошибка при тестировании соединения с моделью: {str(e)}")
        return {
            "success": False,
            "message": f"Непредвиденная ошибка: {str(e)}"
        }