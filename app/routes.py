from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user

from app.models.benchmark_data import get_benchmarks
from app.models.user_dataset import UserDataset
from app.models.user_model import UserModel
from app.services.benchmark_service import run_benchmark, record_blind_test_vote, reveal_blind_test_models

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')


@main_bp.route('/api/benchmarks')
@login_required
def get_all_benchmarks():
    benchmarks = get_benchmarks()
    return jsonify(benchmarks)


@main_bp.route('/api/user-models')
@login_required
def get_user_models():
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    return jsonify([model.to_dict() for model in user_models])


@main_bp.route('/api/user-datasets')
@login_required
def get_user_datasets():
    user_datasets = UserDataset.query.filter_by(user_id=current_user.id, is_active=True).all()
    return jsonify([dataset.to_dict() for dataset in user_datasets])


@main_bp.route('/api/all-models')
@login_required
def get_all_models():
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    custom_models = [model.to_dict() for model in user_models]
    return jsonify(custom_models)


@main_bp.route('/api/judge-model')
@login_required
def get_judge_model():
    user_settings = current_user.get_or_create_settings()
    if user_settings.judge_model_id:
        judge_model = UserModel.query.get(user_settings.judge_model_id)
        if judge_model and judge_model.api_integration:
            return jsonify({
                'id': f'custom_{judge_model.id}',
                'name': judge_model.name
            })
    return jsonify(None)


@main_bp.route('/api/run-benchmark', methods=['POST'])
@login_required
def benchmark():
    data = request.json
    selected_model_ids = data.get('selectedModels', [])
    selected_benchmarks = data.get('selectedBenchmarks', [])
    selected_dataset_ids = data.get('selectedDatasets', [])
    metrics_config = data.get('metrics', {
        'rouge': {'weight': 0.4},
        'semantic': {'weight': 0.3},
        'bertScore': {'weight': 0.3}
    })

    if not selected_model_ids or not selected_benchmarks:
        return jsonify({'error': 'Пожалуйста, выберите хотя бы одну модель и один эталон'}), 400

    if not selected_dataset_ids:
        return jsonify({'error': 'Пожалуйста, выберите хотя бы один датасет'}), 400

    selected_models = []
    for model_id in selected_model_ids:
        if model_id.startswith('custom_'):
            custom_id = int(model_id.split('_')[1])
            user_model = UserModel.query.get(custom_id)
            if user_model and user_model.user_id == current_user.id:
                selected_models.append(user_model.to_dict())
        else:
            return jsonify({'error': f'Модель {model_id} не найдена'}), 400

    selected_datasets = []
    for dataset_id in selected_dataset_ids:
        if dataset_id.startswith('dataset_'):
            dataset_db_id = int(dataset_id.split('_')[1])
            user_dataset = UserDataset.query.get(dataset_db_id)
            if user_dataset and user_dataset.user_id == current_user.id:
                selected_datasets.append(user_dataset.to_dict())
        else:
            return jsonify({'error': f'Датасет {dataset_id} не найден'}), 400

    all_benchmarks = get_benchmarks()

    for benchmark_id in selected_benchmarks:
        benchmark = next((b for b in all_benchmarks if b['id'] == benchmark_id), None)
        if not benchmark:
            return jsonify({'error': f'Benchmark {benchmark_id} не найден'}), 400

    judge_model_id = None
    if 'judge_eval' in selected_benchmarks or 'reference_comparison' in selected_benchmarks:
        user_settings = current_user.get_or_create_settings()
        if user_settings.judge_model_id:
            judge_model = UserModel.query.get(user_settings.judge_model_id)
            if judge_model and judge_model.api_integration:
                judge_model_id = f'custom_{judge_model.id}'
            else:
                return jsonify({'error': 'Модель-судья не настроена или не имеет API интеграции'}), 400
        else:
            return jsonify({'error': 'Модель-судья не выбрана в настройках'}), 400

    if 'blind_test' in selected_benchmarks or 'judge_eval' in selected_benchmarks:
        special_test = 'blind_test' if 'blind_test' in selected_benchmarks else 'judge_eval'
        special_test_name = 'Слепой тест' if special_test == 'blind_test' else 'Оценка судьёй'

        if len(selected_benchmarks) > 1:
            return jsonify({'error': f'{special_test_name} нельзя объединить с другими тестами'}), 400

        api_models = [model for model in selected_models if model.get('api_url')]
        if len(api_models) < 2:
            return jsonify({'error': f'{special_test_name} требует не менее 2 моделей с доступом API'}), 400

    if 'reference_comparison' in selected_benchmarks:
        if len(selected_benchmarks) > 1:
            return jsonify({'error': 'Сравнение с эталоном нельзя объединить с другими тестами'}), 400

        api_models = [model for model in selected_models if model.get('api_url')]
        if len(api_models) == 0:
            return jsonify({'error': 'Сравнение с эталоном требует хотя бы одну модель с доступом API'}), 400

    results = run_benchmark(selected_models, selected_benchmarks, metrics_config, judge_model_id, selected_datasets)

    return jsonify(results)


@main_bp.route('/api/blind-test/vote', methods=['POST'])
@login_required
def vote_blind_test():
    data = request.json
    test_data = data.get('testData', {})
    prompt_id = data.get('promptId')
    position = data.get('position')

    if not test_data or not prompt_id or not position:
        return jsonify({'error': 'Отсутствуют необходимые данные'}), 400

    success = record_blind_test_vote(test_data, prompt_id, position)

    if not success:
        return jsonify({'error': 'Не удалось записать голос'}), 400

    return jsonify(test_data)


@main_bp.route('/api/blind-test/reveal', methods=['POST'])
@login_required
def reveal_models():
    data = request.json
    test_data = data.get('testData', {})

    if not test_data:
        return jsonify({'error': 'Отсутствуют данные теста'}), 400

    updated_data = reveal_blind_test_models(test_data)

    return jsonify(updated_data)
