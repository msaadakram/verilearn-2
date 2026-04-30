/**
 * Messages — Universal Firebase chat dashboard.
 *
 * - Works for every user regardless of role (student / teacher / both).
 * - Sidebar tab "All People" shows every registered user from Firebase /users.
 * - Sidebar tab "Active Chats" shows real-time conversations with last message.
 * - Messages are delivered even when the recipient is offline (Firebase stores them).
 * - Search works across both tabs.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Send,
  Search,
  Smile,
  CheckCheck,
  Check,
  Circle,
  Sparkles,
  ChevronLeft,
  Mic,
  X,
  Users,
  MessageSquare,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  getOrCreateConversation,
  buildConvId,
  type FbConversation,
  type FbMessage,
  type FbUser,
} from '../services/firebase';
import { getStoredAuthUser } from '../services/auth';
import { useMessages } from '../context/MessageContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = [
  '😊', '👍', '🚀', '🎉', '💡', '✅', '❤️', '🔥',
  '😂', '🙌', '💪', '⭐', '🤔', '👏', '😎', '🙏',
  '📚', '💻', '🎯', '✨', '🌟', '💬', '🤝', '📝',
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  teacher: '#7ab8ba',
  student: '#8b5cf6',
  both: '#f59e0b',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] || '#6b7280';
  const label = role === 'both' ? 'Student + Teacher' : role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms?: number) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getPartnerUid(conv: FbConversation, myUid: string): string | null {
  return Object.keys(conv.participants).find((uid) => uid !== myUid) || null;
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: FbMessage; isMe: boolean }) {
  const isRead = !isMe || (msg.readBy && Object.keys(msg.readBy).length > 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} mt-3`}
    >
      {!isMe && (
        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
          <ImageWithFallback src={msg.senderAvatar || DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={isMe
            ? { background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)', color: 'white', borderRadius: '18px 18px 4px 18px', boxShadow: '0 4px 16px rgba(122,184,186,0.35)' }
            : { background: 'white', color: 'var(--foreground)', borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }
          }
        >
          {msg.text}
        </motion.div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[var(--muted-foreground)]">{formatTime(msg.createdAt)}</span>
          {isMe && (
            <span style={{ color: isRead ? '#7ab8ba' : 'var(--muted-foreground)' }}>
              {isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── TypingBubble ─────────────────────────────────────────────────────────────

function TypingBubble({ avatar }: { avatar: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="flex items-end gap-2.5 mt-2"
    >
      <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
        <ImageWithFallback src={avatar || DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="px-4 py-3 flex items-center gap-1.5 bg-white border" style={{ borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderColor: 'rgba(0,0,0,0.06)' }}>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} className="w-2 h-2 rounded-full block" style={{ background: '#7ab8ba' }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── SidebarItem ──────────────────────────────────────────────────────────────

function SidebarItem({
  idx, name, avatar, subtitle, role, unread, online, isActive, time, onClick,
}: {
  idx: number; name: string; avatar: string; subtitle?: string; role?: string;
  unread?: number; online?: boolean; isActive: boolean; time?: number; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.025, type: 'spring', stiffness: 260 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all group relative"
      style={isActive ? { background: 'linear-gradient(135deg, #7ab8ba18, #7ab8ba08)', boxShadow: '0 0 0 1.5px rgba(122,184,186,0.25)' } : {}}
    >
      {!isActive && <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--muted)' }} />}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden">
          <ImageWithFallback src={avatar || DEFAULT_AVATAR} alt={name} className="w-full h-full object-cover" />
        </div>
        {typeof online === 'boolean' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: online ? '#10b981' : '#d1d5db' }} />
        )}
      </div>
      <div className="flex-1 min-w-0 relative">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm truncate pr-1" style={{ color: isActive ? '#7ab8ba' : 'var(--foreground)', fontWeight: isActive ? 600 : 500 }}>
            {name}
          </span>
          {time ? <span className="text-[10px] text-[var(--muted-foreground)] flex-shrink-0">{formatTime(time)}</span> : role ? <RoleBadge role={role} /> : null}
        </div>
        {subtitle && (
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-[var(--muted-foreground)] truncate">{subtitle}</span>
            {unread && unread > 0 ? (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white flex-shrink-0" style={{ background: '#7ab8ba' }}>{unread}</span>
            ) : null}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 mt-1">
      <Icon className="w-3.5 h-3.5" style={{ color: '#7ab8ba' }} />
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7ab8ba' }}>{label}</span>
      {typeof count === 'number' && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(122,184,186,0.15)', color: '#5a9fa1' }}>{count}</span>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Messages() {
  const { teacherId: contactId } = useParams<{ teacherId?: string }>();
  const navigate = useNavigate();
  const currentUser = getStoredAuthUser();
  const myUid = currentUser?.id || '';
  const myName = currentUser?.name || 'User';
  const myAvatar = (currentUser as any)?.avatarUrl || '';
  const myRole = currentUser?.profession || 'student';
  const roleLabel = (myRole as string) === 'teacher' ? 'Teacher' : (myRole as string) === 'both' ? 'Student & Teacher' : 'Student';

  const {
    allUsers,
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    subscribeToMessages,
    unreadByConversation,
    unreadCount,
    markAsRead,
    resetUnreadForConversation,
    sendMessage,
    typingInConversation,
    isUserOnline,
    isConnected,
    emitTypingStart,
    emitTypingStop,
  } = useMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'people'>('chats');
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [ensuringConv, setEnsuringConv] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Active conversation ────────────────────────────────────────────────────

  const activeConversation = useMemo((): FbConversation | null => {
    if (!myUid) return null;
    if (contactId) {
      const tid = buildConvId(myUid, contactId);
      return conversations.find((c) => c.id === tid) || null;
    }
    return conversations[0] || null;
  }, [contactId, conversations, myUid]);

  const partnerUid = activeConversation ? getPartnerUid(activeConversation, myUid) : contactId || null;
  const partnerInfo = activeConversation && partnerUid ? activeConversation.participantInfo?.[partnerUid] : null;

  // Look up from allUsers if no conv yet
  const partnerFromDirectory = partnerUid ? allUsers.find((u) => u.uid === partnerUid) : null;
  const displayName = partnerInfo?.name || partnerFromDirectory?.name || partnerUid || '';
  const displayAvatar = partnerInfo?.avatar || partnerFromDirectory?.avatar || DEFAULT_AVATAR;
  const displayRole = partnerFromDirectory?.role;

  const activeMessages = activeConversation ? (messages[activeConversation.id] || []) : [];
  const typingUids = activeConversation ? (typingInConversation[activeConversation.id] || []) : [];
  const partnerIsTyping = typingUids.length > 0;

  // ── Search ────────────────────────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const uid = getPartnerUid(conv, myUid);
      const info = uid ? conv.participantInfo?.[uid] : null;
      return info?.name?.toLowerCase().includes(q) || conv.lastMessage?.text?.toLowerCase().includes(q);
    });
  }, [conversations, myUid, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) =>
      u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q),
    );
  }, [allUsers, searchQuery]);

  // UIDs of people already in conversations
  const activeConvUids = useMemo(
    () => new Set(conversations.map((c) => getPartnerUid(c, myUid)).filter(Boolean) as string[]),
    [conversations, myUid],
  );

  // ── Auto-create conversation when navigating via URL ──────────────────────

  useEffect(() => {
    if (!contactId || !myUid) return;
    const tid = buildConvId(myUid, contactId);
    if (conversations.some((c) => c.id === tid)) return;

    let cancelled = false;
    setEnsuringConv(true);
    const partner = allUsers.find((u) => u.uid === contactId);

    (async () => {
      try {
        await getOrCreateConversation(myUid, myName, myAvatar, contactId, partner?.name || '', partner?.avatar || '');
      } catch (err) {
        console.error('[Messages] Failed to create conversation:', err);
      } finally {
        if (!cancelled) setEnsuringConv(false);
      }
    })();

    return () => { cancelled = true; };
  }, [contactId, conversations, myUid, myName, myAvatar, allUsers]);

  // ── Subscribe to messages for active conversation ─────────────────────────

  useEffect(() => {
    if (!activeConversation) return;
    subscribeToMessages(activeConversation.id);
  }, [activeConversation?.id, subscribeToMessages]);

  // ── Auto-mark as read + reset Firebase unread counter ─────────────────────

  useEffect(() => {
    if (!activeConversation || !myUid) return;
    // Reset Firebase unread counter immediately when conversation opens
    void resetUnreadForConversation(activeConversation.id);
    // Also mark individual messages as read
    const unread = activeMessages.filter((m) => m.receiverId === myUid && !m.readBy?.[myUid]).map((m) => m.id);
    if (unread.length > 0) void markAsRead(activeConversation.id, unread);
  }, [activeConversation?.id, activeMessages.length, myUid, markAsRead, resetUnreadForConversation]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeConversation?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openChat = async (person: FbUser) => {
    await getOrCreateConversation(myUid, myName, myAvatar, person.uid, person.name, person.avatar || '');
    navigate(`/messages/${person.uid}`, { replace: true });
    setSidebarTab('chats');
  };

  const openConversation = (conv: FbConversation) => {
    const uid = getPartnerUid(conv, myUid);
    if (uid) {
      // Reset unread count immediately on click
      void resetUnreadForConversation(conv.id);
      navigate(`/messages/${uid}`, { replace: true });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let conv = activeConversation;
    const targetUid = partnerUid || contactId;

    // Create conversation if sending for the first time
    if (!conv && targetUid) {
      setEnsuringConv(true);
      const partner = allUsers.find((u) => u.uid === targetUid);
      try {
        await getOrCreateConversation(myUid, myName, myAvatar, targetUid, partner?.name || '', partner?.avatar || '');
        // Firebase subscription will update conversations array; get convId directly
        const convId = buildConvId(myUid, targetUid);
        setSending(true);
        await sendMessage(convId, targetUid, input.trim());
        setInput('');
        inputRef.current?.focus();
        return;
      } finally {
        setEnsuringConv(false);
        setSending(false);
      }
    }

    if (!conv || !targetUid) return;

    setSending(true);
    try {
      await sendMessage(conv.id, targetUid, input.trim());
      setInput('');
      setShowEmoji(false);
      emitTypingStop(conv.id);
      inputRef.current?.focus();
    } catch (err) {
      console.error('[Messages] Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeConversation) return;
    if (e.target.value.trim()) {
      emitTypingStart(activeConversation.id);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTypingStop(activeConversation.id), 2500);
    } else {
      emitTypingStop(activeConversation.id);
    }
  };

  const hasActiveChat = Boolean(activeConversation) || Boolean(contactId);
  const loadingThread = ensuringConv || Boolean(activeConversation && loadingMessages[activeConversation.id]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen pt-[73px]" style={{ background: 'linear-gradient(160deg, #f0f9f9 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, #7ab8ba 0%, transparent 70%)', opacity: 0.1 }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', opacity: 0.07 }} />
      </div>

      <div className="relative flex w-full max-w-7xl mx-auto" style={{ zIndex: 1 }}>

        {/* ══ Sidebar ═══════════════════════════════════════════════════════ */}
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.aside
              key="sidebar"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col shrink-0 bg-white/80 backdrop-blur-xl border-r"
              style={{ width: '20rem', borderColor: 'rgba(122,184,186,0.18)', position: 'relative', zIndex: 10 }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={currentUser?.profession === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'}
                      className="w-8 h-8 rounded-xl border border-[var(--border)] flex items-center justify-center bg-white hover:border-[var(--primary)] transition-all md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
                    </Link>
                    <div>
                      <h2 className="text-[var(--foreground)]">Messages</h2>
                      <div className="text-xs text-[var(--muted-foreground)]">Message anyone</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs" style={{ background: isConnected ? 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' : 'var(--muted)', color: isConnected ? 'white' : 'var(--muted-foreground)' }}>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: 'var(--muted)' }}>
                  <button
                    onClick={() => setSidebarTab('chats')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={sidebarTab === 'chats'
                      ? { background: 'white', color: '#7ab8ba', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }
                      : { color: 'var(--muted-foreground)' }
                    }
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chats
                    {unreadCount > 0 ? (
                      <motion.span
                        key={unreadCount}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[10px] px-1.5 rounded-full text-white font-semibold"
                        style={{ background: '#ef4444', minWidth: '1.1rem', textAlign: 'center', lineHeight: '1.4rem' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    ) : conversations.length > 0 ? (
                      <span className="text-[10px] px-1 rounded-full" style={{ background: sidebarTab === 'chats' ? 'rgba(122,184,186,0.15)' : 'rgba(0,0,0,0.08)' }}>
                        {conversations.length}
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => setSidebarTab('people')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={sidebarTab === 'people'
                      ? { background: 'white', color: '#7ab8ba', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }
                      : { color: 'var(--muted-foreground)' }
                    }
                  >
                    <Users className="w-3.5 h-3.5" />
                    All People
                    {allUsers.length > 0 && (
                      <span className="text-[10px] px-1 rounded-full" style={{ background: sidebarTab === 'people' ? 'rgba(122,184,186,0.15)' : 'rgba(0,0,0,0.08)' }}>
                        {allUsers.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder={sidebarTab === 'chats' ? 'Search chats...' : 'Search people...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--muted)', caretColor: '#7ab8ba' }}
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">

                {/* ── Chats tab ──────────────────────────────────────────── */}
                {sidebarTab === 'chats' && (
                  <>
                    <SectionHeader icon={MessageSquare} label="Active Chats" count={filteredConversations.length} />
                    {loadingConversations ? (
                      <div className="py-10 text-center text-xs text-[var(--muted-foreground)]">Loading…</div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="py-8 text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(122,184,186,0.4)' }} />
                        <p className="text-xs text-[var(--muted-foreground)]">No chats yet.<br />Open <strong>All People</strong> to start one.</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv, idx) => {
                        const uid = getPartnerUid(conv, myUid);
                        if (!uid) return null;
                        const info = conv.participantInfo?.[uid];
                        const isActive = activeConversation?.id === conv.id;
                        const unread = unreadByConversation[conv.id] || 0;
                        return (
                          <SidebarItem
                            key={conv.id}
                            idx={idx}
                            name={info?.name || uid}
                            avatar={info?.avatar || DEFAULT_AVATAR}
                            subtitle={conv.lastMessage?.text || 'Start a conversation'}
                            unread={unread}
                            online={isUserOnline(uid)}
                            isActive={isActive}
                            time={conv.lastMessage?.sentAt}
                            onClick={() => openConversation(conv)}
                          />
                        );
                      })
                    )}
                  </>
                )}

                {/* ── People tab ─────────────────────────────────────────── */}
                {sidebarTab === 'people' && (
                  <>
                    <SectionHeader icon={Users} label="All Registered Users" count={filteredUsers.length} />
                    {filteredUsers.length === 0 ? (
                      <div className="py-8 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(122,184,186,0.4)' }} />
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {allUsers.length === 0
                            ? 'No other users have logged in yet.'
                            : 'No results match your search.'}
                        </p>
                      </div>
                    ) : (
                      filteredUsers.map((person, idx) => {
                        const convId = buildConvId(myUid, person.uid);
                        const existingConv = conversations.find((c) => c.id === convId);
                        const isActive = contactId === person.uid;
                        return (
                          <SidebarItem
                            key={person.uid}
                            idx={idx}
                            name={person.name}
                            avatar={person.avatar || DEFAULT_AVATAR}
                            subtitle={existingConv?.lastMessage?.text || 'Tap to message'}
                            role={person.role}
                            online={isUserOnline(person.uid)}
                            isActive={isActive}
                            time={existingConv?.lastMessage?.sentAt}
                            unread={activeConvUids.has(person.uid) ? unreadByConversation[convId] : undefined}
                            onClick={() => openChat(person)}
                          />
                        );
                      })
                    )}
                  </>
                )}
              </div>

              {/* User footer */}
              <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'var(--muted)' }}>
                  <div className="relative">
                    <ImageWithFallback src={myAvatar || DEFAULT_AVATAR} alt={myName} className="w-9 h-9 rounded-xl object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--foreground)] truncate">{myName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{roleLabel}</div>
                  </div>
                  <Link to={currentUser?.profession === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                    <ArrowLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </Link>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ══ Chat area ══════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {hasActiveChat && displayName ? (
            <>
              {/* Chat header */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b flex-shrink-0"
                style={{ borderColor: 'rgba(122,184,186,0.18)' }}
              >
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSidebar((v) => !v)} className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center bg-white transition-all flex-shrink-0">
                  <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" style={{ transform: showSidebar ? 'rotate(0deg)' : 'rotate(180deg)' }} />
                </motion.button>

                <div className="relative flex-shrink-0">
                  <motion.div whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-xl overflow-hidden" style={{ boxShadow: '0 0 0 2px rgba(122,184,186,0.35)' }}>
                    <ImageWithFallback src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                  </motion.div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: partnerUid && isUserOnline(partnerUid) ? '#10b981' : '#d1d5db' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--foreground)] text-sm font-semibold truncate">{displayName}</span>
                    {displayRole && <RoleBadge role={displayRole} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs h-4">
                    {partnerIsTyping ? (
                      <span className="flex items-center gap-1" style={{ color: '#7ab8ba' }}>
                        <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />typing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <Circle className={`w-2 h-2 ${partnerUid && isUserOnline(partnerUid) ? 'fill-emerald-400 text-emerald-400' : 'fill-gray-300 text-gray-300'}`} />
                        {partnerUid && isUserOnline(partnerUid) ? 'Online' : 'Offline — message will be delivered'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                  <span className="text-xs text-[var(--muted-foreground)] px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.8)' }}>Today</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                </div>

                {loadingThread ? (
                  <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">Loading conversation…</div>
                ) : activeMessages.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-5">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute -inset-2 rounded-2xl opacity-60" style={{ background: 'conic-gradient(from 0deg, #7ab8ba, #8b5cf6, #7ab8ba)' }} />
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white">
                        <ImageWithFallback src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <h3 className="text-[var(--foreground)] mb-1">{displayName}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-5">Say hello{partnerUid && !isUserOnline(partnerUid) ? ' — they\'ll see it when they come back online' : ''}!</p>
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(122,184,186,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setInput(`Hi ${displayName.split(' ')[0]}! `); inputRef.current?.focus(); }}
                      className="px-6 py-3 rounded-xl text-white flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}
                    >
                      <Sparkles className="w-4 h-4" />Start conversation
                    </motion.button>
                  </motion.div>
                ) : (
                  activeMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === myUid} />)
                )}

                <AnimatePresence>
                  {partnerIsTyping && <TypingBubble avatar={displayAvatar} />}
                </AnimatePresence>

                <div ref={bottomRef} />
              </div>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.95 }}
                    className="mx-5 mb-2 p-3 rounded-2xl bg-white/95 backdrop-blur-xl grid grid-cols-8 gap-1 flex-shrink-0"
                    style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(122,184,186,0.18)' }}
                  >
                    <div className="col-span-8 flex items-center justify-between mb-1 pb-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                      <span className="text-xs text-[var(--muted-foreground)]">Quick reactions</span>
                      <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowEmoji(false)}><X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /></motion.button>
                    </div>
                    {EMOJIS.map((emoji) => (
                      <motion.button key={emoji} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }} onClick={() => { setInput((p) => p + emoji); inputRef.current?.focus(); }} className="text-xl p-1 rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center justify-center">{emoji}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="px-5 pb-5 pt-3 flex-shrink-0">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/90 backdrop-blur-xl" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.1), 0 0 0 1.5px rgba(122,184,186,0.22)' }}>
                  <div className="flex-1 min-w-0">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Message ${displayName.split(' ')[0] || 'user'}...`}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKey}
                      className="w-full bg-transparent outline-none text-[var(--foreground)] py-2 px-3 text-sm"
                      style={{ caretColor: '#7ab8ba' }}
                    />
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                    <motion.button whileHover={{ scale: 1.15 }} onClick={() => setShowEmoji((v) => !v)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: showEmoji ? '#7ab8ba' : 'var(--muted-foreground)' }}>
                      <Smile className="w-4 h-4" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted-foreground)]">
                      <Mic className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={!sending && input.trim() ? { scale: 1.08 } : {}}
                      whileTap={!sending && input.trim() ? { scale: 0.95 } : {}}
                      onClick={() => { void handleSend(); }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background: input.trim() && !sending ? 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' : 'var(--muted)',
                        color: input.trim() && !sending ? 'white' : 'var(--muted-foreground)',
                        boxShadow: input.trim() && !sending ? '0 4px 16px rgba(122,184,186,0.40)' : 'none',
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                <p className="text-center text-xs text-[var(--muted-foreground)] mt-2 opacity-50">
                  {partnerUid && !isUserOnline(partnerUid) ? '📬 Offline — message queued via Firebase' : 'Press Enter to send · Firebase'}
                </p>
              </div>
            </>
          ) : (
            /* No active chat */
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-center px-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, rgba(122,184,186,0.15), rgba(139,92,246,0.1))' }}>
                  <Sparkles className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h3 className="text-[var(--foreground)] mb-2">Send a message to anyone</h3>
                <p className="text-[var(--muted-foreground)] text-sm max-w-xs mb-5">
                  Students, teachers, everyone — they'll receive your message even if offline.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSidebarTab('people')}
                  className="px-5 py-2.5 rounded-xl text-white text-sm flex items-center gap-2 mx-auto"
                  style={{ background: 'linear-gradient(135deg, #7ab8ba, #5a9fa1)' }}
                >
                  <Users className="w-4 h-4" />
                  Browse All People
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}