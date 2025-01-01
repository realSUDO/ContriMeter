import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createUserProfile } from "@/services/users";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      await createUserProfile(user.uid, name.trim(), user.email || "", role.trim());
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground mb-8">
          Tell us a bit about yourself to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-clean w-full"
            required
          />
          <input
            type="text"
            placeholder="Role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-clean w-full"
          />
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="btn-primary w-full mt-6"
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          You can update this information later
        </p>
      </div>
    </div>
  );
};

export default ProfileSetup;
