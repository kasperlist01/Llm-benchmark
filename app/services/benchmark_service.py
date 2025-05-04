# app/services/benchmark_service.py
import random
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks, get_blind_test_prompts
import openai


def run_benchmark(selected_models, selected_benchmark_ids, metrics_config):
    """
    Run benchmarks on selected models and return results

    Args:
        selected_models (list): List of model objects to benchmark
        selected_benchmark_ids (list): List of benchmark IDs to run
        metrics_config (dict): Configuration of metric weights

    Returns:
        list: Benchmark results for each model
    """
    # Get full benchmark data
    all_benchmarks = get_benchmarks()

    # Filter selected benchmarks
    selected_benchmarks = [benchmark for benchmark in all_benchmarks if benchmark['id'] in selected_benchmark_ids]

    # Check if blind test is selected
    blind_test_selected = 'blind_test' in selected_benchmark_ids

    # For blind test, we need exactly 2 models with API access
    if blind_test_selected:
        if len(selected_models) != 2:
            return {'error': 'Blind Test requires exactly 2 models to be selected'}

        # Check if both models have API access
        api_models = [model for model in selected_models if
                      (model['type'] == 'custom' and model.get('api_url')) or
                      (model['type'] == 'api')]

        if len(api_models) < 2:
            return {'error': 'Blind Test requires models with API access'}

        # For blind test, use only API-enabled models
        models_for_blind_test = api_models
    else:
        models_for_blind_test = []

    # Simulate benchmark results for standard benchmarks
    # In a real app, you would run actual benchmarks here
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

            # Generate example results with simulated responses for non-API models
            # or real API calls for API models
            example_prompts = [
                'Explain quantum computing in simple terms',
                'What are the ethical implications of AI?'
            ]

            for prompt in example_prompts:
                # Use API for API models, simulated responses for others
                if (model['type'] == 'custom' and model.get('api_url')) or model['type'] == 'api':
                    try:
                        response = call_model_api(prompt, model)
                    except Exception as e:
                        response = f"Error calling API: {str(e)}\n\nFallback to simulated response: {generate_response(prompt, model['name'])}"
                else:
                    response = generate_response(prompt, model['name'])

                example = {
                    'prompt': prompt,
                    'response': response,
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
    if blind_test_selected and len(models_for_blind_test) == 2:
        blind_test_data = generate_blind_test_data(models_for_blind_test)
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
    """Generate data for blind test comparison between two models using real API calls"""
    # Get prompts for blind testing
    prompts = get_blind_test_prompts()

    # Randomly select 5 prompts
    selected_prompts = random.sample(prompts, min(5, len(prompts)))

    # Fetch full model information for API calls
    model_info = []
    for model_id in [selected_models[0]['id'], selected_models[1]['id']]:
        # Check if it's a custom model (starts with 'custom_')
        if model_id.startswith('custom_'):
            # Extract the numeric ID
            custom_id = int(model_id.split('_')[1])
            from app.models.user_model import UserModel
            user_model = UserModel.query.get(custom_id)
            if user_model and user_model.api_url:
                model_info.append({
                    'id': model_id,
                    'name': user_model.name,
                    'type': 'custom',
                    'api_url': user_model.api_url,
                    'api_key': user_model.api_key,
                    'provider': user_model.provider
                })
            else:
                # Fallback if model not found or no API URL
                return {'error': f'Model {model_id} does not have a valid API configuration'}
        else:
            # For standard models
            from app.models.model_data import get_available_models
            std_models = get_available_models()
            matching_model = next((m for m in std_models if m['id'] == model_id), None)
            if matching_model:
                model_info.append(matching_model)
            else:
                # Fallback
                return {'error': f'Model {model_id} not found'}

    # Generate test pairs
    test_pairs = []
    for prompt in selected_prompts:
        # Randomly decide which model appears first
        model_order = list(range(2))
        random.shuffle(model_order)

        # Get real responses from both models
        responses = []
        for i in range(2):
            model_idx = model_order[i]
            response = call_model_api(prompt['prompt'], model_info[model_idx])
            responses.append(response)

        pair = {
            'promptId': prompt['id'],
            'prompt': prompt['prompt'],
            'category': prompt['category'],
            'responses': [
                {
                    'position': 'A',
                    'modelIndex': model_order[0],  # This is the actual model index (0 or 1)
                    'response': responses[0],
                    'votes': 0
                },
                {
                    'position': 'B',
                    'modelIndex': model_order[1],  # This is the actual model index (0 or 1)
                    'response': responses[1],
                    'votes': 0
                }
            ],
            'voted': False,
            'revealed': False
        }
        test_pairs.append(pair)

    return {
        'models': [
            {'name': model_info[0]['name'], 'id': model_info[0]['id'], 'totalVotes': 0},
            {'name': model_info[1]['name'], 'id': model_info[1]['id'], 'totalVotes': 0}
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


def call_model_api(prompt, model_info):
    """
    Call the model API to get a real response

    Args:
        prompt (str): The prompt to send to the model
        model_info (dict): Information about the model including API URL and key

    Returns:
        str: The model's response
    """
    try:
        # For custom models with their own API endpoints
        if model_info.get('type') == 'custom' and model_info.get('api_url'):
            client = openai.OpenAI(
                api_key=model_info.get('api_key', ''),
                base_url=model_info.get('api_url')
            )

            response = client.chat.completions.create(
                model="gpt-4",  # Используем общее имя, так как конкретная модель определяется на сервере API
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content

        # For standard OpenAI models
        elif model_info.get('provider') == 'OpenAI':
            # Use the environment variable for API key or a configured key
            api_key = model_info.get('api_key') or openai.api_key
            client = openai.OpenAI(api_key=api_key)

            model_id = "gpt-4" if model_info.get('id') == 'gpt4' else "gpt-3.5-turbo"

            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content

        # Fallback to simulated response if can't determine how to call the model
        return generate_response(prompt, model_info.get('name', 'Unknown Model'))

    except Exception as e:
        print(f"Error calling model API: {str(e)}")
        # Return a fallback response in case of error
        return f"Error generating response: {str(e)}"
