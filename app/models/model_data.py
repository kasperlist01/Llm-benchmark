# app/models/model_data.py
import json
import os
from pathlib import Path


def get_available_models():
    """Get list of available LLM models for benchmarking"""
    try:
        # Путь к файлу data.json относительно текущего файла
        data_path = Path(__file__).parent.parent.parent / 'data.json'

        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Получаем топ-20 моделей из датасета
        top_models = data.get('top_models', [])[:20]

        # Преобразуем данные в формат, понятный приложению
        formatted_models = []
        for i, model in enumerate(top_models):
            # Генерируем цвет на основе архитектуры модели
            color = get_color_for_architecture(model['architecture'])

            formatted_models.append({
                'id': f"model_{i}",
                'name': model['name'],
                'provider': model['provider'],
                'type': get_model_type(model['type']),
                'size': f"{model['params_billions']}B params",
                'color': color,
                'average_score': model['average_score'],
                'architecture': model['architecture'],
                'model_type': model['type']  # Сохраняем оригинальный тип
            })

        return formatted_models
    except Exception as e:
        print(f"Error loading models from data.json: {str(e)}")
        # Возвращаем несколько моделей по умолчанию в случае ошибки
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
            }
        ]


def get_color_for_architecture(architecture):
    """Генерирует цвет для модели на основе архитектуры"""
    # Определяем цвета для разных архитектур
    color_map = {
        'Qwen2ForCausalLM': '#4285f4',  # Google Blue
        'LlamaForCausalLM': '#0866ff',  # Meta Blue
        'MistralForCausalLM': '#7B68EE',  # Medium Slate Blue
        'Gemma2ForCausalLM': '#34a853',  # Google Green
        'Phi3ForCausalLM': '#8E44AD',  # Purple
        'CohereForCausalLM': '#FF5733',  # Orange-Red
        'Cohere2ForCausalLM': '#C70039',  # Crimson
        'PhiForCausalLM': '#FFC300',  # Gold
        'MixtralForCausalLM': '#DAA520',  # Goldenrod
        'MllamaForConditionalGeneration': '#1E8449'  # Green
    }

    return color_map.get(architecture, '#808080')  # Серый цвет по умолчанию


def get_model_type(model_type):
    """Преобразует тип модели из датасета в тип, используемый в приложении"""
    type_map = {
        'Chat (Instruct)': 'api',
        'Fine-tuned': 'api',
        'Base Merge': 'open',
        'Pretrained': 'open',
        'Continuously Pretrained': 'open',
        'Multimodal': 'api'
    }

    return type_map.get(model_type, 'api')