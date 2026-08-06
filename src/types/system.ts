export type UserStatus = "active" | "disabled" | "pending";

export interface SystemUser {
  id: string;
  name: string;
  account: string;
  department: string;
  role: string;
  status: UserStatus;
  lastActiveAt: string;
}

export type SystemUserInput = Pick<SystemUser, "name" | "account" | "department" | "role" | "status">;

export interface SystemRole {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  permissions: string[];
  updatedAt: string;
}

export type SystemRoleInput = Pick<SystemRole, "name" | "code" | "description" | "permissions">;

export interface SystemMenu {
  id: string;
  name: string;
  path: string;
  permission: string;
  status: "enabled" | "disabled";
  sortOrder: number;
  updatedAt: string;
}

export type SystemMenuInput = Pick<SystemMenu, "name" | "path" | "permission" | "status" | "sortOrder">;
