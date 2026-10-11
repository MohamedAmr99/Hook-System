export type ReturnCondition = 'healthy' | 'damaged' | 'wrong_item' | 'missing_parts';
export type ReturnStage = 'requested' | 'shipping_to_seller' | 'received' | 'inspected' | 'case_filed';
export type CaseStatus = 'not_opened' | 'opened' | 'under_review' | 'resolved' | 'rejected';
export type CompensationType = 'full' | 'partial' | 'none';

export type ReturnConditionType = ReturnCondition;
export type ReturnStageType = ReturnStage;
export type CaseStatusType = CaseStatus;

export interface Return {
  id: string;
  orderId: string;
  orderItemId?: string;
  productId?: string;
  platform?: string;
  platformOrderId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  reason?: string;

  returnCondition: ReturnCondition;
  returnStage: ReturnStage;

  caseReference?: string;
  caseStatus?: CaseStatus;

  compensationType?: CompensationType;
  compensationAmount: number;

  customerRefundAmount: number;
  platformFeeRetained?: number;
  shippingCostRetained?: number;
  netLoss?: number;

  restocked: boolean;
  restockedAt?: number | null;

  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  updatedBy?: string;
}
