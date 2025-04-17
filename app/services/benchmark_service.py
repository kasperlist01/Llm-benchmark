# app/services/benchmark_service.py
import random
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks, get_blind_test_prompts


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

    # Check if blind test is selected
    blind_test_selected = 'blind_test' in selected_benchmark_ids

    # For blind test, we need exactly 2 models
    if blind_test_selected and len(selected_models) != 2:
        return {'error': 'Blind Test requires exactly 2 models to be selected'}

    # Simulate benchmark results
    results = []
    for model in selected_models:
        model_result = {
            'model': model['name'],
            'modelId': model['id'],
            'scores': [],
            'compositeScore': random.uniform(0, 100)
        }

        for benchmark in selected_benchmarks:
            if benchmark['id'] == 'blind_test':
                # Skip blind test for individual model results
                # We'll handle it separately
                continue

            benchmark_score = {
                'benchmark': benchmark['name'],
                'benchmarkId': benchmark['id'],
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

    # Add blind test data if selected
    if blind_test_selected and len(selected_models) == 2:
        blind_test_data = generate_blind_test_data(selected_models)
        return {
            'standardResults': results,
            'blindTest': blind_test_data,
            'testType': 'blind_test'
        }

    return {
        'standardResults': results,
        'testType': 'standard'
    }


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


def generate_blind_test_data(selected_models):
    """Generate data for blind test comparison between two models"""
    # Get prompts for blind testing
    prompts = get_blind_test_prompts()

    # Randomly select 5 prompts
    selected_prompts = random.sample(prompts, min(5, len(prompts)))

    # Generate test pairs
    test_pairs = []
    for prompt in selected_prompts:
        # Randomly decide which model appears first
        model_order = list(range(2))
        random.shuffle(model_order)

        pair = {
            'promptId': prompt['id'],
            'prompt': prompt['prompt'],
            'category': prompt['category'],
            'responses': [
                {
                    'position': 'A',
                    'modelIndex': model_order[0],  # This is the actual model index (0 or 1)
                    'response': generate_response(prompt['prompt'], selected_models[model_order[0]]['name']),
                    'votes': 0
                },
                {
                    'position': 'B',
                    'modelIndex': model_order[1],  # This is the actual model index (0 or 1)
                    'response': generate_response(prompt['prompt'], selected_models[model_order[1]]['name']),
                    'votes': 0
                }
            ],
            'voted': False,
            'revealed': False
        }
        test_pairs.append(pair)

    return {
        'models': [
            {'name': selected_models[0]['name'], 'id': selected_models[0]['id'], 'totalVotes': 0},
            {'name': selected_models[1]['name'], 'id': selected_models[1]['id'], 'totalVotes': 0}
        ],
        'testPairs': test_pairs,
        'completedVotes': 0,
        'totalPairs': len(selected_prompts)
    }


def record_blind_test_vote(test_data, prompt_id, position):
    """Record a vote for a particular response in the blind test"""
    for pair in test_data['testPairs']:
        if pair['promptId'] == prompt_id:
            # Mark as voted
            pair['voted'] = True

            # Increment vote count for the selected response
            response_index = 0 if position == 'A' else 1
            pair['responses'][response_index]['votes'] += 1

            # Update the model's total votes
            model_index = pair['responses'][response_index]['modelIndex']
            test_data['models'][model_index]['totalVotes'] += 1

            # Increment completed votes counter
            test_data['completedVotes'] += 1

            return True

    return False


def reveal_blind_test_models(test_data):
    """Reveal which model is which in all test pairs"""
    for pair in test_data['testPairs']:
        pair['revealed'] = True

    return test_data