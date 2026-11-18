import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { PublicTeamTokenInfo, SubOperatorPins, SubOperatorRole } from '../auction/tokens.ts';
import {
  auth,
  type ConnectionCheckStatus,
  signInWithGoogle,
  signOutUser,
  syncUserProfile,
  testFirestoreConnection,
  updateUserPreferredTeam,
} from '../firebase.ts';

const HOST_TOKEN_STORAGE = 'ipl_host_session_token';
const BIDDER_TOKEN_STORAGE = 'ipl_bidder_room_token';
const BIDDER_TEAM_STORAGE = 'ipl_bidder_room_team';
const SUBOP_TOKEN_STORAGE = 'ipl_subop_session_token';
const SUBOP_ROLE_STORAGE = 'ipl_subop_session_role';

export interface HostStatusState {
  hostLoggedIn: boolean;
  hostName: string | null;
  hostEmail: string | null;
  tokensGenerated: boolean;
  subOpConfigured?: boolean;
  pinRequired: boolean;
}

export interface RedeemResult {
  ok: boolean;
  teamId?: string;
  short?: string;
  name?: string;
  paddle?: string;
  token?: string;
  error?: string;
}

export interface SubOpRedeemResult {
  ok: boolean;
  role?: SubOperatorRole;
  subOpToken?: string;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  signingIn: boolean;
  authError: string | null;
  preferredTeamId: string | null;
  firestoreStatus: ConnectionCheckStatus;
  hostToken: string | null;
  hostStatus: HostStatusState;
  hostTeamTokens: PublicTeamTokenInfo[];
  subOpPins: SubOperatorPins | null;
  subOpToken: string | null;
  subOpRole: SubOperatorRole | null;
  bidderToken: string | null;
  bidderTeamId: string | null;
  signIn: () => Promise<User | null>;
  logout: () => Promise<void>;
  setPreferredTeam: (teamId: string) => Promise<void>;
  clearAuthError: () => void;
  loginHostWithGoogle: () => Promise<boolean>;
  loginHostChair: (pin?: string, hostName?: string) => Promise<{ ok: boolean; error?: string }>;
  refreshHostTokens: (explicitHostToken?: string | null) => Promise<void>;
  regenerateHostTokens: () => Promise<boolean>;
  regenerateSubOpPins: () => Promise<boolean>;
  updateSubOpPins: (displayPin: string, bidsPin: string) => Promise<{ ok: boolean; error?: string }>;
  logoutHost: () => Promise<void>;
  redeemSubOpPin: (rawPin: string) => Promise<SubOpRedeemResult>;
  leaveSubOpSession: () => void;
  redeemBidderToken: (rawToken: string) => Promise<RedeemResult>;
  leaveBidderRoom: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, val: string | null): void {
  try {
    if (val) {
      window.localStorage.setItem(key, val);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [preferredTeamId, setPreferredTeamId] = useState<string | null>(null);
  const [firestoreStatus, setFirestoreStatus] = useState<ConnectionCheckStatus>('checking');

  const [hostToken, setHostToken] = useState<string | null>(() => readStorage(HOST_TOKEN_STORAGE));
  const [hostStatus, setHostStatus] = useState<HostStatusState>({
    hostLoggedIn: false,
    hostName: null,
    hostEmail: null,
    tokensGenerated: false,
    subOpConfigured: false,
    pinRequired: false,
  });
  const [hostTeamTokens, setHostTeamTokens] = useState<PublicTeamTokenInfo[]>([]);
  const [subOpPins, setSubOpPins] = useState<SubOperatorPins | null>(null);

  const [subOpToken, setSubOpToken] = useState<string | null>(() => readStorage(SUBOP_TOKEN_STORAGE));
  const [subOpRole, setSubOpRole] = useState<SubOperatorRole | null>(() => {
    const raw = readStorage(SUBOP_ROLE_STORAGE);
    return raw === 'display' || raw === 'bids' ? raw : null;
  });

  const [bidderToken, setBidderToken] = useState<string | null>(() =>
    readStorage(BIDDER_TOKEN_STORAGE)
  );
  const [bidderTeamId, setBidderTeamId] = useState<string | null>(() =>
    readStorage(BIDDER_TEAM_STORAGE)
  );

  useEffect(() => {
    void testFirestoreConnection().then(setFirestoreStatus);
  }, []);

  // Verify existing sub-operator session on mount / token update
  useEffect(() => {
    if (!subOpToken) {
      if (subOpRole !== null) {
        writeStorage(SUBOP_ROLE_STORAGE, null);
        setSubOpRole(null);
      }
      return;
    }
    let active = true;
    fetch('/api/subop/verify', {
      headers: { 'x-subop-token': subOpToken },
    })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          writeStorage(SUBOP_TOKEN_STORAGE, null);
          writeStorage(SUBOP_ROLE_STORAGE, null);
          setSubOpToken(null);
          setSubOpRole(null);
          return;
        }
        const data = (await res.json()) as { ok?: boolean; role?: SubOperatorRole };
        if (data.ok && (data.role === 'display' || data.role === 'bids')) {
          writeStorage(SUBOP_ROLE_STORAGE, data.role);
          setSubOpRole(data.role);
        }
      })
      .catch(() => {
        // Keep cached session on transient offline error
      });
    return () => {
      active = false;
    };
  }, [subOpToken, subOpRole]);

  const refreshHostTokens = useCallback(
    async (explicitHostToken?: string | null) => {
      const tokenToUse = explicitHostToken !== undefined ? explicitHostToken : hostToken;
      try {
        const statusRes = await fetch('/api/host/status');
        if (statusRes.ok) {
          const st = (await statusRes.json()) as HostStatusState;
          setHostStatus(st);
          if (!st.hostLoggedIn) {
            if (tokenToUse) {
              writeStorage(HOST_TOKEN_STORAGE, null);
              setHostToken(null);
            }
            setHostTeamTokens([]);
            setSubOpPins(null);
            return;
          }
        }
        if (!tokenToUse) return;
        const tokRes = await fetch('/api/host/tokens', {
          headers: { 'x-host-token': tokenToUse },
        });
        if (tokRes.ok) {
          const data = (await tokRes.json()) as {
            tokens?: PublicTeamTokenInfo[];
            subOpPins?: SubOperatorPins;
            hostName?: string | null;
            hostEmail?: string | null;
          };
          if (Array.isArray(data.tokens)) {
            setHostTeamTokens(data.tokens);
          }
          if (data.subOpPins?.displayPin && data.subOpPins?.bidsPin) {
            setSubOpPins(data.subOpPins);
          }
        } else if (tokRes.status === 401) {
          writeStorage(HOST_TOKEN_STORAGE, null);
          setHostToken(null);
          setHostTeamTokens([]);
          setSubOpPins(null);
        }
      } catch {
        // Non-fatal
      }
    },
    [hostToken]
  );

  useEffect(() => {
    void refreshHostTokens();
  }, [refreshHostTokens]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        void syncUserProfile(nextUser)
          .then((profile) => {
            if (profile?.teamId && profile.teamId !== 'spectator') {
              setPreferredTeamId(profile.teamId);
            }
          })
          .catch((err) => {
            setAuthError(err instanceof Error ? err.message : 'Unable to sync Firebase profile');
          });
      } else {
        setPreferredTeamId(null);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const signedInUser = await signInWithGoogle();
      return signedInUser;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Google sign-in popup closed or blocked by browser';
      setAuthError(message);
      return null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const loginHostWithGoogle = useCallback(async (): Promise<boolean> => {
    const signedInUser = await signIn();
    if (!signedInUser) return false;
    try {
      const res = await fetch('/api/host/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'firebase',
          uid: signedInUser.uid,
          email: signedInUser.email || 'host@google.com',
          displayName: signedInUser.displayName || 'Google Auction Host',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        hostToken?: string;
        hostName?: string;
        hostEmail?: string;
        tokens?: PublicTeamTokenInfo[];
        subOpPins?: SubOperatorPins;
        error?: string;
      };
      if (!res.ok || !data.hostToken) {
        setAuthError(data.error || 'Could not establish host server session');
        return false;
      }
      writeStorage(HOST_TOKEN_STORAGE, data.hostToken);
      setHostToken(data.hostToken);
      setHostStatus((prev) => ({
        ...prev,
        hostLoggedIn: true,
        hostName: data.hostName || signedInUser.displayName,
        hostEmail: data.hostEmail || signedInUser.email,
        tokensGenerated: true,
        subOpConfigured: Boolean(data.subOpPins?.displayPin && data.subOpPins?.bidsPin),
      }));
      if (Array.isArray(data.tokens)) setHostTeamTokens(data.tokens);
      if (data.subOpPins?.displayPin && data.subOpPins?.bidsPin) {
        setSubOpPins(data.subOpPins);
      }
      return true;
    } catch {
      setAuthError('Server unreachable while logging in host');
      return false;
    }
  }, [signIn]);

  const loginHostChair = useCallback(
    async (pin?: string, hostName?: string): Promise<{ ok: boolean; error?: string }> => {
      setSigningIn(true);
      setAuthError(null);
      try {
        const res = await fetch('/api/host/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'host_chair',
            pin: pin || '',
            displayName: hostName?.trim() || 'Auction Host Chair',
            email: 'host@club-auction.local',
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          hostToken?: string;
          hostName?: string;
          hostEmail?: string;
          tokens?: PublicTeamTokenInfo[];
          subOpPins?: SubOperatorPins;
          error?: string;
        };
        if (!res.ok || !data.hostToken) {
          const msg = data.error || 'Host login failed';
          setAuthError(msg);
          return { ok: false, error: msg };
        }
        writeStorage(HOST_TOKEN_STORAGE, data.hostToken);
        setHostToken(data.hostToken);
        setHostStatus((prev) => ({
          ...prev,
          hostLoggedIn: true,
          hostName: data.hostName || 'Auction Host Chair',
          hostEmail: data.hostEmail || 'host@club-auction.local',
          tokensGenerated: true,
          subOpConfigured: Boolean(data.subOpPins?.displayPin && data.subOpPins?.bidsPin),
        }));
        if (Array.isArray(data.tokens)) setHostTeamTokens(data.tokens);
        if (data.subOpPins?.displayPin && data.subOpPins?.bidsPin) {
          setSubOpPins(data.subOpPins);
        }
        return { ok: true };
      } catch {
        const msg = 'Server unreachable while logging in host';
        setAuthError(msg);
        return { ok: false, error: msg };
      } finally {
        setSigningIn(false);
      }
    },
    []
  );

  const regenerateHostTokens = useCallback(async (): Promise<boolean> => {
    if (!hostToken) return false;
    try {
      const res = await fetch('/api/host/tokens/regenerate', {
        method: 'POST',
        headers: { 'x-host-token': hostToken },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { tokens?: PublicTeamTokenInfo[] };
      if (Array.isArray(data.tokens)) {
        setHostTeamTokens(data.tokens);
      }
      return true;
    } catch {
      return false;
    }
  }, [hostToken]);

  const regenerateSubOpPins = useCallback(async (): Promise<boolean> => {
    if (!hostToken) return false;
    try {
      const res = await fetch('/api/host/subop-pins/regenerate', {
        method: 'POST',
        headers: { 'x-host-token': hostToken },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { subOpPins?: SubOperatorPins };
      if (data.subOpPins?.displayPin && data.subOpPins?.bidsPin) {
        setSubOpPins(data.subOpPins);
      }
      return true;
    } catch {
      return false;
    }
  }, [hostToken]);

  const updateSubOpPins = useCallback(
    async (displayPin: string, bidsPin: string): Promise<{ ok: boolean; error?: string }> => {
      if (!hostToken) return { ok: false, error: 'Host authentication required' };
      try {
        const res = await fetch('/api/host/subop-pins/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-host-token': hostToken,
          },
          body: JSON.stringify({ displayPin, bidsPin }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          subOpPins?: SubOperatorPins;
          error?: string;
        };
        if (!res.ok || !data.subOpPins) {
          return { ok: false, error: data.error || 'Could not update sub-operator PINs' };
        }
        setSubOpPins(data.subOpPins);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Server unreachable while updating PINs' };
      }
    },
    [hostToken]
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOutUser();
  }, []);

  const logoutHost = useCallback(async () => {
    setAuthError(null);
    try {
      if (hostToken) {
        await fetch('/api/host/logout', {
          method: 'POST',
          headers: { 'x-host-token': hostToken },
        });
      }
    } catch {
      // Non-fatal
    }
    if (user) {
      await signOutUser().catch(() => {});
    }
    writeStorage(HOST_TOKEN_STORAGE, null);
    setHostToken(null);
    setHostTeamTokens([]);
    setSubOpPins(null);
    setHostStatus((prev) => ({
      ...prev,
      hostLoggedIn: false,
      hostName: null,
      hostEmail: null,
    }));
  }, [hostToken, user]);

  const redeemSubOpPin = useCallback(async (rawPin: string): Promise<SubOpRedeemResult> => {
    try {
      const res = await fetch('/api/subop/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: rawPin }),
      });
      const data = (await res.json().catch(() => ({}))) as SubOpRedeemResult;
      if (!res.ok || !data.ok || !data.role || !data.subOpToken) {
        return { ok: false, error: data.error || 'Invalid Sub-Operator PIN' };
      }
      writeStorage(SUBOP_TOKEN_STORAGE, data.subOpToken);
      writeStorage(SUBOP_ROLE_STORAGE, data.role);
      setSubOpToken(data.subOpToken);
      setSubOpRole(data.role);
      return data;
    } catch {
      return { ok: false, error: 'Server unreachable while verifying Sub-Operator PIN' };
    }
  }, []);

  const leaveSubOpSession = useCallback(() => {
    writeStorage(SUBOP_TOKEN_STORAGE, null);
    writeStorage(SUBOP_ROLE_STORAGE, null);
    setSubOpToken(null);
    setSubOpRole(null);
  }, []);

  const redeemBidderToken = useCallback(async (rawToken: string): Promise<RedeemResult> => {
    try {
      const res = await fetch('/api/tokens/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });
      const data = (await res.json().catch(() => ({}))) as RedeemResult;
      if (!res.ok || !data.ok || !data.teamId || !data.token) {
        return { ok: false, error: data.error || 'Invalid room token' };
      }
      writeStorage(BIDDER_TOKEN_STORAGE, data.token);
      writeStorage(BIDDER_TEAM_STORAGE, data.teamId);
      setBidderToken(data.token);
      setBidderTeamId(data.teamId);
      return data;
    } catch {
      return { ok: false, error: 'Server unreachable while verifying room token' };
    }
  }, []);

  const leaveBidderRoom = useCallback(() => {
    writeStorage(BIDDER_TOKEN_STORAGE, null);
    writeStorage(BIDDER_TEAM_STORAGE, null);
    setBidderToken(null);
    setBidderTeamId(null);
  }, []);

  const setPreferredTeam = useCallback(
    async (teamId: string) => {
      setPreferredTeamId(teamId);
      if (user) {
        try {
          await updateUserPreferredTeam(user, teamId);
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Could not save team assignment');
        }
      }
    },
    [user]
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        signingIn,
        authError,
        preferredTeamId,
        firestoreStatus,
        hostToken,
        hostStatus,
        hostTeamTokens,
        subOpPins,
        subOpToken,
        subOpRole,
        bidderToken,
        bidderTeamId,
        signIn,
        logout,
        setPreferredTeam,
        clearAuthError,
        loginHostWithGoogle,
        loginHostChair,
        refreshHostTokens,
        regenerateHostTokens,
        regenerateSubOpPins,
        updateSubOpPins,
        logoutHost,
        redeemSubOpPin,
        leaveSubOpSession,
        redeemBidderToken,
        leaveBidderRoom,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
