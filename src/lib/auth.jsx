import { createContext, useContext, useEffect, useState } from 'react'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import { deleteAllUserData, isLocalMode } from './backend'
import { t } from './i18n'

const AuthContext = createContext(null)

const LOCAL_SESSION_KEY = 'mycelium:local-session'
const LOCAL_NAME_KEY = 'mycelium:local-name'

const ERRORS = {
  'auth/invalid-email': 'Diese E-Mail-Adresse sieht nicht gültig aus.',
  'auth/invalid-credential': 'E-Mail oder Passwort stimmen nicht.',
  'auth/wrong-password': 'E-Mail oder Passwort stimmen nicht.',
  'auth/user-not-found': 'Zu dieser E-Mail gibt es keinen Account.',
  'auth/email-already-in-use': 'Für diese E-Mail existiert bereits ein Account.',
  'auth/weak-password': 'Das Passwort braucht mindestens 6 Zeichen.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz.',
  'auth/network-request-failed': 'Keine Verbindung zum Server.',
  'auth/popup-closed-by-user': 'Anmeldung abgebrochen.',
  'auth/operation-not-allowed': 'Diese Anmeldemethode ist in Firebase noch nicht aktiviert.',
  'auth/user-mismatch': 'Das ist nicht das Google-Konto dieses Accounts.',
  'auth/requires-recent-login': 'Bitte melde dich neu an und versuche es nochmals.',
  'auth/unauthorized-domain': 'Diese Domain ist in Firebase nicht freigegeben (Authentication → Einstellungen).',
}

// eslint-disable-next-line react-refresh/only-export-components
export const authErrorMessage = (err) =>
  ERRORS[err?.code] ? t(ERRORS[err.code]) : (err?.message ?? t('Etwas ist schiefgelaufen.'))

const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      if (value == null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch {
      /* privater Modus */
    }
  },
}

const localUser = () => ({ uid: 'local', displayName: storage.get(LOCAL_NAME_KEY), email: null, isLocal: true })

// Nur die Felder, die die App braucht – so lässt sich der Name nach einer Änderung sofort neu anzeigen
const pick = (u) =>
  u && {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    usesPassword: u.providerData.some((p) => p.providerId === 'password'),
  }

// Gerätebezogene Einstellungen entfernen, Sprache und Farbschema gehören nicht zum Account
function clearDeviceData() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('mycelium:') && !['mycelium:lang', 'mycelium:theme'].includes(key))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    /* privater Modus */
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() =>
    isLocalMode
      ? { user: storage.get(LOCAL_SESSION_KEY) === '1' ? localUser() : null, loading: false }
      : { user: null, loading: true },
  )

  useEffect(() => {
    if (isLocalMode) return
    return onAuthStateChanged(auth, (user) => setState({ user: pick(user), loading: false }))
  }, [])

  const value = {
    ...state,
    isLocalMode,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    async signUp(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
        setState({ user: { ...pick(cred.user), displayName: name }, loading: false })
      }
    },
    signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    async updateDisplayName(name) {
      const displayName = name.trim() || null
      if (isLocalMode) storage.set(LOCAL_NAME_KEY, displayName)
      else await updateProfile(auth.currentUser, { displayName })
      setState((s) => ({ ...s, user: { ...s.user, displayName } }))
    },
    enterLocal() {
      storage.set(LOCAL_SESSION_KEY, '1')
      setState({ user: localUser(), loading: false })
    },
    /**
     * Löscht Account und alle Daten. Firebase verlangt dafür eine frische Anmeldung; sie steht bewusst
     * vor dem Löschen der Daten, damit ein falsches Passwort nichts anrichtet.
     */
    async deleteAccount(password) {
      if (isLocalMode) {
        await deleteAllUserData(state.user.uid)
        clearDeviceData()
        setState({ user: null, loading: false })
        return
      }
      const current = auth.currentUser
      if (state.user.usesPassword) {
        await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password))
      } else {
        await reauthenticateWithPopup(current, new GoogleAuthProvider())
      }
      await deleteAllUserData(current.uid)
      await deleteUser(current)
      clearDeviceData()
    },
    async signOut() {
      if (isLocalMode) {
        storage.set(LOCAL_SESSION_KEY, null)
        setState({ user: null, loading: false })
      } else {
        await firebaseSignOut(auth)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

// eslint-disable-next-line react-refresh/only-export-components
export const displayNameOf = (user) =>
  user?.displayName || user?.email?.split('@')[0] || (user?.isLocal ? t('Lokal') : t('Du'))
