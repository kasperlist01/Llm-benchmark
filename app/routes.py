# app/routes.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks, get_blind_test_prompts
from app.services.benchmark_service import run_benchmark, record_blind_test_vote, reveal_blind_test_models

main_bp = Blueprint('main', __name__)


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
    selected_models = data.get('selectedModels', [])
    selected_benchmarks = data.get('selectedBenchmarks', [])
    metrics_config = data.get('metrics', {
        'quantitative': {'weight': 0.5},
        'qualitative': {'weight': 0.5},
        'hallucination': {'weight': 0.3},
        'safety': {'weight': 0.2}
    })

    if not selected_models or not selected_benchmarks:
        return jsonify({'error': 'Please select at least one model and one benchmark'}), 400

    # Check if blind test is selected
    if 'blind_test' in selected_benchmarks and len(selected_models) != 2:
        return jsonify({'error': 'Blind Test requires exactly 2 models to be selected'}), 400

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