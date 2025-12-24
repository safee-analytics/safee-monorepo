import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure platform settings</p>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200/60">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Settings</h2>
          </div>

          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">Settings interface will be available here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
