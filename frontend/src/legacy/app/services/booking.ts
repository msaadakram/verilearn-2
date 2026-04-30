const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const AUTH_STORAGE_KEY = 'verilearn_auth_token';

function getToken(): string {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) throw new Error('You are not signed in. Please sign in and try again.');
    return token;
}

async function authFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
        },
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error((payload as { message?: string })?.message || `Request failed (${res.status})`);
    }
    return payload as T;
}

/* ── Types ─────────────────────────────────────────────────────────── */

export type BookingStatus = 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled' | 'declined';
export type BookingType = 'slot' | 'request';

export interface BookingParticipant {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface Booking {
    _id: string;
    teacherId: BookingParticipant | string;
    studentId: BookingParticipant | string;
    date: string;  // YYYY-MM-DD
    time: string;  // HH:MM
    status: BookingStatus;
    bookingType: BookingType;
    message: string;
    sessionDuration: number;
    channelName: string;
    createdAt: string;

    /* Session lifecycle fields */
    scheduledAt: string | null;
    studentJoined: boolean;
    teacherJoined: boolean;
    startTime: string | null;
    endTime: string | null;
    actualDuration: number;
    creditsUsed: number;
    studentCreditsAtBooking: number;
    hasEnoughCreditsAtBooking: boolean;
    estimatedCreditsAtBooking: number;
}

export interface CreateBookingPayload {
    teacherId: string;
    studentId: string;
    date: string;
    time: string;
    sessionDuration: number;
    bookingType?: BookingType;
    message?: string;
}

export interface CreateBookingResponse {
    message: string;
    booking: Booking;
    channelName: string;
    estimatedCredits: number;
    studentCredits: number;
    hasEnoughCredits: boolean;
    studentCreditsAtBooking: number;
    hasEnoughCreditsAtBooking: boolean;
    estimatedCreditsAtBooking: number;
}

export interface AvailableSlotsResponse {
    teacherId: string;
    date: string;
    creditRate: number;
    availableSlots: string[];
    bookedSlots: string[];
}

export interface MyBookingsResponse {
    bookings: Booking[];
}

export interface SessionInfo {
    canJoin: boolean;
    remainingMs: number;
    remainingMinutes: number;
    studentJoined: boolean;
    teacherJoined: boolean;
    isOngoing: boolean;
    liveDurationSeconds: number;
    creditsUsed: number;
    actualDuration: number;
}

export interface SessionStatusResponse {
    booking: Booking;
    sessionInfo: SessionInfo;
}

export interface JoinSessionResponse {
    message: string;
    booking: Booking;
    bothJoined: boolean;
    startTime: string | null;
}

export interface EndSessionResponse {
    message: string;
    booking: Booking;
    creditsUsed: number;
    actualDurationMinutes: number;
    studentCreditsRemaining: number;
    teacherCreditsTotal: number;
}

export interface TeacherReviewDistributionItem {
    stars: number;
    count: number;
    percent: number;
}

export interface TeacherReview {
    bookingId: string;
    student: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    rating: number;
    text: string;
    submittedAt: string;
    updatedAt: string;
}

export interface TeacherReviewsResponse {
    teacherId: string;
    summary: {
        totalReviews: number;
        averageRating: number;
        distribution: TeacherReviewDistributionItem[];
    };
    reviews: TeacherReview[];
}

export interface SubmitBookingReviewPayload {
    rating: number;
    text?: string;
}

export interface SubmitBookingReviewResponse {
    message: string;
    bookingId: string;
    teacherId: string;
    review: {
        rating: number;
        text: string;
        submittedAt: string;
        updatedAt: string;
    };
}

/* ── API functions ─────────────────────────────────────────────────── */

/** POST /api/book-session — student books a session (NO credits deducted) */
export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResponse> {
    return authFetch<CreateBookingResponse>('/api/book-session', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/** GET /api/teacher/:id/slots?date= — get free slots for a teacher on a date */
export async function getAvailableSlots(teacherId: string, date: string): Promise<AvailableSlotsResponse> {
    return authFetch<AvailableSlotsResponse>(`/api/teacher/${teacherId}/slots?date=${encodeURIComponent(date)}`);
}

/** GET /api/bookings/mine — get all bookings for the current user */
export async function getMyBookings(status?: BookingStatus): Promise<MyBookingsResponse> {
    const qs = status ? `?status=${status}` : '';
    return authFetch<MyBookingsResponse>(`/api/bookings/mine${qs}`);
}

/** PATCH /api/bookings/:id/cancel */
export async function cancelBooking(bookingId: string): Promise<{ message: string; booking: Partial<Booking> }> {
    return authFetch(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' });
}

/** PATCH /api/bookings/:id/accept — teacher accepts */
export async function acceptBooking(bookingId: string): Promise<{ message: string; booking: Partial<Booking> }> {
    return authFetch(`/api/bookings/${bookingId}/accept`, { method: 'PATCH' });
}

/** PATCH /api/bookings/:id/decline — teacher declines */
export async function declineBooking(bookingId: string): Promise<{ message: string; booking: Partial<Booking> }> {
    return authFetch(`/api/bookings/${bookingId}/decline`, { method: 'PATCH' });
}

/* ── Session lifecycle ─────────────────────────────────────────────── */

/** GET /api/session/:id — get session status */
export async function getSessionStatus(bookingId: string): Promise<SessionStatusResponse> {
    return authFetch<SessionStatusResponse>(`/api/session/${bookingId}`);
}

/** POST /api/session/:id/join — join a session */
export async function joinSession(bookingId: string): Promise<JoinSessionResponse> {
    return authFetch<JoinSessionResponse>(`/api/session/${bookingId}/join`, { method: 'POST' });
}

/** POST /api/session/:id/end — end a session and trigger credit transfer */
export async function endSession(bookingId: string): Promise<EndSessionResponse> {
    return authFetch<EndSessionResponse>(`/api/session/${bookingId}/end`, { method: 'POST' });
}

/** GET /api/teacher/:id/reviews — real student reviews from completed sessions */
export async function getTeacherReviews(teacherId: string): Promise<TeacherReviewsResponse> {
    return authFetch<TeacherReviewsResponse>(`/api/teacher/${teacherId}/reviews`);
}

/** POST /api/bookings/:id/review — submit/update review for a completed booking */
export async function submitBookingReview(
    bookingId: string,
    payload: SubmitBookingReviewPayload,
): Promise<SubmitBookingReviewResponse> {
    return authFetch<SubmitBookingReviewResponse>(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
