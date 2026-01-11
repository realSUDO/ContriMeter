import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signupWithEmail = (email: string, password: string, keepSignedIn: boolean = true) => {
  setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = (email: string, password: string, keepSignedIn: boolean = true) => {
  setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = (keepSignedIn: boolean = true) => {
  setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence);
  return signInWithPopup(auth, googleProvider);
};

export const loginWithGithub = (keepSignedIn: boolean = true) => {
  setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence);
  return signInWithPopup(auth, githubProvider);
};

export const logout = () => signOut(auth);
