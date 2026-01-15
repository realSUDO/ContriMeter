import { useEffect } from "react";
import { X, Crown, LogOut } from "lucide-react";

interface Member {
  id: string;
  name: string;
  isLeader: boolean;
}

interface TeamManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamCode: string;
  members: Member[];
  isLeader: boolean;
  onRemoveMember: (memberId: string) => void;
  onLeaveTeam: () => void;
  onDeleteTeam: () => void;
}

const TeamManageModal = ({ 
  isOpen, 
  onClose, 
  teamName,
  teamCode,
  members, 
  isLeader,
  onRemoveMember,
  onLeaveTeam,
  onDeleteTeam
}: TeamManageModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-soft-lg p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{teamName}</h2>
            <p className="text-sm text-muted-foreground font-mono">{teamCode}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Members</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{member.name}</span>
                  {member.isLeader && (
                    <Crown className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                {isLeader && !member.isLeader && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-border pt-4 space-y-2">
          <button
            onClick={onLeaveTeam}
            className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Team
          </button>
          {isLeader && (
            <button
              onClick={onDeleteTeam}
              className="w-full py-2.5 text-sm text-red-600 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
            >
              Delete Team
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManageModal;
