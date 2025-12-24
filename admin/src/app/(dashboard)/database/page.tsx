import { Database, Search } from "lucide-react";

export default function DatabasePage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Database</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage database records
        </p>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Database Records
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600">
              Database management interface will be available here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
