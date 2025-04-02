# app/models/model_data.py

def get_available_models():
    """Get list of available LLM models for benchmarking"""
    return [
        {
            'id': 'gpt4',
            'name': 'GPT-4',
            'provider': 'OpenAI',
            'type': 'api',
            'size': '1.8T params (est.)',
            'color': '#10a37f'
        },
        {
            'id': 'gpt35',
            'name': 'GPT-3.5 Turbo',
            'provider': 'OpenAI',
            'type': 'api',
            'size': '175B params',
            'color': '#10a37f'
        },
        {
            'id': 'claude2',
            'name': 'Claude 2',
            'provider': 'Anthropic',
            'type': 'api',
            'size': '140B params (est.)',
            'color': '#6b40dc'
        },
        {
            'id': 'llama2',
            'name': 'Llama 2 70B',
            'provider': 'Meta',
            'type': 'open',
            'size': '70B params',
            'color': '#0866ff'
        },
        {
            'id': 'falcon',
            'name': 'Falcon 40B',
            'provider': 'TII',
            'type': 'open',
            'size': '40B params',
            'color': '#00a2e8'
        },
        {
            'id': 'mistral',
            'name': 'Mistral 7B',
            'provider': 'Mistral AI',
            'type': 'open',
            'size': '7B params',
            'color': '#ff4d4d'
        },
        {
            'id': 'gemini',
            'name': 'Gemini Pro',
            'provider': 'Google',
            'type': 'api',
            'size': '340B params (est.)',
            'color': '#4285f4'
        },
        {
            'id': 'palm2',
            'name': 'PaLM 2',
            'provider': 'Google',
            'type': 'api',
            'size': '340B params',
            'color': '#34a853'
        }
    ]
