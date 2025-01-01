import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Team } from "../services/teams";

export const useUserTeams = (uid: string | undefined) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Set timeout to avoid infinite loading
    const timeout = setTimeout(() => {
      console.log("Teams loading timeout - showing empty state");
      setTeams([]);
      setLoading(false);
    }, 3000);

    try {
      const q = query(collection(db, "teams"), where("members", "array-contains", uid));
      
      const unsubscribe = onSnapshot(q, 
        (snap) => {
          console.log("Teams loaded:", snap.docs.length);
          const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Team));
          setTeams(data);
          setLoading(false);
          clearTimeout(timeout);
        },
        (error) => {
          console.error("Firestore error:", error);
          setTeams([]);
          setLoading(false);
          clearTimeout(timeout);
        }
      );

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error("Setup error:", error);
      setTeams([]);
      setLoading(false);
      clearTimeout(timeout);
    }
  }, [uid]);

  return { teams, loading };
};
