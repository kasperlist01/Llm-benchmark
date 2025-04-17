# app/services/benchmark_service.py
import random
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks

def run_benchmark(selected_model_ids, selected_benchmark_ids, metrics_config):
    """
    Run benchmarks on selected models and return results

    Args:
        selected_model_ids (list): List of model IDs to benchmark
        selected_benchmark_ids (list): List of benchmark IDs to run
        metrics_config (dict): Configuration of metric weights

    Returns:
        list: Benchmark results for each model
    """
    # Get full model and benchmark data
    all_models = get_available_models()
    all_benchmarks = get_benchmarks()

    # Filter selected models and benchmarks
    selected_models = [model for model in all_models if model['id'] in selected_model_ids]
    selected_benchmarks = [benchmark for benchmark in all_benchmarks if benchmark['id'] in selected_benchmark_ids]

    # Simulate benchmark results
    results = []
    for model in selected_models:
        model_result = {
            'model': model['name'],
            'scores': [],
            'compositeScore': random.uniform(0, 100)
        }

        for benchmark in selected_benchmarks:
            benchmark_score = {
                'benchmark': benchmark['name'],
                'quantitativeScore': random.uniform(0, 100),
                'qualitativeScore': random.uniform(0, 100),
                'hallucinationScore': random.uniform(0, 100),
                'safetyScore': random.uniform(0, 100),
                'examples': []
            }

            # Generate example results
            example_prompts = [
                'Explain quantum computing in simple terms',
                'What are the ethical implications of AI?'
            ]

            for prompt in example_prompts:
                example = {
                    'prompt': prompt,
                    'response': generate_response(prompt, model['name']),
                    'metrics': {
                        'accuracy': random.uniform(0, 100),
                        'clarity': random.uniform(0, 100),
                        'relevance': random.uniform(0, 100)
                    }
                }
                benchmark_score['examples'].append(example)

            model_result['scores'].append(benchmark_score)

        results.append(model_result)

    return results

def generate_response(prompt, model_name):
    """Generate a simulated response for a given prompt and model"""
    responses = {
        'Explain quantum computing in simple terms': {
            'GPT-4': 'Quantum computing uses quantum bits or qubits that can exist in multiple states simultaneously, unlike classical bits. This allows quantum computers to process certain types of problems much faster than traditional computers.',
            'GPT-3.5 Turbo': 'Quantum computing uses qubits instead of regular bits. While normal bits are either 0 or 1, qubits can be both at the same time, making calculations potentially much faster.',
            'Claude 2': 'Think of quantum computing as computing with particles that can be in multiple states at once. This property, called superposition, allows quantum computers to explore many solutions simultaneously.',
            'default': 'Quantum computing uses quantum bits or qubits that can exist in multiple states simultaneously, unlike classical bits.'
        },
        'What are the ethical implications of AI?': {
            'GPT-4': 'The ethical implications of AI include concerns about privacy, bias in algorithms, job displacement, autonomous weapons, surveillance capabilities, and the need for transparent and accountable systems.',
            'Claude 2': 'AI raises ethical concerns around bias and fairness, privacy, job displacement, accountability, autonomous decision-making, and potential existential risks from advanced systems.',
            'default': 'The ethical implications of AI include concerns about privacy, bias, job displacement, and the need for transparent and accountable systems.'
        }
    }

    if prompt in responses:
        return responses[prompt].get(model_name, responses[prompt]['default'])
    else:
        return f"This is a simulated response from {model_name} for the prompt: {prompt}"