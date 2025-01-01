import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Contribution } from "../services/contributions";

export const useTeamContributions = (teamId: string | undefined) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const contributionsRef = collection(db, "contributions");
    const q = query(contributionsRef, where("teamId", "==", teamId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      } as Contribution));
      setContributions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  return { contributions, loading };
};
