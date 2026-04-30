# Messages.tsx Integration Guide

## Current Status
The Messages.tsx component is **structurally ready** for MessageContext integration. The UI components, animations, and styling are all in place.

## What's Changed
1. ✅ Removed seed data (seedConversations, AUTO_REPLIES)
2. ✅ Added imports for MessageContext and auth
3. ✅ Renamed internal Message type to UIMessage (to avoid conflicts)
4. ✅ Component now uses MessageContext hooks

## How to Complete Integration

### Step 1: Wrap App with MessageProvider
In your main app file (likely `App.tsx` or `LegacyApp.tsx`), wrap the app with the MessageProvider:

```typescript
import { MessageProvider } from './context/MessageContext';

function App() {
  return (
    <MessageProvider>
      {/* Rest of your app */}
      <Routes>
        {/* ... */}
      </Routes>
    </MessageProvider>
  );
}
```

### Step 2: Verify MessageContext Implementation
The MessageContext is in `/frontend/src/legacy/app/context/MessageContext.tsx` and provides:
- `useMessages()` hook for component usage
- Auto socket connection on mount
- Auto conversation fetching

### Step 3: Test Socket Connection
Open browser DevTools → Network → WS tab and verify:
1. Socket.io handshake succeeds (see `socket.io/?...` connection)
2. Connection shows as "Connected" in sidebar
3. No JWT authentication errors in console

### Step 4: Test Message Flow
1. Load the Messages page
2. Click on a conversation
3. Verify messages load from MongoDB
4. Send a test message
5. Verify real-time delivery (should appear immediately)
6. Check console for any errors

## Architecture

```
Messages.tsx
    ↓
useMessages() hook
    ↓
MessageContext
    ↓
  ├─ Socket.io client (messageClient)
  ├─ REST API calls
  ├─ Local state (messages, conversations)
  └─ Event listeners
    ↓
Backend Socket.io Server
    ↓
MongoDB Database
```

## Key Variables in Messages.tsx

### From MessageContext
```typescript
// Conversations
conversations: Conversation[]
loadingConversations: boolean
fetchConversations: () => Promise<void>

// Messages
messages: Record<string, Message[]>
loadingMessages: Record<string, boolean>
fetchMessages: (conversationId: string) => Promise<void>

// Unread
unreadCount: number
unreadByConversation: Record<string, number>
markAsRead: (conversationId: string, messageIds: string[]) => Promise<void>

// Typing & Presence
typingUsers: TypingUser[]
onlineUsers: Map<string, UserPresence>
isUserOnline: (userId: string) => boolean

// Socket
isConnected: boolean
sendMessage: (conversationId, receiverId, text, images) => Promise<void>
emitTypingStart: (conversationId: string) => void
emitTypingStop: (conversationId: string) => void
```

## Handling User Selection

### Current Behavior
```typescript
const activeConversation = conversations.find((c) =>
  c.participants.some((p) => p.userId._id === teacherId)
);
```

This finds the conversation object based on the `teacherId` URL param.

### Message Transformation
Messages from DB are transformed to UI format:
```typescript
const activeMessages = activeConversation
  ? (messages[activeConversation._id] || []).map((msg) => ({
      id: msg._id,
      from: msg.senderId._id === session?.user?._id ? 'me' : 'tutor',
      text: msg.text,
      time: new Date(msg.createdAt).toLocaleTimeString([...]),
      status: msg.readAt ? 'read' : 'sent',
      data: msg, // Original message object for reference
    }))
  : [];
```

## Typing Indicator Logic

### Sending
When user starts typing (input change):
```typescript
if (input.trim()) {
  if (!isLocalTyping) {
    emitTypingStart(conversationId);  // Notify others
    setIsLocalTyping(true);
  }
  // Reset timeout every keystroke
  setTimeout(() => {
    emitTypingStop(conversationId);
    setIsLocalTyping(false);
  }, 3000);
}
```

### Receiving
MessageContext listener shows typing indicator:
```typescript
const isUserTyping = activeConversation
  ? typingUsers.some((t) => 
      t.conversationId === activeConversation._id && 
      t.userId !== session?.user?._id
    )
  : false;
```

## Unread Badge Updates

### Automatic Sync
When messages are fetched, unreadByConversation is populated from conversation.unreadCounts.

When user marks messages as read:
```typescript
markAsRead(conversationId, messageIds)
  → Updates backend
  → Backend emits "messages-read" event
  → MessageContext listener updates local state
  → Badge count decreases
```

