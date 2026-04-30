import { useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck,
  Camera, FileImage, X, AlertCircle, Eye, RotateCcw, Send,
  CreditCard, User, Info,
} from 'lucide-react';
import { useCnic } from '../context/CnicContext';
import {
  isCnicApiError,
  verifyCnicImage,
  type CnicVerificationResponse,
} from '../services/cnic';
import { getStoredAuthUser } from '../services/auth';

/* ── Step definitions ──────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Front Side', desc: 'Upload the front of your CNIC (used for Gemini extraction)' },
  { id: 2, label: 'Back Side', desc: 'Upload the back of your CNIC (required for submission records)' },
  { id: 3, label: 'CNIC Number', desc: 'Enter your 13-digit CNIC number' },
  { id: 4, label: 'Review', desc: 'Confirm and submit for verification' },
];

/* ── Helpers ────────────────────────────────────────────────── */
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function normalizeCnic(raw: string | null | undefined): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 13);
  if (digits.length !== 13) {
    return '';
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function getCnicUploadErrorGuidance(error: unknown): {
  message: string;
  targetStep?: number;
  clearFront?: boolean;
  clearBack?: boolean;
} {
  if (!isCnicApiError(error)) {
    return {
      message: error instanceof Error ? error.message : 'CNIC verification failed. Please try again.',
    };
  }

  switch (error.errorCode) {
    case 'CNIC_NOT_FOUND':
      return {
        message: 'Please upload a valid CNIC image. We could not detect a CNIC on the uploaded front side.',
        targetStep: 1,
        clearFront: true,
      };
    case 'CNIC_LOW_CONFIDENCE':
      return {
        message: 'Please upload another valid CNIC image. Confidence is below 50% (image may be blurry or unclear).',
        targetStep: 1,
        clearFront: true,
      };
    case 'CNIC_MISMATCH':
      return {
        message: 'Entered CNIC number does not match the CNIC in the image. Please correct the number or upload the correct CNIC image.',
        targetStep: 3,
      };
    case 'CNIC_ALREADY_REGISTERED':
      return {
        message: error.message || 'This CNIC is already registered. Please use a different CNIC.',
        targetStep: 3,
      };
    default:
      return {
        message: error.message || 'CNIC verification failed. Please upload a valid CNIC image and try again.',
      };
  }
}

/* ── ImageDropzone ──────────────────────────────────────────── */
function ImageDropzone({
  label, value, onChange, onClear,
}: {
  label: string;
  value: string | null;
  onChange: (payload: { preview: string; file: File }) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState(false);

  const process = useCallback(async (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, WebP).'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return; }
    const b64 = await fileToBase64(file);
    onChange({ preview: b64, file });
  }, [onChange]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) process(file);
  };

  return (
    <div className="w-full">
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f); }} />

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div key="preview"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="relative rounded-2xl overflow-hidden border-2"
            style={{ borderColor: 'rgba(122,184,186,0.4)', background: '#f0f9f9' }}>
            <img src={value} alt={label} className="w-full h-48 object-cover" />
            {/* Overlay on hover */}
            <motion.div
              initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center gap-3"
              style={{ background: 'rgba(26,35,50,0.6)', backdropFilter: 'blur(4px)' }}>
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Eye className="w-4 h-4" /> Preview
              </motion.button>
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
                style={{ background: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <RotateCcw className="w-4 h-4" /> Re-upload
              </motion.button>
            </motion.div>
            {/* Corner badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs"
              style={{ background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(8px)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </div>
          </motion.div>
        ) : (
          <motion.div key="dropzone"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            className="relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-3"
            style={{
              borderColor: dragging ? '#7ab8ba' : 'rgba(122,184,186,0.35)',
              background: dragging ? 'rgba(122,184,186,0.08)' : 'rgba(122,184,186,0.03)',
            }}>
            {/* Animated orb */}
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, rgba(122,184,186,0.12) 0%, transparent 70%)' }} />
            <motion.div animate={{ y: dragging ? -6 : 0 }} transition={{ type: 'spring', stiffness: 300 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.2), rgba(122,184,186,0.08))' }}>
              {dragging ? <Camera className="w-6 h-6" style={{ color: '#7ab8ba' }} /> : <FileImage className="w-6 h-6" style={{ color: '#7ab8ba' }} />}
            </motion.div>
            <div className="text-center px-4">
              <p className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>
                {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">JPG, PNG, WebP · Max 5 MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}

      {/* Full-screen preview modal */}
      <AnimatePresence>
        {previewing && value && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setPreviewing(false)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl w-full">
              <button onClick={() => setPreviewing(false)}
                className="absolute -top-4 -right-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
                style={{ background: '#1a2332', border: '2px solid rgba(255,255,255,0.15)' }}>
                <X className="w-4 h-4 text-white" />
              </button>
              <img src={value} alt={label} className="w-full rounded-2xl shadow-2xl" />
              <p className="text-center text-white/60 text-sm mt-3">{label}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export function CnicUpload() {
  const navigate = useNavigate();
  const { mySubmission, cnicStatus, refreshMySubmission, loadingMine } = useCnic();
  const authUser = getStoredAuthUser();

  const [step, setStep] = useState(1);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [cnicRaw, setCnicRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ocrResult, setOcrResult] = useState<CnicVerificationResponse | null>(null);

  const cnicFormatted = formatCnic(cnicRaw);
  const cnicDigits = cnicRaw.replace(/\D/g, '');
  const cnicValid = cnicDigits.length === 13;

  const canNext =
    (step === 1 && !!frontImage) ||
    (step === 2 && !!backImage) ||
    (step === 3 && cnicValid) ||
    step === 4;

  const handleSubmit = async () => {
    if (!frontImageFile || !frontImage) {
      setSubmitError('Please upload the front image of your CNIC.');
      return;
    }

    if (!backImageFile || !backImage) {
      setSubmitError('Please upload the back image of your CNIC.');
      return;
    }

    if (!cnicValid) {
      setSubmitError('Please enter a valid 13-digit CNIC number before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const enteredCnic = normalizeCnic(cnicFormatted);
      // Send front+back images + typed CNIC number to backend.
      // Backend performs Gemini extraction using the front image, validates the CNIC, and saves only if it matches.
      const verification = await verifyCnicImage(frontImageFile, backImageFile, enteredCnic);

      setOcrResult(verification);
      // Refresh context so status screen shows immediately
      await refreshMySubmission();
      setSubmitted(true);
    } catch (error) {
      const guidance = getCnicUploadErrorGuidance(error);
      setSubmitError(guidance.message);

      if (typeof guidance.targetStep === 'number') {
        setStep(guidance.targetStep);
      }

      if (guidance.clearFront) {
        setFrontImage(null);
        setFrontImageFile(null);
      }

      if (guidance.clearBack) {
        setBackImage(null);
        setBackImageFile(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading state ──────────────────────────────────────── */
  if (loadingMine) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center px-6 bg-slate-50">
        <div className="text-gray-500 animate-pulse text-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Checking CNIC status...
        </div>
      </div>
    );
  }

  /* ── Success screen ─────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen pt-[73px] flex items-center justify-center px-6"
        style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-md w-full text-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', boxShadow: '0 0 60px rgba(122,184,186,0.4)' }}>
            <ShieldCheck className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-[var(--foreground)] mb-3" style={{ fontSize: '1.75rem' }}>Submitted Successfully!</h1>
          <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
            Your CNIC has been submitted for review. Our team will verify your identity within <strong>1–2 business days</strong>. You'll be notified once the review is complete.
          </p>
          <div className="p-5 rounded-2xl mb-8 text-left space-y-3"
            style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.25)' }}>
            {[
              { label: 'CNIC Number', value: cnicFormatted },
              ...(ocrResult?.name ? [{ label: 'Detected Name', value: ocrResult.name }] : []),
              ...(ocrResult?.dob ? [{ label: 'Detected DOB', value: ocrResult.dob }] : []),
              ...(ocrResult?.issue_date ? [{ label: 'Issue Date', value: ocrResult.issue_date }] : []),
              ...(ocrResult?.expiry_date ? [{ label: 'Expiry Date', value: ocrResult.expiry_date }] : []),
              ...(ocrResult?.cnic ? [{ label: 'Detected CNIC', value: ocrResult.cnic }] : []),
              ...(typeof ocrResult?.confidence === 'number'
                ? [{ label: 'Gemini Confidence', value: `${Math.round(ocrResult.confidence * 100)}%` }]
                : []),
              { label: 'Status', value: 'Verified' },
              { label: 'Submitted', value: new Date().toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm" style={{ color: '#1a2332', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/teacher-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── If already submitted/verified — show status screen ── */
  if (cnicStatus === 'Pending' || cnicStatus === 'Verified') {
    return <AlreadySubmitted status={cnicStatus} submission={mySubmission} />;
  }

  return (
    <div className="min-h-screen pt-[73px]"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>

      {/* Decorative orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-10" style={{ zIndex: 1 }}>

        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/teacher-dashboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors group">
            <motion.div whileHover={{ x: -4 }}
              className="w-8 h-8 rounded-xl border border-[var(--border)] flex items-center justify-center bg-white/80 backdrop-blur-sm group-hover:border-[var(--primary)] transition-all">
              <ArrowLeft className="w-4 h-4" />
            </motion.div>
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[var(--foreground)] mb-2" style={{ fontSize: '1.75rem' }}>CNIC Verification</h1>
          <p className="text-[var(--muted-foreground)]">
            Verify your identity to build student trust and unlock the <strong>Verified Tutor</strong> badge.
          </p>
        </motion.div>

        {/* Step progress bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <motion.div
                  animate={{ scale: step === s.id ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{
                    zIndex: 1,
                    background:
                      step > s.id
                        ? 'linear-gradient(135deg, #10b981, #34d399)'
                        : step === s.id
                          ? 'linear-gradient(135deg, #7ab8ba, #5a9fa1)'
                          : 'var(--muted)',
                  }}>
                  {step > s.id
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <span className="text-sm" style={{ color: step === s.id ? '#fff' : 'var(--muted-foreground)', fontWeight: 600 }}>{s.id}</span>}
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'var(--muted)' }}>
                    <motion.div className="h-full rounded-full"
                      animate={{ width: step > s.id ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: 'linear-gradient(90deg, #10b981, #7ab8ba)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-xs text-[var(--muted-foreground)]">
              Step {step} of {STEPS.length} — <strong style={{ color: '#7ab8ba' }}>{STEPS[step - 1].label}</strong>
            </span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-3xl border overflow-hidden shadow-xl"
          style={{ borderColor: 'rgba(122,184,186,0.25)', boxShadow: '0 8px 48px rgba(122,184,186,0.15)' }}>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Front ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="p-8">
                <StepHeader icon={<Camera className="w-5 h-5 text-white" />} title="Front Side of CNIC" color="#7ab8ba"
                  desc="Upload a clear photo of the FRONT of your CNIC. This image is sent to Gemini to extract your identity details." />
                <InfoTip text="Make sure the photo is well-lit and all text is legible. Avoid glare or shadows." />
                <ImageDropzone
                  label="CNIC Front"
                  value={frontImage}
                  onChange={({ preview, file }) => {
                    setFrontImage(preview);
                    setFrontImageFile(file);
                    setSubmitError('');
                  }}
                  onClear={() => {
                    setFrontImage(null);
                    setFrontImageFile(null);
                    setOcrResult(null);
                  }}
                />
              </motion.div>
            )}

            {/* ── Step 2: Back ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="p-8">
                <StepHeader icon={<Camera className="w-5 h-5 text-white" />} title="Back Side of CNIC (Required)" color="#8b5cf6"
                  desc="Upload a clear photo of the BACK of your CNIC. This is required for submission records and admin review." />
                <ImageDropzone
                  label="CNIC Back"
                  value={backImage}
                  onChange={({ preview, file }) => {
                    setBackImage(preview);
                    setBackImageFile(file);
                    setSubmitError('');
                  }}
                  onClear={() => {
                    setBackImage(null);
                    setBackImageFile(null);
                  }}
                />
              </motion.div>
            )}

            {/* ── Step 3: CNIC Number ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="p-8">
                <StepHeader icon={<CreditCard className="w-5 h-5 text-white" />} title="Enter Your CNIC Number" color="#f59e0b"
                  desc="Type your 13-digit CNIC number exactly as it appears on your card." />
                <InfoTip text="Format: XXXXX-XXXXXXX-X (e.g. 42101-1234567-9). Your number will be cross-checked against the uploaded images." />
                <div className="mt-2">
                  <label className="text-xs text-[var(--muted-foreground)] mb-2 block">CNIC Number</label>
                  <motion.div animate={cnicFormatted && !cnicValid
                    ? { boxShadow: '0 0 0 3px rgba(245,158,11,0.25)' }
                    : cnicValid
                      ? { boxShadow: '0 0 0 3px rgba(16,185,129,0.25)' }
                      : { boxShadow: '0 0 0 0px transparent' }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
                    style={{ borderColor: cnicValid ? '#10b981' : cnicFormatted ? '#f59e0b' : 'rgba(122,184,186,0.35)', background: 'var(--muted)' }}>
                    <CreditCard className="w-5 h-5 flex-shrink-0" style={{ color: cnicValid ? '#10b981' : '#7ab8ba' }} />
                    <input
                      type="text" value={cnicFormatted} placeholder="XXXXX-XXXXXXX-X"
                      onChange={(e) => setCnicRaw(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-transparent outline-none text-[var(--foreground)]"
                      style={{ caretColor: '#7ab8ba', letterSpacing: '0.05em' }}
                    />
                    {cnicValid && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />}
                  </motion.div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    {cnicDigits.length}/13 digits entered
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="p-8">
                <StepHeader icon={<ShieldCheck className="w-5 h-5 text-white" />} title="Review & Submit" color="#10b981"
                  desc="Double-check your details before submitting for review." />
                <div className="space-y-4 mt-2">
                  {/* Images */}
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Front Side (Gemini)', img: frontImage }, { label: 'Back Side', img: backImage }].map(({ label, img }) => (
                      <div key={label} className="rounded-xl overflow-hidden border"
                        style={{ borderColor: 'rgba(122,184,186,0.3)' }}>
                        {img ? (
                          <img src={img} alt={label} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                            <span className="text-xs text-[var(--muted-foreground)]">Not uploaded</span>
                          </div>
                        )}
                        <div className="px-3 py-2 flex items-center gap-1.5"
                          style={{ background: img ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                          {img
                            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                            : <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />}
                          <span className="text-xs" style={{ color: img ? '#059669' : '#ef4444', fontWeight: 600 }}>{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* CNIC Number */}
                  <div className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.25)' }}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" style={{ color: '#7ab8ba' }} />
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">CNIC Number</p>
                        <p className="text-sm" style={{ color: '#1a2332', fontWeight: 700, letterSpacing: '0.05em' }}>{cnicFormatted}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />
                  </div>
                  {/* Authenticated user info */}
                  <div className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(26,35,50,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
                    <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">Submitting as</p>
                      <p className="text-sm" style={{ color: '#1a2332', fontWeight: 600 }}>{authUser?.name || 'Teacher'}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{authUser?.email}</p>
                    </div>
                  </div>
                  {/* Legal notice */}
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed px-1">
                    By submitting, you confirm that the uploaded documents and information are genuine and belong to you. False submissions may result in account suspension.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation footer ── */}
          <div className="px-8 pb-8 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            {submitError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#b91c1c' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all"
                style={step === 1
                  ? { background: 'var(--muted)', color: 'var(--muted-foreground)', opacity: 0.5, cursor: 'not-allowed' }
                  : { background: 'var(--muted)', color: 'var(--foreground)' }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </motion.button>

              {step < 4 ? (
                <motion.button whileHover={canNext ? { scale: 1.04, boxShadow: '0 0 30px rgba(122,184,186,0.4)' } : {}}
                  whileTap={canNext ? { scale: 0.97 } : {}}
                  onClick={() => canNext && setStep((s) => s + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white transition-all"
                  style={{
                    background: canNext ? 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' : 'var(--muted)',
                    color: canNext ? '#fff' : 'var(--muted-foreground)',
                    cursor: canNext ? 'pointer' : 'not-allowed',
                  }}>
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={!submitting ? { scale: 1.04, boxShadow: '0 0 40px rgba(16,185,129,0.4)' } : {}}
                  whileTap={!submitting ? { scale: 0.97 } : {}}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {submitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Submitting…
                    </>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit for Verification</>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */
function StepHeader({ icon, title, desc, color }: { icon: ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        {icon}
      </div>
      <div>
        <h2 className="text-[var(--foreground)] mb-0.5">{title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{desc}</p>
      </div>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl mb-5"
      style={{ background: 'rgba(122,184,186,0.08)', border: '1px solid rgba(122,184,186,0.2)' }}>
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7ab8ba' }} />
      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{text}</p>
    </div>
  );
}

function AlreadySubmitted({ status, submission }: { status: string; submission: any }) {
  const isVerified = status === 'Verified';
  const color = isVerified ? '#10b981' : '#f59e0b';
  const Icon = isVerified ? CheckCircle2 : AlertCircle;

  return (
    <div className="min-h-screen pt-[73px] flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `2px solid ${color}40` }}>
          <Icon className="w-10 h-10" style={{ color }} />
        </div>
        <h2 className="text-[var(--foreground)] mb-2">
          {isVerified ? 'Identity Verified!' : 'Verification In Progress'}
        </h2>
        <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
          {isVerified
            ? 'Your CNIC has been verified. Your Verified Tutor badge is now active on your profile.'
            : 'Your CNIC is currently under review. You\'ll be notified once the process is complete (usually 1–2 business days).'}
        </p>
        {submission && (
          <div className="p-5 rounded-2xl mb-6 text-left space-y-3"
            style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
            {[
              { label: 'CNIC Number', value: submission.cnicNumberEntered || submission.enteredCnicNumber || submission.parsedCnicNumber || submission.ocrCnic || '—' },
              ...(submission.parsedCnicNumber || submission.ocrCnic ? [{ label: 'Detected CNIC', value: submission.parsedCnicNumber || submission.ocrCnic }] : []),
              ...(submission.parsedName ? [{ label: 'Detected Name', value: submission.parsedName }] : []),
              ...(submission.parsedDob || submission.ocrDob ? [{ label: 'Date of Birth', value: submission.parsedDob || submission.ocrDob }] : []),
              ...(submission.parsedIssueDate ? [{ label: 'Issue Date', value: submission.parsedIssueDate }] : []),
              ...(submission.parsedExpiryDate ? [{ label: 'Expiry Date', value: submission.parsedExpiryDate }] : []),
              ...(submission.parsedConfidence != null ? [{ label: 'OCR Confidence', value: `${Math.round(submission.parsedConfidence * 100)}%` }] : submission.ocrConfidence != null ? [{ label: 'OCR Confidence', value: `${Math.round(submission.ocrConfidence * 100)}%` }] : []),
              { label: 'Status', value: status },
              { label: 'Submitted', value: new Date(submission.submittedAt).toLocaleString() },
              ...(submission.reviewedAt ? [{ label: 'Reviewed', value: new Date(submission.reviewedAt).toLocaleString() }] : []),
              ...(submission.rejectionReason ? [{ label: 'Reason', value: submission.rejectionReason }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm" style={{ color: '#1a2332', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}
        <Link to="/teacher-dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
