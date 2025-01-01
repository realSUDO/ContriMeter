interface Session {
  id: string;
  taskName: string;
  duration: number; // in seconds
  createdAt: Date;
}

interface SessionHistoryProps {
  sessions: Session[];
}

const SessionHistory = ({ sessions }: SessionHistoryProps) => {
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

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {sessions.map((session) => (
        <div 
          key={session.id}
          className="flex items-center justify-between p-3 bg-background rounded-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground truncate">{session.taskName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</p>
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
