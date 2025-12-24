import csv
import json
import math
import random
import re
import requests
from collections import Counter

from app.models.user_dataset import UserDataset
from app.schemas.benchmark_dto import RunBenchmarkRequest, RunBenchmarkResult


def clean_model_response(response):
    if not response:
        return response

    response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL | re.IGNORECASE)

    response = response.lstrip()

    return response


def run_benchmark(request: RunBenchmarkRequest) -> RunBenchmarkResult:
    """
    Запускает выбранные бенчмарки для переданных моделей и датасетов.

    На вход принимает структурированный запрос RunBenchmarkRequest, а внутри
    использует словари и списки в том же формате, что и раньше, чтобы не
    затрагивать алгоритмы генерации данных. Возвращает RunBenchmarkResult,
    который оборачивает готовый словарь с результатами для фронтенда.
    """
    # Преобразуем DTO моделей и датасетов в словари, совместимые с существующей логикой.
    selected_models = [model.to_benchmark_dict() for model in request.models]
    selected_datasets = [dataset.to_benchmark_dict() for dataset in request.datasets]

    if not selected_datasets or len(selected_datasets) == 0:
        return RunBenchmarkResult({
            'error': 'Необходимо выбрать хотя бы один датасет для проведения тестирования'
        })

    selected_benchmark_ids = request.selected_benchmark_ids
    metrics_config = request.metrics_config
    judge_model_id = request.judge_model_id

    metrics_comparison_selected = 'metrics_comparison' in selected_benchmark_ids
    blind_test_selected = 'blind_test' in selected_benchmark_ids
    judge_eval_selected = 'judge_eval' in selected_benchmark_ids
    reference_comparison_selected = 'reference_comparison' in selected_benchmark_ids

    if metrics_comparison_selected:
        if len(selected_benchmark_ids) > 1:
            return RunBenchmarkResult({'error': 'Сравнение по метрикам нельзя комбинировать с другими тестами'})

        api_models = [model for model in selected_models if model.get('api_url')]
        if len(api_models) == 0:
            return RunBenchmarkResult({'error': 'Сравнение по метрикам требует хотя бы одну модель с доступом к API'})

        metrics_data = generate_metrics_comparison_data(api_models, selected_datasets, metrics_config)
        if 'error' in metrics_data:
            return RunBenchmarkResult(metrics_data)
        return RunBenchmarkResult({
            'metricsComparison': metrics_data,
            'testType': 'metrics_comparison'
        })

    if blind_test_selected or judge_eval_selected:
        api_models = [model for model in selected_models if model.get('api_url')]

        if len(api_models) < 2:
            return RunBenchmarkResult({
                'error': f'{"Слепой тест" if blind_test_selected else "Оценка судьёй"} требует как минимум 2 модели с доступом к API'
            })

        if len(api_models) > 2:
            models_for_special_test = random.sample(api_models, 2)
        else:
            models_for_special_test = api_models
    else:
        models_for_special_test = []

    if blind_test_selected and len(models_for_special_test) == 2:
        blind_test_data = generate_blind_test_data(models_for_special_test, selected_datasets)
        if 'error' in blind_test_data:
            return RunBenchmarkResult(blind_test_data)
        return RunBenchmarkResult({
            'blindTest': blind_test_data,
            'testType': 'blind_test'
        })

    if judge_eval_selected and len(models_for_special_test) == 2:
        if not judge_model_id:
            return RunBenchmarkResult({'error': 'Для оценки судьёй необходимо выбрать модель-судью'})

        judge_eval_data = generate_judge_eval_data(models_for_special_test, judge_model_id, selected_datasets)
        if 'error' in judge_eval_data:
            return RunBenchmarkResult(judge_eval_data)
        return RunBenchmarkResult({
            'judgeEval': judge_eval_data,
            'testType': 'judge_eval'
        })

    if reference_comparison_selected:
        if not judge_model_id:
            return RunBenchmarkResult({'error': 'Для сравнения с эталоном необходимо выбрать модель-судью'})

        api_models = [model for model in selected_models if model.get('api_url')]
        if len(api_models) == 0:
            return RunBenchmarkResult({'error': 'Сравнение с эталоном требует хотя бы одну модель с доступом к API'})

        reference_data = generate_reference_comparison_data(api_models, judge_model_id, selected_datasets)
        if 'error' in reference_data:
            return RunBenchmarkResult(reference_data)
        return RunBenchmarkResult({
            'referenceComparison': reference_data,
            'testType': 'reference_comparison'
        })

    return RunBenchmarkResult({
        'testType': 'none',
        'error': 'Не выбраны допустимые тесты'
    })


