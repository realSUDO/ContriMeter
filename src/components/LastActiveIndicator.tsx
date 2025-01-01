interface LastActiveIndicatorProps {
  minutes: number;
  className?: string;
}

const LastActiveIndicator = ({ minutes, className = "" }: LastActiveIndicatorProps) => {
  const formatTime = (mins: number): string => {
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <span className={`text-xs text-muted-foreground/70 ${className}`}>
      Last active: {formatTime(minutes)}
    </span>
  );
};

export default LastActiveIndicator;
