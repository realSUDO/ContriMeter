import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "./UserSidebar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout = ({ children }: GlobalLayoutProps) => {
  const { user, loading } = useAuth();
  const [showUserSidebar, setShowUserSidebar] = useState(false);

  // Don't show sidebar during loading or when no user
  if (loading || !user) return <>{children}</>;

  return (
    <>
      {children}
      
      <UserSidebar
        isOpen={showUserSidebar}
        onToggle={() => setShowUserSidebar(!showUserSidebar)}
      />
    </>
  );
};

export default GlobalLayout;
