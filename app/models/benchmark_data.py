def get_benchmarks():
    return [
        {
            'id': 'blind_test',
            'name': 'Слепой тест',
            'description': 'Сравните ответы от двух анонимных моделей и проголосуйте за ту, которую предпочитаете. Использует промпты из ваших датасетов.',
            'metrics': ['user_preference', 'qualitative'],
            'model_type': 'custom',
            'requires_datasets': True
        },
        {
            'id': 'judge_eval',
            'name': 'Оценка моделью-судьёй',
            'description': 'Автоматическое сравнение моделей с использованием выбранной модели в качестве беспристрастного судьи. Использует промпты из ваших датасетов.',
            'metrics': ['quality', 'accuracy', 'reasoning'],
            'model_type': 'custom',
            'requires_datasets': True
        },
        {
            'id': 'reference_comparison',
            'name': 'Сравнение с эталоном',
            'description': 'Сравните ответы моделей с эталонными ответами из ваших датасетов. Модель-судья оценивает близость к эталону.',
            'category': 'auto_eval',
            'metrics': ['accuracy', 'similarity', 'completeness'],
            'model_type': 'custom',
            'requires_datasets': True
        },
        {
            'id': 'metrics_comparison',
            'name': 'Сравнение по метрикам',
            'description': 'Автоматическая оценка ответов моделей с использованием количественных метрик: ROUGE, семантическое сходство и BERTScore. Сравнивает ответы с эталонными из датасетов.',
            'metrics': ['rouge', 'semantic_similarity', 'bert_score'],
            'model_type': 'custom',
            'requires_datasets': True
        }
    ]
