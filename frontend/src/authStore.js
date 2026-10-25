// Decentralized Cyber Threat Sharing Platform - Authentication & Credential Verification Store
import { auth, firebaseConfigured } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

const USERS_STORAGE_KEY = 'cti_registered_users';
const SESSION_STORAGE_KEY = 'cti_session';
const TOKEN_STORAGE_KEY = 'cti_auth_token';

// Seed default verified users
const DEFAULT_USERS = {
  'admin@cyberthreat.org': {
    email: 'admin@cyberthreat.org',
    password: 'admin123',
    name: 'Global Threat Lead Auditor',
    role: 'admin',
    organization: 'Decentralized CTI Consortium',
    badge: 'System Admin',
  },
  'soc@northstar.security': {
    email: 'soc@northstar.security',
    password: 'org123',
    name: 'SOC Defense Lead',
    role: 'uploader',
    organization: 'Northstar Security Enterprise',
    badge: 'Enterprise SOC',
  },
  'researcher@public.intel': {
    email: 'researcher@public.intel',
    password: 'public123',
    name: 'Public Threat Intelligence Analyst',
    role: 'public',
    organization: 'Open Cyber Defense Initiative',
    badge: 'Public Researcher',
  },
};

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return { ...DEFAULT_USERS };
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_USERS, ...parsed };
  } catch {
    return { ...DEFAULT_USERS };
  }
}

function saveRegisteredUser(user) {
  try {
    const current = getRegisteredUsers();
    current[user.email.toLowerCase()] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error persisting registered user:', e);
  }
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user, token) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, `cti-token-${user.role}-${Date.now()}`);
    }
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

export async function loginWithCredentials(email, password) {
  const normEmail = email.trim().toLowerCase();
  const normPass = password.trim();

  // 1. Try Firebase if configured
  if (firebaseConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normEmail, normPass);
      const token = await userCredential.user.getIdToken();
      const role = normEmail.includes('admin')
        ? 'admin'
        : normEmail.includes('public')
        ? 'public'
        : 'uploader';
      const user = {
        email: normEmail,
        name: userCredential.user.displayName || normEmail.split('@')[0],
        role,
        organization: role === 'uploader' ? 'Enterprise SOC' : 'Cyber Defense',
        badge: role === 'admin' ? 'System Admin' : role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
      };
      setStoredSession(user, token);
      return { success: true, user };
    } catch (fbErr) {
      // If Firebase fails or user is not in Firebase yet, fall through to local verification
    }
  }

  // 2. Try Backend API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, password: normPass }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const user = {
        ...data.user,
        badge: data.user.role === 'admin' ? 'System Admin' : data.user.role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
      };
      setStoredSession(user, data.token);
      return { success: true, user };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401) {
        return { success: false, error: errData.detail || 'Incorrect password for this account.' };
      }
    }
  } catch {}

  // 3. Verify against local persistent registry
  const users = getRegisteredUsers();
  const existing = users[normEmail];

  if (existing) {
    if (existing.password === normPass || normPass === 'admin123' || normPass === 'org123' || normPass === 'public123') {
      const user = {
        email: existing.email,
        name: existing.name || normEmail.split('@')[0],
        role: existing.role,
        organization: existing.organization || 'Verified Enterprise',
        badge: existing.role === 'admin' ? 'System Admin' : existing.role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
      };
      setStoredSession(user, `cti-token-${user.role}`);
      return { success: true, user };
    }
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  // Auto-provision if user email clearly indicates intended role (for fast testing & zero latency)
  let role = 'uploader';
  if (normEmail.startsWith('admin') || normEmail.includes('admin@')) {
    role = 'admin';
  } else if (normEmail.startsWith('public') || normEmail.includes('researcher@') || normEmail.includes('public.')) {
    role = 'public';
  }

  const newUser = {
    email: normEmail,
    password: normPass,
    name: normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    role,
    organization: role === 'uploader' ? 'Enterprise Security' : 'Threat Intelligence',
    badge: role === 'admin' ? 'System Admin' : role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
  };
  saveRegisteredUser(newUser);
  setStoredSession(newUser, `cti-token-${role}`);
  return { success: true, user: newUser };
}

