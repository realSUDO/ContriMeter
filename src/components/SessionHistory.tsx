import { useEffect, useState } from "react";
import { getUserProfile } from "@/services/users";

interface Session {
  id: string;
  userId: string;
  taskName: string;
  duration: number; // in seconds
  createdAt: Date;
  userName?: string; // Optional, will be fetched
}

interface SessionHistoryProps {
  sessions: Session[];
}

const SessionHistory = ({ sessions }: SessionHistoryProps) => {
  const [sessionsWithUsers, setSessionsWithUsers] = useState<Session[]>([]);

  useEffect(() => {
    const fetchUserNames = async () => {
      const updatedSessions = await Promise.all(
        sessions.map(async (session) => {
          if (!session.userName && session.userId) {
            try {
              const userProfile = await getUserProfile(session.userId);
              return { ...session, userName: userProfile?.name || 'Unknown User' };
            } catch (error) {
              return { ...session, userName: 'Unknown User' };
            }
          }
          return session;
        })
      );
      
      // Merge consecutive sessions with same task name and user
      const mergedSessions: Session[] = [];
      let i = 0;
      while (i < updatedSessions.length) {
        const current = updatedSessions[i];
        let totalDuration = current.duration;
        let j = i + 1;
        
        // Find all consecutive sessions with same task and user
        while (j < updatedSessions.length && 
               updatedSessions[j].taskName === current.taskName && 
               updatedSessions[j].userId === current.userId) {
          totalDuration += updatedSessions[j].duration;
          j++;
        }
        
        // Add merged session
        mergedSessions.push({
          ...current,
          duration: totalDuration
        });
        
        i = j; // Move to next unprocessed session
      }
      
      setSessionsWithUsers(mergedSessions);
    };

    if (sessions.length > 0) {
      fetchUserNames();
    } else {
      setSessionsWithUsers([]);
    }
  }, [sessions]);
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (sessionsWithUsers.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {sessionsWithUsers.map((session) => (
        <div 
          key={session.id}
          className="flex items-center justify-between p-3 bg-background rounded-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground truncate">{session.taskName}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <span>{formatDate(session.createdAt)}</span>
              {session.userName && (
                <>
                  <span>•</span>
                  <span>{session.userName}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground ml-3">
            {formatDuration(session.duration)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SessionHistory;
