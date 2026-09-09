import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import { Expense } from "../types/expense.types";

const COLLECTION_NAME = "expenses";

export const expenseRepository = {
  async getAll(): Promise<Expense[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Expense);
  },

  async create(expense: Expense): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, expense.id);
    await setDoc(docRef, expense);
  },

  async update(id: string, updates: Partial<Expense>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, updates, { merge: true });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
