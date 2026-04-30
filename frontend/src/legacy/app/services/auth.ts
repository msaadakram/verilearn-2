export type Profession = 'student' | 'teacher';
export type SessionTier = 'Bronze' | 'Gold' | 'Diamond';

export interface TeacherAssessmentState {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  passed: boolean;
  attemptedAt: string | null;
}

export interface TeacherOnboardingState {
  cnicStatus?: string;
  cnicVerified?: boolean;
  subjects: string[];
  subjectSelectionCompleted?: boolean;
  assessment: TeacherAssessmentState;
  assessmentPassed?: boolean;
  profileCompleted?: boolean;
  profileCompletedAt?: string | null;
  dashboardUnlocked: boolean;
  onboardingCompletedAt: string | null;
  assessmentAttemptCount?: number;
  assessmentCooldownUntil?: string | null;
  cooldownActive?: boolean;
  cooldownRemainingMs?: number;
  subjectConstraints?: {
    min: number;
    max: number;
  };
  passCriteria?: {
    minimumCorrectAnswers: number;
    totalQuestions: number;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles?: Profession[];
  profession: Profession;
  avatarUrl?: string;
  learningCredits?: number;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  teacherOnboarding?: TeacherOnboardingState;
  teacherSessionStats?: {
    successfulSessions: number;
    tier: SessionTier;
  };
}

export type StudentLearningLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

export interface StudentProfile {
  username: string;
  bio: string;
  location: string;
  avatarUrl: string;
  level: StudentLearningLevel;
  subjects: string[];
  currentlyLearning: string;
  streak: number;
  goals: string[];
  targetDate: string;
  days: string[];
  timeSlots: string[];
  timezone: string;
  weeklyHours: number;
  languages: string[];
  sessionPrefs: string[];
  learningStyle: string;

}

export type StudentProfileUpdatePayload = Partial<StudentProfile> & {
  name?: string;
  avatarFile?: File | null;
};

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface TeacherOnboardingResponse {
  message: string;
  user: AuthUser;
  onboarding: TeacherOnboardingState;
}

export interface TeacherProfilePackage {
  label: string;
  sessions: number;
  price: number;
  popular: boolean;
}

export interface TeacherProfileEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface TeacherProfile {
  title: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  profileSubjects: string[];
  skills: string[];
  sessionTypes: string[];
  teachingStyle: string;
  targetAudience: string;
  creditRate: number;
  availabilityDays: string[];
  timeSlots: string[];
  timezone: string;
  sessionLength: number;
  education: TeacherProfileEducation[];
  languages: string[];
  experience: string;
  certifications: string[];
  profileCompleted: boolean;
  profileCompletedAt: string | null;
}

export type TeacherProfileUpdatePayload = Partial<Omit<TeacherProfile, 'profileCompleted' | 'profileCompletedAt'>> & {
  name?: string;
  avatarFile?: File | null;
  avatarUrl?: string;
};

export interface TeacherProfileResponse {
  message: string;
  user: AuthUser;
  onboarding: TeacherOnboardingState;
  profile: TeacherProfile;
}

export interface StudentTeacherDirectoryItem {
  id: string;
  name: string;
  title: string;
  subject: string;
  avatarUrl: string;
  bio: string;
  specialties: string[];
  availability: string;
  languages: string[];
  experience: string;
  creditRate: number;
  teachingStyle: string;
  targetAudience: string;
  sessionTypes: string[];
  timezone: string;
  onboarding: {
    cnicStatus: string;
    cnicVerified: boolean;
    assessmentPassed: boolean;
    profileCompleted: boolean;
    dashboardUnlocked: boolean;
  };
  successfulSessions: number;
  sessionTier: SessionTier;
}

export interface StudentTeacherDirectoryListResponse {
  message: string;
  teachers: StudentTeacherDirectoryItem[];
}

export interface StudentTeacherDirectoryDetailResponse {
  message: string;
  teacher: StudentTeacherDirectoryItem;
}

export interface SignUpResponse {
  message: string;
  email: string;
  requiresEmailVerification: boolean;
  developmentVerificationCode?: string;
  emailDeliveryFailed?: boolean;
}

export interface StoredAuthSession {
  token: string;
  user: AuthUser;
}

interface AuthErrorPayload {
  message?: string;
  errors?: string[];
}

function buildApiErrorMessage(
  payload: AuthErrorPayload | null,
  fallback: string,
) {
  const details = Array.isArray(payload?.errors) && payload.errors.length > 0
    ? payload.errors.join(' ')
    : '';

  if (details && payload?.message) {
    return `${payload.message} ${details}`;
  }

  if (details) {
    return details;
  }

  if (payload?.message) {
    return payload.message;
  }

  return fallback;
}

interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  profession?: Profession;
}

