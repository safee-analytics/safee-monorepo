"use client";

import Link from "next/link";
import {
  Users,
  Building2,
  UserPlus,
  UserCheck,
  UserX,
  Briefcase,
  Palmtree,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useEmployees, useDepartments } from "@/lib/api/hooks/hrManagement";

export default function HRDashboardPage() {
  // Fetch data
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  // Calculate statistics
  const activeEmployees = employees?.filter((e) => e.active).length || 0;
  const inactiveEmployees = employees?.filter((e) => !e.active).length || 0;
  const totalEmployees = employees?.length || 0;
  const totalDepartments = departments?.length || 0;

  // Get recent employees (last 5)
  const recentEmployees = employees?.slice(0, 5) || [];

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees.toString(),
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/hr/employees",
    },
    {
      title: "Active Employees",
      value: activeEmployees.toString(),
      change: "+5.2%",
      trend: "up",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/hr/employees",
    },
    {
      title: "Departments",
      value: totalDepartments.toString(),
      change: "+2",
      trend: "up",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/hr/departments",
    },
    {
      title: "Inactive",
      value: inactiveEmployees.toString(),
      change: "-3.1%",
      trend: "down",
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/hr/employees",
    },
  ];

  const quickActions = [
    {
      label: "Add Employee",
      href: "/hr/employees/new",
      icon: UserPlus,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Add Department",
      href: "/hr/departments/new",
      icon: Building2,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: "View All Employees",
      href: "/hr/employees",
      icon: Users,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "View All Departments",
      href: "/hr/departments",
      icon: Briefcase,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee records, personal information, and work details",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/hr/employees",
      stats: `${totalEmployees} employees`,
    },
    {
      title: "Department Management",
      description: "Organize departments and sub-departments across your organization",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/hr/departments",
      stats: `${totalDepartments} departments`,
    },
    {
      title: "Contracts",
      description: "View and manage employee contracts and salary structures",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/hr/employees",
      stats: "View in employee profiles",
    },
    {
      title: "Leave Management",
      description: "Track leave balances, requests, and allocations",
      icon: Palmtree,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/hr/employees",
      stats: "View in employee profiles",
    },
    {
      title: "Payslips",
      description: "Access employee payslips and salary information",
      icon: DollarSign,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      href: "/hr/employees",
      stats: "View in employee profiles",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your organization&apos;s human resources</p>
        </div>
        <div className="flex items-center gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${action.color} transition-colors`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Employees</h2>
            <Link href="/hr/employees" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="p-6">
            {recentEmployees.length > 0 ? (
              <div className="space-y-3">
                {recentEmployees.map((employee) => (
                  <Link
                    key={employee.id}
                    href={`/hr/employees/${employee.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {employee.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name || "No Name"}</p>
                        <p className="text-sm text-gray-600">{employee.jobTitle || "No job title"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {employee.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No employees yet</p>
                <Link
                  href="/hr/employees/new"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  Add your first employee →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Total Employees</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{totalEmployees}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <span className="text-lg font-bold text-green-600">{activeEmployees}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-50">
                  <UserX className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm text-gray-600">Inactive</span>
              </div>
              <span className="text-lg font-bold text-red-600">{inactiveEmployees}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Departments</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{totalDepartments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HR Modules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">HR Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg ${module.bgColor}`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{module.description}</p>
              <p className="text-xs text-gray-500">{module.stats}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
