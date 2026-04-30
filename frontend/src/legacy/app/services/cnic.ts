import { getStoredAuthSession } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface CnicErrorPayload {
  message?: string;
  errors?: string[];
  errorCode?: string;
  details?: unknown;
  retryable?: boolean;
}

export class CnicApiError extends Error {
  statusCode?: number;
  errorCode?: string;
  details?: unknown;
  retryable?: boolean;

  constructor(message: string, metadata?: { statusCode?: number; errorCode?: string; details?: unknown; retryable?: boolean }) {
    super(message);
    this.name = 'CnicApiError';
    this.statusCode = metadata?.statusCode;
    this.errorCode = metadata?.errorCode;
    this.details = metadata?.details;
    this.retryable = metadata?.retryable;
  }
}

export function isCnicApiError(error: unknown): error is CnicApiError {
  return error instanceof CnicApiError;
}

function buildCnicApiError(statusCode: number, payload: CnicErrorPayload | null, fallbackMessage: string) {
  const details = payload?.errors?.join(' ');
  return new CnicApiError(payload?.message || details || fallbackMessage, {
    statusCode,
    errorCode: payload?.errorCode,
    details: payload?.details,
    retryable: payload?.retryable,
  });
}

export interface CnicVerificationResponse {
  message: string;
  submissionId: string;
  cnicNumberEntered: string;
  cnic_available?: boolean;
  cnic: string | null;
  dob: string | null;
  name: string | null;
  father_or_husband_name: string | null;
  gender: string | null;
  nationality: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  address: string | null;
  confidence?: number;
  raw_text: string;
  text?: string;
  ocr_backend?: string;
  warnings?: string[];
  verificationStatus?: 'Verified';
  status: 'Pending' | 'Verified' | 'Rejected';
}

export interface CnicSubmissionRecord {
  id: string;
  userId: string;
  tutorName?: string;
  tutorEmail?: string;
  cnicNumberEntered: string;
  enteredCnicNumber?: string;
  cnicAvailable?: boolean;
  parsedCnicNumber?: string | null;
  parsedDob?: string | null;
  parsedName?: string | null;
  parsedFatherOrHusbandName?: string | null;
  parsedGender?: string | null;
  parsedNationality?: string | null;
  parsedIssueDate?: string | null;
  parsedExpiryDate?: string | null;
  parsedAddress?: string | null;
  parsedConfidence?: number | null;
  parsedRawText?: string;
  parsedOcrBackend?: string;
  parsedWarnings?: string[];
  parsedGeminiJson?: unknown;
  ocrCnic: string | null;
  ocrDob: string | null;
  ocrRawText: string;
  ocrConfidence: number | null;
  ocrBackend: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface AllSubmissionsResponse {
  submissions: CnicSubmissionRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function getAuthTokenOrThrow() {
  const session = getStoredAuthSession();
  if (!session?.token) {
    throw new CnicApiError('You are not signed in. Please sign in and try again.', {
      statusCode: 401,
      errorCode: 'AUTH_REQUIRED',
    });
  }
  return session.token;
}

async function authFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthTokenOrThrow();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as (T & CnicErrorPayload) | null;

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw buildCnicApiError(response.status, payload, fallback);
  }

  if (!payload) {
    throw new CnicApiError('Unexpected empty response from server.', { statusCode: response.status });
  }

  return payload as T;
}

/** Upload CNIC front+back images and entered number to verification endpoint. */
export async function verifyCnicImage(
  frontImageFile: File,
  backImageFile: File,
  cnicNumber?: string,
): Promise<CnicVerificationResponse> {
  if (!frontImageFile) {
    throw new CnicApiError('CNIC front image is required for verification.', {
      statusCode: 400,
      errorCode: 'CNIC_FRONT_REQUIRED',
    });
  }

  if (!backImageFile) {
    throw new CnicApiError('CNIC back image is required for verification.', {
      statusCode: 400,
      errorCode: 'CNIC_BACK_REQUIRED',
    });
  }

  const token = getAuthTokenOrThrow();
  const formData = new FormData();
  formData.append('imageFront', frontImageFile, frontImageFile.name || 'cnic-front-upload.jpg');
  formData.append('imageBack', backImageFile, backImageFile.name || 'cnic-back-upload.jpg');
  if (cnicNumber) {
    formData.append('cnicNumber', cnicNumber);
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/cnic/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | (CnicVerificationResponse & CnicErrorPayload)
    | null;

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw buildCnicApiError(response.status, payload, fallback);
  }

  if (!payload) {
    throw new CnicApiError('Unexpected empty response from CNIC verification endpoint.', {
      statusCode: response.status,
    });
  }

  return payload;
}

/** Get the current teacher's latest CNIC submission. */
export async function getMySubmission(): Promise<{ submission: CnicSubmissionRecord | null }> {
  return authFetch('/api/auth/cnic/my-submission');
}

/** Get all CNIC submissions (admin view). */
export async function getAllSubmissions(
  page = 1,
  limit = 50,
  status?: string,
): Promise<AllSubmissionsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'All') params.set('status', status);
  return authFetch(`/api/auth/cnic/submissions?${params}`);
}

/** Approve or reject a submission. */
export async function updateSubmissionStatus(
  id: string,
  status: 'Verified' | 'Rejected',
  rejectionReason?: string,
): Promise<{ message: string; submission: CnicSubmissionRecord }> {
  return authFetch(`/api/auth/cnic/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, rejectionReason }),
  });
}
