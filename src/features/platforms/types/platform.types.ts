export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface Platform {
  id: string;
  name: string;
  logoUrl?: string;
  categories: PlatformCategory[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface PlatformCategory {
  categoryId: string;
  categoryName: string;
  commissionRate: number; // percentage e.g. 15 = 15%
}
