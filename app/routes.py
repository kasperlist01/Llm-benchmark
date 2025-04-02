# app/routes.py
from flask import Blueprint, render_template, jsonify, request
from app.models.model_data import get_available_models
from app.models.benchmark_data import get_benchmarks
from app.services.benchmark_service import run_benchmark

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@main_bp.route('/api/models')
def get_models():
    """API endpoint to get all available models"""
    models = get_available_models()
    return jsonify(models)

@main_bp.route('/api/benchmarks')
def get_all_benchmarks():
    """API endpoint to get all benchmarks"""
    benchmarks = get_benchmarks()
    return jsonify(benchmarks)

@main_bp.route('/api/run-benchmark', methods=['POST'])
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

    # Run the benchmark with selected models and benchmarks
    results = run_benchmark(selected_models, selected_benchmarks, metrics_config)

    return jsonify(results)

@main_bp.route('/api/export-results', methods=['POST'])
def export_results():
    """API endpoint to export benchmark results"""
    data = request.json
    export_format = data.get('format', 'csv')
    results = data.get('results', [])

    # In a real application, this would generate and return a file
    # For now, we'll just return a success message
    return jsonify({'message': f'Results exported as {export_format}'})
