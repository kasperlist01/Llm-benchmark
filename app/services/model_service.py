# app/services/model_service.py
import requests
import json
from flask import current_app
import time


def test_model_connection(api_url, api_key=None, timeout=10):
    """
    Test connection to a model API

    Args:
        api_url (str): The API URL to test
        api_key (str, optional): API key if required
        timeout (int, optional): Request timeout in seconds

    Returns:
        dict: Result of the test with success flag and message
    """
    try:
        # Simple test prompt
        test_data = {
            "prompt": "Hello, this is a test. Please respond with 'Connection successful'.",
            "max_tokens": 10
        }

        headers = {
            "Content-Type": "application/json"
        }

        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        # Make the request
        start_time = time.time()
        response = requests.post(api_url, json=test_data, headers=headers, timeout=timeout)
        response_time = time.time() - start_time

        # Check response
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Connection successful! Response time: {response_time:.2f}s",
                "response": response.json()
            }
        else:
            return {
                "success": False,
                "message": f"API returned status code {response.status_code}: {response.text}"
            }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "message": f"Connection timed out after {timeout} seconds"
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "message": "Connection error: Could not connect to the API"
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "message": "Invalid JSON response from API"
        }
    except Exception as e:
        current_app.logger.error(f"Error testing model connection: {str(e)}")
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}"
        }