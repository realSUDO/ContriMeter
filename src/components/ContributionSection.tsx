import { useEffect, useState } from "react";
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
}

const ContributionSection = ({ teamId, teamMembers = [], memberProfiles = {}, tasks = [], user }: ContributionSectionProps) => {
  const { contributions, loading } = useTeamContributions(teamId);

  // Create member data with contributions
  const membersWithScores = teamMembers.map(memberId => {
    const contribution = contributions.find(c => c.userId === memberId);
    const profile = memberProfiles[memberId];
    
    const tasksCompleted = contribution?.tasksCompleted || 0;
    const tasksAssigned = tasks.filter(t => t.assignee === memberId).length;
    const timeSpent = contribution?.totalTimeSpent || 0;
    const lastActive = contribution?.lastActive || new Date();
    const lastActiveMinutes = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60));
    
    // Calculate progress percentage: (tasks completed / tasks assigned) * 100
    const progressPercentage = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;
    
    return {
      id: memberId,
      name: memberId === user?.uid 
        ? `${profile?.name || `User ${memberId.slice(-4)}`} (You)`
        : profile?.name || `User ${memberId.slice(-4)}`,
      tasksCompleted,
      tasksAssigned,
      timeSpent,
      lastActiveMinutes,
      progressPercentage,
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
              
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-semibold text-foreground">{Math.round(member.progressPercentage)}%</p>
                <p className="text-xs text-muted-foreground">progress</p>
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
