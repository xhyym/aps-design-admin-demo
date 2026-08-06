import { request } from "../client";
import type { PageResult, SortOrder } from "@/types/api";
import type { SystemMenu, SystemMenuInput, SystemRole, SystemRoleInput, SystemUser, SystemUserInput, UserStatus } from "@/types/system";

export interface ListQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

/** 成员筛选参数与其他列表参数分离，避免角色、状态条件污染无关接口。 */
export interface UserListQuery extends ListQuery {
  role?: string;
  status?: UserStatus;
}

export function getUsers(query: UserListQuery): Promise<PageResult<SystemUser>> {
  return request<PageResult<SystemUser>>({ url: "/system/users", method: "get", params: query });
}

export function createUser(user: SystemUserInput): Promise<SystemUser> {
  return request<SystemUser>({ url: "/system/users", method: "post", data: user });
}

export function updateUser(user: Partial<SystemUserInput> & Pick<SystemUser, "id">): Promise<SystemUser> {
  return request<SystemUser>({ url: "/system/users", method: "put", data: user });
}

export function removeUser(id: string): Promise<null> {
  return request<null>({ url: "/system/users", method: "delete", data: { id } });
}

export function updateUserStatus(ids: string[], status: UserStatus): Promise<null> {
  return request<null>({ url: "/system/users/status", method: "patch", data: { ids, status } });
}

export function getRoles(query: ListQuery): Promise<PageResult<SystemRole>> {
  return request<PageResult<SystemRole>>({ url: "/system/roles", method: "get", params: query });
}

export function createRole(role: SystemRoleInput): Promise<SystemRole> {
  return request<SystemRole>({ url: "/system/roles", method: "post", data: role });
}

export function updateRole(role: Partial<SystemRoleInput> & Pick<SystemRole, "id">): Promise<SystemRole> {
  return request<SystemRole>({ url: "/system/roles", method: "put", data: role });
}

export function removeRole(id: string): Promise<null> {
  return request<null>({ url: "/system/roles", method: "delete", data: { id } });
}

export function getMenus(query: ListQuery): Promise<PageResult<SystemMenu>> {
  return request<PageResult<SystemMenu>>({ url: "/system/menus", method: "get", params: query });
}

export function createMenu(menu: SystemMenuInput): Promise<SystemMenu> {
  return request<SystemMenu>({ url: "/system/menus", method: "post", data: menu });
}

export function updateMenu(menu: Partial<SystemMenuInput> & Pick<SystemMenu, "id">): Promise<SystemMenu> {
  return request<SystemMenu>({ url: "/system/menus", method: "put", data: menu });
}

export function removeMenu(id: string): Promise<null> {
  return request<null>({ url: "/system/menus", method: "delete", data: { id } });
}
