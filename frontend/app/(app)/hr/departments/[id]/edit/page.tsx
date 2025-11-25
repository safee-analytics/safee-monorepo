"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DepartmentForm, type DepartmentFormValues } from "@/components/hr/DepartmentForm";
import { useDepartment, useUpdateDepartment } from "@/lib/api/hooks/hrManagement";

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const { data: department, isLoading, error } = useDepartment(departmentId);
  const updateDepartment = useUpdateDepartment();

  const handleSubmit = async (data: DepartmentFormValues) => {
    try {
      await updateDepartment.mutateAsync({
        departmentId,
        data: {
          name: data.name,
          code: data.code || undefined,
          parentId: data.parentId || undefined,
          color: data.color ? parseInt(data.color, 16) : undefined,
          note: data.note || undefined,
        },
      });

      router.push(`/hr/departments/${departmentId}`);
    } catch (error) {
      console.error("Failed to update department:", error);
      alert("Failed to update department. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Department</h1>
          <p className="text-gray-600 mt-1">{department.name}</p>
        </div>
      </div>

      {/* Form */}
      <DepartmentForm
        defaultValues={department}
        onSubmit={handleSubmit}
        isSubmitting={updateDepartment.isPending}
        submitLabel="Update Department"
      />
    </div>
  );
}
