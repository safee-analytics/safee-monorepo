"use client";

import { useState } from "react";
import type { WizardStepProps } from "../CreateCaseWizard";
import { Users, X } from "lucide-react";

// Mock users - in real implementation, fetch from API
const AVAILABLE_USERS = [
  { id: "1", name: "Ahmed Al-Mansoori", email: "ahmed@safee.ae", role: "Senior Auditor" },
  { id: "2", name: "Fatima Hassan", email: "fatima@safee.ae", role: "Lead Auditor" },
  { id: "3", name: "Mohammed Ali", email: "mohammed@safee.ae", role: "Junior Auditor" },
  { id: "4", name: "Sara Abdullah", email: "sara@safee.ae", role: "Audit Manager" },
  { id: "5", name: "Khalid Omar", email: "khalid@safee.ae", role: "Senior Auditor" },
];

const ROLES = [
  { value: "lead", label: "Lead Auditor", description: "Responsible for overall audit" },
  { value: "senior", label: "Senior Auditor", description: "Performs complex audit tasks" },
  { value: "staff", label: "Staff Auditor", description: "Supports audit procedures" },
  { value: "reviewer", label: "Reviewer", description: "Reviews audit work" },
];

export function TeamStep({ data, onChange }: WizardStepProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const currentAssignments = data.assignments || [];

  const filteredUsers = AVAILABLE_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddMember = (userId: string, role: string) => {
    const newAssignments = [...currentAssignments, { userId, role }];
    onChange({ assignments: newAssignments });
  };

  const handleRemoveMember = (userId: string) => {
    const newAssignments = currentAssignments.filter((a) => a.userId !== userId);
    onChange({ assignments: newAssignments });
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    const newAssignments = currentAssignments.map((a) => (a.userId === userId ? { ...a, role: newRole } : a));
    onChange({ assignments: newAssignments });
  };

  const isUserAssigned = (userId: string) => {
    return currentAssignments.some((a) => a.userId === userId);
  };

  const getUserById = (userId: string) => {
    return AVAILABLE_USERS.find((u) => u.id === userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Assign Team Members</h3>
        <p className="text-sm text-gray-600">
          Optionally assign team members to this case. You can also do this later from the case detail page.
        </p>
      </div>

      {/* Assigned Team Members */}
      {currentAssignments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Assigned Team ({currentAssignments.length})
          </h4>
          <div className="space-y-2">
            {currentAssignments.map((assignment) => {
              const user = getUserById(assignment.userId);
              if (!user) return null;

              return (
                <div
                  key={assignment.userId}
                  className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={assignment.role}
                      onChange={(e) => handleChangeRole(assignment.userId, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveMember(assignment.userId)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Team Members */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Team Members</h4>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search team members by name or email..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />

        {/* Available Users */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredUsers.map((user) => {
            const isAssigned = isUserAssigned(user.id);

            return (
              <div
                key={user.id}
                className={`p-3 border rounded-lg transition-all ${
                  isAssigned
                    ? "bg-gray-50 border-gray-300 opacity-50"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.email} • {user.role}
                      </p>
                    </div>
                  </div>

                  {!isAssigned && (
                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMember(user.id, e.target.value);
                            e.target.value = ""; // Reset
                          }
                        }}
                        defaultValue=""
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="" disabled>
                          Select role...
                        </option>
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isAssigned && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Already assigned
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      {currentAssignments.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>Optional:</strong> You can assign team members now or skip this step and assign them
            later from the case detail page.
          </p>
        </div>
      )}
    </div>
  );
}
