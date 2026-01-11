import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";

export interface Team {
  id: string;
  name: string;
  code: string;
  leader: string;
  members: string[];
  createdAt: any;
}

export const createTeam = async (teamName: string, leaderUid: string, teamCode: string): Promise<void> => {
  console.log("createTeam called with:", { teamName, leaderUid, teamCode });
  
  try {
    const teamRef = doc(db, "teams", teamCode);
    console.log("Team ref created:", teamRef.path);
    
    const teamData = {
      name: teamName,
      code: teamCode,
      leader: leaderUid,
      members: [leaderUid, "common"],
      createdAt: serverTimestamp()
    };
    console.log("Team data:", teamData);
    
    await setDoc(teamRef, teamData);
    console.log("Team document created successfully");
  } catch (error) {
    console.error("Error in createTeam:", error);
    throw error;
  }
};

export const joinTeam = async (teamCode: string, userUid: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }

  await updateDoc(teamRef, {
    members: arrayUnion(userUid)
  });
};

export const getUserTeams = async (userUid: string): Promise<Team[]> => {
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, where("members", "array-contains", userUid));
  const snap = await getDocs(q);
  
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  } as Team));
};

export const getTeamByCode = async (teamCode: string): Promise<Team | null> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    return null;
  }

  return {
    id: teamSnap.id,
    ...teamSnap.data()
  } as Team;
};

export const updateTeam = async (teamCode: string, updates: Partial<Team>): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  await updateDoc(teamRef, updates);
};

export const deleteTeam = async (teamCode: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  await deleteDoc(teamRef);
};

export const leaveTeam = async (teamCode: string, userUid: string): Promise<void> => {
  const teamRef = doc(db, "teams", teamCode);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }

  const teamData = teamSnap.data();
  const updatedMembers = teamData.members.filter((id: string) => id !== userUid);
  
  await updateDoc(teamRef, {
    members: updatedMembers
  });
};
