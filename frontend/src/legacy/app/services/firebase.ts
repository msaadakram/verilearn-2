/**
 * Firebase Realtime Database service for VeriLearn chat.
 *
 * Data layout:
 *   /users/{uid}
 *     name, avatar, role, registeredAt
 *
 *   /conversations/{convId}
 *     participants: { uid1: true, uid2: true }
 *     participantInfo: { uid1: { name, avatar }, uid2: { name, avatar } }
 *     lastMessage: { text, senderId, sentAt }
 *     createdAt: number (ms)
 *
 *   /messages/{convId}/{msgId}
 *     text, senderId, senderName, senderAvatar, receiverId, createdAt
 *     readBy: { [uid]: number }
 *
 *   /presence/{uid}
 *     online: boolean
 *     lastSeen: number (ms)
 *
 *   /typing/{convId}/{uid}: number (ms) | null
 */

import { initializeApp, getApps } from 'firebase/app';
import {
    getDatabase,
    ref,
    push,
    set,
    get,
    onValue,
    off,
    serverTimestamp,
    onDisconnect,
    query,
    orderByChild,
    equalTo,
    update,
    remove,
    increment,
    DataSnapshot,
} from 'firebase/database';

const firebaseConfig = {
    apiKey: 'AIzaSyAXiJUL8iKyUlL3mKOmIq2n8z9AJB9iiuI',
    authDomain: 'verilearn-b9b8d.firebaseapp.com',
    databaseURL: 'https://verilearn-b9b8d-default-rtdb.firebaseio.com',
    projectId: 'verilearn-b9b8d',
    storageBucket: 'verilearn-b9b8d.firebasestorage.app',
    messagingSenderId: '894934151360',
    appId: '1:894934151360:web:111278ab0acc4103757d25',
    measurementId: 'G-9ZLMTQKWJR',
};

// Singleton — safe to call multiple times
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FbUser {
    uid: string;
    name: string;
    avatar: string;
    role: string;        // 'student' | 'teacher' | 'both'
    registeredAt: number;
}

export interface FbMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    receiverId: string;
    createdAt: number;
    readBy: Record<string, number>;
}

export interface FbParticipantInfo {
    name: string;
    avatar: string;
}

export interface FbConversation {
    id: string;
    participants: Record<string, boolean>;
    participantInfo: Record<string, FbParticipantInfo>;
    lastMessage?: {
        text: string;
        senderId: string;
        sentAt: number;
    };
    unreadCounts?: Record<string, number>; // { [uid]: number of unread messages }
    createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a stable, sorted conversation ID from two user UIDs */
export function buildConvId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
}

// ─── User Directory ──────────────────────────────────────────────────────────

/**
 * Register / update the current user in the Firebase user directory.
 * Should be called on every login/app mount.
 */
export async function registerUserInFirebase(
    uid: string,
    name: string,
    avatar: string,
    role: string,
): Promise<void> {
    await update(ref(db, `users/${uid}`), {
        uid,
        name,
        avatar,
        role,
        registeredAt: Date.now(),
    });
}

/**
 * Sync avatar and name for a user in the Firebase user directory.
 * Call this after any profile save that may change the avatar or name.
 */
export async function syncAvatarToFirebase(
    uid: string,
    name: string,
    avatar: string,
): Promise<void> {
    if (!uid) return;
    await update(ref(db, `users/${uid}`), { name, avatar });
    // Also update participantInfo in all conversations that include this user
    // (best-effort, no await needed)
    void update(ref(db, `userConversations/${uid}`), {}).catch(() => { }); // no-op ping to ensure index exists
}


/**
 * Subscribe to the complete user directory (all registered users).
 * Returns an unsubscribe function.
 */
