// @ts-nocheck
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  QueryConstraint
} from "firebase/firestore";
import { db } from "./config";

export class BaseRepository<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as T;
  }

  async create(data: Omit<T, "id">): Promise<T> {
    const docRef = await addDoc(collection(db, this.collectionName), data);
    return { ...data, id: docRef.id } as T;
  }

  async set(id: string, data: Omit<T, "id">): Promise<T> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, data);
    return { ...data, id } as T;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    // @ts-ignore
    await updateDoc(docRef, data);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

