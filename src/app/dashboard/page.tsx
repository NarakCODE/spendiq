import { ExpenseSidebar } from "@/components/dashboard/expense-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ExpenseMetrics } from "@/components/dashboard/expense-metrics";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "280px",
          "--header-height": "64px",
        } as React.CSSProperties
      }
  >
      <ExpenseSidebar variant="inset" />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-6 py-6">
              <ExpenseMetrics />
              <div className="px-4 lg:px-6">
                <ExpenseChart />
              </div>
              <div className="px-4 lg:px-6">
                <RecentExpenses />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
