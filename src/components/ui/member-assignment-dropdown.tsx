import * as React from "react";
import { Check, Crown, User, ChevronDown, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface MemberProfile {
  id: string;
  name: string;
  avatar?: string;
  isLeader?: boolean;
  isOnline?: boolean;
}

interface MemberAssignmentDropdownProps {
  members: MemberProfile[];
  selectedMember?: string;
  onMemberSelect: (memberId: string) => void;
  currentUserId?: string;
  trigger?: React.ReactNode;
  placeholder?: string;
}

const MemberAssignmentDropdown = ({
  members,
  selectedMember,
  onMemberSelect,
  currentUserId,
  trigger,
  placeholder = "Assign to..."
}: MemberAssignmentDropdownProps) => {
  const getMemberDisplayName = (member: MemberProfile) => {
    if (member.id === "common") return "Common";
    if (member.id === currentUserId) return "You";
    return member.name?.slice(0, 12) || "Unknown";
  };

  const getSelectedMemberName = () => {
    if (!selectedMember) return placeholder;
    const member = members.find(m => m.id === selectedMember);
    return member ? getMemberDisplayName(member) : placeholder;
  };

  const sortedMembers = React.useMemo(() => {
    // Put "common" first, then current user, then others
    return [...members].sort((a, b) => {
      if (a.id === "common") return -1;
      if (b.id === "common") return 1;
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [members, currentUserId]);

  const defaultTrigger = (
    <div className="input-clean flex items-center justify-between w-full cursor-pointer">
      <div className="flex items-center gap-2">
        {selectedMember === "common" ? (
          <UsersRound className="w-4 h-4 text-muted-foreground" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={selectedMember ? "text-foreground" : "text-muted-foreground"}>
          {getSelectedMemberName()}
        </span>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground" />
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {sortedMembers.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => onMemberSelect(member.id)}
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : member.id === "common" ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UsersRound className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    member.id === currentUserId
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {member.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">
                    {getMemberDisplayName(member)}
                  </span>
                  {member.isLeader && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                {member.id === "common" && (
                  <span className="text-xs text-muted-foreground">Shared task</span>
                )}
                {member.id === currentUserId && member.id !== "common" && (
                  <span className="text-xs text-muted-foreground">Your task</span>
                )}
              </div>
            </div>
            {selectedMember === member.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MemberAssignmentDropdown;