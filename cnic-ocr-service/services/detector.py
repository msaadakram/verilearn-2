"""
CNIC detector using YOLOv8.

If a custom-trained CNIC model is found at the configured path, it is used.
Otherwise, falls back to `yolov8n.pt` (general object detection) and treats
the full image as the CNIC region — still enabling preprocessing + PaddleOCR.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from config import get_settings
from utils.errors import NoCnicDetectedError

logger = logging.getLogger(__name__)

_FALLBACK_MODEL = 'yolov8n.pt'  # downloaded automatically by ultralytics


class CnicDetector:
    """YOLOv8-based CNIC card detector with auto-download fallback."""

    def __init__(self) -> None:
        settings = get_settings()
        self._enabled: bool = settings.cnic_detection_enabled
        self._required: bool = settings.cnic_detection_required
        self._conf: float = settings.yolo_conf_threshold
        self._model_path: str = settings.yolo_model_path
        self._model = None
        self._using_fallback = False
        self._status: str = 'disabled'

        if self._enabled:
            self._load_model()

    # ── public ────────────────────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        return not self._enabled or self._model is not None

    @property
    def status(self) -> str:
        return self._status

    def detect_and_crop(self, image: np.ndarray) -> np.ndarray:
        """
        Run YOLO detection. Returns the cropped CNIC region.
        Falls back to the full image when:
          • detection is disabled
          • no box passes the confidence threshold
          • cnic_detection_required is False (graceful degradation)
        """
        if not self._enabled or self._model is None:
            return image

        try:
            results = self._model.predict(
                source=image,
                conf=self._conf,
                max_det=5,
                verbose=False,
            )

            boxes = results[0].boxes if results else None
            if not boxes or len(boxes) == 0:
                return self._handle_no_detection(image, 'No boxes detected by YOLO')

            # Pick highest-confidence box
            confs = boxes.conf.cpu().numpy()
            best_idx = int(confs.argmax())
            x1, y1, x2, y2 = boxes.xyxy[best_idx].cpu().numpy().astype(int)

            # Clamp to image bounds
            h, w = image.shape[:2]
            pad_x = max(1, int((x2 - x1) * 0.04))
            pad_y = max(1, int((y2 - y1) * 0.06))
            x1 = max(0, x1 - pad_x)
            y1 = max(0, y1 - pad_y)
            x2 = min(w, x2 + pad_x)
            y2 = min(h, y2 + pad_y)

            cropped = image[y1:y2, x1:x2]
            if cropped.size == 0:
                return self._handle_no_detection(image, 'Empty crop after YOLO detection')

            # CRITICAL: Numpy slicing creates non-contiguous memory views.
            # Passing a non-contiguous array to C++ backends (like PaddleOCR/OpenCV)
            # causes them to crash with `std::exception` or segfault.
            cropped = np.ascontiguousarray(cropped)

            conf_pct = float(confs[best_idx]) * 100
            logger.info('YOLO detected CNIC card (conf=%.1f%%), crop: [%d,%d,%d,%d]',
                        conf_pct, x1, y1, x2, y2)
            return cropped

        except Exception as exc:  # pragma: no cover
            logger.warning('YOLO inference error: %s', exc)
            return self._handle_no_detection(image, str(exc))

    # ── private ───────────────────────────────────────────────────────────

    def _load_model(self) -> None:
        try:
            from ultralytics import YOLO  # type: ignore

            custom_path = Path(self._model_path)
            if custom_path.exists():
                logger.info('Loading custom CNIC YOLO model from %s', custom_path)
                self._model = YOLO(str(custom_path))
                self._status = f'custom model ({custom_path.name})'
                self._using_fallback = False
            else:
                logger.warning(
                    'Custom CNIC model not found at %s — using %s (general detector). '
                    'For best accuracy, provide a CNIC-trained YOLOv8 model.',
                    self._model_path,
                    _FALLBACK_MODEL,
                )
                # ultralytics auto-downloads yolov8n.pt to ~/.cache/ultralytics
                self._model = YOLO(_FALLBACK_MODEL)
                self._status = f'fallback ({_FALLBACK_MODEL})'
                self._using_fallback = True

            logger.info('YOLO model ready: %s', self._status)

        except ImportError:
            logger.error('ultralytics is not installed — CNIC detection disabled')
            self._enabled = False
            self._status = 'ultralytics not installed'
        except Exception as exc:
            logger.error('Failed to load YOLO model: %s', exc)
            self._enabled = False
            self._status = f'load error: {exc}'

    def _handle_no_detection(self, image: np.ndarray, reason: str) -> np.ndarray:
        if self._required:
            raise NoCnicDetectedError(f'CNIC card not detected: {reason}')
        logger.info('Falling back to full image — %s', reason)
        return image
