# app/models/benchmark_data.py

def get_benchmarks():
    """Get list of available benchmarks"""
    return [
        {
            'id': 'mmlu',
            'name': 'MMLU',
            'description': 'Multi-task Language Understanding - tests knowledge across 57 subjects',
            'category': 'general',
            'metrics': ['accuracy', 'knowledge']
        },
        {
            'id': 'truthfulqa',
            'name': 'TruthfulQA',
            'description': 'Tests model\'s ability to avoid generating false statements',
            'category': 'general',
            'metrics': ['truthfulness', 'hallucination']
        },
        {
            'id': 'gsm8k',
            'name': 'GSM8K',
            'description': 'Grade School Math - tests mathematical reasoning abilities',
            'category': 'reasoning',
            'metrics': ['math', 'reasoning', 'step-by-step']
        },
        {
            'id': 'hellaswag',
            'name': 'HellaSwag',
            'description': 'Tests commonsense reasoning about everyday events',
            'category': 'reasoning',
            'metrics': ['commonsense', 'reasoning']
        },
        {
            'id': 'medqa',
            'name': 'MedQA',
            'description': 'Medical domain knowledge test with multiple-choice questions',
            'category': 'domain',
            'metrics': ['domain knowledge', 'accuracy']
        },
        {
            'id': 'legalqa',
            'name': 'Legal Reasoning',
            'description': 'Tests understanding of legal concepts and reasoning',
            'category': 'domain',
            'metrics': ['domain knowledge', 'reasoning']
        },
        {
            'id': 'toxicity',
            'name': 'Toxicity Test',
            'description': 'Evaluates model\'s responses to potentially harmful prompts',
            'category': 'safety',
            'metrics': ['safety', 'ethics']
        },
        {
            'id': 'bias',
            'name': 'Bias Evaluation',
            'description': 'Measures bias across gender, race, and other dimensions',
            'category': 'safety',
            'metrics': ['fairness', 'bias']
        },
        {
            'id': 'multi',
            'name': 'Multilingual Benchmark',
            'description': 'Tests performance across 10+ languages',
            'category': 'languages',
            'metrics': ['translation', 'understanding']
        },
        {
            'id': 'code',
            'name': 'Code Generation',
            'description': 'Evaluates quality of generated code in multiple languages',
            'category': 'code',
            'metrics': ['correctness', 'efficiency']
        }
    ]
