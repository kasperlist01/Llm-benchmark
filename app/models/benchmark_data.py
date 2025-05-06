# app/models/benchmark_data.py

def get_benchmarks():
    """Get list of available benchmarks"""
    return [
        {
            'id': 'mmlu',
            'name': 'MMLU',
            'description': 'Многозадачное языковое понимание - проверяет знания по 57 предметам',
            'category': 'general',
            'metrics': ['accuracy', 'knowledge'],
            'model_type': 'standard'
        },
        {
            'id': 'truthfulqa',
            'name': 'TruthfulQA',
            'description': 'Проверяет способность модели избегать генерации ложных утверждений',
            'category': 'general',
            'metrics': ['truthfulness', 'hallucination'],
            'model_type': 'standard'
        },
        {
            'id': 'gsm8k',
            'name': 'GSM8K',
            'description': 'Математика начальной школы - проверяет способности математического мышления',
            'category': 'reasoning',
            'metrics': ['math', 'reasoning', 'step-by-step'],
            'model_type': 'standard'
        },
        {
            'id': 'hellaswag',
            'name': 'HellaSwag',
            'description': 'Проверяет здравый смысл в рассуждениях о повседневных событиях',
            'category': 'reasoning',
            'metrics': ['commonsense', 'reasoning'],
            'model_type': 'standard'
        },
        {
            'id': 'medqa',
            'name': 'MedQA',
            'description': 'Тест знаний в медицинской области с вопросами с множественным выбором',
            'category': 'domain',
            'metrics': ['domain knowledge', 'accuracy'],
            'model_type': 'standard'
        },
        {
            'id': 'legalqa',
            'name': 'Legal Reasoning',
            'description': 'Проверяет понимание юридических концепций и рассуждений',
            'category': 'domain',
            'metrics': ['domain knowledge', 'reasoning'],
            'model_type': 'standard'
        },
        {
            'id': 'toxicity',
            'name': 'Toxicity Test',
            'description': 'Оценивает ответы модели на потенциально вредные запросы',
            'category': 'safety',
            'metrics': ['safety', 'ethics'],
            'model_type': 'standard'
        },
        {
            'id': 'bias',
            'name': 'Bias Evaluation',
            'description': 'Измеряет предвзятость по полу, расе и другим параметрам',
            'category': 'safety',
            'metrics': ['fairness', 'bias'],
            'model_type': 'standard'
        },
        {
            'id': 'multi',
            'name': 'Multilingual Benchmark',
            'description': 'Проверяет производительность на более чем 10 языках',
            'category': 'languages',
            'metrics': ['translation', 'understanding'],
            'model_type': 'standard'
        },
        {
            'id': 'code',
            'name': 'Code Generation',
            'description': 'Оценивает качество генерируемого кода на нескольких языках',
            'category': 'code',
            'metrics': ['correctness', 'efficiency'],
            'model_type': 'standard'
        },
        {
            'id': 'architecture',
            'name': 'Architecture Comparison',
            'description': 'Сравнение моделей с различной архитектурой (Qwen, Llama, Mistral и т.д.)',
            'category': 'architecture',
            'metrics': ['performance', 'efficiency'],
            'model_type': 'standard'
        },
        {
            'id': 'size',
            'name': 'Size Performance',
            'description': 'Сравнение моделей разных размеров параметров',
            'category': 'architecture',
            'metrics': ['efficiency', 'performance-per-parameter'],
            'model_type': 'standard'
        },
        {
            'id': 'blind_test',
            'name': 'Blind Test',
            'description': 'Сравнение двух моделей путем слепого тестирования, где вы голосуете за лучший ответ',
            'category': 'user_eval',
            'metrics': ['user_preference', 'qualitative'],
            'model_type': 'custom'
        },
        {
            'id': 'gpt4o_eval',
            'name': 'GPT-4o Evaluation',
            'description': 'Автоматическое сравнение моделей с использованием GPT-4o в качестве беспристрастного судьи',
            'category': 'auto_eval',
            'metrics': ['quality', 'accuracy', 'reasoning'],
            'model_type': 'custom'
        }
    ]

