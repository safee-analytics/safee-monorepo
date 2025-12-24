"use client";

export default function QueuesPage() {
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Job Queues</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manage background job queues with Bull Board</p>
      </div>
      <div className="flex-1 p-4">
        <div className="h-full rounded-xl overflow-hidden border border-gray-200 bg-white shadow-lg">
          <iframe
            src={`${gatewayUrl}/admin/queues`}
            className="h-full w-full border-0"
            title="Bull Board - Job Queue Dashboard"
          />
        </div>
      </div>
    </div>
  );
}