interface SignInPayload {
  email: string;
  password: string;
}

interface VerifyEmailCodePayload {
  email: string;
  code: string;
}

interface ResendEmailCodePayload {
  email: string;
}

interface ForgotPasswordEmailPayload {
  email: string;
}

interface VerifyResetCodePayload {
  email: string;
  code: string;
}

interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
  email?: string;
  requiresEmailVerification?: boolean;
  developmentVerificationCode?: string;
  emailDeliveryFailed?: boolean;
}

interface StudentProfileResponse {
  message: string;
  user: AuthUser;
  profile: StudentProfile;
}

interface SwitchAccountModePayload {
  profession: Profession;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const AUTH_STORAGE_KEYS = {
  token: 'verilearn_auth_token',
  user: 'verilearn_auth_user',
};

export const AUTH_SESSION_CHANGED_EVENT = 'verilearn-auth-session-changed';

function isBrowser() {
  return typeof window !== 'undefined';
}

function notifyAuthSessionChanged() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function isProfession(value: string): value is Profession {
  return value === 'student' || value === 'teacher';
}

export function canAccessRole(user: AuthUser, role: Profession) {
  const roles = Array.isArray(user.roles) ? user.roles : [];

  if (roles.includes(role)) {
    return true;
  }

  return user.profession === role;
}

function parseStoredUser(rawUser: string | null): AuthUser | null {
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as Partial<AuthUser>;

    if (
      typeof parsed.id !== 'string'
      || typeof parsed.name !== 'string'
      || typeof parsed.email !== 'string'
      || typeof parsed.profession !== 'string'
      || !isProfession(parsed.profession)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      roles: Array.isArray(parsed.roles)
        ? parsed.roles.filter((role): role is Profession => typeof role === 'string' && isProfession(role))
        : undefined,
      profession: parsed.profession,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
      learningCredits: typeof parsed.learningCredits === 'number' ? parsed.learningCredits : undefined,
      isEmailVerified: parsed.isEmailVerified,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
      lastLoginAt: parsed.lastLoginAt ?? null,
      teacherOnboarding: {
        subjects: Array.isArray(parsed.teacherOnboarding?.subjects)
          ? parsed.teacherOnboarding.subjects.filter((subject): subject is string => typeof subject === 'string')
          : [],
        assessment: {
          totalQuestions: typeof parsed.teacherOnboarding?.assessment?.totalQuestions === 'number'
            ? parsed.teacherOnboarding.assessment.totalQuestions
            : 10,
          correctAnswers: typeof parsed.teacherOnboarding?.assessment?.correctAnswers === 'number'
            ? parsed.teacherOnboarding.assessment.correctAnswers
            : 0,
          scorePercent: typeof parsed.teacherOnboarding?.assessment?.scorePercent === 'number'
            ? parsed.teacherOnboarding.assessment.scorePercent
            : 0,
          passed: parsed.teacherOnboarding?.assessment?.passed === true,
          attemptedAt: typeof parsed.teacherOnboarding?.assessment?.attemptedAt === 'string'
            ? parsed.teacherOnboarding.assessment.attemptedAt
            : null,
        },
        dashboardUnlocked: parsed.teacherOnboarding?.dashboardUnlocked === true,
        cnicStatus: typeof parsed.teacherOnboarding?.cnicStatus === 'string'
          ? parsed.teacherOnboarding.cnicStatus
          : undefined,
        cnicVerified: typeof parsed.teacherOnboarding?.cnicVerified === 'boolean'
          ? parsed.teacherOnboarding.cnicVerified
          : undefined,
        subjectSelectionCompleted: typeof parsed.teacherOnboarding?.subjectSelectionCompleted === 'boolean'
          ? parsed.teacherOnboarding.subjectSelectionCompleted
          : undefined,
        assessmentPassed: typeof parsed.teacherOnboarding?.assessmentPassed === 'boolean'
          ? parsed.teacherOnboarding.assessmentPassed
          : undefined,
        profileCompleted: typeof parsed.teacherOnboarding?.profileCompleted === 'boolean'
          ? parsed.teacherOnboarding.profileCompleted
          : undefined,
        profileCompletedAt: typeof parsed.teacherOnboarding?.profileCompletedAt === 'string'
          ? parsed.teacherOnboarding.profileCompletedAt
          : null,
        onboardingCompletedAt: typeof parsed.teacherOnboarding?.onboardingCompletedAt === 'string'
          ? parsed.teacherOnboarding.onboardingCompletedAt
          : null,
        assessmentAttemptCount: typeof parsed.teacherOnboarding?.assessmentAttemptCount === 'number'
          ? parsed.teacherOnboarding.assessmentAttemptCount
          : 0,
        assessmentCooldownUntil: typeof parsed.teacherOnboarding?.assessmentCooldownUntil === 'string'
          ? parsed.teacherOnboarding.assessmentCooldownUntil
          : null,
        cooldownActive: typeof parsed.teacherOnboarding?.cooldownActive === 'boolean'
          ? parsed.teacherOnboarding.cooldownActive
          : undefined,
        cooldownRemainingMs: typeof parsed.teacherOnboarding?.cooldownRemainingMs === 'number'
          ? parsed.teacherOnboarding.cooldownRemainingMs
          : undefined,
        subjectConstraints:
          typeof parsed.teacherOnboarding?.subjectConstraints?.min === 'number'
            && typeof parsed.teacherOnboarding?.subjectConstraints?.max === 'number'
            ? {
              min: parsed.teacherOnboarding.subjectConstraints.min,
              max: parsed.teacherOnboarding.subjectConstraints.max,
            }
            : undefined,
        passCriteria:
          typeof parsed.teacherOnboarding?.passCriteria?.minimumCorrectAnswers === 'number'
            && typeof parsed.teacherOnboarding?.passCriteria?.totalQuestions === 'number'
            ? {
              minimumCorrectAnswers: parsed.teacherOnboarding.passCriteria.minimumCorrectAnswers,
              totalQuestions: parsed.teacherOnboarding.passCriteria.totalQuestions,
            }
            : undefined,
      },
    };
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as (T & AuthErrorPayload) | null;

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw new Error(buildApiErrorMessage(payload, fallback));
  }

