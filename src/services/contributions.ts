import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

export interface Contribution {
  id: string;
  teamId: string;
  userId: string;
  tasksCompleted: number;
  totalTimeSpent: number; // in seconds
  lastActive: Date;
  createdAt: Date;
}

export const updateContribution = async (
  teamId: string, 
  userId: string, 
  timeSpent: number = 0, 
  tasksCompleted: number = 0
): Promise<void> => {
  const contributionRef = doc(db, "contributions", `${teamId}_${userId}`);
  
  try {
    await updateDoc(contributionRef, {
      tasksCompleted: increment(tasksCompleted),
      totalTimeSpent: increment(timeSpent),
      lastActive: serverTimestamp()
    });
  } catch (error) {
    // Document doesn't exist, create it
    await setDoc(contributionRef, {
      teamId,
      userId,
      tasksCompleted: Math.max(0, tasksCompleted), // Ensure no negative values
      totalTimeSpent: Math.max(0, timeSpent),
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }
};

export const decrementContribution = async (
  teamId: string, 
  userId: string, 
  tasksCompleted: number = 0
): Promise<void> => {
  const contributionRef = doc(db, "contributions", `${teamId}_${userId}`);
  
  try {
    await updateDoc(contributionRef, {
      tasksCompleted: increment(-tasksCompleted), // Decrement
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error("Error decrementing contribution:", error);
  }
};

export const getTeamContributions = async (teamId: string): Promise<Contribution[]> => {
  const contributionsRef = collection(db, "contributions");
  const q = query(contributionsRef, where("teamId", "==", teamId));
  const snap = await getDocs(q);
  
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastActive: doc.data().lastActive?.toDate(),
    createdAt: doc.data().createdAt?.toDate()
  } as Contribution));
};
