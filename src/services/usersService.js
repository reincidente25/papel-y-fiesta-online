// src/services/usersService.js
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { ROLES } from '../constants';

const COL = 'usuarios';

// Crea el documento de perfil del usuario tras el registro.
export async function createUserProfile(uid, { email, nombre, rol = ROLES.CLIENTE }) {
  if (!isFirebaseConfigured) return { uid, email, nombre, rol };
  const ref = doc(db, COL, uid);
  const perfil = { email, nombre, rol, creadoEn: serverTimestamp() };
  await setDoc(ref, perfil, { merge: true });
  return perfil;
}

export async function getUserProfile(uid) {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, COL, uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}