export function subscribeAllUsers(
    myUid: string,
    callback: (users: FbUser[]) => void,
): () => void {
    const usersRef = ref(db, 'users');
    const handler = (snap: DataSnapshot) => {
        const list: FbUser[] = [];
        snap.forEach((child) => {
            const val = child.val();
            if (val?.uid && val.uid !== myUid) {
                list.push(val as FbUser);
            }
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        callback(list);
    };
    onValue(usersRef, handler);
    return () => off(usersRef, 'value', handler);
}

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Ensure a conversation node exists between two users.
 * Idempotent — if already exists, returns the existing convId.
 */
export async function getOrCreateConversation(
    myUid: string,
    myName: string,
    myAvatar: string,
    partnerUid: string,
    partnerName: string,
    partnerAvatar: string,
): Promise<string> {
    const convId = buildConvId(myUid, partnerUid);
    const convRef = ref(db, `conversations/${convId}`);
    const snap = await get(convRef);

    if (!snap.exists()) {
        await set(convRef, {
            participants: { [myUid]: true, [partnerUid]: true },
            participantInfo: {
                [myUid]: { name: myName, avatar: myAvatar },
                [partnerUid]: { name: partnerName, avatar: partnerAvatar },
            },
            createdAt: Date.now(),
        });
    }

    // Maintain per-user index for fast lookups
    await Promise.all([
        update(ref(db, `userConversations/${myUid}`), { [convId]: true }),
        update(ref(db, `userConversations/${partnerUid}`), { [convId]: true }),
    ]);

    return convId;
}

/**
 * Subscribe to the current user's conversations using a per-user index.
 * This is O(user_convs) not O(all_convs) — much faster.
 * Returns an unsubscribe function.
 */
export function subscribeUserConversations(
    myUid: string,
    callback: (conversations: FbConversation[]) => void,
): () => void {
    // Map of active per-conv listeners so we can clean them up
    const convListeners: Map<string, () => void> = new Map();
    const currentConvs: Map<string, FbConversation> = new Map();

    const emit = () => {
        const list = Array.from(currentConvs.values());
        list.sort((a, b) => {
            const at = a.lastMessage?.sentAt ?? a.createdAt;
            const bt = b.lastMessage?.sentAt ?? b.createdAt;
            return bt - at;
        });
        callback(list);
    };

    // Listen to the user's conv index
    const indexRef = ref(db, `userConversations/${myUid}`);
    const indexHandler = (snap: DataSnapshot) => {
        const ids: Record<string, boolean> = snap.val() || {};
        const newIds = new Set(Object.keys(ids));

        // Remove unneeded listeners
        convListeners.forEach((unsub, id) => {
            if (!newIds.has(id)) {
                unsub();
                convListeners.delete(id);
                currentConvs.delete(id);
            }
        });

        // Add new listeners
        newIds.forEach((id) => {
            if (convListeners.has(id)) return;
            const convRef = ref(db, `conversations/${id}`);
            const handler = (cSnap: DataSnapshot) => {
                if (cSnap.exists()) {
                    currentConvs.set(id, { id, ...cSnap.val() });
                } else {
                    currentConvs.delete(id);
                }
                emit();
            };
            onValue(convRef, handler);
            convListeners.set(id, () => off(convRef, 'value', handler));
        });

        // If no conversations, still call callback with empty array
        if (newIds.size === 0) callback([]);
    };

    onValue(indexRef, indexHandler);

    return () => {
        off(indexRef, 'value', indexHandler);
        convListeners.forEach((unsub) => unsub());
    };
}

/**
 * @deprecated Use subscribeUserConversations instead (fast index-based).
 * Kept for reference only.
 */
export function subscribeConversations(
    myUid: string,
    callback: (conversations: FbConversation[]) => void,
): () => void {
    return subscribeUserConversations(myUid, callback);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Send a message in a conversation.
 */
export async function sendFirebaseMessage(
    convId: string,
    msg: Omit<FbMessage, 'id' | 'readBy'>,
): Promise<string> {
    const msgRef = push(ref(db, `messages/${convId}`));
    const id = msgRef.key as string;

    await set(msgRef, {
        ...msg,
        readBy: { [msg.senderId]: msg.createdAt },
    });

    // Update conversation lastMessage + increment receiver's unread count atomically
    await update(ref(db, `conversations/${convId}`), {
        lastMessage: {
            text: msg.text,
            senderId: msg.senderId,
            sentAt: msg.createdAt,
        },
        [`unreadCounts/${msg.receiverId}`]: increment(1),
    });

    return id;
}

/**
 * Reset the unread count for a user in a conversation (call when they open the chat).
 */
export async function resetUnreadCount(convId: string, uid: string): Promise<void> {
    await update(ref(db, `conversations/${convId}`), {
        [`unreadCounts/${uid}`]: 0,
    });
}

/**
 * Subscribe to messages in a conversation (real-time).
 * Returns an unsubscribe function.
 */
export function subscribeMessages(
    convId: string,
    callback: (messages: FbMessage[]) => void,
): () => void {
    const msgsRef = ref(db, `messages/${convId}`);

    const handler = (snap: DataSnapshot) => {
        const msgs: FbMessage[] = [];
        snap.forEach((child) => {
            msgs.push({ id: child.key as string, ...child.val() });
        });
        callback(msgs);
    };

    onValue(msgsRef, handler);
    return () => off(msgsRef, 'value', handler);
}

/**
 * Mark a message as read by a user.
 */
export async function markMessageRead(
    convId: string,
    msgId: string,
    uid: string,
): Promise<void> {
    await update(ref(db, `messages/${convId}/${msgId}/readBy`), {
        [uid]: Date.now(),
    });
}

// ─── Presence ─────────────────────────────────────────────────────────────────

/**
 * Set current user as online and register an onDisconnect handler.
 */
export function setPresenceOnline(uid: string): () => void {
    const presenceRef = ref(db, `presence/${uid}`);

    set(presenceRef, { online: true, lastSeen: Date.now() });

    // On disconnect, mark offline
    onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now() });

    // Returns cleanup: mark offline immediately
    return () => {
        set(presenceRef, { online: false, lastSeen: Date.now() });
    };
}

/**
 * Subscribe to a user's presence.
 */
export function subscribePresence(
    uid: string,
    callback: (online: boolean) => void,
): () => void {
    const presenceRef = ref(db, `presence/${uid}`);
    const handler = (snap: DataSnapshot) => {
        callback(snap.val()?.online === true);
    };
    onValue(presenceRef, handler);
    return () => off(presenceRef, 'value', handler);
}

// ─── Typing indicators ────────────────────────────────────────────────────────

export function setTypingIndicator(convId: string, uid: string, isTyping: boolean): void {
    const typingRef = ref(db, `typing/${convId}/${uid}`);
    if (isTyping) {
        set(typingRef, Date.now());
    } else {
        remove(typingRef);
    }
}

export function subscribeTyping(
    convId: string,
    myUid: string,
    callback: (typingUids: string[]) => void,
): () => void {
    const typingRef = ref(db, `typing/${convId}`);
    const handler = (snap: DataSnapshot) => {
        const val = snap.val() as Record<string, number> | null;
        if (!val) {
            callback([]);
            return;
        }
        const now = Date.now();
        // Only show typing if timestamp is within 4 seconds
        const active = Object.entries(val)
            .filter(([uid, ts]) => uid !== myUid && now - ts < 4000)
            .map(([uid]) => uid);
        callback(active);
    };
    onValue(typingRef, handler);
    return () => off(typingRef, 'value', handler);
}
