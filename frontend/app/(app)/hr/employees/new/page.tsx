"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Info } from "lucide-react";

export default function NewEmployeePage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => { router.back(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600 mt-1">Invite team members to create employee records</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Employees are created through team invitations
        </h2>
        <p className="text-gray-700 mb-6 max-w-xl mx-auto">
          To add a new employee, invite them to join your organization as a team member. An employee record
          will be automatically created when they accept the invitation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/settings/team"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </Link>
          <Link
            href="/hr/employees"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Employees
          </Link>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <span>Go to Team Management and invite a new member to your organization</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <span>The invitee receives an email invitation to join</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </span>
            <span>When they accept, an employee record is automatically created</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </span>
            <span>You can then edit the employee record to add additional details</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
