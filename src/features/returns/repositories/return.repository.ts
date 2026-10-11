import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { Return } from "../types/return.types";

const RETURNS_COLLECTION = "returns";

export const ReturnRepository = {
  async getAll(): Promise<Return[]> {
    try {
      const q = query(collection(db, RETURNS_COLLECTION), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Return[];
    } catch (e) {
      console.warn("Firestore returns fetch error, returning empty array:", e);
      return [];
    }
  },

  async create(data: Omit<Return, "id" | "createdAt" | "updatedAt">): Promise<Return> {
    const docRef = doc(collection(db, RETURNS_COLLECTION));
    const now = Date.now();
    const newReturn: Return = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newReturn);
    return newReturn;
  },

  async update(id: string, updates: Partial<Return>): Promise<void> {
    const docRef = doc(db, RETURNS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, RETURNS_COLLECTION, id);
    await deleteDoc(docRef);
  },
};
