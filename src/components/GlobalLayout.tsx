import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "./UserSidebar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout = ({ children }: GlobalLayoutProps) => {
  const { user } = useAuth();
  const [showUserSidebar, setShowUserSidebar] = useState(false);

  if (!user) return <>{children}</>;

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
