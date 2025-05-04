from flask import current_app
import time
import openai


def test_model_connection(api_url, api_key=None, timeout=10):
    """
    Test connection to a model API using OpenAI client

    Args:
        api_url (str): The API URL to test
        api_key (str, optional): API key if required
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

        # Simple test prompt
        start_time = time.time()
        response = client.chat.completions.create(
            model="gemma3:4b",  # You can make this configurable if needed
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, this is a test. Please respond with 'Connection successful'."}
            ],
            max_tokens=10
        )
        response_time = time.time() - start_time

        # Process successful response
        return {
            "success": True,
            "message": f"Connection successful! Response time: {response_time:.2f}s",
            "response": {
                "content": response.choices[0].message.content,
                "model": response.model
            }
        }

    except openai.APIError as e:
        return {
            "success": False,
            "message": f"API error: {str(e)}"
        }
    except openai.APIConnectionError as e:
        return {
            "success": False,
            "message": f"Connection error: Could not connect to the API: {str(e)}"
        }
    except openai.RateLimitError as e:
        return {
            "success": False,
            "message": f"Rate limit exceeded: {str(e)}"
        }
    except openai.AuthenticationError as e:
        return {
            "success": False,
            "message": f"Authentication error: {str(e)}"
        }
    except openai.APITimeoutError as e:
        return {
            "success": False,
            "message": f"Connection timed out after {timeout} seconds: {str(e)}"
        }
    except Exception as e:
        current_app.logger.error(f"Error testing model connection: {str(e)}")
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}"
        }