import { ExpenseMetrics } from "@/components/dashboard/expense-metrics";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <ExpenseMetrics />
      <div className="px-4 lg:px-6">
        <ExpenseChart />
      </div>
      <div className="px-4 lg:px-6">
        <RecentExpenses />
      </div>
    </div>
  );
}
