import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  getMySubmission,
  getAllSubmissions,
  updateSubmissionStatus,
  type CnicSubmissionRecord,
} from '../services/cnic';
import { canAccessRole, isAuthenticated, getStoredAuthUser } from '../services/auth';

/* ── Types ────────────────────────────────────────────────────────── */
export type CnicStatus = 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected';

interface CnicContextValue {
  /** Current teacher's own status */
  cnicStatus: CnicStatus;
  mySubmission: CnicSubmissionRecord | null;
  loadingMine: boolean;

  /** Admin pool */
  allSubmissions: CnicSubmissionRecord[];
  loadingAll: boolean;

  /** Actions */
  refreshMySubmission: () => Promise<void>;
  refreshAllSubmissions: () => Promise<void>;
  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string, reason: string) => Promise<void>;
}

const CnicCtx = createContext<CnicContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────────────── */
export function CnicProvider({ children }: { children: ReactNode }) {
  const [mySubmission, setMySubmission] = useState<CnicSubmissionRecord | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<CnicSubmissionRecord[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const authed = isAuthenticated();

  // Read user reactively inside callbacks — avoids stale closure over a
  // value captured once at render time (e.g. session changes after mount).
  const refreshMySubmission = useCallback(async () => {
    const user = getStoredAuthUser();
    if (!authed || !user || !canAccessRole(user, 'teacher')) return;
    setLoadingMine(true);
    try {
      const { submission } = await getMySubmission();
      setMySubmission(submission);
    } catch {
      // Not critical if this fails (e.g. unauthenticated reload)
      setMySubmission(null);
    } finally {
      setLoadingMine(false);
    }
  }, [authed]);

  // getAllSubmissions requires admin — only call if the stored session user is
  // an admin. Regular teachers would get a 403 which previously caused a silent
  // error that cleared allSubmissions and masked real bugs.
  const refreshAllSubmissions = useCallback(async () => {
    const user = getStoredAuthUser();
    // Only admins have access to the full submissions list
    if (!authed || !(user as any)?.isAdmin) return;
    setLoadingAll(true);
    try {
      const { submissions } = await getAllSubmissions(1, 100);
      setAllSubmissions(submissions);
    } catch {
      setAllSubmissions([]);
    } finally {
      setLoadingAll(false);
    }
  }, [authed]);

  // Fetch on mount when authenticated
  useEffect(() => {
    if (!authed) {
      setMySubmission(null);
      setAllSubmissions([]);
      return;
    }
    void refreshMySubmission();
    void refreshAllSubmissions();
  }, [authed, refreshMySubmission, refreshAllSubmissions]);

  const approveSubmission = useCallback(
    async (id: string) => {
      await updateSubmissionStatus(id, 'Verified');
      await Promise.all([refreshMySubmission(), refreshAllSubmissions()]);
    },
    [refreshMySubmission, refreshAllSubmissions],
  );

  const rejectSubmission = useCallback(
    async (id: string, reason: string) => {
      await updateSubmissionStatus(id, 'Rejected', reason);
      await Promise.all([refreshMySubmission(), refreshAllSubmissions()]);
    },
    [refreshMySubmission, refreshAllSubmissions],
  );

  const cnicStatus: CnicStatus = mySubmission?.status ?? 'Not Submitted';

  return (
    <CnicCtx.Provider
      value={{
        cnicStatus,
        mySubmission,
        loadingMine,
        allSubmissions,
        loadingAll,
        refreshMySubmission,
        refreshAllSubmissions,
        approveSubmission,
        rejectSubmission,
      }}
    >
      {children}
    </CnicCtx.Provider>
  );
}

export function useCnic() {
  const ctx = useContext(CnicCtx);
  if (!ctx) throw new Error('useCnic must be used inside CnicProvider');
  return ctx;
}
