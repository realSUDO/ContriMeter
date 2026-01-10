import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  loginWithGithub,
} from "../services/auth";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getErrorMessage = (error: any) => {
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect login ID or password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      default:
        return 'Authentication failed';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError("");
    try {
      if (provider === "google") {
        await loginWithGoogle();
      } else {
        await loginWithGithub();
      }
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Social auth error:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <button 
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          ← Back
        </button>
        
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isLogin 
            ? "Enter your credentials to continue" 
            : "Get started with ContriMeter"
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-clean w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-clean w-full ${error ? 'border-red-500 text-red-600' : ''}`}
          />
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || !email || !password}
            className="btn-primary w-full mt-6"
          >
            {loading ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialAuth("google")}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialAuth("github")}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => navigate(`/auth?mode=${isLogin ? "signup" : "login"}`)}
            className="text-foreground hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
