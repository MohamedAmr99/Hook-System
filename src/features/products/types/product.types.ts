export type MarketplaceStatus = "Active" | "Inactive" | "Pending" | "Suspended";

export interface MarketplaceUrls {
  amazon?: string;
  noon?: string;
  jumia?: string;
}

export interface Product {
  id: string;

  // Basic Info
  productName: string;
  slug: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;

  // Pricing
  sellingPrice: number;
  costPrice: number;

  // Inventory
  quantity: number;
  reservedQuantity: number;
  unavailableQuantity?: number;
  minimumStockAlert: number;

  // Marketplace
  amazonStatus: MarketplaceStatus;
  noonStatus: MarketplaceStatus;
  jumiaStatus: MarketplaceStatus;
  listingUrls: MarketplaceUrls;

  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string; // Comma separated keywords

  // AI Content
  aiPrompt?: string;
  aiGeneratedDescription?: string;

  // Media
  thumbnail?: string;
  gallery: string[];
  videos: string[];

  // System
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  archived: boolean;
}

export interface ProductFilters {
  search?: string;
  brand?: string;
  category?: string;
  stockStatus?: "InStock" | "LowStock" | "OutOfStock";
  marketplaceStatus?: MarketplaceStatus;
  archived?: boolean;
}
