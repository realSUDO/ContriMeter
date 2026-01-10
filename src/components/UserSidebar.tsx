import { useState, useEffect } from "react";
import { User, Edit3, X, LogOut, Moon, Sun, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile, getUserProfile } from "@/services/users";
import { logout } from "@/services/auth";

interface UserSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const UserSidebar = ({ isOpen, onToggle }: UserSidebarProps) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Load user profile from database
  useEffect(() => {
    if (user?.uid && isOpen) {
      const loadProfile = async () => {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          setEditName(profile?.name || "");
          setEditRole(profile?.role || "");
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      };
      loadProfile();
    }
  }, [user?.uid, isOpen]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        name: editName,
        role: editRole
      });
      // Refresh profile data
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-card border-r shadow-lg z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-72'
      }`}>
        {/* User Icon Button - Inside sidebar */}
        <button
          onClick={onToggle}
          className={`absolute bottom-4 p-3 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
            isOpen ? 'right-4' : 'right-[-24px]'
          }`}
          title="Toggle profile"
        >
          <User className="w-5 h-5 text-primary-foreground" />
        </button>

        {/* Header with X button - Always visible */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className={`text-lg font-semibold text-foreground transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Profile</h2>
          <button
            onClick={onToggle}
            className={`text-muted-foreground hover:text-foreground absolute top-6 transition-all duration-300 ${
              isOpen ? 'right-6 p-1' : 'right-[-24px] p-3 bg-primary rounded-full shadow-lg hover:shadow-xl text-primary-foreground'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Content - Only visible when open */}
        <div className={`p-6 pt-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

          {/* User Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{userProfile?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Edit Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Details</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Role</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Your role"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Name: </span>
                    <span className="text-sm text-foreground">{userProfile?.name || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Role: </span>
                    <span className="text-sm text-foreground">{userProfile?.role || "Not set"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Toggle Button - Bottom right of sidebar */}
        <button
          onClick={toggleTheme}
          className="absolute bottom-4 right-20 p-3 bg-card border rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Sign Out Button - Bottom left */}
        <button
          onClick={handleSignOut}
          className="absolute bottom-4 left-4 flex items-center gap-2 p-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );
};

export default UserSidebar;
