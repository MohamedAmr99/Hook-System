import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import { Loan } from "../types/loan.types";

const COLLECTION_NAME = "loans";

export const loanRepository = {
  async getAll(): Promise<Loan[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Loan);
  },

  async create(loan: Loan): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, loan.id);
    await setDoc(docRef, loan);
  },

  async update(id: string, updates: Partial<Loan>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, updates, { merge: true });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
