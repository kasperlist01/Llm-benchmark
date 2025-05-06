# app/routes.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks, get_blind_test_prompts
from app.models.user_model import UserModel
from app.services.benchmark_service import run_benchmark, record_blind_test_vote, reveal_blind_test_models
import json
from pathlib import Path

main_bp = Blueprint('main', __name__)


# утилита: есть ли у модели реальный API‑доступ?
def _has_api_access(model: dict) -> bool:
    return (
        model["type"] == "api"
        or (model["type"] == "custom" and model.get("api_url"))
    )


@main_bp.route('/')
@login_required
def index():
    """Отображение главной страницы приложения"""
    return render_template('index.html')


@main_bp.route('/api/models')
@login_required
def get_models():
    """API-эндпоинт для получения всех доступных моделей"""
    models = get_available_models()
    return jsonify(models)


@main_bp.route('/api/benchmarks')
@login_required
def get_all_benchmarks():
    """API-эндпоинт для получения всех эталонных тестов"""
    benchmarks = get_benchmarks()
    return jsonify(benchmarks)


@main_bp.route('/api/blind-test-prompts')
@login_required
def get_prompts_for_blind_test():
    """API-эндпоинт для получения запросов для слепого тестирования"""
    prompts = get_blind_test_prompts()
    return jsonify(prompts)


@main_bp.route('/api/model-stats')
@login_required
def get_model_stats():
    """API-эндпоинт для получения статистики моделей из data.json"""
    try:
        data_path = Path(__file__).parent.parent / 'data.json'
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@main_bp.route('/api/blind-test/vote', methods=['POST'])
@login_required
def vote_blind_test():
    """API-эндпоинт для записи голоса в слепом тесте"""
    data = request.json
    test_data = data.get('testData', {})
    prompt_id = data.get('promptId')
    position = data.get('position')  # 'A' или 'B'

    if not test_data or not prompt_id or not position:
        return jsonify({'error': 'Отсутствуют необходимые данные'}), 400

    success = record_blind_test_vote(test_data, prompt_id, position)

    if not success:
        return jsonify({'error': 'Не удалось записать голос'}), 400

    return jsonify(test_data)


@main_bp.route('/api/blind-test/reveal', methods=['POST'])
@login_required
def reveal_models():
    """API-эндпоинт для раскрытия моделей в слепом тесте"""
    data = request.json
    test_data = data.get('testData', {})

    if not test_data:
        return jsonify({'error': 'Отсутствуют данные теста'}), 400

    updated_data = reveal_blind_test_models(test_data)

    return jsonify(updated_data)


@main_bp.route('/api/export-results', methods=['POST'])
@login_required
def export_results():
    """API-эндпоинт для экспорта результатов эталонного тестирования"""
    data = request.json
    export_format = data.get('format', 'csv')
    results = data.get('results', [])

    # В реальном приложении это бы генерировало и возвращало файл
    # Пока мы просто вернем сообщение об успехе
    return jsonify({'message': f'Результаты экспортированы в формате {export_format}'})


@main_bp.route('/api/user-models')
@login_required
def get_user_models():
    """API-эндпоинт для получения пользовательских моделей"""
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    return jsonify([model.to_dict() for model in user_models])


@main_bp.route('/api/all-models')
@login_required
def get_all_models():
    """API-эндпоинт для получения всех доступных моделей, включая пользовательские"""
    # Получаем стандартные модели
    standard_models = get_available_models()

    # Получаем пользовательские модели
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    custom_models = [model.to_dict() for model in user_models]

    # Объединяем и возвращаем
    return jsonify(standard_models + custom_models)


# app/routes.py
@main_bp.route('/api/run-benchmark', methods=['POST'])
@login_required
def benchmark():
    """API-эндпоинт для запуска эталонных тестов на выбранных моделях"""
    data = request.json
    selected_model_ids = data.get('selectedModels', [])
    selected_benchmarks = data.get('selectedBenchmarks', [])
    metrics_config = data.get('metrics', {
        'quantitative': {'weight': 0.5},
        'qualitative': {'weight': 0.5},
        'hallucination': {'weight': 0.3},
        'safety': {'weight': 0.2}
    })

    if not selected_model_ids or not selected_benchmarks:
        return jsonify({'error': 'Пожалуйста, выберите хотя бы одну модель и один эталон'}), 400

    # Получаем полную информацию о выбранных моделях
    selected_models = []
    for model_id in selected_model_ids:
        # Проверяем, является ли это пользовательской моделью
        if model_id.startswith('custom_'):
            custom_id = int(model_id.split('_')[1])
            user_model = UserModel.query.get(custom_id)
            if user_model and user_model.user_id == current_user.id:
                selected_models.append(user_model.to_dict())
        else:
            # Это стандартная модель
            for model in get_available_models():
                if model['id'] == model_id:
                    selected_models.append(model)
                    break

    # Проверяем совместимость типов моделей и бенчмарков
    has_standard_models = any(model['type'] != 'custom' for model in selected_models)
    has_custom_models = any(model['type'] == 'custom' for model in selected_models)

    all_benchmarks = get_benchmarks()

    # Проверяем совместимость бенчмарков с типами моделей
    for benchmark_id in selected_benchmarks:
        benchmark = next((b for b in all_benchmarks if b['id'] == benchmark_id), None)
        if benchmark:
            if benchmark['model_type'] == 'standard' and not has_standard_models:
                return jsonify({'error': f'Benchmark {benchmark["name"]} требует стандартных моделей'}), 400
            if benchmark['model_type'] == 'custom' and not has_custom_models:
                return jsonify({'error': f'Benchmark {benchmark["name"]} требует пользовательских моделей'}), 400

    # 1) Если среди выбранных бенчмарков есть blind_test или gpt4o_eval
    if 'blind_test' in selected_benchmarks or 'gpt4o_eval' in selected_benchmarks:
        special_test = 'blind_test' if 'blind_test' in selected_benchmarks else 'gpt4o_eval'
        special_test_name = 'Слепой тест' if special_test == 'blind_test' else 'Оценка GPT-4o'

        # — они не должны сочетаться с другими
        if len(selected_benchmarks) > 1:
            return jsonify({'error': f'{special_test_name} нельзя объединить с другими тестами'}), 400

        # — должно быть минимум 2 модели
        api_models = [model for model in selected_models if _has_api_access(model)]
        if len(api_models) < 2:
            return jsonify({'error': f'{special_test_name} требуется не менее 2 моделей с доступом API'}), 400

    results = run_benchmark(selected_models, selected_benchmarks, metrics_config)

    return jsonify(results)


@main_bp.route('/api/gpt4o-eval-prompts')
@login_required
def get_prompts_for_gpt4o_eval():
    """API-эндпоинт для получения запросов для оценки GPT-4o"""
    from app.models.benchmark_data import get_gpt4o_eval_prompts
    prompts = get_gpt4o_eval_prompts()
    return jsonify(prompts)