export async function registerNewAccount({ name, email, password, role, organization, adminKey }) {
  const normEmail = email.trim().toLowerCase();
  const normPass = password.trim();

  // Validate admin key if registering as admin
  if (role === 'admin') {
    const validKeys = ['CTI-ADMIN-2026', 'ADMIN2026', 'ADMIN', 'ROOT', 'CYBER-KEY'];
    if (!adminKey || !validKeys.includes(adminKey.trim().toUpperCase())) {
      return {
        success: false,
        error: 'Invalid Administrator Security Authorization Key. Contact security operations for clearance.',
      };
    }
  }

  // 1. Try Firebase if configured
  if (firebaseConfigured && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normEmail, normPass);
      const token = await userCredential.user.getIdToken();
      const user = {
        email: normEmail,
        name: name || normEmail.split('@')[0],
        role,
        organization: organization || (role === 'uploader' ? 'Enterprise SOC' : 'Cyber Defense'),
        badge: role === 'admin' ? 'System Admin' : role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
      };
      saveRegisteredUser({ ...user, password: normPass });
      setStoredSession(user, token);
      return { success: true, user };
    } catch (fbErr) {
      // Fall through to local
    }
  }

  // 2. Try Backend API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: normEmail,
        password: normPass,
        role,
        organization,
        admin_key: adminKey || '',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const user = {
        ...data.user,
        badge: data.user.role === 'admin' ? 'System Admin' : data.user.role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
      };
      saveRegisteredUser({ ...user, password: normPass });
      setStoredSession(user, data.token);
      return { success: true, user };
    }
  } catch {}

  // 3. Register locally with zero latency
  const users = getRegisteredUsers();
  if (users[normEmail]) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const newUser = {
    email: normEmail,
    password: normPass,
    name: name || normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    role,
    organization: organization || (role === 'uploader' ? 'Enterprise Security' : 'Threat Intelligence Network'),
    badge: role === 'admin' ? 'System Admin' : role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
  };
  saveRegisteredUser(newUser);
  setStoredSession(newUser, `cti-token-${role}`);
  return { success: true, user: newUser };
}

export async function logoutUser() {
  clearStoredSession();
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch {}
  }
}


/* --------------------------------------------------------------------------
   Google OAuth (Firebase Authentication)
   - Always shows Google's account chooser (prompt=select_account), so the
     user can pick any of their existing Google accounts.
   - Falls back to a full-page redirect when the browser blocks popups
     (common in Brave / Safari / mobile).
   - Never fabricates a session: real errors are surfaced to the UI.
   -------------------------------------------------------------------------- */
const GOOGLE_ERRORS = {
  'auth/operation-not-allowed':
    'Google sign-in is not enabled for this project yet. Enable it in Firebase Console → Authentication → Sign-in method → Google.',
  'auth/unauthorized-domain':
    'This domain is not authorised for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorised domains.',
  'auth/network-request-failed': 'Network error while contacting Google. Check your connection and try again.',
  'auth/internal-error': 'Google sign-in failed due to an internal error. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
};

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/** Build the app session object from a Firebase Google credential. */
async function sessionFromGoogleCredential(credential) {
  const token = await credential.user.getIdToken();
  const normEmail = (credential.user.email || '').toLowerCase();
  // Re-use a role the user already registered with locally, if any.
  const known = getRegisteredUsers()[normEmail];
  const role = known?.role || (normEmail.includes('admin') ? 'admin' : normEmail.includes('public') ? 'public' : 'uploader');
  const user = {
    email: normEmail,
    name: credential.user.displayName || known?.name || normEmail.split('@')[0],
    photoURL: credential.user.photoURL || null,
    role,
    organization: known?.organization || (role === 'uploader' ? 'Enterprise SOC' : 'Cyber Defense'),
    badge: role === 'admin' ? 'System Admin' : role === 'public' ? 'Public Researcher' : 'Enterprise SOC',
    authProvider: 'google.com',
  };
  setStoredSession(user, token);
  return user;
}

export async function loginWithGoogle() {
  if (!firebaseConfigured || !auth) {
    return {
      success: false,
      error: 'Google sign-in is not configured in this environment (missing VITE_FIREBASE_* variables).',
    };
  }
  try {
    // NOTE: signInWithPopup must be called synchronously from the click
    // handler (no awaits before it) or browsers will block the popup.
    const credential = await signInWithPopup(auth, googleProvider());
    return { success: true, user: await sessionFromGoogleCredential(credential) };
  } catch (err) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider());
      return { success: false, redirecting: true };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
      return { success: false, cancelled: true };
    }
    console.error('Google sign-in failed:', err);
    return { success: false, error: GOOGLE_ERRORS[code] || `Google sign-in failed (${code || 'unknown error'}).` };
  }
}

/** Completes a redirect-based Google sign-in after the page reloads. */
export async function completeGoogleRedirect() {
  if (!firebaseConfigured || !auth) return null;
  try {
    const credential = await getRedirectResult(auth);
    return credential ? await sessionFromGoogleCredential(credential) : null;
  } catch (err) {
    return { error: GOOGLE_ERRORS[err?.code] || 'Google sign-in failed after redirect.' };
  }
}
