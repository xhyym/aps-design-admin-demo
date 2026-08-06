export interface DashboardSummary {
  label: string;
  value: string;
  detail: string;
  trend: "up" | "down" | "flat" | "attention";
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "access" | "setting" | "member" | "release";
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  action: string;
  level: "normal" | "attention";
}

export interface DashboardData {
  greeting: string;
  summaries: DashboardSummary[];
  activities: ActivityItem[];
  todos: TodoItem[];
}
