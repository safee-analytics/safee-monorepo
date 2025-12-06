"use client";

import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/EmployeeForm";
import { useEmployee, useUpdateEmployee } from "@/lib/api/hooks/hrManagement";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = async (data: EmployeeFormValues) => {
    try {
      await updateEmployee.mutateAsync({
        employeeId,
        data: {
          name: data.name,
          workEmail: data.workEmail || undefined,
          jobTitle: data.jobTitle || undefined,
          departmentId: data.departmentId || undefined,
          managerId: data.managerId || undefined,
          mobile: data.mobile || undefined,
          workPhone: data.workPhone || undefined,
          workLocation: data.workLocation || undefined,
          identificationId: data.identificationId || undefined,
          gender: data.gender || undefined,
          birthday: data.birthday || undefined,
          countryOfBirth: data.countryOfBirth || undefined,
          maritalStatus: data.maritalStatus || undefined,
          employeeType: data.employeeType || undefined,
          email: data.email || undefined,
          emergencyContact: data.emergencyContact || undefined,
          emergencyPhone: data.emergencyPhone || undefined,
          notes: data.notes || undefined,
          active: data.active,
        },
      });

      router.push(`/hr/employees/${employeeId}`);
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee. Please try again.");
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

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium">Failed to load employee</p>
          <p className="text-red-600 text-sm mt-1">{error?.message || "Employee not found"}</p>
          <Link
            href="/hr/employees"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Employees
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
          <p className="text-gray-600 mt-1">{employee.name}</p>
        </div>
      </div>

      {/* Form */}
      <EmployeeForm
        defaultValues={employee}
        onSubmit={handleSubmit}
        isSubmitting={updateEmployee.isPending}
        submitLabel="Update Employee"
      />
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}
