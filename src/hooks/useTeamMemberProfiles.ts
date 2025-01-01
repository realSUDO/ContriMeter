import { useEffect, useState } from "react";
import { getUserProfile, User } from "../services/users";

export const useTeamMemberProfiles = (memberIds: string[]) => {
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberIds.length) {
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      try {
        const profiles: Record<string, User> = {};
        
        await Promise.all(
          memberIds.map(async (memberId) => {
            const profile = await getUserProfile(memberId);
            if (profile) {
              profiles[memberId] = profile;
            }
          })
        );
        
        setMemberProfiles(profiles);
      } catch (error) {
        console.error("Error fetching member profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [memberIds]);

  return { memberProfiles, loading };
};
