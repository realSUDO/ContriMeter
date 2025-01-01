interface StatusBadgeProps {
  status: "active" | "at-risk" | "inactive";
  className?: string;
}

const statusStyles = {
  active: "bg-primary/10 text-primary",
  "at-risk": "bg-accent/30 text-muted-foreground",
  inactive: "bg-muted text-muted-foreground/60",
};

const statusLabels = {
  active: "Active",
  "at-risk": "At Risk",
  inactive: "Inactive",
};

const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  return (
    <span 
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[status]} ${className}`}
    >
      {statusLabels[status]}
    </span>
  );
};

// Helper to calculate status based on activity
export const calculateStatus = (
  tasksCompleted: number,
  timeSpentMinutes: number,
  lastActiveMinutes: number
): "active" | "at-risk" | "inactive" => {
  // Inactive: no activity in 60+ minutes or no tasks/time
  if (lastActiveMinutes > 60 || (tasksCompleted === 0 && timeSpentMinutes === 0)) {
    return "inactive";
  }
  // At risk: low activity (less than 2 tasks and less than 30 mins)
  if (tasksCompleted < 2 && timeSpentMinutes < 30) {
    return "at-risk";
  }
  // Active: good engagement
  return "active";
};

export default StatusBadge;
