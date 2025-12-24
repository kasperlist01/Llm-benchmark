from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

# DTO-модели для обмена данными между маршрутами и сервисами бенчмарков.


@dataclass
class BenchmarkInfo:
    """Краткое описание доступного бенчмарка, возвращается в /api/benchmarks."""
    id: str
    name: str
    description: str
    metrics: List[str]
    model_type: str
    requires_datasets: bool
    category: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BenchmarkInfo":
        """Создаёт DTO из словаря, полученного из app.models.benchmark_data.get_benchmarks()."""
        return cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            metrics=data.get("metrics", []),
            model_type=data.get("model_type", ""),
            requires_datasets=data.get("requires_datasets", False),
            category=data.get("category"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Преобразует объект в словарь для JSON-ответа.

        Ключи и структура соответствуют результату get_benchmarks():
        поле category включается только если оно явно задано, чтобы
        не изменять существующий JSON-контракт.
        """
        data: Dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "metrics": self.metrics,
            "model_type": self.model_type,
            "requires_datasets": self.requires_datasets,
        }
        if self.category is not None:
            data["category"] = self.category
        return data


@dataclass
class UserModelInfo:
    """
    Представление пользовательской модели для API /api/user-models и /api/all-models
    и для сервисов бенчмарков. Структура соответствует методу UserModel.to_dict().
    """
    id: str
    name: str
    provider: str
    type: str
    description: Optional[str]
    api_url: Optional[str]
    api_key: Optional[str]
    size: Optional[int]
    color: Optional[str]
    has_api: bool
    api_integration: Optional[Dict[str, Any]]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserModelInfo":
        """Создаёт DTO из словаря, обычно полученного из UserModel.to_dict()."""
        return cls(
            id=data["id"],
            name=data["name"],
            provider=data.get("provider", ""),
            type=data.get("type", ""),
            description=data.get("description"),
            api_url=data.get("api_url"),
            api_key=data.get("api_key"),
            size=data.get("size"),
            color=data.get("color"),
            has_api=data.get("has_api", False),
            api_integration=data.get("api_integration"),
        )

    @classmethod
    def from_model(cls, model: "UserModel") -> "UserModelInfo":
        """Создаёт DTO из ORM-модели UserModel, сохраняя JSON-формат, ожидаемый фронтендом."""
        data = model.to_dict()
        return cls.from_dict(data)

    def to_dict(self) -> Dict[str, Any]:
        """Преобразует модель в словарь для JSON-ответа и внутренних вычислений."""
        return asdict(self)

    def to_benchmark_dict(self) -> Dict[str, Any]:
        """Возвращает словарь в формате, совместимом с текущими алгоритмами бенчмарков."""
        return self.to_dict()


@dataclass
class UserDatasetInfo:
    """
    Описание пользовательского датасета для API /api/user-datasets
    и для загрузки промптов внутри сервисов бенчмарков.
    Структура соответствует методу UserDataset.to_dict().
    """
    id: str
    name: str
    description: Optional[str]
    filename: str
    file_size: Optional[int]
    row_count: Optional[int]
    column_count: Optional[int]
    columns_info: Optional[str]
    format_validated: bool
    prompt_column: Optional[str]
    reference_column: Optional[str]
    created_at: Optional[str]
    type: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserDatasetInfo":
        """Создаёт DTO из словаря, обычно полученного из UserDataset.to_dict()."""
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description"),
            filename=data.get("filename", ""),
            file_size=data.get("file_size"),
            row_count=data.get("row_count"),
            column_count=data.get("column_count"),
            columns_info=data.get("columns_info"),
            format_validated=data.get("format_validated", False),
            prompt_column=data.get("prompt_column"),
            reference_column=data.get("reference_column"),
            created_at=data.get("created_at"),
            type=data.get("type", "user_dataset"),
        )

    @classmethod
    def from_model(cls, model: "UserDataset") -> "UserDatasetInfo":
        """Создаёт DTO из ORM-модели UserDataset, сохраняя JSON-формат, ожидаемый фронтендом."""
        data = model.to_dict()
        return cls.from_dict(data)

    def to_dict(self) -> Dict[str, Any]:
        """Преобразует модель в словарь для JSON-ответа и внутренних вычислений."""
        return asdict(self)

    def to_benchmark_dict(self) -> Dict[str, Any]:
        """Возвращает словарь в формате, совместимом с текущими алгоритмами бенчмарков."""
        return self.to_dict()


@dataclass
class JudgeModelInfo:
    """Краткая информация о выбранной модели-судье для /api/judge-model."""
    id: str
    name: str

    def to_dict(self) -> Dict[str, Any]:
        """Преобразует модель-судью в словарь для JSON-ответа."""
        return asdict(self)


@dataclass
class SelectedModel:
    """Выбранная пользователем модель в запросе /api/run-benchmark (элемент selectedModels)."""
    id: str


@dataclass
class SelectedDataset:
    """Выбранный пользователем датасет в запросе /api/run-benchmark (элемент selectedDatasets)."""
    id: str


@dataclass
class RunBenchmarkRequest:
    """
    Структурированное представление JSON-запроса /api/run-benchmark.
    
    Поля соответствуют ключам исходного JSON (selectedModels, selectedBenchmarks,
    selectedDatasets, metrics), а также содержат обогащённые списки моделей и
    датасетов для использования в сервисном слое.
    """
    selected_models: List[SelectedModel]
    selected_benchmark_ids: List[str]
    selected_datasets: List[SelectedDataset]
    metrics_config: Dict[str, Any]
    judge_model_id: Optional[str] = None
    models: List[UserModelInfo] = field(default_factory=list)
    datasets: List[UserDatasetInfo] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RunBenchmarkRequest":
        """Создаёт объект запроса из исходного JSON без изменения схемы ключей."""
        selected_models = [SelectedModel(id=m) for m in data.get("selectedModels", [])]
        selected_benchmarks = data.get("selectedBenchmarks", [])
        selected_datasets = [SelectedDataset(id=d) for d in data.get("selectedDatasets", [])]
        metrics = data.get("metrics") or {
            "rouge": {"weight": 0.4},
            "semantic": {"weight": 0.3},
            "bertScore": {"weight": 0.3},
        }
        return cls(
            selected_models=selected_models,
            selected_benchmark_ids=selected_benchmarks,
            selected_datasets=selected_datasets,
            metrics_config=metrics,
        )

    @property
    def selected_model_ids(self) -> List[str]:
        """Удобное представление идентификаторов выбранных моделей."""
        return [m.id for m in self.selected_models]

    @property
    def selected_dataset_ids(self) -> List[str]:
        """Удобное представление идентификаторов выбранных датасетов."""
        return [d.id for d in self.selected_datasets]

    def to_dict(self) -> Dict[str, Any]:
        """Восстанавливает исходный JSON-запрос без изменения схемы ключей."""
        return {
            "selectedModels": self.selected_model_ids,
            "selectedBenchmarks": self.selected_benchmark_ids,
            "selectedDatasets": self.selected_dataset_ids,
            "metrics": self.metrics_config,
        }


@dataclass
class RunBenchmarkResult:
    """
    Результат выполнения бенчмарка.
    
    В поле payload хранится словарь ровно той структуры, которая ожидается фронтендом
    и ранее напрямую возвращалась из сервисного слоя.
    """
    payload: Dict[str, Any]

    @property
    def test_type(self) -> Optional[str]:
        """Возвращает тип проведённого теста (поле testType), если он задан."""
        return self.payload.get("testType")

    def to_dict(self) -> Dict[str, Any]:
        """Возвращает словарь результата без изменения структуры ключей."""
        return self.payload


@dataclass
class BlindTestVoteRequest:
    """Запрос голосования в слепом тесте для /api/blind-test/vote."""
    test_data: Dict[str, Any]
    prompt_id: Optional[str]
    position: Optional[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BlindTestVoteRequest":
        """Создаёт DTO из исходного JSON без изменения имён ключей."""
        return cls(
            test_data=data.get("testData") or {},
            prompt_id=data.get("promptId"),
            position=data.get("position"),
        )

    def is_valid(self) -> bool:
        """Проверяет наличие всех обязательных полей запроса голосования."""
        return bool(self.test_data and self.prompt_id and self.position)

    def to_dict(self) -> Dict[str, Any]:
        """Восстанавливает исходный JSON-запрос голосования."""
        return {
            "testData": self.test_data,
            "promptId": self.prompt_id,
            "position": self.position,
        }


@dataclass
class BlindTestRevealRequest:
    """Запрос раскрытия моделей в слепом тесте для /api/blind-test/reveal."""
    test_data: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BlindTestRevealRequest":
        """Создаёт DTO из исходного JSON без изменения имён ключей."""
        return cls(test_data=data.get("testData") or {})

    def to_dict(self) -> Dict[str, Any]:
        """Восстанавливает исходный JSON-запрос раскрытия моделей."""
        return {"testData": self.test_data}