def load_prompts_from_datasets(selected_datasets):
    prompts = []

    if not selected_datasets:
        return {'prompts': [], 'error': 'Не выбраны датасеты'}

    for dataset_info in selected_datasets:
        try:
            dataset_id = int(dataset_info['id'].split('_')[1])
            dataset = UserDataset.query.get(dataset_id)

            if not dataset or not dataset.file_path:
                continue

            import os
            if not os.path.exists(dataset.file_path):
                continue

            with open(dataset.file_path, 'r', encoding='utf-8') as file:
                sample = file.read(1024)
                file.seek(0)
                sniffer = csv.Sniffer()
                try:
                    delimiter = sniffer.sniff(sample).delimiter
                except:
                    delimiter = ','

                reader = csv.DictReader(file, delimiter=delimiter)
                fieldnames = reader.fieldnames
                if not fieldnames:
                    continue

                prompt_column = find_prompt_column(fieldnames)
                reference_column = find_reference_column(fieldnames)

                if not prompt_column:
                    continue

                for i, row in enumerate(reader):
                    prompt_text = row.get(prompt_column, '').strip() if prompt_column else ''
                    reference_answer = row.get(reference_column, '').strip() if reference_column else None

                    if prompt_text:
                        prompt_data = {
                            'id': f'dataset_{dataset.id}_row_{i}',
                            'prompt': prompt_text,
                            'category': f'dataset_{dataset.name}',
                            'source_dataset': dataset.name,
                            'source_file': dataset.filename
                        }

                        if reference_answer:
                            prompt_data['reference_answer'] = reference_answer

                        prompts.append(prompt_data)

                        if len([p for p in prompts if p['source_dataset'] == dataset.name]) >= 20:
                            break

        except Exception as e:
            continue

    if not prompts:
        return {'prompts': [],
                'error': 'Не удалось загрузить промпты из выбранных датасетов. Проверьте формат CSV файлов.'}

    return {'prompts': prompts, 'error': None}


def find_prompt_column(fieldnames):
    if not fieldnames:
        return None

    prompt_keywords = [
        'prompt', 'prompts', 'question', 'questions', 'query', 'queries',
        'input', 'instruction', 'instructions', 'task', 'tasks',
        'запрос', 'вопрос', 'задача', 'задание', 'инструкция'
    ]

    for field in fieldnames:
        if field.lower() in prompt_keywords:
            return field

    for field in fieldnames:
        for keyword in prompt_keywords:
            if keyword in field.lower():
                return field

    return None


def find_reference_column(fieldnames):
    if not fieldnames:
        return None

    reference_keywords = [
        'reference', 'answer', 'answers', 'response', 'responses', 'output',
        'solution', 'solutions', 'result', 'results', 'expected', 'target',
        'эталон', 'ответ', 'ответы', 'решение', 'результат', 'ожидаемый',
        'ref', 'ans', 'ground_truth', 'truth', 'correct', 'ideal'
    ]

    for field in fieldnames:
        if field.lower() in reference_keywords:
            return field

    for field in fieldnames:
        for keyword in reference_keywords:
            if keyword in field.lower():
                return field

    return None


