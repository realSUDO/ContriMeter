import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WelcomeScreen from "./WelcomeScreen";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return <WelcomeScreen />;
};

export default Index;
