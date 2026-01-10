import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTeams } from "@/hooks/useUserTeams";
import { logout } from "@/services/auth";
import { createTeam, joinTeam } from "@/services/teams";
import { createUserProfile, getUserProfile, addTeamToUser } from "@/services/users";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import TeamCard from "@/components/TeamCard";
import CreateTeamModal from "@/components/CreateTeamModal";
import JoinTeamModal from "@/components/JoinTeamModal";

interface DashboardTeam {
  id: string;
  name: string;
  code: string;
  isLeader: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams: firestoreTeams, loading: teamsLoading } = useUserTeams(user?.uid);
  const [userInitialized, setUserInitialized] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Initialize user profile once
  useEffect(() => {
    if (!user) return;

    const initializeUser = async () => {
      try {
        // Check if user profile exists
        const userProfile = await getUserProfile(user.uid);
        if (!userProfile) {
          // Redirect to profile setup
          navigate("/profile-setup");
          return;
        }
        setUserInitialized(true);
      } catch (error) {
        console.error("Error initializing user:", error);
        // Still mark as initialized to show the UI
        setUserInitialized(true);
      }
    };

    initializeUser();
  }, [user, navigate]);

  // Convert Firestore teams to dashboard format
  const teams: DashboardTeam[] = firestoreTeams.map(team => ({
    id: team.id,
    name: team.name,
    code: team.code,
    isLeader: team.leader === user?.uid
  }));

  const handleCreateTeam = async (name: string, code: string) => {
    if (!user) return;
    
    console.log("Creating team:", { name, code, uid: user.uid });
    setCreating(true);
    
    try {
      console.log("Calling createTeam...");
      await createTeam(name, user.uid, code);
      console.log("Team created successfully");
      
      console.log("Adding team to user...");
      await addTeamToUser(user.uid, code);
      console.log("Team added to user successfully");
      
      // Force refresh teams
      console.log("Team creation complete");
    } catch (error) {
      console.error("Error creating team:", error);
      alert(`Failed to create team: ${error}`);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (code: string) => {
    if (!user) return;
    
    try {
      await joinTeam(code, user.uid);
      await addTeamToUser(user.uid, code);
      // No need to update local state - onSnapshot will handle it
    } catch (error) {
      console.error("Error joining team:", error);
      alert("Failed to join team. Please check the code and try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading skeleton
  if (teamsLoading && userInitialized) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="h-4 w-16 bg-muted rounded mb-8 animate-pulse"></div>
          <div className="h-8 w-48 bg-muted rounded mb-8 animate-pulse"></div>
          <div className="flex gap-3 mb-10">
            <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show main UI even if teams are still loading
  if (!userInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-semibold text-foreground mb-8">Your Teams</h1>

        <div className="flex gap-3 mb-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            disabled={creating}
            className="btn-primary"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary"
          >
            Join Team
          </button>
        </div>
        
        {/* Micro-copy */}
        <div className="flex gap-6 mb-10">
          <p className="text-xs text-muted-foreground/70">Start something fair.</p>
          <p className="text-xs text-muted-foreground/70">Step into the action.</p>
        </div>

        <div className="space-y-4">
          {teams.map((team, index) => (
            <div 
              key={team.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TeamCard {...team} />
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No teams yet. Create or join one to get started.</p>
          </div>
        )}
      </div>

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTeam={handleCreateTeam}
      />

      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinTeam={handleJoinTeam}
      />
    </div>
  );
};

export default Dashboard;
