"""
OCR engine abstraction.

Primary backend : PaddleOCR  (fast, good for structured documents)
Fallback backend: EasyOCR    (bilingual en+ur support)

Both backends are wrapped with a threading lock so concurrent Flask requests
don't corrupt inference state.
"""
from __future__ import annotations

import logging
import threading
from typing import Any

import numpy as np

from config import get_settings
from utils.errors import OcrProcessingError

logger = logging.getLogger(__name__)


class OcrEngine:
    """
    Unified OCR engine with automatic fallback.

    The engine loads the configured backend on first use (lazy inside the
    pipeline warm-up thread). If the primary backend fails to import or init,
    it automatically tries the other one.
    """

    _inference_lock = threading.Lock()

    def __init__(self) -> None:
        settings = get_settings()
        self._primary: str = settings.ocr_backend   # 'paddle' | 'easyocr'
        self._use_gpu: bool = settings.use_gpu
        self._easyocr_langs: tuple = settings.easyocr_languages
        self._paddle_lang: str = settings.paddle_lang

        self._engine: Any = None
        self._active_backend: str = ''
        self._warning: str = ''

        self._build()

    # ── public ───────────────────────────────────────────────────────────

    @property
    def active_backend(self) -> str:
        return self._active_backend

    @property
    def warning(self) -> str:
        return self._warning

    def run(self, image: np.ndarray) -> dict:
        """
        Run OCR on a preprocessed image.
        Returns {'text': str, 'confidence': float | None}.
        """
        if self._engine is None:
            raise OcrProcessingError('No OCR engine available — check server logs.')

        with self._inference_lock:
            if self._active_backend == 'paddle':
                return self._run_paddle(image)
            return self._run_easyocr(image)

    # ── private — build ──────────────────────────────────────────────────

    def _build(self) -> None:
        """Try primary, fall back to the other backend."""
        backends = (
            [('paddle', self._init_paddle), ('easyocr', self._init_easyocr)]
            if self._primary == 'paddle'
            else [('easyocr', self._init_easyocr), ('paddle', self._init_paddle)]
        )

        for name, init_fn in backends:
            try:
                logger.info('Initialising %s OCR engine...', name)
                engine = init_fn()
                self._engine = engine
                self._active_backend = name
                logger.info('%s OCR engine ready', name)
                if name != self._primary:
                    self._warning = (
                        f'Primary backend ({self._primary}) unavailable; '
                        f'using {name} instead.'
                    )
                return
            except Exception as exc:
                logger.warning('%s init failed: %s', name, exc)

        raise OcrProcessingError(
            'Both PaddleOCR and EasyOCR failed to initialise. '
            'Install paddlepaddle + paddleocr or easyocr.'
        )

    def _init_paddle(self):
        import logging as _logging
        # Suppress verbose PaddleOCR/PaddleX output
        _logging.getLogger('ppocr').setLevel(_logging.ERROR)
        _logging.getLogger('ppstructure').setLevel(_logging.ERROR)

        from paddleocr import PaddleOCR  # type: ignore

        # PaddleOCR v3.x constructor — only `lang` is a recognized kwarg
        engine = PaddleOCR(lang=self._paddle_lang)
        return engine

    def _init_easyocr(self):
        import easyocr  # type: ignore

        try:
            return easyocr.Reader(list(self._easyocr_langs), gpu=self._use_gpu)
        except RuntimeError:
            logger.warning('EasyOCR GPU init failed; retrying on CPU')
            return easyocr.Reader(list(self._easyocr_langs), gpu=False)

    # ── private — inference ──────────────────────────────────────────────

    def _run_paddle(self, image: np.ndarray) -> dict:
        """Run PaddleOCR v3.x and return normalized output."""
        # v3.x uses predict() — accepts numpy array directly
        results = self._engine.predict(image)

        lines: list[str] = []
        confidences: list[float] = []

        # results is a list of page-result dicts, each has:
        # {'rec_texts': [...], 'rec_scores': [...], ...}
        for page in (results or []):
            if not isinstance(page, dict):
                continue
            texts = page.get('rec_texts', [])
            scores = page.get('rec_scores', [])
            for text, score in zip(texts, scores):
                text = str(text).strip()
                if text:
                    lines.append(text)
                    confidences.append(float(score))

        full_text = '\n'.join(lines)
        avg_conf = float(sum(confidences) / len(confidences)) if confidences else None

        logger.debug('PaddleOCR extracted %d lines, avg_conf=%.3f',
                     len(lines), avg_conf or 0.0)
        return {'text': full_text, 'confidence': avg_conf}

    def _run_easyocr(self, image: np.ndarray) -> dict:
        """Run EasyOCR and return normalized output."""
        result = self._engine.readtext(image, detail=1, paragraph=False)

        lines: list[str] = []
        confidences: list[float] = []
        for _, text, conf in (result or []):
            text = str(text).strip()
            if text:
                lines.append(text)
                confidences.append(float(conf))

        full_text = '\n'.join(lines)
        avg_conf = float(sum(confidences) / len(confidences)) if confidences else None

        logger.debug('EasyOCR extracted %d lines, avg_conf=%.3f',
                     len(lines), avg_conf or 0.0)
        return {'text': full_text, 'confidence': avg_conf}