  if (!payload) {
    throw new Error('Unexpected empty response from server.');
  }

  return payload as T;
}

function getAuthTokenOrThrow() {
  const session = getStoredAuthSession();

  if (!session?.token) {
    throw new Error('You are not signed in. Please sign in and try again.');
  }

  return session.token;
}

async function authenticatedRequest<T>(endpoint: string, init: RequestInit): Promise<T> {
  const token = getAuthTokenOrThrow();

  return request<T>(endpoint, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function signUp(payload: SignUpPayload): Promise<SignUpResponse> {
  return request<SignUpResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailVerificationCode(payload: VerifyEmailCodePayload): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/email-verification/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendEmailVerificationCode(payload: ResendEmailCodePayload): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/email-verification/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestForgotPasswordCode(payload: ForgotPasswordEmailPayload): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/forgot-password/send-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyForgotPasswordCode(payload: VerifyResetCodePayload): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/forgot-password/verify-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPasswordWithCode(payload: ResetPasswordPayload): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStudentProfile(): Promise<StudentProfileResponse> {
  return authenticatedRequest<StudentProfileResponse>('/api/auth/student-profile', {
    method: 'GET',
  });
}

export async function updateStudentProfile(
  payload: StudentProfileUpdatePayload,
): Promise<StudentProfileResponse> {
  const token = getAuthTokenOrThrow();
  const formData = new FormData();

  const appendIfDefined = (key: string, value: unknown) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  };

  appendIfDefined('name', payload.name);
  appendIfDefined('username', payload.username);
  appendIfDefined('bio', payload.bio);
  appendIfDefined('location', payload.location);
  appendIfDefined('avatarUrl', payload.avatarUrl);
  appendIfDefined('level', payload.level);
  appendIfDefined('subjects', payload.subjects);
  appendIfDefined('currentlyLearning', payload.currentlyLearning);
  appendIfDefined('streak', payload.streak);
  appendIfDefined('goals', payload.goals);
  appendIfDefined('targetDate', payload.targetDate);
  appendIfDefined('days', payload.days);
  appendIfDefined('timeSlots', payload.timeSlots);
  appendIfDefined('timezone', payload.timezone);
  appendIfDefined('weeklyHours', payload.weeklyHours);
  appendIfDefined('languages', payload.languages);
  appendIfDefined('sessionPrefs', payload.sessionPrefs);
  appendIfDefined('learningStyle', payload.learningStyle);


  if (payload.avatarFile) {
    formData.append('avatar', payload.avatarFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/student-profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const responsePayload = (await response.json().catch(() => null)) as (StudentProfileResponse & AuthErrorPayload) | null;

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw new Error(buildApiErrorMessage(responsePayload, fallback));
  }

  if (!responsePayload) {
    throw new Error('Unexpected empty response from server.');
  }

  return responsePayload as StudentProfileResponse;
}

export async function getQualifiedStudentTeachers(): Promise<StudentTeacherDirectoryListResponse> {
  return authenticatedRequest<StudentTeacherDirectoryListResponse>('/api/auth/student/teachers', {
    method: 'GET',
  });
}

export async function getQualifiedStudentTeacherById(
  teacherId: string,
): Promise<StudentTeacherDirectoryDetailResponse> {
  return authenticatedRequest<StudentTeacherDirectoryDetailResponse>(`/api/auth/student/teachers/${teacherId}`, {
    method: 'GET',
  });
}

export async function switchAccountMode(payload: SwitchAccountModePayload): Promise<AuthResponse> {
  return authenticatedRequest<AuthResponse>('/api/auth/account/switch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function syncAccountModeForDashboard(
  targetProfession: Profession,
): Promise<AuthResponse | null> {
  const session = getStoredAuthSession();

  if (!session?.user) {
    return null;
  }

  if (session.user.profession === targetProfession) {
    return null;
  }

  const response = await switchAccountMode({ profession: targetProfession });
  persistAuthSession(response);
  return response;
}

export async function getTeacherOnboardingStatus(): Promise<TeacherOnboardingResponse> {
  return authenticatedRequest<TeacherOnboardingResponse>('/api/auth/teacher-onboarding/status', {
    method: 'GET',
  });
}

export async function updateTeacherSubjects(subjects: string[]): Promise<TeacherOnboardingResponse> {
  return authenticatedRequest<TeacherOnboardingResponse>('/api/auth/teacher-onboarding/subjects', {
    method: 'PUT',
    body: JSON.stringify({ subjects }),
  });
}

export async function submitTeacherAssessment(
  payload: { correctAnswers: number; totalQuestions: number },
): Promise<TeacherOnboardingResponse> {
  return authenticatedRequest<TeacherOnboardingResponse>('/api/auth/teacher-onboarding/assessment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTeacherProfile(): Promise<TeacherProfileResponse> {
  return authenticatedRequest<TeacherProfileResponse>('/api/auth/teacher-profile', {
    method: 'GET',
  });
}

export async function updateTeacherProfile(
  payload: TeacherProfileUpdatePayload,
): Promise<TeacherProfileResponse> {
  const token = getAuthTokenOrThrow();
  const formData = new FormData();

  const appendIfDefined = (key: string, value: unknown) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  };

  appendIfDefined('name', payload.name);
  appendIfDefined('title', payload.title);
  appendIfDefined('tagline', payload.tagline);
  appendIfDefined('bio', payload.bio);
  appendIfDefined('avatarUrl', payload.avatarUrl);
  appendIfDefined('profileSubjects', payload.profileSubjects);
  appendIfDefined('skills', payload.skills);
  appendIfDefined('sessionTypes', payload.sessionTypes);
  appendIfDefined('teachingStyle', payload.teachingStyle);
  appendIfDefined('targetAudience', payload.targetAudience);
  appendIfDefined('creditRate', payload.creditRate);
  appendIfDefined('availabilityDays', payload.availabilityDays);
  appendIfDefined('timeSlots', payload.timeSlots);
  appendIfDefined('timezone', payload.timezone);
  appendIfDefined('sessionLength', payload.sessionLength);
  appendIfDefined('education', payload.education);
  appendIfDefined('languages', payload.languages);
  appendIfDefined('experience', payload.experience);
  appendIfDefined('certifications', payload.certifications);

  if (payload.avatarFile) {
    formData.append('avatar', payload.avatarFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/teacher-profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const responsePayload = (await response.json().catch(() => null)) as (TeacherProfileResponse & AuthErrorPayload) | null;

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw new Error(buildApiErrorMessage(responsePayload, fallback));
  }

  if (!responsePayload) {
    throw new Error('Unexpected empty response from server.');
  }

  return responsePayload as TeacherProfileResponse;
}

export function persistAuthSession(authData: AuthResponse) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.token, authData.token);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(authData.user));
  notifyAuthSessionChanged();
}

export function updateStoredAuthUser(user: AuthUser) {
  if (!isBrowser()) {
    return;
  }

  const session = getStoredAuthSession();

  if (!session?.token) {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  notifyAuthSessionChanged();
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  notifyAuthSessionChanged();
}

export function getStoredAuthSession(): StoredAuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const token = localStorage.getItem(AUTH_STORAGE_KEYS.token);
  const user = parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEYS.user));

  if (!token || !user) {
    return null;
  }

  return {
    token,
    user,
  };
}

export function getStoredAuthUser(): AuthUser | null {
  return getStoredAuthSession()?.user ?? null;
}

export function isAuthenticated() {
  return Boolean(getStoredAuthSession());
}

export function getPostAuthRoute(profession: Profession) {
  return profession === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
}
