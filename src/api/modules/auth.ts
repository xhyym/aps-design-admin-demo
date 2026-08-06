import { request } from "../client";
import type { LoginPayload, LoginResult } from "@/types/auth";

export function login(payload: LoginPayload): Promise<LoginResult> {
  return request<LoginResult>({
    url: "/auth/login",
    method: "post",
    data: payload,
  });
}
