import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, ShieldX, ShieldAlert, Clock, CheckCircle2,
  AlertCircle, X, Eye, Search, Filter, Users,
  TrendingUp, CreditCard, ChevronDown, RefreshCw,
} from 'lucide-react';
import { useCnic } from '../context/CnicContext';
import type { CnicSubmissionRecord } from '../services/cnic';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type CnicStatus = 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected';

/* ── Helpers ──────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CONFIG: Record<'Pending' | 'Verified' | 'Rejected', { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock className="w-4 h-4" /> },
  Verified: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ShieldCheck className="w-4 h-4" /> },
  Rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <ShieldX className="w-4 h-4" /> },
};

/* ── Reject Modal ─────────────────────────────────────────── */
function RejectModal({
  submission, onConfirm, onClose, loading,
}: {
  submission: CnicSubmissionRecord;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const presets = [
    'Image is blurry or unclear.',
    'CNIC number does not match the card.',
    'Document appears to be expired.',
    'Photo is partially cut off or obstructed.',
    'Document provided is not a CNIC.',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 20 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(239,68,68,0.04)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <ShieldX className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h3 className="text-[var(--foreground)]" style={{ fontWeight: 600 }}>Reject Submission</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{submission.tutorName || submission.tutorEmail || 'Teacher'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--muted)]">
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-2 block">Quick reasons</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <motion.button key={p} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setReason(p)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={reason === p
                    ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
                    : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid transparent' }}>
                  {p}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">Rejection reason (sent to tutor)</label>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Explain why the submission was rejected…"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--muted)', caretColor: '#ef4444' }} />
          </div>

          <div className="flex gap-3 pt-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              Cancel
            </motion.button>
            <motion.button
              whileHover={reason.trim() && !loading ? { scale: 1.03, boxShadow: '0 0 24px rgba(239,68,68,0.3)' } : {}}
              whileTap={reason.trim() && !loading ? { scale: 0.97 } : {}}
              onClick={() => reason.trim() && !loading && onConfirm(reason.trim())}
              disabled={loading || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
              style={{
                background: reason.trim() ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--muted)',
                color: reason.trim() ? '#fff' : 'var(--muted-foreground)',
                cursor: reason.trim() && !loading ? 'pointer' : 'not-allowed',
              }}>
              {loading && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />}
              Confirm Reject
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── OCR Detail Modal ─────────────────────────────────────── */
function OcrDetailModal({ submission, onClose }: { submission: CnicSubmissionRecord; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a2332] rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <p className="text-white text-sm font-semibold">{submission.tutorName || submission.tutorEmail || 'Teacher'}</p>
            <p className="text-white/50 text-xs">{submission.cnicNumberEntered || 'No CNIC entered'}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'CNIC Entered', value: submission.cnicNumberEntered || '—' },
            { label: 'Detected CNIC', value: submission.parsedCnicNumber || submission.ocrCnic || '—' },
            { label: 'Detected DOB', value: submission.parsedDob || submission.ocrDob || '—' },
            { label: 'Detected Name', value: submission.parsedName || '—' },
            { label: 'Father / Husband', value: submission.parsedFatherOrHusbandName || '—' },
            { label: 'Gender', value: submission.parsedGender || '—' },
            { label: 'Nationality', value: submission.parsedNationality || '—' },
            { label: 'Issue Date', value: submission.parsedIssueDate || '—' },
            { label: 'Expiry Date', value: submission.parsedExpiryDate || '—' },
            { label: 'OCR Confidence', value: submission.parsedConfidence != null ? `${Math.round(submission.parsedConfidence * 100)}%` : submission.ocrConfidence != null ? `${Math.round(submission.ocrConfidence * 100)}%` : '—' },
            { label: 'OCR Backend', value: submission.parsedOcrBackend || submission.ocrBackend || '—' },
            { label: 'Status', value: submission.status },
            { label: 'Submitted', value: new Date(submission.submittedAt).toLocaleString() },
            ...(submission.reviewedAt ? [{ label: 'Reviewed At', value: new Date(submission.reviewedAt).toLocaleString() }] : []),
            ...(submission.rejectionReason ? [{ label: 'Rejection Reason', value: submission.rejectionReason }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-white/50 text-xs flex-shrink-0">{label}</span>
              <span className="text-white text-xs text-right break-all" style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          {submission.ocrRawText && (
            <div>
              <p className="text-white/50 text-xs mb-1">Raw OCR Text</p>
              <pre className="text-white/70 text-xs rounded-xl p-3 overflow-auto max-h-48"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap' }}>
                {submission.parsedRawText || submission.ocrRawText}
              </pre>
            </div>
          )}
          {Array.isArray(submission.parsedWarnings) && submission.parsedWarnings.length > 0 && (
            <div>
              <p className="text-white/50 text-xs mb-1">Warnings</p>
              <ul className="list-disc pl-5 text-white/70 text-xs space-y-1">
                {submission.parsedWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Submission Row ───────────────────────────────────────── */
function SubmissionRow({
  sub, onApprove, onReject, onPreview, approving,
}: {
  sub: CnicSubmissionRecord;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
  approving: boolean;
}) {
  const cfg = STATUS_CONFIG[sub.status];

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border transition-all hover:shadow-md"
      style={{ background: 'white', borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tutor info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.2), rgba(122,184,186,0.08))' }}>
            <span className="text-lg font-bold" style={{ color: '#7ab8ba' }}>
              {(sub.tutorName || sub.tutorEmail || 'T')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[var(--foreground)] truncate" style={{ fontWeight: 600 }}>
              {sub.tutorName || 'Teacher'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">{sub.tutorEmail || ''}</p>
          </div>
        </div>

        {/* CNIC number */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.2)' }}>
          <CreditCard className="w-3.5 h-3.5" style={{ color: '#7ab8ba' }} />
          <span className="text-xs" style={{ color: '#1a2332', fontWeight: 600, letterSpacing: '0.04em' }}>
            {sub.cnicNumberEntered || sub.ocrCnic || '—'}
          </span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
          {cfg.icon}
          <span className="text-xs" style={{ fontWeight: 600 }}>{cfg.label}</span>
        </div>

        {/* Time */}
        <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{timeAgo(sub.submittedAt)}</span>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            onClick={onPreview}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors hover:border-[#7ab8ba]"
            style={{ background: 'var(--muted)', borderColor: 'rgba(0,0,0,0.08)' }}
            title="View OCR details">
            <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />
          </motion.button>

          {sub.status === 'Pending' && (
            <>
              <motion.button
                whileHover={!approving ? { scale: 1.06, boxShadow: '0 0 16px rgba(16,185,129,0.35)' } : {}}
                whileTap={!approving ? { scale: 0.95 } : {}}
                onClick={onApprove}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                {approving
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve
              </motion.button>
              <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(239,68,68,0.3)' }}
                whileTap={{ scale: 0.95 }} onClick={onReject}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <X className="w-3.5 h-3.5" /> Reject
              </motion.button>
            </>
          )}

          {sub.status === 'Rejected' && sub.rejectionReason && (
            <div className="max-w-[180px] text-xs text-[var(--muted-foreground)] truncate" title={sub.rejectionReason}>
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" style={{ color: '#ef4444' }} />
              {sub.rejectionReason}
            </div>
          )}

          {sub.status === 'Verified' && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#10b981' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export function AdminCnicReview() {
  const { allSubmissions, loadingAll, approveSubmission, rejectSubmission, refreshAllSubmissions } = useCnic();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [rejectTarget, setRejectTarget] = useState<CnicSubmissionRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<CnicSubmissionRecord | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = allSubmissions.filter((s) => {
    const matchSearch =
      (s.tutorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.tutorEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.cnicNumberEntered || '').includes(search) ||
      (s.ocrCnic || '').includes(search);
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: allSubmissions.length,
    pending: allSubmissions.filter((s) => s.status === 'Pending').length,
    verified: allSubmissions.filter((s) => s.status === 'Verified').length,
    rejected: allSubmissions.filter((s) => s.status === 'Rejected').length,
  };

  const STAT_CARDS = [
    { label: 'Total Submissions', value: stats.total, icon: <Users className="w-5 h-5" />, color: '#7ab8ba' },
    { label: 'Pending Review', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: '#f59e0b' },
    { label: 'Verified', value: stats.verified, icon: <ShieldCheck className="w-5 h-5" />, color: '#10b981' },
    { label: 'Rejected', value: stats.rejected, icon: <ShieldX className="w-5 h-5" />, color: '#ef4444' },
  ];

  const STATUS_FILTERS: ('All' | 'Pending' | 'Verified' | 'Rejected')[] = ['All', 'Pending', 'Verified', 'Rejected'];

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveSubmission(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(id);
    try {
      await rejectSubmission(id, reason);
      setRejectTarget(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-[73px]"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #1a2332 0%, #273447 50%, #1a3a3c 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
          </div>
          <div className="relative p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs border border-white/20 text-white/70"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>Admin Panel</span>
                <span className="px-3 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24', border: '1px solid' }}>
                  {stats.pending} Pending
                </span>
              </div>
              <h1 className="text-white mb-1" style={{ fontSize: '1.75rem' }}>CNIC Verification Review</h1>
              <p className="text-white/60">Review and manage tutor identity verification submissions.</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => refreshAllSubmissions()}
                disabled={loadingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 text-sm border border-white/20"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div animate={loadingAll ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: loadingAll ? Infinity : 0, ease: 'linear' }}>
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                Refresh
              </motion.button>
              <div className="flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                <span className="text-white/70 text-sm">Live queue</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border"
              style={{ borderColor: `${color}25`, boxShadow: `0 4px 24px ${color}12` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15` }}>
                  <span style={{ color }}>{icon}</span>
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: `${color}80` }} />
              </div>
              <div style={{ fontSize: '1.75rem', color, fontWeight: 700 }}>{value}</div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Filters & Search ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border mb-5 p-5"
          style={{ borderColor: 'rgba(122,184,186,0.2)', boxShadow: '0 4px 24px rgba(122,184,186,0.08)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border"
              style={{ borderColor: 'rgba(122,184,186,0.3)', background: 'var(--muted)' }}>
              <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or CNIC…"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--foreground)]"
                style={{ caretColor: '#7ab8ba' }} />
            </div>
            <div className="relative">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'rgba(122,184,186,0.3)', background: 'var(--muted)', color: 'var(--foreground)', minWidth: 140 }}>
                <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
                {statusFilter}
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] ml-auto" />
              </motion.button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border z-20 overflow-hidden min-w-[140px]"
                    style={{ borderColor: 'rgba(122,184,186,0.25)' }}>
                    {STATUS_FILTERS.map((f) => (
                      <button key={f} onClick={() => { setStatusFilter(f); setFilterOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-[var(--muted)] transition-colors"
                        style={{ color: statusFilter === f ? '#7ab8ba' : 'var(--foreground)', fontWeight: statusFilter === f ? 600 : 400 }}>
                        {f !== 'All' && STATUS_CONFIG[f as 'Pending' | 'Verified' | 'Rejected'].icon}
                        {f}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Submissions list ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--muted-foreground)]">
              Showing <strong style={{ color: '#7ab8ba' }}>{filtered.length}</strong> of {allSubmissions.length} submissions
            </span>
          </div>

          {loadingAll ? (
            <div className="flex items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 rounded-full"
                style={{ borderColor: 'rgba(122,184,186,0.3)', borderTopColor: '#7ab8ba' }} />
            </div>
          ) : (
            <AnimatePresence>
              {filtered.length > 0 ? (
                filtered.map((sub) => (
                  <SubmissionRow key={sub.id} sub={sub}
                    approving={actionLoading === sub.id}
                    onApprove={() => handleApprove(sub.id)}
                    onReject={() => setRejectTarget(sub)}
                    onPreview={() => setPreviewTarget(sub)} />
                ))
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(122,184,186,0.1)' }}>
                    <Search className="w-7 h-7 text-[var(--primary)]" />
                  </div>
                  <p className="text-[var(--foreground)]" style={{ fontWeight: 600 }}>No submissions found</p>
                  <p className="text-[var(--muted-foreground)] text-sm mt-1">Try adjusting your search or filter.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal submission={rejectTarget}
            loading={actionLoading === rejectTarget.id}
            onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
            onClose={() => setRejectTarget(null)} />
        )}
        {previewTarget && (
          <OcrDetailModal submission={previewTarget} onClose={() => setPreviewTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