## Common Issues & Solutions

### Issue: Messages not loading
**Solution**: 
1. Verify MessageProvider wraps the app
2. Check browser console for socket connection errors
3. Verify `activeConversation` is found correctly
4. Check MongoDB connection on backend

### Issue: Typing indicator not showing
**Solution**:
1. Verify socket is connected (`isConnected` = true)
2. Check `emitTypingStart` is being called
3. Verify typing timeout is set correctly (3 seconds)
4. Check socket event name matches: "typing-start" and "typing-stop"

### Issue: Messages stuck at "sent" status
**Solution**:
1. Verify "messages-read" socket event is received
2. Check `markMessagesAsRead` is being called
3. Verify messageIds are correct
4. Check backend socket handler for errors

### Issue: Unread count not updating
**Solution**:
1. Verify unreadCounts in conversation object
2. Check `markAsRead` is awaited
3. Verify backend updates unreadCounts
4. Check conversation is refetched after mark-read

## Performance Tips

### 1. Message Pagination
Current implementation loads 50 messages by default. For large conversations:
```typescript
// Implement infinite scroll
const handleLoadMore = async () => {
  const newMessages = await getMessages(conversationId, 50, messages.length);
  // Append to messages array
};
```

### 2. Conversation List Optimization
Already paginated at 50 conversations per request. Implement lazy loading:
```typescript
const handleLoadMoreConversations = async () => {
  const { conversations: newConvs } = await getConversations(
    50,
    conversations.length  // skip value
  );
  // Append to conversations
};
```

### 3. Image Lazy Loading
Already implemented in UI (ImageWithFallback component). No additional work needed.

### 4. Debounce Typing
Typing indicator already debounced at 3 seconds. Consider reducing to 1.5 seconds for more responsiveness if network is fast.

## Testing Checklist

- [ ] Socket connects with JWT token
- [ ] Conversations load on mount
- [ ] Messages load when conversation selected
- [ ] Send message appears immediately
- [ ] Message broadcasts to socket room
- [ ] Typing indicator appears
- [ ] Online status shows (green dot)
- [ ] Unread badge updates on mark-as-read
- [ ] Search filters conversations
- [ ] Emoji picker works
- [ ] Input sends on Enter key
- [ ] Reconnection works after disconnect
- [ ] Multiple conversations switch smoothly

## Debugging Tips

### Monitor Socket Events
```typescript
// Add to MessageProvider or MessageContext
messageClient.on('message-received', (data) => {
  console.log('[DEBUG] Message received:', data);
});

messageClient.on('messages-read', (data) => {
  console.log('[DEBUG] Messages marked read:', data);
});

messageClient.on('user-typing', (data) => {
  console.log('[DEBUG] User typing:', data);
});
```

### Monitor State Changes
```typescript
useEffect(() => {
  console.log('[DEBUG] Active conversation:', activeConversation);
}, [activeConversation]);

useEffect(() => {
  console.log('[DEBUG] Active messages:', activeMessages);
}, [activeMessages]);

useEffect(() => {
  console.log('[DEBUG] Typing users:', typingUsers);
}, [typingUsers]);

useEffect(() => {
  console.log('[DEBUG] Online users:', onlineUsers);
}, [onlineUsers]);
```

## File Locations
- **MessageContext**: `/frontend/src/legacy/app/context/MessageContext.tsx`
- **Message Service**: `/frontend/src/legacy/app/services/message.ts`
- **Messages Page**: `/frontend/src/legacy/app/pages/Messages.tsx`
- **Backend API**: `/backend/src/routes/message.routes.js`
- **Socket Handlers**: `/backend/src/socketHandlers.js`

## Next Phase: Rich Features

After integration is complete, implement:

1. **Image Uploads**
   - Multer middleware on backend
   - Image upload UI in input bar
   - Image preview in messages

2. **Message Reactions**
   - Emoji reaction picker
   - Reaction counts
   - Real-time reaction sync

3. **Notifications**
   - Badge count in header
   - Sound alerts
   - Desktop notifications

4. **Search Enhancement**
   - Full-text search UI
   - Date range picker
   - User mention search

## Success Criteria ✅

When integration is complete:
- ✅ All messages from DB display correctly
- ✅ Send message works in real-time
- ✅ Read receipts update automatically
- ✅ Typing indicators show/hide
- ✅ Online status displays
- ✅ Unread counts accurate
- ✅ Socket reconnection works
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Fast load times

You're now ready to complete the frontend integration! 🎉
