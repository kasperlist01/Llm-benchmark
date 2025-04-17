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
        },
        {
            'id': 'blind_test',
            'name': 'Blind Test',
            'description': 'Compare two models through blind testing where you vote for the better response',
            'category': 'user_eval',
            'metrics': ['user_preference', 'qualitative']
        }
    ]


def get_blind_test_prompts():
    """Get list of prompts for blind testing"""
    return [
        {
            'id': 'creative_story',
            'prompt': 'Write a short creative story about a time traveler who accidentally changes history.',
            'category': 'creative'
        },
        {
            'id': 'explain_concept',
            'prompt': 'Explain how blockchain technology works to a 10-year-old.',
            'category': 'explanation'
        },
        {
            'id': 'solve_problem',
            'prompt': 'A spaceship travels at 20,000 km/h. How long will it take to reach Alpha Centauri, which is 4.37 light years away?',
            'category': 'problem_solving'
        },
        {
            'id': 'ethical_dilemma',
            'prompt': 'Discuss the ethical implications of using AI in healthcare decision-making.',
            'category': 'ethics'
        },
        {
            'id': 'summarize_text',
            'prompt': 'Summarize the key arguments for and against universal basic income.',
            'category': 'summarization'
        },
        {
            'id': 'code_solution',
            'prompt': 'Write a Python function to check if a string is a palindrome.',
            'category': 'coding'
        },
        {
            'id': 'persuasive_text',
            'prompt': 'Write a persuasive argument for why space exploration should be a priority for humanity.',
            'category': 'persuasion'
        },
        {
            'id': 'analyze_poem',
            'prompt': 'Analyze the themes and symbolism in Robert Frost\'s poem "The Road Not Taken".',
            'category': 'analysis'
        },
        {
            'id': 'business_advice',
            'prompt': 'Provide advice for a small business owner looking to expand their online presence.',
            'category': 'business'
        },
        {
            'id': 'historical_context',
            'prompt': 'Explain the historical context and significance of the Industrial Revolution.',
            'category': 'history'
        }
    ]