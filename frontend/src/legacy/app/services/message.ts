/**
 * message.ts — re-exported types and thin wrappers over the Firebase service.
 *
 * The Socket.io / REST implementation has been replaced with Firebase RTDB.
 * All imports in Messages.tsx and MessageContext.tsx now resolve to Firebase.
 */

import {
  getOrCreateConversation,
  FbConversation,
  FbMessage,
  FbParticipantInfo,
} from './firebase';

// Re-export Firebase types under legacy names so the rest of the app compiles
export type Message = FbMessage;
export type Conversation = FbConversation;
export type { FbParticipantInfo };

/**
 * createConversation — called by Messages.tsx when navigating to /messages/:partnerId.
 * Requires the current user's info + the partner's info.
 * If partner info is unknown at call-site, pass empty strings — Firebase will skip
 * overwriting an existing record.
 */
export async function createConversation(
  myUid: string,
  myName: string,
  myAvatar: string,
  partnerUid: string,
  partnerName = '',
  partnerAvatar = '',
): Promise<string> {
  return getOrCreateConversation(myUid, myName, myAvatar, partnerUid, partnerName, partnerAvatar);
}
