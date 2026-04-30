from __future__ import annotations

import cv2
import numpy as np


def _estimate_skew_angle(gray: np.ndarray) -> float:
    """Estimate skew angle from foreground pixels; returns angle in degrees."""
    inverted = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(inverted > 0))

    if coords.shape[0] < 150:
        return 0.0

    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > 45:
        return 0.0

    return float(angle)


def _rotate(image: np.ndarray, angle: float) -> np.ndarray:
    if abs(angle) < 0.3:
        return image

    height, width = image.shape[:2]
    center = (width // 2, height // 2)

    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated


def preprocess_for_ocr(cnic_crop: np.ndarray) -> np.ndarray:
    """Grayscale + blur + threshold + deskew for OCR-friendly text regions."""
    if len(cnic_crop.shape) == 3:
        gray = cv2.cvtColor(cnic_crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = cnic_crop.copy()

    estimated_angle = _estimate_skew_angle(gray)
    deskewed_gray = _rotate(gray, estimated_angle)

    blurred = cv2.GaussianBlur(deskewed_gray, (5, 5), 0)
    thresholded = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    return thresholded
