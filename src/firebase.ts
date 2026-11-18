import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Preset } from './auction/types.ts';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_AUTH_DOMAIN = firebaseConfig.authDomain;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type ConnectionCheckStatus = 'checking' | 'connected' | 'offline';

let lastConnectionStatus: ConnectionCheckStatus = 'checking';

export async function testFirestoreConnection(): Promise<ConnectionCheckStatus> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    lastConnectionStatus = 'connected';
    return 'connected';
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      lastConnectionStatus = 'offline';
      return 'offline';
    }
    // Permission denied or missing doc still confirms live server reachability
    lastConnectionStatus = 'connected';
    return 'connected';
  }
}

export function getLastConnectionStatus(): ConnectionCheckStatus {
  return lastConnectionStatus;
}

void testFirestoreConnection();

const ALLOWED_TEAM_IDS = new Set([
  't1',
  't2',
  't3',
  't4',
  't5',
  't6',
  't7',
  't8',
  't9',
  't10',
  't11',
  'spectator',
]);

function sanitizeTeamId(teamId?: string | null): string {
  if (teamId && ALLOWED_TEAM_IDS.has(teamId)) return teamId;
  return 'spectator';
}

function sanitizeDisplayName(user: User): string {
  const raw = (user.displayName || user.email?.split('@')[0] || 'Club Participant').trim();
  return raw.slice(0, 100) || 'Club Participant';
}

function sanitizePhotoUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 500) return undefined;
  return trimmed;
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export interface StoredUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  teamId: string;
  role: 'bidder' | 'spectator';
}

export async function syncUserProfile(
  user: User,
  preferredTeamId?: string | null
): Promise<StoredUserProfile | null> {
  if (!user.uid || !user.emailVerified) return null;

  const publicPath = `users/${user.uid}`;
  const publicRef = doc(db, 'users', user.uid);
  const displayName = sanitizeDisplayName(user);
  const photoURL = sanitizePhotoUrl(user.photoURL);
  const requestedTeam = preferredTeamId ? sanitizeTeamId(preferredTeamId) : null;

  let stored: StoredUserProfile | null = null;

  try {
    const existingSnap = await getDoc(publicRef);
    if (!existingSnap.exists()) {
      const teamId = requestedTeam ?? 'spectator';
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        teamId,
        role: teamId === 'spectator' ? 'spectator' : 'bidder',
        updatedAt: serverTimestamp(),
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(publicRef, payload);
      stored = {
        uid: user.uid,
        displayName,
        photoURL,
        teamId,
        role: teamId === 'spectator' ? 'spectator' : 'bidder',
      };
    } else {
      const data = existingSnap.data() as Partial<StoredUserProfile>;
      const nextTeam = requestedTeam ?? sanitizeTeamId(data.teamId);
      const updatePayload: Record<string, unknown> = {
        displayName,
        teamId: nextTeam,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) updatePayload.photoURL = photoURL;
      await updateDoc(publicRef, updatePayload);
      stored = {
        uid: user.uid,
        displayName,
        photoURL: photoURL ?? data.photoURL,
        teamId: nextTeam,
        role: data.role === 'bidder' ? 'bidder' : 'spectator',
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (user.email) {
    const privatePath = `users/${user.uid}/private/profile`;
    const privateRef = doc(db, 'users', user.uid, 'private', 'profile');
    try {
      const privSnap = await getDoc(privateRef);
      const email = user.email.trim().slice(0, 254);
      if (!privSnap.exists()) {
        await setDoc(privateRef, {
          uid: user.uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privateRef, {
          email,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }

  return stored;
}

export async function updateUserPreferredTeam(
  user: User,
  teamId: string
): Promise<string> {
  const safeTeam = sanitizeTeamId(teamId);
  const publicPath = `users/${user.uid}`;
  const publicRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(publicRef, {
      displayName: sanitizeDisplayName(user),
      teamId: safeTeam,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, publicPath);
  }
  return safeTeam;
}

export async function registerAuctionRoom(
  user: User,
  roomId: string,
  title: string,
  preset: Preset
): Promise<void> {
  const safeRoomId = roomId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'club-room-1';
  const safeTitle = title.trim().slice(0, 120) || 'IPL Club Auction Session';
  const roomPath = `auctions/${safeRoomId}`;
  const roomRef = doc(db, 'auctions', safeRoomId);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      await setDoc(roomRef, {
        roomId: safeRoomId,
        ownerId: user.uid,
        title: safeTitle,
        preset,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(roomRef, {
        title: safeTitle,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomPath);
  }
}
