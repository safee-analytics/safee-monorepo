"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Search, Plus, Users, FolderTree, ShieldAlert } from "lucide-react";
import { useDepartments, useEmployees } from "@/lib/api/hooks/hrManagement";
import { useHasHRSectionAccess } from "@/lib/api/hooks";

export default function DepartmentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch departments and employees
  const { data: departments, isLoading, error } = useDepartments();
  const { data: employees } = useEmployees();

  const canAccess = useHasHRSectionAccess("departments");

  // Check permission
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Access Denied</h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You don&apos;t have permission to access department management. This section is only available
              to HR roles.
            </p>
            <button
              onClick={() => router.push("/hr")}
              className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
            >
              Go to HR Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter departments based on search
  const filteredDepartments = departments?.filter((dept) => {
    const matchesSearch =
      !searchQuery ||
      dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate department employee counts
  const getDepartmentEmployeeCount = (departmentId: string) => {
    return employees?.filter((emp) => emp.departmentId === departmentId).length || 0;
  };

  const handleRowClick = (departmentId: string) => {
    router.push(`/hr/departments/${departmentId}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Failed to load departments</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage your organization&apos;s departments</p>
        </div>
        <Link
          href="/hr/departments/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <FolderTree className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments?.filter((d) => !d.parentId).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading departments...</p>
          </div>
        ) : filteredDepartments && filteredDepartments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Parent Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Color
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDepartments.map((department) => (
                  <tr
                    key={department.id}
                    onClick={() => {
                      handleRowClick(department.id);
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: department.color ? `#${department.color}` : "#3b82f6" }}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {department.name || "No Name"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{department.code || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {department.parentId
                          ? departments?.find((d) => d.id === department.parentId)?.name || "—"
                          : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{getDepartmentEmployeeCount(department.id)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {department.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: `#${department.color}` }}
                          />
                          <span className="text-sm text-gray-600">#{department.color}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No departments found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery ? "Try adjusting your search" : "Get started by adding your first department"}
            </p>
            {!searchQuery && (
              <Link
                href="/hr/departments/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Department
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
