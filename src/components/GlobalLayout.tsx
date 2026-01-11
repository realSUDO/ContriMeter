import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "./UserSidebar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout = ({ children }: GlobalLayoutProps) => {
  const { user, loading } = useAuth();
  const [showUserSidebar, setShowUserSidebar] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved === 'true';
  });

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !showUserSidebar;
    setShowUserSidebar(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  // Don't show sidebar during loading or when no user
  if (loading || !user) return <>{children}</>;

  return (
    <>
      {children}
      
      <UserSidebar
        isOpen={showUserSidebar}
        onToggle={toggleSidebar}
      />
    </>
  );
};

export default GlobalLayout;
