import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Task } from "../services/tasks";

export const useTeamTasks = (teamId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "tasks"), where("teamId", "==", teamId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate()
      } as Task));
      setTasks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  return { tasks, loading };
};
