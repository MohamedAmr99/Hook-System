export type MovementType = 
  | "PURCHASE_RECEIVE" 
  | "SALE" 
  | "RETURN_CUSTOMER" 
  | "RETURN_SUPPLIER" 
  | "ADJUSTMENT_ADD" 
  | "ADJUSTMENT_SUBTRACT" 
  | "DAMAGE";

export interface InventoryMovement {
  id: string;
  productId: string;
  sku: string;
  type: MovementType;
  quantity: number; // Positive for addition, Negative for subtraction
  
  referenceId: string; // Order ID, Purchase ID, or Adjustment ID
  
  // Costing
  unitCost: number; // The cost associated with this movement (impacts WAC)
  previousStock: number;
  newStock: number;
  
  notes?: string;

  createdAt: number;
  createdBy: string;
}

export interface CostHistory {
  id: string;
  productId: string;
  
  date: number;
  newWeightedAverageCost: number;
  
  // How it was calculated
  previousStock: number;
  previousWac: number;
  addedQuantity: number;
  addedUnitCost: number;
  newTotalStock: number;
  
  referenceId: string; // E.g. PurchaseReceive ID
  isEstimated: boolean; // Flag if this is a historical estimate vs verified
}
