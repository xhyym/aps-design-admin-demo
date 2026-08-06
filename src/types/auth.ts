import type { IconName } from "aps-design-pro";

export interface PermissionNode {
  code: string;
  label: string;
}

export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon: IconName;
  permission: string;
  children?: NavigationItem[];
}

export interface UserProfile {
  id: string;
  tenantId: string;
  name: string;
  title: string;
  initials: string;
  roles: string[];
  permissions: PermissionNode[];
  navigation: NavigationItem[];
}

export type UserProfileUpdate = Pick<UserProfile, "name" | "title" | "initials">;

export interface LoginPayload {
  account: string;
  password: string;
  remember: boolean;
}

export interface LoginResult {
  accessToken: string;
  profile: UserProfile;
}
