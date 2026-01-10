import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Settings, Archive, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamTasks } from "@/hooks/useTeamTasks";
import { useTeamMemberProfiles } from "@/hooks/useTeamMemberProfiles";
import { getTeamByCode, updateTeam, deleteTeam } from "@/services/teams";
import { createTask, updateTask, deleteTask, archiveTask, unarchiveTask } from "@/services/tasks";
import TaskSection from "@/components/TaskSection";
import TimerSection from "@/components/TimerSection";
import ContributionSection from "@/components/ContributionSection";
import TeamManageModal from "@/components/TeamManageModal";
import ArchivedTasksModal from "@/components/ArchivedTasksModal";
import TeamChat from "@/components/TeamChat";

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
  
  const { tasks, loading: tasksLoading } = useTeamTasks(teamId);
  const { memberProfiles } = useTeamMemberProfiles(team?.members || []);

  // Load team data
  useEffect(() => {
    if (!teamId) return;
    
    const loadTeam = async () => {
      try {
        const teamData = await getTeamByCode(teamId);
        setTeam(teamData);
      } catch (error) {
        console.error("Error loading team:", error);
        navigate("/dashboard");
      }
    };
    
    loadTeam();
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
    if (!confirm("Are you sure you want to delete this task?")) return;
    
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

  // Create team members array with real names
  const teamMembersWithNames = team?.members?.map((memberId: string) => ({
    id: memberId,
    name: memberId === user?.uid ? "You" : (memberProfiles[memberId]?.name || memberId.slice(0, 8) + "..."),
    isLeader: team?.leader === memberId
  })) || [];

  const handleRemoveMember = async (memberId: string) => {
    if (!team || team.leader !== user?.uid) return; // Only leader can remove members
    
    try {
      const updatedMembers = team.members.filter((id: string) => id !== memberId);
      await updateTeam(team.code, { members: updatedMembers });
      
      // Update local state
      setTeam({ ...team, members: updatedMembers });
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  const handleLeaveTeam = () => {
    navigate("/dashboard");
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

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Back to teams
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
              onClick={() => setShowChat(true)}
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
          <h1 className="text-3xl font-semibold text-foreground">{team.name}</h1>
          <span className="text-sm text-muted-foreground font-mono bg-card px-2 py-1 rounded">
            {team.code}
          </span>
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
