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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export class AuthSignInError extends Error {
  code: string;
  hostname: string;
  origin: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthSignInError';
    this.code = code;
    this.hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    this.origin = typeof window !== 'undefined' ? window.location.origin : '';
  }
}

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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new AuthSignInError(
        'auth/missing-token',
        'Gagal mendapatkan token akses Google OAuth. Pastikan popup OAuth selesai dan izin Drive/Sheets/Gmail disetujui.'
      );
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    const code = error?.code || 'auth/unknown';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';

    if (code === 'auth/unauthorized-domain') {
      throw new AuthSignInError(
        code,
        `Domain "${host}" belum diotorisasi di Firebase Authentication. Tambahkan "${host}" ke Authorized Domains di Firebase Console dan Google Cloud Console.`
      );
    }
    if (code === 'auth/popup-blocked') {
      throw new AuthSignInError(
        code,
        'Popup login diblokir oleh browser. Izinkan popup untuk situs ini lalu klik Masuk lagi.'
      );
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new AuthSignInError(
        code,
        'Jendela login Google ditutup sebelum selesai. Silakan coba masuk kembali.'
      );
    }
    if (code === 'auth/operation-not-allowed') {
      throw new AuthSignInError(
        code,
        'Provider Google Sign-In belum diaktifkan di Firebase Console.'
      );
    }
    if (error instanceof AuthSignInError) {
      throw error;
    }
    throw new AuthSignInError(code, error?.message || 'Gagal masuk dengan Google OAuth');
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};
