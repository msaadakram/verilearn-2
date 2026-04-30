import os
from dataclasses import dataclass
from functools import lru_cache


def _to_bool(raw_value: str | None, default: bool) -> bool:
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {'1', 'true', 'yes', 'on'}


def _to_int(raw_value: str | None, default: int) -> int:
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return default


def _to_float(raw_value: str | None, default: float) -> float:
    if raw_value is None:
        return default

    try:
        return float(raw_value)
    except (TypeError, ValueError):
        return default


def _to_language_tuple(raw_value: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if raw_value is None:
        return default

    languages = tuple(part.strip() for part in raw_value.split(',') if part.strip())
    return languages if languages else default


def _normalize_backend(raw_value: str | None) -> str:
    backend = (raw_value or 'easyocr').strip().lower()
    if backend in {'easyocr', 'paddle'}:
        return backend
    return 'easyocr'


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    yolo_model_path: str
    yolo_conf_threshold: float
    cnic_detection_enabled: bool
    cnic_detection_required: bool
    ocr_backend: str
    paddle_lang: str
    easyocr_languages: tuple[str, ...]
    use_gpu: bool
    max_upload_size_bytes: int
    allowed_mime_types: tuple[str, ...]
    warmup_on_start: bool


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        host=os.getenv('CNIC_OCR_HOST', '0.0.0.0'),
        port=_to_int(os.getenv('CNIC_OCR_PORT'), 8001),
        yolo_model_path=os.getenv('YOLO_MODEL_PATH', 'models/cnic_yolov8.pt'),
        yolo_conf_threshold=_to_float(os.getenv('YOLO_CONF_THRESHOLD'), 0.25),
        # YOLOv8 detection ENABLED — crops the CNIC card before OCR
        cnic_detection_enabled=_to_bool(os.getenv('CNIC_DETECTION_ENABLED'), True),
        # Not required — falls back to full image if no card detected
        cnic_detection_required=_to_bool(os.getenv('CNIC_DETECTION_REQUIRED'), False),
        # PaddleOCR as primary backend (faster, better for structured docs)
        ocr_backend=_normalize_backend(os.getenv('OCR_BACKEND', 'paddle')),
        paddle_lang=os.getenv('PADDLE_OCR_LANG', 'en'),
        easyocr_languages=_to_language_tuple(os.getenv('EASYOCR_LANGUAGES'), ('en', 'ur')),
        use_gpu=_to_bool(os.getenv('OCR_USE_GPU'), False),
        max_upload_size_bytes=_to_int(os.getenv('MAX_UPLOAD_SIZE_BYTES'), 8 * 1024 * 1024),
        allowed_mime_types=(
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/bmp',
            'image/tiff',
        ),
        warmup_on_start=_to_bool(os.getenv('OCR_WARMUP_ON_START'), True),
    )

