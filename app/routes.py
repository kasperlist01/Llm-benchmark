from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user

from app.models.benchmark_data import get_benchmarks
from app.models.user_dataset import UserDataset
from app.models.user_model import UserModel
from app.schemas.benchmark_dto import (
    BenchmarkInfo,
    UserModelInfo,
    UserDatasetInfo,
    JudgeModelInfo,
    RunBenchmarkRequest,
    RunBenchmarkResult,
    BlindTestVoteRequest,
    BlindTestRevealRequest,
)
from app.services.benchmark_service import run_benchmark, record_blind_test_vote, reveal_blind_test_models

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')


@main_bp.route('/api/benchmarks')
@login_required
def get_all_benchmarks():
    """Возвращает список доступных бенчмарков для фронтенда."""
    raw_benchmarks = get_benchmarks()
    benchmarks = [BenchmarkInfo.from_dict(b) for b in raw_benchmarks]
    return jsonify([b.to_dict() for b in benchmarks])


@main_bp.route('/api/user-models')
@login_required
def get_user_models():
    """Возвращает активные пользовательские модели текущего пользователя."""
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    models = [UserModelInfo.from_model(model) for model in user_models]
    return jsonify([m.to_dict() for m in models])


@main_bp.route('/api/user-datasets')
@login_required
def get_user_datasets():
    """Возвращает активные датасеты текущего пользователя."""
    user_datasets = UserDataset.query.filter_by(user_id=current_user.id, is_active=True).all()
    datasets = [UserDatasetInfo.from_model(dataset) for dataset in user_datasets]
    return jsonify([d.to_dict() for d in datasets])


@main_bp.route('/api/all-models')
@login_required
def get_all_models():
    """Возвращает все модели, доступные пользователю (на данный момент только пользовательские)."""
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    models = [UserModelInfo.from_model(model) for model in user_models]
    return jsonify([m.to_dict() for m in models])


@main_bp.route('/api/judge-model')
@login_required
def get_judge_model():
    """Возвращает выбранную пользователем модель-судью или None, если она не настроена."""
    user_settings = current_user.get_or_create_settings()
    if user_settings.judge_model_id:
        judge_model = UserModel.query.get(user_settings.judge_model_id)
        if judge_model and judge_model.api_integration:
            judge_info = JudgeModelInfo(
                id=f'custom_{judge_model.id}',
                name=judge_model.name,
            )
            return jsonify(judge_info.to_dict())
    return jsonify(None)


@main_bp.route('/api/run-benchmark', methods=['POST'])
@login_required
def benchmark():
    """Запускает выбранные бенчмарки над пользовательскими моделями и датасетами."""
    data = request.json or {}
    request_dto = RunBenchmarkRequest.from_dict(data)

    if not request_dto.selected_model_ids or not request_dto.selected_benchmark_ids:
        return jsonify({'error': 'Пожалуйста, выберите хотя бы одну модель и один эталон'}), 400

    if not request_dto.selected_dataset_ids:
        return jsonify({'error': 'Пожалуйста, выберите хотя бы один датасет'}), 400

    selected_models = []
    for model_id in request_dto.selected_model_ids:
        if model_id.startswith('custom_'):
            custom_id = int(model_id.split('_')[1])
            user_model = UserModel.query.get(custom_id)
            if user_model and user_model.user_id == current_user.id:
                selected_models.append(UserModelInfo.from_model(user_model))
        else:
            return jsonify({'error': f'Модель {model_id} не найдена'}), 400

    selected_datasets = []
    for dataset_id in request_dto.selected_dataset_ids:
        if dataset_id.startswith('dataset_'):
            dataset_db_id = int(dataset_id.split('_')[1])
            user_dataset = UserDataset.query.get(dataset_db_id)
            if user_dataset and user_dataset.user_id == current_user.id:
                selected_datasets.append(UserDatasetInfo.from_model(user_dataset))
        else:
            return jsonify({'error': f'Датасет {dataset_id} не найден'}), 400

    raw_benchmarks = get_benchmarks()
    benchmarks = [BenchmarkInfo.from_dict(b) for b in raw_benchmarks]

    for benchmark_id in request_dto.selected_benchmark_ids:
        benchmark_obj = next((b for b in benchmarks if b.id == benchmark_id), None)
        if not benchmark_obj:
            return jsonify({'error': f'Benchmark {benchmark_id} не найден'}), 400

    judge_model_id = None
    selected_benchmarks = request_dto.selected_benchmark_ids

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

        api_models = [model for model in selected_models if model.api_url]
        if len(api_models) < 2:
            return jsonify({'error': f'{special_test_name} требует не менее 2 моделей с доступом API'}), 400

    if 'reference_comparison' in selected_benchmarks:
        if len(selected_benchmarks) > 1:
            return jsonify({'error': 'Сравнение с эталоном нельзя объединить с другими тестами'}), 400

        api_models = [model for model in selected_models if model.api_url]
        if len(api_models) == 0:
            return jsonify({'error': 'Сравнение с эталоном требует хотя бы одну модель с доступом API'}), 400

    request_dto.judge_model_id = judge_model_id
    request_dto.models = selected_models
    request_dto.datasets = selected_datasets

    result = run_benchmark(request_dto)

    if isinstance(result, RunBenchmarkResult):
        return jsonify(result.to_dict())

    return jsonify(result)


@main_bp.route('/api/blind-test/vote', methods=['POST'])
@login_required
def vote_blind_test():
    """Обрабатывает голос пользователя в слепом тесте."""
    data = request.json or {}
    vote_request = BlindTestVoteRequest.from_dict(data)

    if not vote_request.is_valid():
        return jsonify({'error': 'Отсутствуют необходимые данные'}), 400

    success = record_blind_test_vote(
        vote_request.test_data,
        vote_request.prompt_id,
        vote_request.position,
    )

    if not success:
        return jsonify({'error': 'Не удалось записать голос'}), 400

    return jsonify(vote_request.test_data)


@main_bp.route('/api/blind-test/reveal', methods=['POST'])
@login_required
def reveal_models():
    """Раскрывает, какие модели стояли за ответами в слепом тесте."""
    data = request.json or {}
    reveal_request = BlindTestRevealRequest.from_dict(data)

    if not reveal_request.test_data:
        return jsonify({'error': 'Отсутствуют данные теста'}), 400

    updated_data = reveal_blind_test_models(reveal_request.test_data)

    return jsonify(updated_data)
