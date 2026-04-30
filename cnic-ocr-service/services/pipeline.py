from __future__ import annotations

import numpy as np

from config import Settings
from services.detector import CnicDetector
from services.extractor import extract_fields
from services.ocr_engine import OcrEngine
from services.preprocessing import preprocess_for_ocr


class CnicOcrPipeline:
    """Coordinates detector, preprocessing, OCR engine, and field extraction."""

    def __init__(self, settings: Settings):
        self._settings = settings
        # Both constructors read from get_settings() internally
        self._detector = CnicDetector()
        self._ocr_engine = OcrEngine()

    @property
    def detector_ready(self) -> bool:
        return self._detector.is_ready

    @property
    def detector_status(self) -> str:
        return self._detector.status

    @property
    def ocr_backend(self) -> str:
        return self._ocr_engine.active_backend

    @property
    def ocr_warning(self) -> str | None:
        return self._ocr_engine.warning

    def process(self, image: np.ndarray) -> dict[str, str | float | None]:
        cnic_region = self._detector.detect_and_crop(image)

        # PaddleOCR has its own prep (deskew, doc unwarping) which requires 3 channels.
        # Our custom preprocessing outputs 2D grayscale, which crashes PaddleOCR.
        # Only use our preprocessing for EasyOCR.
        if self.ocr_backend == 'paddle':
            ocr_input = cnic_region
        else:
            ocr_input = preprocess_for_ocr(cnic_region)

        ocr_payload = self._ocr_engine.run(ocr_input)
        text = str(ocr_payload.get('text', ''))
        fields = extract_fields(text)

        payload: dict[str, str | float | None] = {
            'cnic': fields['cnic'],
            'dob': fields['dob'],
            'text': text,
            'confidence': None,
            'ocr_backend': self.ocr_backend,
        }

        confidence = ocr_payload.get('confidence')
        if confidence is not None:
            payload['confidence'] = float(confidence)

        return payload
