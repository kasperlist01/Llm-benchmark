from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks, get_blind_test_prompts
from app.models.user_model import UserModel
from app.services.benchmark_service import run_benchmark, record_blind_test_vote, reveal_blind_test_models
from functools import partial

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
    """Render the main application page"""
    return render_template('index.html')


@main_bp.route('/api/models')
@login_required
def get_models():
    """API endpoint to get all available models"""
    models = get_available_models()
    return jsonify(models)


@main_bp.route('/api/benchmarks')
@login_required
def get_all_benchmarks():
    """API endpoint to get all benchmarks"""
    benchmarks = get_benchmarks()
    return jsonify(benchmarks)


@main_bp.route('/api/blind-test-prompts')
@login_required
def get_prompts_for_blind_test():
    """API endpoint to get prompts for blind testing"""
    prompts = get_blind_test_prompts()
    return jsonify(prompts)


@main_bp.route('/api/run-benchmark', methods=['POST'])
@login_required
def benchmark():
    """API endpoint to run benchmarks on selected models"""
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
        return jsonify({'error': 'Please select at least one model and one benchmark'}), 400

    # Get full model details for selected models
    selected_models = []
    for model_id in selected_model_ids:
        # Check if it's a custom model
        if model_id.startswith('custom_'):
            custom_id = int(model_id.split('_')[1])
            user_model = UserModel.query.get(custom_id)
            if user_model and user_model.user_id == current_user.id:
                selected_models.append(user_model.to_dict())
        else:
            # It's a standard model
            for model in get_available_models():
                if model['id'] == model_id:
                    selected_models.append(model)
                    break

    # 1) Если среди выбранных бенчмарков есть blind_test …
    if 'blind_test' in selected_benchmarks:
        # — он не должен сочетаться с другими
        if len(selected_benchmarks) > 1:
            return jsonify({'error': 'Blind Test cannot be combined with other benchmarks'}), 400

        # — должно быть ровно 2 модели
        if len(selected_models) != 2:
            return jsonify({'error': 'Blind Test requires exactly 2 models'}), 400

        # — и обе с API‑доступом
        if not all(map(_has_api_access, selected_models)):
            return jsonify({'error': 'Both models must provide an API endpoint for Blind Test'}), 400

    # Run the benchmark with selected models and benchmarks
    results = run_benchmark(selected_models, selected_benchmarks, metrics_config)

    return jsonify(results)


@main_bp.route('/api/blind-test/vote', methods=['POST'])
@login_required
def vote_blind_test():
    """API endpoint to record a vote in the blind test"""
    data = request.json
    test_data = data.get('testData', {})
    prompt_id = data.get('promptId')
    position = data.get('position')  # 'A' or 'B'

    if not test_data or not prompt_id or not position:
        return jsonify({'error': 'Missing required data'}), 400

    success = record_blind_test_vote(test_data, prompt_id, position)

    if not success:
        return jsonify({'error': 'Failed to record vote'}), 400

    return jsonify(test_data)


@main_bp.route('/api/blind-test/reveal', methods=['POST'])
@login_required
def reveal_models():
    """API endpoint to reveal models in the blind test"""
    data = request.json
    test_data = data.get('testData', {})

    if not test_data:
        return jsonify({'error': 'Missing test data'}), 400

    updated_data = reveal_blind_test_models(test_data)

    return jsonify(updated_data)


@main_bp.route('/api/export-results', methods=['POST'])
@login_required
def export_results():
    """API endpoint to export benchmark results"""
    data = request.json
    export_format = data.get('format', 'csv')
    results = data.get('results', [])

    # In a real application, this would generate and return a file
    # For now, we'll just return a success message
    return jsonify({'message': f'Results exported as {export_format}'})


@main_bp.route('/api/user-models')
@login_required
def get_user_models():
    """API endpoint to get user's custom models"""
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    return jsonify([model.to_dict() for model in user_models])


@main_bp.route('/api/all-models')
@login_required
def get_all_models():
    """API endpoint to get all available models including user's custom models"""
    # Get standard models
    standard_models = get_available_models()

    # Get user's custom models
    user_models = UserModel.query.filter_by(user_id=current_user.id, is_active=True).all()
    custom_models = [model.to_dict() for model in user_models]

    # Combine and return
    return jsonify(standard_models + custom_models)