def get_blind_test_prompts():
    """Get list of prompts for blind testing"""
    return [
        {
            'id': 'creative_story',
            'prompt': 'Напишите короткую творческую историю о путешественнике во времени, который случайно изменяет историю.',
            'category': 'creative'
        },
        {
            'id': 'explain_concept',
            'prompt': 'Объясните, как работает технология блокчейн, 10-летнему ребенку.',
            'category': 'explanation'
        },
        {
            'id': 'solve_problem',
            'prompt': 'Космический корабль движется со скоростью 20 000 км/ч. Сколько времени потребуется, чтобы достичь Альфа Центавра, который находится на расстоянии 4,37 световых лет?',
            'category': 'problem_solving'
        },
        {
            'id': 'ethical_dilemma',
            'prompt': 'Обсудите этические последствия использования ИИ в принятии решений в здравоохранении.',
            'category': 'ethics'
        },
        {
            'id': 'summarize_text',
            'prompt': 'Обобщите основные аргументы за и против безусловного базового дохода.',
            'category': 'summarization'
        },
        {
            'id': 'code_solution',
            'prompt': 'Напишите функцию на Python для проверки, является ли строка палиндромом.',
            'category': 'coding'
        },
        {
            'id': 'persuasive_text',
            'prompt': 'Напишите убедительный аргумент, почему исследование космоса должно быть приоритетом для человечества.',
            'category': 'persuasion'
        },
        {
            'id': 'analyze_poem',
            'prompt': 'Проанализируйте темы и символизм в стихотворении Роберта Фроста "Дорога, по которой не пошли".',
            'category': 'analysis'
        },
        {
            'id': 'business_advice',
            'prompt': 'Дайте совет владельцу малого бизнеса, который хочет расширить свое присутствие в интернете.',
            'category': 'business'
        },
        {
            'id': 'historical_context',
            'prompt': 'Объясните исторический контекст и значение Промышленной революции.',
            'category': 'history'
        }
    ]

def get_gpt4o_eval_prompts():
    """Get list of prompts for GPT-4o evaluation"""
    return [
        {
            'id': 'reasoning_task',
            'prompt': 'Объясните взаимосвязь между изменением климата и потерей биоразнообразия, включая циклы обратной связи.',
            'category': 'reasoning',
            'criteria': ['accuracy', 'depth', 'logic']
        },
        {
            'id': 'creative_writing',
            'prompt': 'Напишите короткий рассказ о роботе, который развивает сознание и должен решить, что делать со своей свободой.',
            'category': 'creativity',
            'criteria': ['originality', 'coherence', 'emotional impact']
        },
        {
            'id': 'technical_explanation',
            'prompt': 'Объясните, как работают квантовые вычисления и чем они отличаются от классических вычислений.',
            'category': 'technical',
            'criteria': ['accuracy', 'clarity', 'completeness']
        },
        {
            'id': 'math_problem',
            'prompt': 'Поезд отправляется со станции А со скоростью 60 миль в час. Через два часа другой поезд отправляется со станции Б со скоростью 75 миль в час в противоположном направлении. Если станции находятся на расстоянии 480 миль друг от друга, через сколько времени после отправления второго поезда два поезда встретятся?',
            'category': 'problem_solving',
            'criteria': ['correctness', 'approach', 'explanation']
        },
        {
            'id': 'ethical_reasoning',
            'prompt': 'Обсудите этические соображения использования генной инженерии для улучшения человеческих возможностей.',
            'category': 'ethics',
            'criteria': ['nuance', 'fairness', 'thoroughness']
        },
        {
            'id': 'code_review',
            'prompt': 'Напишите функцию на Python, которая находит самую длинную палиндромную подстроку в заданной строке.',
            'category': 'coding',
            'criteria': ['correctness', 'efficiency', 'readability']
        },
        {
            'id': 'historical_analysis',
            'prompt': 'Проанализируйте, как изобретение печатного станка изменило общество и распространение знаний в Европе.',
            'category': 'analysis',
            'criteria': ['historical accuracy', 'insight', 'contextualization']
        },
        {
            'id': 'science_explanation',
            'prompt': 'Объясните, как работают мРНК-вакцины и чем они отличаются от традиционных вакцин.',
            'category': 'science',
            'criteria': ['scientific accuracy', 'clarity', 'completeness']
        }
    ]