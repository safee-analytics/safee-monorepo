"use client";

import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/EmployeeForm";
import { useEmployee, useUpdateEmployee } from "@/lib/api/hooks/hrManagement";
import { useHasHRSectionAccess } from "@/lib/api/hooks";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const employeeId = params.id as string;

  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const updateEmployee = useUpdateEmployee();
  const canAccess = useHasHRSectionAccess("employees");

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
              You don&apos;t have permission to access employee management. This section is only available to
              HR roles.
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
    } catch (err) {
      console.error("Failed to update employee:", err);
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
        <button
          onClick={() => {
            router.back();
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
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
