"use client";

import { useState } from "react";
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

type RequestStatus = "pending" | "approved" | "rejected";

interface TimeOffRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const statusConfig = {
  pending: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    label: "Pending",
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    label: "Rejected",
  },
};

export default function MyTimeOffPage() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Mock data - replace with actual API call
  const [requests] = useState<TimeOffRequest[]>([
    {
      id: "1",
      type: "Vacation",
      startDate: "2024-02-01",
      endDate: "2024-02-05",
      days: 5,
      reason: "Family vacation",
      status: "approved",
      submittedAt: "2024-01-15",
      reviewedBy: "HR Manager",
      reviewedAt: "2024-01-16",
    },
    {
      id: "2",
      type: "Sick Leave",
      startDate: "2024-01-20",
      endDate: "2024-01-21",
      days: 2,
      reason: "Medical appointment",
      status: "pending",
      submittedAt: "2024-01-19",
    },
  ]);

  const balance = {
    vacation: { available: 15, used: 5, total: 20 },
    sick: { available: 8, used: 2, total: 10 },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Implement API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowRequestForm(false);
    setFormData({ type: "vacation", startDate: "", endDate: "", reason: "" });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Time Off</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Request time off and view your balance
          </p>
        </div>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Request Time Off
        </button>
      </div>

      {/* Time Off Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Vacation Days</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-safee-600 dark:text-safee-400">
              {balance.vacation.available}
            </span>
            <span className="text-gray-500 dark:text-gray-400 mb-1">/ {balance.vacation.total} days</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-safee-600 dark:bg-safee-500 h-2 rounded-full transition-all"
              style={{ width: `${(balance.vacation.available / balance.vacation.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Sick Leave</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {balance.sick.available}
            </span>
            <span className="text-gray-500 dark:text-gray-400 mb-1">/ {balance.sick.total} days</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(balance.sick.available / balance.sick.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            New Time Off Request
          </h2>
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request History</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((request) => {
            const StatusIcon = statusConfig[request.status].icon;
            return (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full ${statusConfig[request.status].bg} flex items-center justify-center`}
                    >
                      <StatusIcon className={`w-5 h-5 ${statusConfig[request.status].color}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{request.type}</h3>
                        <span
                          className={`px-2 py-0.5 ${statusConfig[request.status].bg} ${statusConfig[request.status].color} text-xs font-medium rounded-full`}
                        >
                          {statusConfig[request.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {request.days} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{request.reason}</p>
                      {request.reviewedBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Reviewed by {request.reviewedBy} on{" "}
                          {new Date(request.reviewedAt!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
