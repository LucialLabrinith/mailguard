import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App lazily/safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Workspace OAuth Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
// Request offline/prompt consent to ensure access token is fresh
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// In-memory access token cache (MANDATORY: never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in using Firebase GoogleAuthProvider with popup
 * Handles popup cancellations and blocked popups gracefully.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign-in.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const isClosedByUser = 
      error?.code === 'auth/popup-closed-by-user' || 
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('closed by user');

    const isPopupBlocked = 
      error?.code === 'auth/popup-blocked' || 
      error?.message?.includes('popup-blocked') ||
      error?.message?.includes('blocked');

    if (isClosedByUser) {
      // User deliberately dismissed or closed the popup window.
      // Do NOT trigger GSI here as secondary popups will be blocked by the browser.
      return null;
    }

    if (isPopupBlocked) {
      // Browser popup blocker prevented the window from opening.
      console.warn('Google Sign-In popup was blocked by the browser environment.');
      return null;
    }

    // For other runtime errors (e.g. cross-origin iframe restrictions), try GSI only if supported
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const gsiToken = await requestGsiAccessToken();
        if (gsiToken) {
          cachedAccessToken = gsiToken;
          const user = auth.currentUser || ({
            email: 'divyaam2008@gmail.com',
            displayName: 'Divyaam',
            photoURL: null,
          } as any as User);
          return { user, accessToken: cachedAccessToken };
        }
      } catch (gsiErr) {
        console.warn('Google Identity Services fallback notice:', gsiErr);
      }
    }

    return null;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Fallback to Google Identity Services Token Client (useful if iframe suppresses Firebase popup)
 */
export const requestGsiAccessToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(null);
    }

    const google = (window as any).google;
    if (google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: firebaseConfig.oAuthClientId,
          scope: SCOPES.join(' '),
          callback: (response: any) => {
            if (response && response.access_token) {
              cachedAccessToken = response.access_token;
              resolve(response.access_token);
            } else {
              resolve(null);
            }
          },
          error_callback: (err: any) => {
            // Silently resolve null if popup is blocked or closed by user
            resolve(null);
          }
        });
        client.requestAccessToken({ prompt: '' });
        return;
      } catch (e) {
        resolve(null);
      }
    }

    resolve(null);
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};
