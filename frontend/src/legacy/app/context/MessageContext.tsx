/**
 * MessageContext — Firebase Realtime Database powered chat context.
 *
 * Unread counts are stored in /conversations/{convId}/unreadCounts/{uid}
 * and incremented atomically on every sent message.  This gives instant
 * real-time badge counts without subscribing to every message document.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  subscribeUserConversations,
  subscribeMessages,
  sendFirebaseMessage,
  markMessageRead,
  setPresenceOnline,
  subscribePresence,
  setTypingIndicator,
  subscribeTyping,
  registerUserInFirebase,
  subscribeAllUsers,
  resetUnreadCount,
  type FbConversation,
  type FbMessage,
  type FbUser,
} from '../services/firebase';
import { AUTH_SESSION_CHANGED_EVENT, getStoredAuthUser } from '../services/auth';

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CONV_CACHE_KEY = (uid: string) => `vl_convs_${uid}`;
const USERS_CACHE_KEY = (uid: string) => `vl_users_${uid}`;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function writeCache(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageContextType {
  allUsers: FbUser[];
  conversations: FbConversation[];
  loadingConversations: boolean;
  messages: Record<string, FbMessage[]>;
  loadingMessages: Record<string, boolean>;
  subscribeToMessages: (convId: string) => void;
  /** Unread count per conversationId, derived from Firebase unreadCounts */
  unreadByConversation: Record<string, number>;
  /** Total unread across all conversations */
  unreadCount: number;
  markAsRead: (convId: string, msgIds: string[]) => Promise<void>;
  /** Call when user opens a conversation to reset its unread counter */
  resetUnreadForConversation: (convId: string) => Promise<void>;
  typingInConversation: Record<string, string[]>;
  isUserOnline: (uid: string) => boolean;
  isConnected: boolean;
  sendMessage: (convId: string, receiverId: string, text: string) => Promise<void>;
  emitTypingStart: (convId: string) => void;
  emitTypingStop: (convId: string) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const initialUid = () => getStoredAuthUser()?.id || '';

  const [myUid, setMyUid] = useState<string>(initialUid);

  const [conversations, setConversations] = useState<FbConversation[]>(() =>
    readCache<FbConversation[]>(CONV_CACHE_KEY(initialUid())) ?? [],
  );
  const [allUsers, setAllUsers] = useState<FbUser[]>(() =>
    readCache<FbUser[]>(USERS_CACHE_KEY(initialUid())) ?? [],
  );
  const [loadingConversations, setLoadingConversations] = useState<boolean>(() => {
    const uid = initialUid();
    return uid ? readCache<FbConversation[]>(CONV_CACHE_KEY(uid)) === null : false;
  });

  const [messages, setMessages] = useState<Record<string, FbMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingInConversation, setTypingInConversation] = useState<Record<string, string[]>>({});

  const unsubConvRef = useRef<(() => void) | null>(null);
  const unsubUsersRef = useRef<(() => void) | null>(null);
  const unsubMsgsRef = useRef<Record<string, () => void>>({});
  const unsubPresenceRef = useRef<Record<string, () => void>>({});
  const unsubTypingRef = useRef<Record<string, () => void>>({});
  const cleanupPresenceRef = useRef<(() => void) | null>(null);

  // ── Unread counts from conversation metadata (no message crawling) ─────────

  const unreadByConversation: Record<string, number> = {};
  let unreadCount = 0;
  if (myUid) {
    conversations.forEach((conv) => {
      const n = conv.unreadCounts?.[myUid] ?? 0;
      unreadByConversation[conv.id] = n;
      unreadCount += n;
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (convId: string, msgIds: string[]) => {
    if (!myUid) return;
    await Promise.all(msgIds.map((id) => markMessageRead(convId, id, myUid)));
  }, [myUid]);

  const resetUnreadForConversation = useCallback(async (convId: string) => {
    if (!myUid) return;
    void resetUnreadCount(convId, myUid);
  }, [myUid]);

  const sendMessage = useCallback(async (convId: string, receiverId: string, text: string) => {
    if (!myUid || !text.trim()) return;
    const user = getStoredAuthUser();
    await sendFirebaseMessage(convId, {
      text: text.trim(),
      senderId: myUid,
      senderName: user?.name || 'User',
      senderAvatar: (user as any)?.avatarUrl || '',
      receiverId,
      createdAt: Date.now(),
    });
  }, [myUid]);

  const emitTypingStart = useCallback((convId: string) => {
    if (myUid) setTypingIndicator(convId, myUid, true);
  }, [myUid]);

  const emitTypingStop = useCallback((convId: string) => {
    if (myUid) setTypingIndicator(convId, myUid, false);
  }, [myUid]);

  const subscribeToMessages = useCallback((convId: string) => {
    if (unsubMsgsRef.current[convId]) return;
    setLoadingMessages((prev) => ({ ...prev, [convId]: true }));
    unsubMsgsRef.current[convId] = subscribeMessages(convId, (msgs) => {
      setMessages((prev) => ({ ...prev, [convId]: msgs }));
      setLoadingMessages((prev) => ({ ...prev, [convId]: false }));
    });
    if (!unsubTypingRef.current[convId] && myUid) {
      unsubTypingRef.current[convId] = subscribeTyping(convId, myUid, (uids) => {
        setTypingInConversation((prev) => ({ ...prev, [convId]: uids }));
      });
    }
  }, [myUid]);

  // ── Presence ──────────────────────────────────────────────────────────────

  const isUserOnline = useCallback((uid: string) => onlineUsers[uid] === true, [onlineUsers]);

  useEffect(() => {
    if (!myUid) return;
    conversations.forEach((conv) => {
      const partnerUid = Object.keys(conv.participants).find((u) => u !== myUid);
      if (!partnerUid || unsubPresenceRef.current[partnerUid]) return;
      unsubPresenceRef.current[partnerUid] = subscribePresence(partnerUid, (online) => {
        setOnlineUsers((prev) => ({ ...prev, [partnerUid]: online }));
      });
    });
  }, [conversations, myUid]);

  // ── Main setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!myUid) return;

    const user = getStoredAuthUser();
    void registerUserInFirebase(
      myUid,
      user?.name || 'User',
      (user as any)?.avatarUrl || '',
      user?.profession || 'student',
    );
    cleanupPresenceRef.current = setPresenceOnline(myUid);

    unsubConvRef.current = subscribeUserConversations(myUid, (convs) => {
      setConversations(convs);
      setLoadingConversations(false);
      writeCache(CONV_CACHE_KEY(myUid), convs);
    });

    unsubUsersRef.current = subscribeAllUsers(myUid, (users) => {
      setAllUsers(users);
      writeCache(USERS_CACHE_KEY(myUid), users);
    });

    return () => {
      unsubConvRef.current?.();
      unsubUsersRef.current?.();
      cleanupPresenceRef.current?.();
      Object.values(unsubMsgsRef.current).forEach((fn) => fn());
      Object.values(unsubPresenceRef.current).forEach((fn) => fn());
      Object.values(unsubTypingRef.current).forEach((fn) => fn());
      unsubMsgsRef.current = {};
      unsubPresenceRef.current = {};
      unsubTypingRef.current = {};
    };
  }, [myUid]);

  // ── Auth change sync ──────────────────────────────────────────────────────

  useEffect(() => {
    const sync = () => {
      const uid = getStoredAuthUser()?.id || '';
      setMyUid(uid);
      setConversations(readCache<FbConversation[]>(CONV_CACHE_KEY(uid)) ?? []);
      setAllUsers(readCache<FbUser[]>(USERS_CACHE_KEY(uid)) ?? []);
      setLoadingConversations(!readCache<FbConversation[]>(CONV_CACHE_KEY(uid)));
      setMessages({});
      setOnlineUsers({});
      setTypingInConversation({});
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const value: MessageContextType = {
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
    typingInConversation,
    isUserOnline,
    isConnected: Boolean(myUid),
    sendMessage,
    emitTypingStart,
    emitTypingStop,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessages must be used within MessageProvider');
  return ctx;
}
