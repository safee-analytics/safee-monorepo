"use client";

import { useToast, useConfirm, SafeeToastContainer } from "@/components/feedback";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Building2, Users, AlertCircle, FolderTree } from "lucide-react";
import {
  useDepartment,
  useDepartments,
  useEmployees,
  useDeleteDepartment,
} from "@/lib/api/hooks/hrManagement";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const departmentId = params.id as string;

  const { data: department, isLoading, error } = useDepartment(departmentId);
  const { data: allDepartments } = useDepartments();
  const { data: allEmployees } = useEmployees();

  const deleteDepartment = useDeleteDepartment();

  const parentDepartment = allDepartments?.find((d) => d.id === department?.parentId);
  const subDepartments = allDepartments?.filter((d) => d.parentId === departmentId);
  const departmentEmployees = allEmployees?.filter((e) => e.departmentId === departmentId);

  const handleDelete = async () => {
    if (departmentEmployees && departmentEmployees.length > 0) {
      toast.error(
        `Cannot delete department with ${departmentEmployees.length} employees. Please reassign or remove employees first.`,
      );
      return;
    }

    if (subDepartments && subDepartments.length > 0) {
      toast.error(
        `Cannot delete department with ${subDepartments.length} sub-departments. Please delete or move sub-departments first.`,
      );
      return;
    }

    const confirmed = await confirm({
      title: "Delete Department",
      message: "Are you sure you want to delete this department?",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteDepartment.mutateAsync(departmentId);
      router.push("/hr/departments");
    } catch (err) {
      console.error("Failed to delete department:", err);
      toast.error("Failed to delete department. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium">Failed to load department</p>
          <p className="text-red-600 text-sm mt-1">{error?.message || "Department not found"}</p>
          <Link
            href="/hr/departments"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { router.back(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: department.color ? `#${department.color}` : "#3b82f6" }}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
              {department.code && <p className="text-gray-600 mt-1">Code: {department.code}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/hr/departments/${departmentId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteDepartment.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleteDepartment.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-gray-900">{departmentEmployees?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <FolderTree className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sub-Departments</p>
              <p className="text-2xl font-bold text-gray-900">{subDepartments?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Parent Department</p>
              <p className="text-lg font-bold text-gray-900">
                {parentDepartment ? parentDepartment.name : "None"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Details */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Department Name</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{department.name}</p>
          </div>

          {department.code && (
            <div>
              <p className="text-sm text-gray-600">Department Code</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{department.code}</p>
            </div>
          )}

          {department.color && (
            <div>
              <p className="text-sm text-gray-600">Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: `#${department.color}` }}
                />
                <span className="text-sm font-medium text-gray-900">#{department.color}</span>
              </div>
            </div>
          )}

          {parentDepartment && (
            <div>
              <p className="text-sm text-gray-600">Parent Department</p>
              <Link
                href={`/hr/departments/${parentDepartment.id}`}
                className="text-sm font-medium text-blue-600 hover:underline mt-1 inline-block"
              >
                {parentDepartment.name}
              </Link>
            </div>
          )}

          {department.createdAt && (
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(department.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {department.note && (
          <div className="mt-6">
            <p className="text-sm text-gray-600">Notes</p>
            <div className="bg-gray-50 rounded-lg p-4 mt-1">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{department.note}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Departments */}
      {subDepartments && subDepartments.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sub-Departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subDepartments.map((subDept) => (
              <Link
                key={subDept.id}
                href={`/hr/departments/${subDept.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: subDept.color ? `#${subDept.color}` : "#3b82f6" }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{subDept.name}</p>
                    <p className="text-sm text-gray-600">
                      {allEmployees?.filter((e) => e.departmentId === subDept.id).length || 0} employees
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Employees */}
      {departmentEmployees && departmentEmployees.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employees</h3>
          <div className="space-y-3">
            {departmentEmployees.map((employee) => (
              <Link
                key={employee.id}
                href={`/hr/employees/${employee.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
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
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.active ? "Active" : "Inactive"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}
