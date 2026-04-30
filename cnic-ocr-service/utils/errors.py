class ServiceError(Exception):
    """Base class for service-level errors with HTTP status codes."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


class InvalidImageError(ServiceError):
    def __init__(self, message: str = 'Invalid image payload.'):
        super().__init__(message, status_code=400)


class NoCnicDetectedError(ServiceError):
    def __init__(self, message: str = 'No CNIC card detected in the uploaded image.'):
        super().__init__(message, status_code=422)


class OcrProcessingError(ServiceError):
    def __init__(self, message: str = 'OCR processing failed.'):
        super().__init__(message, status_code=502)


class NoTextDetectedError(ServiceError):
    def __init__(self, message: str = 'No readable text detected in the uploaded image.'):
        super().__init__(message, status_code=422)
