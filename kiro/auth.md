// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8EReX4t2Qu85WGKNCe8Gvg_yAjoHbXfE",
  authDomain: "contrimeter-techsprint.firebaseapp.com",
  databaseURL: "https://contrimeter-techsprint-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "contrimeter-techsprint",
  storageBucket: "contrimeter-techsprint.firebasestorage.app",
  messagingSenderId: "593952245188",
  appId: "1:593952245188:web:f90dc4bce198a2d946d091"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);





 Security reminder

apiKey in Firebase is not secret. It’s safe to put in frontend code.

Don’t try to hide it — it’s just a project identifier.

Security rules in Firestore / Auth protect your data.


###  auth.ts


```js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

// providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// email
export const signupWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// google
export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

// github
export const loginWithGithub = () =>
  signInWithPopup(auth, githubProvider);


// logout
export const logout = () => signOut(auth);

```


`src/hooks/useAuth.ts`

```js
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
};

```


`components/protectedRoutes.tsx`
```js
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return children;
}

```



🖥️ UI INTEGRATION
Auth page

src/pages/AuthPage.tsx

import { useState } from "react";
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  loginWithGithub,
} from "../services/auth";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F7]">

      <h1 className="text-2xl font-semibold mb-6">Welcome to ContriMeter</h1>

      <input
        className="mb-2 p-2 border rounded"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="mb-4 p-2 border rounded"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="mb-2 px-4 py-2 bg-[#393E46] text-white rounded"
        onClick={() => loginWithEmail(email, password)}
      >
        Login
      </button>

      <button
        className="mb-4 px-4 py-2 bg-[#929AAB] text-white rounded"
        onClick={() => signupWithEmail(email, password)}
      >
        Sign up
      </button>

      <div className="flex gap-2">
        <button onClick={loginWithGoogle}>Google</button>
        <button onClick={loginWithGithub}>GitHub</button>
      </div>
    </div>
  );
}

🔄 ROUTER SETUP

src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

🧪 TEST MATRIX
