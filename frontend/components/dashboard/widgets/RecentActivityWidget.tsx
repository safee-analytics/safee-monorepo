"use client";

import { Button } from "@safee/ui";

export const RecentActivityWidget = () => {
// TODO: [Backend/Frontend] - Fetch recent activities from API
//   Details: The `activities` array is currently mocked. Implement a backend API endpoint to fetch recent activities and integrate it here.
//   Priority: High
  const activities = [
    { name: "Invoice #1234", amount: "+$1,250", color: "text-green-600" },
    { name: "Office Supplies", amount: "-$89", color: "text-red-600" },
    { name: "Client Payment", amount: "+$2,500", color: "text-green-600" },
    { name: "Rent Payment", amount: "-$1,200", color: "text-red-600" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recent Activity</h3>
        <p className="text-sm text-gray-600">Track your latest transactions</p>
      </div>

      <div className="space-y-2 flex-1">
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm text-gray-700">{activity.name}</span>
            <span className={`text-sm font-semibold ${activity.color}`}>{activity.amount}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4">
        View All Transactions
      </Button>
    </div>
  );
};
