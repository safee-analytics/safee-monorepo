"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListTodo,
  Settings,
  FileText,
  Database,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Job Queues", href: "/queues", icon: ListTodo },
  { name: "Users", href: "/users", icon: Users },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Database", href: "/database", icon: Database },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Safee</h1>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700",
                )}
              />
              <span>{item.name}</span>
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-semibold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@safee.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
