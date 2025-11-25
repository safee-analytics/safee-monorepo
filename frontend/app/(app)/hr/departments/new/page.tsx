"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DepartmentForm, type DepartmentFormValues } from "@/components/hr/DepartmentForm";
import { useCreateDepartment } from "@/lib/api/hooks/hrManagement";

export default function NewDepartmentPage() {
  const router = useRouter();
  const createDepartment = useCreateDepartment();

  const handleSubmit = async (data: DepartmentFormValues) => {
    try {
      const department = await createDepartment.mutateAsync({
        name: data.name,
        code: data.code || undefined,
        parentId: data.parentId || undefined,
        color: data.color ? parseInt(data.color, 16) : undefined,
        note: data.note || undefined,
      });

      router.push(`/hr/departments/${department.id}`);
    } catch (error) {
      console.error("Failed to create department:", error);
      alert("Failed to create department. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Department</h1>
          <p className="text-gray-600 mt-1">Create a new department or sub-department</p>
        </div>
      </div>

      {/* Form */}
      <DepartmentForm
        onSubmit={handleSubmit}
        isSubmitting={createDepartment.isPending}
        submitLabel="Create Department"
      />
    </div>
  );
}
