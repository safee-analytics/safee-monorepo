"use client";

import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600 mb-6">
              Team management feature is coming soon. Manage audit team members, assign roles, and track workload.
            </p>
            <p className="text-sm text-gray-500">This feature is part of the audit case management system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
