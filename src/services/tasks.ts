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
  Timestamp,
  writeBatch
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
  activeUserId?: string; // For common tasks, tracks who is currently working on it
  completedBy?: string; // For common tasks, tracks who completed it
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

export const getArchivedTasks = (teamId: string, callback: (tasks: Task[]) => void) => {
  const tasksRef = collection(db, "tasks");
  const q = query(
    tasksRef, 
    where("teamId", "==", teamId),
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

export const reassignUserTasksToCommon = async (teamId: string, userId: string): Promise<void> => {
  const tasksRef = collection(db, "tasks");
  
  // Simple query - just get all tasks for this team assigned to this user
  const q = query(
    tasksRef, 
    where("teamId", "==", teamId),
    where("assignee", "==", userId)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.docs.length === 0) {
    return;
  }
  
  // Batch update all tasks assigned to the user
  const batch = writeBatch(db);
  
  snapshot.docs.forEach((doc) => {
    const taskData = doc.data();
    // Skip already archived tasks
    if (taskData.archived) {
      return;
    }
    
    const taskRef = doc.ref;
    batch.update(taskRef, {
      assignee: "common",
      isActive: false,
      activeUserId: null,
      lastActivity: serverTimestamp()
    });
  });
  
  await batch.commit();
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
