import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import type { Category } from "../types/platform.types";

const CATEGORIES_COLLECTION = "categories";

export const CategoryService = {
  async createCategory(
    data: Pick<Category, "name" | "description">,
    userId: string,
    userDisplayName: string,
  ): Promise<Category> {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const newDocRef = doc(colRef);
    const now = Date.now();
    const category: Category = {
      id: newDocRef.id,
      name: data.name,
      description: data.description || "",
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userDisplayName,
    };
    await setDoc(newDocRef, category);
    return category;
  },

  async updateCategory(
    id: string,
    data: Partial<Pick<Category, "name" | "description">>,
    userDisplayName: string,
  ): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: Date.now(), updatedBy: userDisplayName });
  },

  async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  },

  async getCategories(): Promise<Category[]> {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Category);
  },
};
