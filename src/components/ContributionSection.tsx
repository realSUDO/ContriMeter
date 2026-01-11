import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import CircularProgress from "./CircularProgress";
import StatusBadge, { calculateStatus } from "./StatusBadge";
import LastActiveIndicator from "./LastActiveIndicator";
import { useTeamContributions } from "@/hooks/useTeamContributions";

interface ContributionSectionProps {
  teamId?: string;
  teamMembers?: string[];
  memberProfiles?: Record<string, any>;
  tasks?: any[];
  user?: any;
  teamLeader?: string;
}

const ContributionSection = ({ teamId, teamMembers = [], memberProfiles = {}, tasks = [], user, teamLeader }: ContributionSectionProps) => {
  const { contributions, loading } = useTeamContributions(teamId);

  // Create member data with contributions (exclude "common" user)
  // Show ALL team members, even those without contribution records yet
  const membersWithScores = teamMembers
    .filter(memberId => memberId !== "common")
    .map(memberId => {
    const contribution = contributions.find(c => c.userId === memberId);
    const profile = memberProfiles[memberId];
    
    const tasksCompleted = contribution?.tasksCompleted || 0;
    const tasksAssigned = tasks.filter(t => t.assignee === memberId).length;
    const timeSpent = contribution?.totalTimeSpent || 0;
    // For new members without contributions, use current time as lastActive
    const lastActive = contribution?.lastActive || new Date();
    const lastActiveMinutes = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60));
    
    // Progress bar: only personal tasks (excludes common tasks)
    const personalTasksCompleted = tasks.filter(t => t.assignee === memberId && t.status === "done").length;
    const personalTasksAssigned = tasks.filter(t => t.assignee === memberId).length;
    const progressBarPercentage = personalTasksAssigned > 0 ? (personalTasksCompleted / personalTasksAssigned) * 100 : 0;
    
    // Overall percentage: includes common tasks (from contributions)
    const overallPercentage = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;
    
    return {
      id: memberId,
      name: memberId === user?.uid 
        ? `${profile?.name?.slice(0, 8) || "You"} (You)`
        : profile?.name?.slice(0, 8) || "Unknown",
      tasksCompleted,
      tasksAssigned,
      timeSpent,
      lastActiveMinutes,
      progressPercentage: progressBarPercentage, // For circular progress bar (personal tasks only)
      overallPercentage, // For display percentage (includes common tasks)
      score: (tasksCompleted * 10) + timeSpent,
      status: calculateStatus(tasksCompleted, timeSpent, lastActiveMinutes),
    };
  });

  const maxScore = Math.max(...membersWithScores.map(m => m.score), 1);

  if (loading) {
    return (
      <div className="card-soft">
        <h2 className="text-lg font-semibold text-foreground mb-6">Contributions</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-soft">
      <h2 className="text-lg font-semibold text-foreground mb-6">Contributions</h2>
      
      <div className="space-y-4">
        {membersWithScores.map((member, index) => {
          return (
            <div 
              key={member.id}
              className="flex items-center gap-5 p-4 bg-background rounded-lg animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CircularProgress percentage={member.progressPercentage} size={64} strokeWidth={5} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-foreground truncate">{member.name}</h3>
                  {member.id === teamLeader && (
                    <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-sm text-muted-foreground">
                    {member.tasksCompleted}/{member.tasksAssigned} tasks
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(member.timeSpent / 3600)}h {Math.floor((member.timeSpent % 3600) / 60)}m {member.timeSpent % 60}s
                  </span>
                </div>
                <LastActiveIndicator minutes={member.lastActiveMinutes} className="mt-1" />
              </div>
            </div>
          );
        })}
        
        {membersWithScores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No team members found
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributionSection;
