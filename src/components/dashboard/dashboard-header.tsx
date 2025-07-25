"use client";

import * as React from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../layout/theme-toggle";

export function DashboardHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Add any header actions here */}
          <ModeToggle />
          
        </div>
      </div>
    </header>
  );
}
