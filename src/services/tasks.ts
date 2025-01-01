import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface Task {
  id: string;
  teamId: string;
  name: string;
  assignee: string;
  status: "pending" | "done";
  timeSpent?: number;
  isActive?: boolean;
  lastActivity?: Date;
  createdAt?: Date;
  manuallyMarkedAtRisk?: boolean;
  archived?: boolean;
}

export const createTask = async (task: Omit<Task, "id" | "createdAt">): Promise<string> => {
  const tasksRef = collection(db, "tasks");
  const docRef = await addDoc(tasksRef, {
    ...task,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp()
  });
  return docRef.id;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, {
    ...updates,
    lastActivity: serverTimestamp()
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  await deleteDoc(taskRef);
};

export const archiveTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, {
    archived: true,
    lastActivity: serverTimestamp()
  });
};

export const unarchiveTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, {
    archived: false,
    lastActivity: serverTimestamp()
  });
};

export const getTeamTasks = async (teamId: string): Promise<Task[]> => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("teamId", "==", teamId));
  const snap = await getDocs(q);
  
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    lastActivity: doc.data().lastActivity?.toDate()
  } as Task));
};

export const getArchivedTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const tasksRef = collection(db, "tasks");
  const q = query(
    tasksRef, 
    where("assignee", "==", userId),
    where("archived", "==", true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastActivity: doc.data().lastActivity?.toDate()
    } as Task));
    callback(tasks);
  });
};

export const subscribeToTeamTasks = (
  teamId: string, 
  callback: (tasks: Task[]) => void
): (() => void) => {
  const tasksRef = collection(db, "tasks");
  const q = query(
    tasksRef, 
    where("teamId", "==", teamId),
    where("archived", "!=", true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastActivity: doc.data().lastActivity?.toDate()
    } as Task));
    callback(tasks);
  });
};
