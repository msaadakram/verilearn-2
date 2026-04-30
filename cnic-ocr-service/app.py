from __future__ import annotations

import gc
import signal
import sys
from threading import Lock, Thread
from typing import Any

import cv2
import numpy as np
from flask import Flask, jsonify, request

from config import get_settings
from services.pipeline import CnicOcrPipeline
from utils.errors import InvalidImageError, ServiceError

settings = get_settings()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = settings.max_upload_size_bytes

_pipeline: CnicOcrPipeline | None = None
_pipeline_init_error: str | None = None
_pipeline_init_started = False
_pipeline_init_lock = Lock()

# ── Graceful shutdown ─────────────────────────────────────────────────────────

def _graceful_shutdown(signum, frame):
    """
    Handle SIGTERM / SIGINT at the Python level before the C++ PaddleOCR
    runtime receives it. Without this handler, PaddleOCR's C++ layer intercepts
    the signal and emits a fatal 'Termination signal detected' crash message.
    """
    print(f'\n[OCR Service] Received signal {signum}. Shutting down gracefully…')
    sys.exit(0)

signal.signal(signal.SIGTERM, _graceful_shutdown)
signal.signal(signal.SIGINT, _graceful_shutdown)

# ── Pipeline lifecycle ────────────────────────────────────────────────────────

def _initialize_pipeline() -> None:
    """Initialize OCR pipeline once in a background-safe way."""
    global _pipeline, _pipeline_init_error, _pipeline_init_started

    try:
        pipeline = CnicOcrPipeline(settings)
        with _pipeline_init_lock:
            _pipeline = pipeline
            _pipeline_init_error = None
            # Only clear the started flag on success so health checks
            # report `ocr_initializing: false` once the model is ready.
            _pipeline_init_started = False
    except Exception as error:
        with _pipeline_init_lock:
            _pipeline_init_error = str(error)
            _pipeline_init_started = False
        print(f'Warning: OCR pipeline initialization issue: {error}')


def _get_pipeline_or_raise() -> CnicOcrPipeline:
    """Return initialized OCR pipeline or raise a retryable service error."""
    with _pipeline_init_lock:
        pipeline = _pipeline
        init_error = _pipeline_init_error
        init_started = _pipeline_init_started

    if pipeline is not None:
        return pipeline

    if init_error:
        raise ServiceError(f'OCR service failed to initialize: {init_error}', status_code=503)

    if not init_started:
        Thread(target=_initialize_pipeline, daemon=True).start()

    raise ServiceError('OCR model is initializing. Please retry in a few moments.', status_code=503)


def _start_pipeline_warmup() -> None:
    global _pipeline_init_started
    with _pipeline_init_lock:
        if _pipeline is not None or _pipeline_init_started:
            return
        _pipeline_init_started = True

    Thread(target=_initialize_pipeline, daemon=True).start()


def _stop_pipeline() -> dict[str, Any]:
    """Release loaded OCR pipeline resources and reset initialization state."""
    global _pipeline, _pipeline_init_error, _pipeline_init_started

    with _pipeline_init_lock:
        had_pipeline = _pipeline is not None
        _pipeline = None
        _pipeline_init_error = None
        _pipeline_init_started = False

    if had_pipeline:
        gc.collect()

    return {
        'status': 'ok',
        'service': 'cnic-ocr-service',
        'message': 'OCR pipeline stopped successfully.' if had_pipeline else 'OCR pipeline was not running.',
        'ocr_ready': False,
        'ocr_initializing': False,
    }


def _decode_image(file_bytes: bytes) -> np.ndarray:
    """Decode image bytes to OpenCV format."""
    if not file_bytes:
        raise InvalidImageError('Uploaded file is empty.')

    image_np = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    if image is None:
        raise InvalidImageError('Unable to decode image bytes.')

    return image


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get('/health')
def health() -> Any:
    """Health check endpoint."""
    with _pipeline_init_lock:
        pipeline = _pipeline
        ocr_initializing = _pipeline_init_started
        ocr_init_error = _pipeline_init_error

    payload: dict[str, Any] = {
        'status': 'ok',
        'service': 'cnic-ocr-service',
        'ocr_ready': pipeline is not None,
        'ocr_initializing': ocr_initializing,
    }

    if pipeline is not None:
        payload['ocr_backend'] = pipeline.ocr_backend
        payload['detector_ready'] = pipeline.detector_ready
        payload['detector_status'] = pipeline.detector_status

        if pipeline.ocr_warning:
            payload['ocr_warning'] = pipeline.ocr_warning

    if ocr_init_error:
        payload['ocr_init_error'] = ocr_init_error

    return jsonify(payload), 200


@app.post('/ocr')
def ocr() -> Any:
    """Extract CNIC and text from image."""
    try:
        pipeline = _get_pipeline_or_raise()

        file = request.files.get('image')

        if file is None:
            return jsonify({'message': 'Image file is required as form-data key "image".'}), 400

        if not file.filename:
            return jsonify({'message': 'Image filename is missing.'}), 400

        if file.mimetype not in settings.allowed_mime_types:
            return jsonify({'message': f'Unsupported image type: {file.mimetype}'}), 415

        image = _decode_image(file.read())
        payload = pipeline.process(image)

        return jsonify(payload), 200

    except ServiceError as error:
        return jsonify({'message': str(error)}), error.status_code
    except Exception as error:
        return jsonify({'message': f'Unexpected OCR service failure: {error}'}), 500


@app.post('/pipeline/stop')
def stop_pipeline() -> Any:
    """Stop OCR pipeline and release resources."""
    payload = _stop_pipeline()
    return jsonify(payload), 200


if settings.warmup_on_start:
    _start_pipeline_warmup()


if __name__ == '__main__':
    app.run(host=settings.host, port=settings.port, threaded=True)
