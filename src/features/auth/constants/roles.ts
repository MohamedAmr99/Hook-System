// =================== Role & Permission Constants ===================
export const ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  WAREHOUSE: "Warehouse",
  DESIGNER: "Designer",
} as const;

export const PERMISSIONS = {
  CAN_VIEW_DASHBOARD: "can_view_dashboard",
  CAN_MANAGE_PRODUCTS: "can_manage_products",
  CAN_MANAGE_ORDERS: "can_manage_orders",
  CAN_MANAGE_INVENTORY: "can_manage_inventory",
  CAN_MANAGE_FINANCE: "can_manage_finance",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EDITOR]: [
    PERMISSIONS.CAN_VIEW_DASHBOARD,
    PERMISSIONS.CAN_MANAGE_PRODUCTS,
  ],
  [ROLES.WAREHOUSE]: [
    PERMISSIONS.CAN_VIEW_DASHBOARD,
    PERMISSIONS.CAN_MANAGE_ORDERS,
    PERMISSIONS.CAN_MANAGE_INVENTORY,
  ],
  [ROLES.DESIGNER]: [PERMISSIONS.CAN_VIEW_DASHBOARD],
};

// =================== Types (co-located with constants) ===================
export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  permissions: Permission[];
  createdAt: number;
}