def calculate_rouge_score(reference, candidate):
    def lcs_length(seq1, seq2):
        m, n = len(seq1), len(seq2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if seq1[i - 1] == seq2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

        return dp[m][n]

    ref_tokens = re.findall(r'\w+', reference.lower())
    cand_tokens = re.findall(r'\w+', candidate.lower())

    if not ref_tokens or not cand_tokens:
        return 0.0

    lcs_len = lcs_length(ref_tokens, cand_tokens)

    if lcs_len == 0:
        return 0.0

    precision = lcs_len / len(cand_tokens)
    recall = lcs_len / len(ref_tokens)

    if precision + recall == 0:
        return 0.0

    f1_score = 2 * precision * recall / (precision + recall)
    return f1_score


def calculate_semantic_similarity(reference, candidate):
    def text_to_vector(text):
        words = re.findall(r'\w+', text.lower())
        word_count = Counter(words)
        return word_count

    def cosine_similarity(vec1, vec2):
        all_words = set(vec1.keys()) | set(vec2.keys())

        if not all_words:
            return 0.0

        v1 = [vec1.get(word, 0) for word in all_words]
        v2 = [vec2.get(word, 0) for word in all_words]

        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(a * a for a in v2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    ref_vector = text_to_vector(reference)
    cand_vector = text_to_vector(candidate)

    return cosine_similarity(ref_vector, cand_vector)


def calculate_bert_score(reference, candidate):
    ref_tokens = re.findall(r'\w+', reference.lower())
    cand_tokens = re.findall(r'\w+', candidate.lower())

    if not ref_tokens or not cand_tokens:
        return 0.0

    ref_set = set(ref_tokens)
    cand_set = set(cand_tokens)

    overlap = len(ref_set & cand_set)
    union = len(ref_set | cand_set)

    if union == 0:
        return 0.0

    jaccard = overlap / union
    len_ratio = min(len(cand_tokens), len(ref_tokens)) / max(len(cand_tokens), len(ref_tokens))
    bert_like_score = jaccard * len_ratio

    return bert_like_score


def generate_metrics_comparison_data(selected_models, selected_datasets, metrics_config):
    dataset_result = load_prompts_from_datasets(selected_datasets)
    if dataset_result['error']:
        return {'error': dataset_result['error']}

    prompts = dataset_result['prompts']
    prompts_with_reference = [p for p in prompts if
                              'reference_answer' in p and p['reference_answer'] and p['reference_answer'].strip()]

    if not prompts_with_reference:
        return {
            'error': f'В выбранных датасетах не найдено промптов с эталонными ответами. Всего промптов: {len(prompts)}. Убедитесь, что CSV файлы содержат колонки с промптами и эталонными ответами.'}

    selected_prompts = prompts_with_reference[:10]

    rouge_weight = metrics_config.get('rouge', {}).get('weight', 0.4)
    semantic_weight = metrics_config.get('semantic', {}).get('weight', 0.3)
    bert_weight = metrics_config.get('bertScore', {}).get('weight', 0.3)

    model_results = []

    for model in selected_models:
        model_data = {
            'id': model['id'],
            'name': model['name'],
            'api_url': model['api_url'],
            'api_key': model['api_key']
        }

        model_scores = []
        model_responses = []

        for prompt_data in selected_prompts:
            prompt = prompt_data['prompt']
            reference_answer = prompt_data['reference_answer']

            try:
                model_response = call_model_api(prompt, model_data)
            except Exception as e:
                model_response = f"Ошибка получения ответа: {str(e)}"

            rouge_score = calculate_rouge_score(reference_answer, model_response)
            semantic_score = calculate_semantic_similarity(reference_answer, model_response)
            bert_score = calculate_bert_score(reference_answer, model_response)

            rouge_norm = max(0, min(1, rouge_score))
            semantic_norm = max(0, min(1, semantic_score))
            bert_norm = max(0, min(1, bert_score))

            weighted_score = (
                                     rouge_norm * rouge_weight +
                                     semantic_norm * semantic_weight +
                                     bert_norm * bert_weight
                             ) * 10

            model_scores.append(weighted_score)
            model_responses.append({
                'promptId': prompt_data['id'],
                'prompt': prompt,
                'modelResponse': model_response,
                'referenceAnswer': reference_answer,
                'weightedScore': round(weighted_score, 2),
                'metrics': {
                    'rouge': round(rouge_score, 3),
                    'semantic': round(semantic_score, 3),
                    'bertScore': round(bert_score, 3),
                    'rouge_norm': round(rouge_norm, 3),
                    'semantic_norm': round(semantic_norm, 3),
                    'bert_norm': round(bert_norm, 3)
                },
                'category': prompt_data['category'],
                'source_info': {
                    'dataset': prompt_data.get('source_dataset', 'Неизвестный датасет'),
                    'file': prompt_data.get('source_file', 'Неизвестный файл')
                }
            })

        avg_score = sum(model_scores) / len(model_scores) if model_scores else 0

        model_results.append({
            'id': model_data['id'],
            'name': model_data['name'],
            'averageScore': round(avg_score, 2),
            'responses': model_responses
        })

    model_results.sort(key=lambda x: x['averageScore'], reverse=True)

    return {
        'models': model_results,
        'totalPrompts': len(selected_prompts),
        'metricsWeights': {
            'rouge': rouge_weight,
            'semantic': semantic_weight,
            'bertScore': bert_weight
        },
        'datasetsUsed': list(set([prompt.get('source_dataset', 'Неизвестный датасет') for prompt in selected_prompts]))
    }


def generate_reference_comparison_data(selected_models, judge_model_id, selected_datasets):
    dataset_result = load_prompts_from_datasets(selected_datasets)
    if dataset_result['error']:
        return {'error': dataset_result['error']}

    prompts = dataset_result['prompts']
    prompts_with_reference = [p for p in prompts if
                              'reference_answer' in p and p['reference_answer'] and p['reference_answer'].strip()]

    if not prompts_with_reference:
        return {
            'error': f'В выбранных датасетах не найдено промптов с эталонными ответами. Всего промптов: {len(prompts)}. Убедитесь, что CSV файлы содержат колонки с промптами и эталонными ответами.'}

    selected_prompts = prompts_with_reference

    from app.models.user_model import UserModel
    from flask_login import current_user

    if judge_model_id.startswith('custom_'):
        judge_id = int(judge_model_id.split('_')[1])
        judge_model = UserModel.query.filter_by(id=judge_id, user_id=current_user.id).first()
        if not judge_model or not judge_model.api_integration:
            return {'error': 'Модель-судья не найдена или не имеет API доступа'}

        judge_info = {
            'id': judge_model_id,
            'name': judge_model.name,
            'api_url': judge_model.api_integration.api_url,
            'api_key': judge_model.api_integration.api_key
        }
    else:
        return {'error': 'Неверный ID модели-судьи'}

    model_results = []

    for model in selected_models:
        model_data = {
            'id': model['id'],
            'name': model['name'],
            'api_url': model['api_url'],
            'api_key': model['api_key']
        }

        model_scores = []
        model_responses = []

        for prompt_data in selected_prompts:
            prompt = prompt_data['prompt']
            reference_answer = prompt_data['reference_answer']

            try:
                model_response = call_model_api(prompt, model_data)
            except Exception as e:
                model_response = f"Ошибка получения ответа: {str(e)}"

            evaluation = evaluate_against_reference(
                prompt,
                model_response,
                reference_answer,
                model_data['name'],
                judge_info
            )

            model_scores.append(evaluation['score'])
            model_responses.append({
                'promptId': prompt_data['id'],
                'prompt': prompt,
                'modelResponse': model_response,
                'referenceAnswer': reference_answer,
                'score': evaluation['score'],
                'reasoning': evaluation['reasoning'],
                'category': prompt_data['category'],
                'source_info': {
                    'dataset': prompt_data.get('source_dataset', 'Неизвестный датасет'),
                    'file': prompt_data.get('source_file', 'Неизвестный файл')
                }
            })

        avg_score = sum(model_scores) / len(model_scores) if model_scores else 0

        model_results.append({
            'id': model_data['id'],
            'name': model_data['name'],
            'averageScore': round(avg_score, 2),
            'responses': model_responses
        })

    model_results.sort(key=lambda x: x['averageScore'], reverse=True)

    return {
        'models': model_results,
        'totalPrompts': len(selected_prompts),
        'judgeModel': judge_info['name'],
        'datasetsUsed': list(set([prompt.get('source_dataset', 'Неизвестный датасет') for prompt in selected_prompts]))
    }


def generate_judge_eval_data(selected_models, judge_model_id, selected_datasets):
    dataset_result = load_prompts_from_datasets(selected_datasets)
    if dataset_result['error']:
        return {'error': dataset_result['error']}

    prompts = dataset_result['prompts']

    if not prompts:
        return {'error': 'В выбранных датасетах не найдено подходящих промптов'}

    selected_prompts = prompts

    from app.models.user_model import UserModel
    from flask_login import current_user

    if judge_model_id.startswith('custom_'):
        judge_id = int(judge_model_id.split('_')[1])
        judge_model = UserModel.query.filter_by(id=judge_id, user_id=current_user.id).first()
        if not judge_model or not judge_model.api_integration:
            return {'error': 'Модель-судья не найдена или не имеет API доступа'}

        judge_info = {
            'id': judge_model_id,
            'name': judge_model.name,
            'api_url': judge_model.api_integration.api_url,
            'api_key': judge_model.api_integration.api_key
        }
    else:
        return {'error': 'Неверный ID модели-судьи'}

    eval_pairs = []
    for prompt_data in selected_prompts:
        prompt = prompt_data['prompt']

        responses = []
        model_info = []

        for i in range(2):
            model = selected_models[i]
            model_data = {
                'id': model['id'],
                'name': model['name'],
                'api_url': model['api_url'],
                'api_key': model['api_key']
            }
            model_info.append(model_data)

            try:
                response = call_model_api(prompt, model_data)
            except Exception as e:
                response = f"Ошибка получения ответа: {str(e)}"
            responses.append(response)

        criteria = ['accuracy', 'helpfulness', 'clarity']
        evaluation = evaluate_responses_with_judge(
            prompt,
            responses[0],
            responses[1],
            model_info[0]['name'],
            model_info[1]['name'],
            criteria,
            judge_info
        )

        pair = {
            'promptId': prompt_data['id'],
            'prompt': prompt,
            'category': prompt_data['category'],
            'criteria': criteria,
            'source_info': {
                'dataset': prompt_data.get('source_dataset', 'Неизвестный датасет'),
                'file': prompt_data.get('source_file', 'Неизвестный файл')
            },
            'responses': [
                {
                    'modelId': model_info[0]['id'],
                    'modelName': model_info[0]['name'],
                    'response': responses[0],
                    'score': evaluation['model1_score']
                },
                {
                    'modelId': model_info[1]['id'],
                    'modelName': model_info[1]['name'],
                    'response': responses[1],
                    'score': evaluation['model2_score']
                }
            ],
            'evaluation': {
                'winner': evaluation['winner'],
                'reasoning': evaluation['reasoning'],
                'criteria_scores': evaluation['criteria_scores'],
                'judge_model': judge_info['name']
            }
        }
        eval_pairs.append(pair)

    model1_total = sum(pair['responses'][0]['score'] for pair in eval_pairs)
    model2_total = sum(pair['responses'][1]['score'] for pair in eval_pairs)
    model1_wins = sum(1 for pair in eval_pairs if pair['evaluation']['winner'] == model_info[0]['name'])
    model2_wins = sum(1 for pair in eval_pairs if pair['evaluation']['winner'] == model_info[1]['name'])

    return {
        'models': [
            {
                'id': model_info[0]['id'],
                'name': model_info[0]['name'],
                'totalScore': model1_total,
                'wins': model1_wins
            },
            {
                'id': model_info[1]['id'],
                'name': model_info[1]['name'],
                'totalScore': model2_total,
                'wins': model2_wins
            }
        ],
        'evalPairs': eval_pairs,
        'totalPrompts': len(selected_prompts),
        'judgeModel': judge_info['name'],
        'datasetsUsed': list(set([prompt.get('source_dataset', 'Неизвестный датасет') for prompt in selected_prompts]))
    }


def generate_blind_test_data(selected_models, selected_datasets):
    dataset_result = load_prompts_from_datasets(selected_datasets)
    if dataset_result['error']:
        return {'error': dataset_result['error']}

    prompts = dataset_result['prompts']

    if not prompts:
        return {'error': 'В выбранных датасетах не найдено подходящих промптов'}

    selected_prompts = prompts

    model_info = []
    for model in selected_models:
        model_info.append({
            'id': model['id'],
            'name': model['name'],
            'api_url': model['api_url'],
            'api_key': model['api_key']
        })

    test_pairs = []
    for prompt in selected_prompts:
        model_order = list(range(2))
        random.shuffle(model_order)

        responses = []
        for i in range(2):
            model_idx = model_order[i]
            try:
                response = call_model_api(prompt['prompt'], model_info[model_idx])
            except Exception as e:
                response = f"Ошибка получения ответа: {str(e)}"
            responses.append(response)

        pair = {
            'promptId': prompt['id'],
            'prompt': prompt['prompt'],
            'category': prompt['category'],
            'source_info': {
                'dataset': prompt.get('source_dataset', 'Неизвестный датасет'),
                'file': prompt.get('source_file', 'Неизвестный файл')
            },
            'responses': [
                {
                    'position': 'A',
                    'modelIndex': model_order[0],
                    'response': responses[0],
                    'votes': 0
                },
                {
                    'position': 'B',
                    'modelIndex': model_order[1],
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
        'totalPairs': len(selected_prompts),
        'datasetsUsed': list(set([prompt.get('source_dataset', 'Неизвестный датасет') for prompt in selected_prompts]))
    }


def evaluate_against_reference(prompt, model_response, reference_answer, model_name, judge_info):
    try:
        system_prompt = f"""Вы эксперт по оценке качества ответов ИИ. Ваша задача - оценить, насколько хорошо ответ модели соответствует эталонному ответу.

Оцените ответ модели по следующим критериям:
1. Точность информации (соответствие фактам в эталоне)
2. Полнота ответа (покрытие всех важных аспектов эталона)
3. Ясность и понятность изложения
4. Соответствие стилю и формату эталона

Дайте общую оценку от 1 до 10, где:
- 1-3: Очень плохое соответствие эталону
- 4-6: Частичное соответствие эталону
- 7-8: Хорошее соответствие эталону
- 9-10: Отличное соответствие эталону

Оформите свой ответ строго в формате JSON:
{{
  "score": <оценка от 1 до 10>,
  "reasoning": "<подробное объяснение оценки с анализом соответствия по всем критериям>"
}}"""

        user_prompt = f"""Исходный запрос: {prompt}

Эталонный ответ: {reference_answer}

Ответ тестируемой модели: {model_response}

Пожалуйста, оцените соответствие ответа модели эталонному ответу."""

        judge_response = call_model_api_with_system(user_prompt, judge_info, system_prompt)

        try:
            json_match = re.search(r'\{.*\}', judge_response, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                json_text = judge_response

            result = json.loads(json_text)

            if 'score' in result and 'reasoning' in result:
                return {
                    "score": float(result['score']),
                    "reasoning": result['reasoning']
                }
        except json.JSONDecodeError:
            pass

        score_match = re.search(r'(?:score|оценка)["\s:]*(\d+(?:\.\d+)?)', judge_response.lower())
        if score_match:
            score = float(score_match.group(1))
            score = max(1, min(10, score))
            return {
                "score": score,
                "reasoning": judge_response
            }

        return {
            "score": 0.0,
            "reasoning": f"Не удалось извлечь оценку из ответа модели-судьи. Ответ судьи: {judge_response[:200]}..."
        }

    except Exception as e:
        return {
            "score": 0.0,
            "reasoning": f"Ошибка при получении оценки от модели-судьи: {str(e)}"
        }


def evaluate_responses_with_judge(prompt, response1, response2, model1_name, model2_name, criteria, judge_info):
    try:
        criteria_str = ", ".join(criteria)

        system_prompt = f"""Вы эксперт по оценке ИИ. Ваша задача - сравнить ответы двух разных моделей ИИ на один и тот же запрос и определить, какой из них лучше.

Оцените ответы по следующим критериям: {criteria_str}

Для каждого критерия назначьте оценку от 1 до 10 для каждой модели. Затем предоставьте общую оценку от 1 до 10 для каждой модели.
В заключение определите, какая модель дала лучший ответ в целом, и объясните свои рассуждения.

Оформите свой ответ строго в формате JSON:
{{
  "model1_score": <общая оценка для Модели A>,
  "model2_score": <общая оценка для Модели B>,
  "winner": "<Модель A или Модель B>",
  "reasoning": "<ваше подробное объяснение решения и анализ ответов>",
  "criteria_scores": {{
    "{criteria[0] if criteria else 'accuracy'}": {{ "model1": <оценка>, "model2": <оценка> }},
    "{criteria[1] if len(criteria) > 1 else 'helpfulness'}": {{ "model1": <оценка>, "model2": <оценка> }},
    "{criteria[2] if len(criteria) > 2 else 'clarity'}": {{ "model1": <оценка>, "model2": <оценка> }}
  }}
}}"""

        user_prompt = f"""Исходный запрос: {prompt}

Модель A:
{response1}

Модель B:
{response2}

Пожалуйста, оцените эти ответы согласно указанным критериям и формату."""

        judge_response = call_model_api_with_system(user_prompt, judge_info, system_prompt)

        try:
            json_match = re.search(r'\{.*\}', judge_response, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                json_text = judge_response

            result = json.loads(json_text)

            if all(key in result for key in ['model1_score', 'model2_score', 'winner', 'reasoning']):
                winner = result['winner']
                if 'A' in winner or 'model1' in winner.lower():
                    actual_winner = model1_name
                elif 'B' in winner or 'model2' in winner.lower():
                    actual_winner = model2_name
                else:
                    actual_winner = model1_name if result['model1_score'] > result['model2_score'] else model2_name

                return {
                    "model1_score": float(result['model1_score']),
                    "model2_score": float(result['model2_score']),
                    "winner": actual_winner,
                    "reasoning": result['reasoning'],
                    "criteria_scores": result.get('criteria_scores', {})
                }
        except json.JSONDecodeError:
            pass

        score1_match = re.search(r'(?:model\s*a|модель\s*a)["\s:]*(\d+(?:\.\d+)?)', judge_response.lower())
        score2_match = re.search(r'(?:model\s*b|модель\s*b)["\s:]*(\d+(?:\.\d+)?)', judge_response.lower())

        if not score1_match:
            score1_match = re.search(r'(?:model1|модель 1)["\s:]*(\d+(?:\.\d+)?)', judge_response.lower())
        if not score2_match:
            score2_match = re.search(r'(?:model2|модель 2)["\s:]*(\d+(?:\.\d+)?)', judge_response.lower())

        score1 = float(score1_match.group(1)) if score1_match else None
        score2 = float(score2_match.group(1)) if score2_match else None

        if score1 is None or score2 is None:
            return {
                "model1_score": 0.0,
                "model2_score": 0.0,
                "winner": "Невозможно определить",
                "reasoning": f"Не удалось извлечь оценки из ответа модели-судьи. Ответ: {judge_response[:200]}...",
                "criteria_scores": {}
            }

        winner = model1_name if score1 > score2 else model2_name

        criteria_scores = {}
        for criterion in criteria:
            criteria_scores[criterion] = {
                "model1": 0.0,
                "model2": 0.0
            }

        return {
            "model1_score": score1,
            "model2_score": score2,
            "winner": winner,
            "reasoning": judge_response,
            "criteria_scores": criteria_scores
        }

    except Exception as e:
        return {
            "model1_score": 0.0,
            "model2_score": 0.0,
            "winner": "Ошибка оценки",
            "reasoning": f"Ошибка при получении оценки от модели-судьи: {str(e)}",
            "criteria_scores": {}
        }


def record_blind_test_vote(test_data, prompt_id, position):
    for pair in test_data['testPairs']:
        if pair['promptId'] == prompt_id:
            pair['voted'] = True

            response_index = 0 if position == 'A' else 1
            pair['responses'][response_index]['votes'] += 1

            model_index = pair['responses'][response_index]['modelIndex']
            test_data['models'][model_index]['totalVotes'] += 1

            test_data['completedVotes'] += 1

            return True

    return False


def reveal_blind_test_models(test_data):
    for pair in test_data['testPairs']:
        pair['revealed'] = True

    return test_data


def call_model_api(prompt, model_info):
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        if model_info.get('api_key'):
            headers['Authorization'] = f'Bearer {model_info["api_key"]}'

        payload = {
            'model': model_info.get('name', 'default'),
            'messages': [
                {"role": "system", "content": "Вы очень полезный помощник. Отвечайте на вопросы кратко и по делу."},
                {"role": "user", "content": prompt}
            ],
            'max_tokens': 500,
            'temperature': 0.7
        }

        response = requests.post(
            f"{model_info['api_url'].rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            response_data = response.json()

            if 'choices' in response_data and len(response_data['choices']) > 0:
                if 'message' in response_data['choices'][0]:
                    content = response_data['choices'][0]['message'].get('content', 'Нет ответа')
                elif 'text' in response_data['choices'][0]:
                    content = response_data['choices'][0]['text']
                else:
                    content = "Не удалось извлечь ответ из API"

                return clean_model_response(content)
            else:
                return "Не удалось извлечь ответ из API"
        else:
            return f"Ошибка API: HTTP {response.status_code}"

    except Exception as e:
        return f"Ошибка генерации ответа: {str(e)}"


def call_model_api_with_system(prompt, model_info, system_prompt):
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        if model_info.get('api_key'):
            headers['Authorization'] = f'Bearer {model_info["api_key"]}'

        payload = {
            'model': model_info.get('name', 'default'),
            'messages': [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            'max_tokens': 1000,
            'temperature': 0.3
        }

        response = requests.post(
            f"{model_info['api_url'].rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code == 200:
            response_data = response.json()

            if 'choices' in response_data and len(response_data['choices']) > 0:
                if 'message' in response_data['choices'][0]:
                    content = response_data['choices'][0]['message'].get('content', 'Нет ответа')
                elif 'text' in response_data['choices'][0]:
                    content = response_data['choices'][0]['text']
                else:
                    content = "Не удалось извлечь ответ из API"

                return clean_model_response(content)
            else:
                return "Не удалось извлечь ответ из API"
        else:
            return f"Ошибка API: HTTP {response.status_code}"

    except Exception as e:
        return f"Ошибка генерации ответа: {str(e)}"
