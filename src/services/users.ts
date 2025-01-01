import { db } from "../firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

export interface User {
  uid: string;
  name: string;
  email: string;
  role?: string;
  joinedTeams: string[];
  createdAt: any;
}

export const createUserProfile = async (uid: string, name: string, email: string, role?: string): Promise<void> => {
  console.log("createUserProfile called with:", { uid, name, email, role });
  
  try {
    const userRef = doc(db, "users", uid);
    console.log("User ref created:", userRef.path);
    
    const userData = {
      uid,
      name,
      email,
      role: role || "",
      joinedTeams: [],
      createdAt: serverTimestamp()
    };
    console.log("User data:", userData);
    
    await setDoc(userRef, userData);
    console.log("User profile created successfully");
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as User;
};

export const addTeamToUser = async (uid: string, teamCode: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  
  // Check if user document exists, create if not
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    // Create user document first
    await setDoc(userRef, {
      uid,
      name: "User", // Default name
      email: "",
      joinedTeams: [teamCode],
      createdAt: serverTimestamp()
    });
  } else {
    // Update existing document
    await updateDoc(userRef, {
      joinedTeams: arrayUnion(teamCode)
    });
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};
