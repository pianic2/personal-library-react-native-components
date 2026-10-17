export type Trend = "up" | "down" | "flat";

export interface Stat {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
}

export interface Goal {
  id: string;
  label: string;
  progress: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  status: "done" | "pending" | "failed";
}

export const stats: Stat[] = [
  { id: "revenue", label: "Revenue", value: "$12,480", change: "+8%", trend: "up" },
  { id: "orders", label: "Orders", value: "342", change: "+3%", trend: "up" },
  { id: "visitors", label: "Visitors", value: "9,120", change: "-2%", trend: "down" },
  { id: "conversion", label: "Conversion", value: "3.7%", change: "0%", trend: "flat" },
];

export const goals: Goal[] = [
  { id: "sales", label: "Monthly sales", progress: 72 },
  { id: "signups", label: "New sign-ups", progress: 45 },
  { id: "support", label: "Support backlog cleared", progress: 90 },
];

export const activity: ActivityItem[] = [
  { id: "a1", title: "Order #1042", detail: "Paid by card", status: "done" },
  { id: "a2", title: "Order #1041", detail: "Waiting for payment", status: "pending" },
  { id: "a3", title: "Refund #88", detail: "Card declined", status: "failed" },
  { id: "a4", title: "Order #1040", detail: "Shipped", status: "done" },
];
