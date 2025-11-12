"use client";

import { useState } from "react";
import { Search, Users, UserCheck, Clock, Shield } from "lucide-react";
import { StatusBadge } from "@/components/audit/ui/StatusBadge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "away";
  lastActive: string;
  avatar: string;
}

interface Role {
  name: string;
  userCount: number;
  description: string;
  permissions: string[];
  color: string;
}

export default function TeamManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    totalUsers: 48,
    totalUsersChange: "+8% from last month",
    activeUsers: 42,
    activityRate: "87% activity rate",
    pendingInvites: 6,
    pendingNote: "Expire soon",
    adminRoles: 8,
    adminNote: "Different roles",
  };

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      role: "Senior Auditor",
      department: "Financial Audit",
      status: "active",
      lastActive: "2 hours ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@company.com",
      role: "Audit Manager",
      department: "Operations",
      status: "active",
      lastActive: "5 hours ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      email: "emma.rodriguez@company.com",
      role: "Junior Auditor",
      department: "Compliance",
      status: "active",
      lastActive: "1 day ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
    {
      id: "4",
      name: "David Kim",
      email: "david.kim@company.com",
      role: "Senior Auditor",
      department: "Risk Assessment",
      status: "away",
      lastActive: "3 days ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    {
      id: "5",
      name: "Lisa Thompson",
      email: "lisa.thompson@company.com",
      role: "System Admin",
      department: "IT Security",
      status: "active",
      lastActive: "30 minutes ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    },
  ];

  const roles: Role[] = [
    {
      name: "System Admin",
      userCount: 3,
      description: "Full system access and user management",
      permissions: ["All Permissions"],
      color: "text-red-600",
    },
    {
      name: "Audit Manager",
      userCount: 8,
      description: "Manage audit processes and teams",
      permissions: ["Create Audits", "Assign Tasks", "View Reports"],
      color: "text-blue-600",
    },
    {
      name: "Senior Auditor",
      userCount: 15,
      description: "Lead audit activities and review work",
      permissions: ["Execute Audits", "Review Work", "Generate Reports"],
      color: "text-purple-600",
    },
    {
      name: "Junior Auditor",
      userCount: 22,
      description: "Perform audit tasks and data entry",
      permissions: ["Data Entry", "Basic Testing", "Documentation"],
      color: "text-green-600",
    },
  ];

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      "System Admin": "bg-red-100 text-red-700",
      "Audit Manager": "bg-blue-100 text-blue-700",
      "Senior Auditor": "bg-purple-100 text-purple-700",
      "Junior Auditor": "bg-green-100 text-green-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  // Filter team members based on search query and filters
  const filteredTeamMembers = teamMembers.filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role.toLowerCase().includes(roleFilter);
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User & Role Management</h1>
            <p className="text-gray-600">
              Manage team members, permissions, and role assignments for audit cases.
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Users className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">{stats.totalUsersChange}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.activeUsers}</p>
                <p className="text-xs text-green-600">{stats.activityRate}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Pending Invites</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingInvites}</p>
                <p className="text-xs text-orange-600">{stats.pendingNote}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Admin Roles</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.adminRoles}</p>
                <p className="text-xs text-gray-500">{stats.adminNote}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">System Admin</option>
                      <option value="manager">Audit Manager</option>
                      <option value="senior">Senior Auditor</option>
                      <option value="junior">Junior Auditor</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="away">Away</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTeamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-600">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{member.department}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{member.lastActive}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">Showing 1 to 5 of 48 results</p>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
                    Previous
                  </button>
                  <button className="w-8 h-8 rounded bg-blue-600 text-white text-sm font-medium">1</button>
                  <button className="w-8 h-8 rounded hover:bg-gray-100 text-sm font-medium text-gray-600">
                    2
                  </button>
                  <button className="w-8 h-8 rounded hover:bg-gray-100 text-sm font-medium text-gray-600">
                    3
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Next</button>
                </div>
              </div>
            </div>
          </div>

          {/* Role Management Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Role Management</h2>

              <div className="space-y-4">
                {roles.map((role, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">{role.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          role.name === "System Admin"
                            ? "bg-red-100 text-red-700"
                            : role.name === "Audit Manager"
                              ? "bg-blue-100 text-blue-700"
                              : role.name === "Senior Auditor"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {role.userCount} users
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-3">{role.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((permission, pIdx) => (
                        <span
                          key={pIdx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
                + Add New Role
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
