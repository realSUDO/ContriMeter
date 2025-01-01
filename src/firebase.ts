import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA8EReX4t2Qu85WGKNCe8Gvg_yAjoHbXfE",
  authDomain: "contrimeter-techsprint.firebaseapp.com",
  databaseURL: "https://contrimeter-techsprint-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "contrimeter-techsprint",
  storageBucket: "contrimeter-techsprint.firebasestorage.app",
  messagingSenderId: "593952245188",
  appId: "1:593952245188:web:f90dc4bce198a2d946d091"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
