import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Settings, Archive, MessageCircle, Phone, ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamTasks } from "@/hooks/useTeamTasks";
import { useTeamMemberProfiles } from "@/hooks/useTeamMemberProfiles";
import { getTeamByCode, updateTeam, deleteTeam } from "@/services/teams";
import { createTask, updateTask, deleteTask, archiveTask, unarchiveTask } from "@/services/tasks";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import TaskSection from "@/components/TaskSection";
import TimerSection from "@/components/TimerSection";
import ContributionSection from "@/components/ContributionSection";
import TeamManageModal from "@/components/TeamManageModal";
import ArchivedTasksModal from "@/components/ArchivedTasksModal";
import TeamChat from "@/components/TeamChat";
import InviteCodeDisplay from "@/components/InviteCodeDisplay";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  name: string;
  assignee: string;
  status: "pending" | "done";
  timeSpent?: number;
  isActive?: boolean;
  lastActivity?: Date;
  createdAt?: Date;
  manuallyMarkedAtRisk?: boolean;
}

const TeamWorkspace = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  
  const { tasks, loading: tasksLoading } = useTeamTasks(teamId);
  const { memberProfiles } = useTeamMemberProfiles(team?.members || []);

  // Load team data with real-time subscription
  useEffect(() => {
    if (!teamId) return;
    
    const timer = setTimeout(() => {
      if (!team) setShowSkeleton(true);
    }, 100);
    
    const teamRef = doc(db, "teams", teamId);
    const unsubscribe = onSnapshot(teamRef, (doc) => {
      if (doc.exists()) {
        setTeam({ id: doc.id, ...doc.data() });
        setShowSkeleton(false);
      } else {
        console.error("Team not found");
        navigate("/dashboard");
      }
      clearTimeout(timer);
    }, (error) => {
      console.error("Error loading team:", error);
      navigate("/dashboard");
      clearTimeout(timer);
    });
    
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [teamId, navigate]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!teamId) return;
    console.log('onTaskUpdate called:', taskId, updates);
    try {
      if (tasks.find(t => t.id === taskId)) {
        // Update existing task
        console.log('Updating existing task with:', updates);
        await updateTask(taskId, updates);
      } else {
        // Create new task
        console.log('Creating new task');
        await createTask({
          teamId,
          name: updates.name || "New Task",
          assignee: updates.assignee || user?.uid || "Unknown",
          status: updates.status || "pending",
          timeSpent: updates.timeSpent || 0,
          isActive: updates.isActive ?? false,
          manuallyMarkedAtRisk: updates.manuallyMarkedAtRisk || false
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleTaskArchive = async (taskId: string) => {
    try {
      await archiveTask(taskId);
    } catch (error) {
      console.error("Error archiving task:", error);
    }
  };

  const handleArchiveAllCompleted = async () => {
    const completedTasks = tasks.filter(t => t.status === "done");
    if (completedTasks.length === 0) return;
    
    if (!confirm(`Archive ${completedTasks.length} completed tasks?`)) return;
    
    try {
      await Promise.all(completedTasks.map(t => archiveTask(t.id)));
    } catch (error) {
      console.error("Error archiving tasks:", error);
    }
  };

  // Create team members array with real names (exclude "common")
  const teamMembersWithNames = team?.members
    ?.filter((memberId: string) => memberId !== "common")
    ?.map((memberId: string) => ({
      id: memberId,
      name: memberId === user?.uid ? "You" : (memberProfiles[memberId]?.name?.slice(0, 8) || "Unknown"),
      isLeader: team?.leader === memberId
    })) || [];

  const handleRemoveMember = async (memberId: string) => {
    if (!team || team.leader !== user?.uid) return; // Only leader can remove members
    
    try {
      const updatedMembers = team.members.filter((id: string) => id !== memberId);
      await updateTeam(team.code, { members: updatedMembers });
      
      // Reassign the removed member's tasks to common
      const { reassignUserTasksToCommon } = await import("@/services/tasks");
      await reassignUserTasksToCommon(teamId, memberId);
      
      // Update local state
      setTeam({ ...team, members: updatedMembers });
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  const handleLeaveTeam = async () => {
    if (!teamId || !user?.uid || !team) return;
    
    try {
      // If leader is leaving, transfer leadership to next member (excluding "common")
      if (team.leader === user.uid) {
        const nextLeader = team.members.find((memberId: string) => 
          memberId !== user.uid && memberId !== "common"
        );
        
        if (nextLeader) {
          // Transfer leadership first
          await updateTeam(team.code, { leader: nextLeader });
        }
      }
      
      // Reassign the leaving user's tasks to common before leaving
      const { reassignUserTasksToCommon } = await import("@/services/tasks");
      await reassignUserTasksToCommon(teamId, user.uid);
      
      const { leaveTeam } = await import("@/services/teams");
      await leaveTeam(teamId, user.uid);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error leaving team:", error);
      alert("Failed to leave team. Please try again.");
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId || !team || team.leader !== user?.uid) {
      console.error("Only team leader can delete the team");
      return;
    }
    
    try {
      await deleteTeam(teamId);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const handleEditTeamName = () => {
    setEditTeamName(team.name);
    setIsEditingTeamName(true);
  };

  const handleSaveTeamName = async () => {
    if (!team || !editTeamName.trim()) return;
    
    try {
      await updateTeam(team.id, { name: editTeamName.trim() });
      setIsEditingTeamName(false);
    } catch (error) {
      console.error("Error updating team name:", error);
    }
  };

  const handleCancelEditTeamName = () => {
    setIsEditingTeamName(false);
    setEditTeamName("");
  };

  if (!team || isNavigating) {
    if (showSkeleton || isNavigating) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-10">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-16" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
    }
    return null; // Don't render anything during the first 100ms
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => {
              setIsNavigating(true);
              navigate("/dashboard");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to teams
          </button>
          
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50"
              title="Team calls coming soon!"
              disabled
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Team chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowArchivedModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Archived tasks"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowManageModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Team settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-10">
          {isEditingTeamName ? (
            <input
              type="text"
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              className="text-3xl font-semibold bg-transparent border-none outline-none text-foreground p-0 m-0"
              onBlur={handleSaveTeamName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTeamName();
                  e.target.blur();
                }
                if (e.key === 'Escape') handleCancelEditTeamName();
              }}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-foreground">{team.name}</h1>
              {team.leader === user?.uid && (
                <button
                  onClick={handleEditTeamName}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Edit team name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <InviteCodeDisplay code={team.code} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2">
            <TaskSection 
              onTaskSelect={setSelectedTask} 
              selectedTask={selectedTask}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskArchive={handleTaskArchive}
              onArchiveAllCompleted={handleArchiveAllCompleted}
              user={user}
              teamMembers={team?.members || []}
              teamId={teamId}
              teamLeader={team?.leader}
            />
          </div>

          {/* Right Column - Timer & Contributions */}
          <div className="space-y-6">
            <TimerSection 
              selectedTask={selectedTask} 
              onTaskUpdate={handleTaskUpdate}
              teamId={teamId}
              userId={user?.uid}
              tasks={tasks}
            />
            <ContributionSection 
              teamId={teamId}
              teamMembers={team?.members || []}
              memberProfiles={memberProfiles}
              tasks={tasks}
              user={user}
              teamLeader={team?.leader}
            />
          </div>
        </div>
      </div>

      <TeamManageModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        teamName={team.name}
        teamCode={team.code}
        members={teamMembersWithNames}
        isLeader={team.leader === user?.uid}
        onRemoveMember={handleRemoveMember}
        onLeaveTeam={handleLeaveTeam}
        onDeleteTeam={handleDeleteTeam}
      />

      <ArchivedTasksModal
        isOpen={showArchivedModal}
        onClose={() => setShowArchivedModal(false)}
        teamId={teamId || ""}
        memberProfiles={memberProfiles}
      />

      <TeamChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        teamId={teamId || ""}
        userId={user?.uid || ""}
        userName={memberProfiles[user?.uid || ""]?.name || "User"}
      />

    </div>
  );
};

export default TeamWorkspace;
