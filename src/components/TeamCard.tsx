import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";

interface TeamCardProps {
  id: string;
  name: string;
  code: string;
  isLeader?: boolean;
}

const TeamCard = ({ id, name, code, isLeader = false }: TeamCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/team/${id}`)}
      className="card-soft cursor-pointer hover:shadow-soft-lg transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {isLeader && (
              <Crown className="w-3.5 h-3.5 text-accent" />
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-1">{code}</p>
        </div>
        <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          →
        </span>
      </div>
    </div>
  );
};

export default TeamCard;
