import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

export interface Session {
  id: string;
  userId: string;
  teamId: string;
  taskName: string;
  duration: number; // in seconds
  createdAt: Date;
}

export const addSession = async (
  userId: string,
  teamId: string,
  taskName: string,
  duration: number
): Promise<void> => {
  const sessionsRef = collection(db, "sessions");
  await addDoc(sessionsRef, {
    userId,
    teamId,
    taskName,
    duration,
    createdAt: serverTimestamp()
  });
};

export const getTeamSessions = async (teamId: string): Promise<Session[]> => {
  const sessionsRef = collection(db, "sessions");
  const q = query(
    sessionsRef,
    where("teamId", "==", teamId),
    orderBy("createdAt", "desc"),
    limit(20) // Only get latest 20 sessions for the team
  );
  
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()
  } as Session));
};
