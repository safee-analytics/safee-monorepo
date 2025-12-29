"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  User,
  Briefcase,
  FileText,
  Palmtree,
  DollarSign,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useConfirm } from "@/components/feedback";
import {
  useEmployee,
  useDepartment,
  useDeactivateEmployee,
  useLeaveBalances,
  type LeaveBalanceResponse,
} from "@/lib/api/hooks/hrManagement";
import { useContracts, usePayslips } from "@/lib/api/hooks/hrData";
import { useHasHRSectionAccess } from "@/lib/api/hooks";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const employeeId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "contracts" | "leave" | "payslips">("overview");

  // Fetch employee data
  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const { data: department } = useDepartment(employee?.departmentId || "");
  const { data: manager } = useEmployee(employee?.managerId || "");

  // Fetch related data
  const { data: contracts } = useContracts({ employeeId: employee?.odooEmployeeId });
  const { data: leaveBalances } = useLeaveBalances(employeeId);
  const { data: payslips } = usePayslips({ employeeId: employee?.odooEmployeeId });

  // Deactivate mutation
  const deactivateEmployee = useDeactivateEmployee();
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
              You don&apos;t have permission to access employee management. This section is only available to HR roles.
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

  const handleDeactivate = async () => {
    const confirmed = await confirm({
      title: "Deactivate Employee",
      message: "Are you sure you want to deactivate this employee?",
      type: "danger",
      confirmText: "Deactivate",
    });
    if (!confirmed) return;

    try {
      await deactivateEmployee.mutateAsync(employeeId);
      router.push("/hr/employees");
    } catch (err) {
      console.error("Failed to deactivate employee:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: User },
    { id: "contracts" as const, label: "Contracts", icon: FileText, count: contracts?.length },
    { id: "leave" as const, label: "Leave", icon: Palmtree, count: leaveBalances?.length },
    { id: "payslips" as const, label: "Payslips", icon: DollarSign, count: payslips?.length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-gray-600 mt-1">{employee.jobTitle || "No job title"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/hr/employees/${employeeId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          {employee.active && (
            <button
              onClick={() => {
                void handleDeactivate();
              }}
              disabled={deactivateEmployee.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deactivateEmployee.isPending ? "Deactivating..." : "Deactivate"}
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {!employee.active && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">This employee is inactive</p>
        </div>
      )}

      {/* Employee Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Contact</h3>
            <div className="space-y-2">
              {employee.workEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${employee.workEmail}`} className="text-sm text-blue-600 hover:underline">
                    {employee.workEmail}
                  </a>
                </div>
              )}
              {employee.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${employee.mobile}`} className="text-sm text-gray-900">
                    {employee.mobile}
                  </a>
                </div>
              )}
              {employee.workPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{employee.workPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Work</h3>
            <div className="space-y-2">
              {department && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <Link
                    href={`/hr/departments/${department.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {department.name}
                  </Link>
                </div>
              )}
              {manager && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <Link
                    href={`/hr/employees/${manager.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {manager.name}
                  </Link>
                </div>
              )}
              {employee.workLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{employee.workLocation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Personal</h3>
            <div className="space-y-2">
              {employee.identificationId && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{employee.identificationId}</p>
                </div>
              )}
              {employee.gender && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900 capitalize">{employee.gender}</p>
                </div>
              )}
              {employee.birthday && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{new Date(employee.birthday).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Employment</h3>
            <div className="space-y-2">
              {employee.employeeType && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900 capitalize">{employee.employeeType}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.active ? "Active" : "Inactive"}
                </span>
              </div>
              {employee.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Joined {new Date(employee.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Additional Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.maritalStatus && (
                    <div>
                      <p className="text-sm text-gray-600">Marital Status</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{employee.maritalStatus}</p>
                    </div>
                  )}
                  {employee.countryOfBirth && (
                    <div>
                      <p className="text-sm text-gray-600">Country of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{employee.countryOfBirth}</p>
                    </div>
                  )}
                  {employee.email && !employee.workEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Personal Email</p>
                      <p className="text-sm font-medium text-gray-900">{employee.email}</p>
                    </div>
                  )}
                  {employee.emergencyContact && (
                    <div>
                      <p className="text-sm text-gray-600">Emergency Contact</p>
                      <p className="text-sm font-medium text-gray-900">{employee.emergencyContact}</p>
                    </div>
                  )}
                  {employee.emergencyPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Emergency Phone</p>
                      <p className="text-sm font-medium text-gray-900">{employee.emergencyPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {employee.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "contracts" && (
            <div>
              {contracts && contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{contract.name}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contract.state === "open"
                              ? "bg-green-100 text-green-800"
                              : contract.state === "close"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {contract.state}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-medium text-gray-900">
                            {contract.date_start ? new Date(contract.date_start).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-medium text-gray-900">
                            {contract.date_end ? new Date(contract.date_end).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        {contract.wage && (
                          <div>
                            <p className="text-gray-600">Wage</p>
                            <p className="font-medium text-gray-900">${contract.wage.toLocaleString()}</p>
                          </div>
                        )}
                        {contract.struct_id && (
                          <div>
                            <p className="text-gray-600">Salary Structure</p>
                            <p className="font-medium text-gray-900">{contract.struct_id.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No contracts found</p>
              )}
            </div>
          )}

          {activeTab === "leave" && (
            <div>
              {leaveBalances && leaveBalances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaveBalances.map((balance: LeaveBalanceResponse) => (
                    <div
                      key={balance.leaveTypeId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900 mb-3">{balance.leaveTypeName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Allocated</span>
                          <span className="font-medium text-gray-900">{balance.totalAllocated} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Used</span>
                          <span className="font-medium text-gray-900">{balance.totalUsed} days</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-600 font-medium">Remaining</span>
                          <span className="font-bold text-blue-600">{balance.totalRemaining} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No leave balances found</p>
              )}
            </div>
          )}

          {activeTab === "payslips" && (
            <div>
              {payslips && payslips.length > 0 ? (
                <div className="space-y-4">
                  {payslips.map((payslip) => (
                    <div
                      key={payslip.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {payslip.number || `Payslip #${payslip.id}`}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payslip.state === "done"
                              ? "bg-green-100 text-green-800"
                              : payslip.state === "cancel"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payslip.state}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date From</p>
                          <p className="font-medium text-gray-900">
                            {payslip.date_from ? new Date(payslip.date_from).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date To</p>
                          <p className="font-medium text-gray-900">
                            {payslip.date_to ? new Date(payslip.date_to).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No payslips found</p>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModalComponent />
    </div>
  );
}
