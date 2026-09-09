import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { LoginFormData, RegisterFormData } from "../schemas/auth.schema";
import type { UserProfile, Role } from "../constants/roles";
import { ROLES, ROLE_PERMISSIONS } from "../constants/roles";
import { ActivityService } from "@/features/notifications/services/activity.service";

export const AuthService = {
  async register(data: RegisterFormData): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: data.name });

    // Assigning OWNER role by default for the purposes of this demo.
    const defaultRole: Role = ROLES.OWNER; 
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: data.email,
      displayName: data.name,
      role: defaultRole,
      permissions: ROLE_PERMISSIONS[defaultRole] as import("../constants/roles").Permission[],
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);
    
    await ActivityService.log("user_registered", user.uid, { email: data.email, role: defaultRole });

    return userProfile;
  },

  async login(data: LoginFormData): Promise<UserProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("User profile not found in database.");
    }

    const profile = userDoc.data() as UserProfile;
    await ActivityService.log("user_login", user.uid);
    return profile;
  },

  async logout(uid?: string): Promise<void> {
    if (uid) {
      await ActivityService.log("user_logout", uid);
    }
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as UserProfile;
  }
};
