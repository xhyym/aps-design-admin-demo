import { request } from "../client";
import type { DashboardData } from "@/types/dashboard";

export function getDashboardData(): Promise<DashboardData> {
  return request<DashboardData>({
    url: "/dashboard/workbench",
    method: "get",
  });
}
