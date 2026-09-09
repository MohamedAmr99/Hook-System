import { db, storage } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Product, ProductFilters } from "../types";
import { ActivityService } from "@/shared/services/activity.service";

const PRODUCTS_COLLECTION = "products";

export const ProductService = {
  /**
   * Generates a unique doc ref and sets product in Firestore.
   */
  async createProduct(
    productData: Omit<
      Product,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "archived"
    >,
    userId: string,
    userDisplayName: string,
  ): Promise<Product> {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const newDocRef = doc(productsRef);
    const id = newDocRef.id;

    const now = Date.now();
    const product: Product = {
      ...productData,
      id,
      archived: false,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      gallery: productData.gallery || [],
      videos: productData.videos || [],
    };

    await setDoc(newDocRef, product);

    // Write Activity Log
    await ActivityService.logAction({
      userId,
      userDisplayName,
      actionType: "create",
      entityType: "product",
      entityId: id,
      entityName: product.productName,
      description: `Created product "${product.productName}" (SKU: ${product.sku})`,
      metadata: { sku: product.sku, sellingPrice: product.sellingPrice },
    });

    return product;
  },

  /**
   * Updates an existing product.
   */
  async updateProduct(
    productId: string,
    data: Partial<Product>,
    userId: string,
    userDisplayName: string,
  ): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Read original product first to detect inventory changes or for logs
    const originalSnap = await getDoc(docRef);
    const originalData = originalSnap.exists()
      ? (originalSnap.data() as Product)
      : null;

    const now = Date.now();
    const updateData = {
      ...data,
      updatedAt: now,
      updatedBy: userId,
    };

    await updateDoc(docRef, updateData);

    // Determine log details
    let actionType: "update" | "inventory_edit" = "update";
    let desc = `Updated product "${data.productName || originalData?.productName || productId}"`;

    if (
      originalData &&
      data.quantity !== undefined &&
      data.quantity !== originalData.quantity
    ) {
      actionType = "inventory_edit";
      desc = `Edited inventory of "${originalData.productName}" from ${originalData.quantity} to ${data.quantity} units (SKU: ${originalData.sku})`;
    }

    await ActivityService.logAction({
      userId,
      userDisplayName,
      actionType,
      entityType: "product",
      entityId: productId,
      entityName: data.productName || originalData?.productName || productId,
      description: desc,
      metadata: {
        beforeQuantity: originalData?.quantity,
        afterQuantity: data.quantity,
        sku: originalData?.sku,
      },
    });
  },

  /**
   * Permanently deletes a product.
   */
  async deleteProduct(
    productId: string,
    userId: string,
    userDisplayName: string,
  ): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const originalSnap = await getDoc(docRef);
    const originalData = originalSnap.exists()
      ? (originalSnap.data() as Product)
      : null;

    await deleteDoc(docRef);

    await ActivityService.logAction({
      userId,
      userDisplayName,
      actionType: "delete",
      entityType: "product",
      entityId: productId,
      entityName: originalData?.productName || productId,
      description: `Deleted product "${originalData?.productName || productId}" (SKU: ${originalData?.sku || "N/A"})`,
      metadata: { sku: originalData?.sku },
    });
  },

  /**
   * Archives or unarchives a product.
   */
  async archiveProduct(
    productId: string,
    archived: boolean,
    userId: string,
    userDisplayName: string,
  ): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const originalSnap = await getDoc(docRef);
    const originalData = originalSnap.exists()
      ? (originalSnap.data() as Product)
      : null;

    await updateDoc(docRef, {
      archived,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    await ActivityService.logAction({
      userId,
      userDisplayName,
      actionType: "archive",
      entityType: "product",
      entityId: productId,
      entityName: originalData?.productName || productId,
      description: archived
        ? `Archived product "${originalData?.productName || productId}"`
        : `Restored product "${originalData?.productName || productId}" from archives`,
      metadata: { archived, sku: originalData?.sku },
    });
  },

  /**
   * Fetches a single product by its ID.
   */
  async getProductById(productId: string): Promise<Product | null> {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  },

  /**
   * Fetches all products, applying search and filters in-memory for zero index requirement.
   */
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const productsRef = collection(db, PRODUCTS_COLLECTION);

    // Sort by createdAt descending
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    let list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);

    // Apply Archived filter (defaults to active/false, unless explicitly requesting archived)
    const showArchived = filters.archived ?? false;
    list = list.filter((p) => p.archived === showArchived);

    // Apply Search filter (name, SKU, brand, slug)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower),
      );
    }

    // Apply Brand filter
    if (filters.brand) {
      list = list.filter(
        (p) => p.brand.toLowerCase() === filters.brand?.toLowerCase(),
      );
    }

    // Apply Category filter
    if (filters.category) {
      list = list.filter(
        (p) => p.category.toLowerCase() === filters.category?.toLowerCase(),
      );
    }

    // Apply Marketplace Status
    if (filters.marketplaceStatus) {
      list = list.filter(
        (p) =>
          p.amazonStatus === filters.marketplaceStatus ||
          p.noonStatus === filters.marketplaceStatus ||
          p.jumiaStatus === filters.marketplaceStatus,
      );
    }

    // Apply Stock Status
    if (filters.stockStatus) {
      list = list.filter((p) => {
        const stock = p.quantity - p.reservedQuantity;
        if (filters.stockStatus === "OutOfStock") {
          return stock <= 0;
        } else if (filters.stockStatus === "LowStock") {
          return stock > 0 && stock <= p.minimumStockAlert;
        } else {
          // InStock
          return stock > p.minimumStockAlert;
        }
      });
    }

    return list;
  },

  /**
   * Uploads a file to Firebase Storage under the products path and calls back with upload progress.
   */
  async uploadProductImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (onProgress) onProgress(0);
      const fileExt = file.name.split(".").pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const fileRef = ref(storage, `products/${uniqueName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      if (onProgress) onProgress(100);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw error;
    }
  },
};
