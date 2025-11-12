"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Link2,
  FileCheck,
  CreditCard,
  Database,
  Save,
} from "lucide-react";

type SettingsTab =
  | "general"
  | "users"
  | "security"
  | "notifications"
  | "integrations"
  | "audit"
  | "billing"
  | "backup";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // Form states
  const [companyName, setCompanyName] = useState("AuditPro Solutions");
  const [registrationNumber, setRegistrationNumber] = useState("REG-123456789");
  const [primaryEmail, setPrimaryEmail] = useState("admin@auditpro.com");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 123-4567");
  const [address, setAddress] = useState("123 Business District, Suite 400\nNew York, NY 10001");
  const [timeZone, setTimeZone] = useState("utc-5");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [currency, setCurrency] = useState("USD");
  const [auditDuration, setAuditDuration] = useState("30");
  const [riskFramework, setRiskFramework] = useState("coso");
  const [autoAssignAuditors, setAutoAssignAuditors] = useState(true);
  const [autoProgressNotifications, setAutoProgressNotifications] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState("50");

  const tabs = [
    { id: "general" as const, name: "General Settings", icon: SettingsIcon },
    { id: "users" as const, name: "User Management", icon: Users },
    { id: "security" as const, name: "Security", icon: Shield },
    { id: "notifications" as const, name: "Notifications", icon: Bell },
    { id: "integrations" as const, name: "Integrations", icon: Link2 },
    { id: "audit" as const, name: "Audit Settings", icon: FileCheck },
    { id: "billing" as const, name: "Billing & Plans", icon: CreditCard },
    { id: "backup" as const, name: "Backup & Recovery", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration Settings</h1>
                <p className="text-gray-600">
                  Manage your application settings, preferences, and integrations.
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            {/* General Settings Content */}
            {activeTab === "general" && (
              <div className="space-y-6">
                {/* Company Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email</label>
                      <input
                        type="email"
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* System Preferences */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">System Preferences</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                      <p className="text-xs text-gray-500 mb-2">
                        Set your organization&apos;s default time zone
                      </p>
                      <select
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="utc-5">Eastern Time (UTC-5)</option>
                        <option value="utc-6">Central Time (UTC-6)</option>
                        <option value="utc-7">Mountain Time (UTC-7)</option>
                        <option value="utc-8">Pacific Time (UTC-8)</option>
                        <option value="utc">UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                      <p className="text-xs text-gray-500 mb-2">Choose how dates are displayed</p>
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <p className="text-xs text-gray-500 mb-2">Default currency for financial reports</p>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Audit Defaults */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Audit Defaults</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Audit Duration (Days)
                      </label>
                      <input
                        type="number"
                        value={auditDuration}
                        onChange={(e) => setAuditDuration(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Assessment Framework
                      </label>
                      <select
                        value={riskFramework}
                        onChange={(e) => setRiskFramework(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="coso">COSO Framework</option>
                        <option value="iso">ISO 31000</option>
                        <option value="nist">NIST Framework</option>
                        <option value="cobit">COBIT</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignAuditors}
                          onChange={(e) => setAutoAssignAuditors(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-assign auditors based on expertise</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoProgressNotifications}
                          onChange={(e) => setAutoProgressNotifications(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Send automatic progress notifications</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Document Management */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Document Management</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder content for other tabs */}
            {activeTab !== "general" && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {tabs.find((t) => t.id === activeTab)?.icon && (
                      <div className="text-gray-400">
                        {(() => {
                          const Tab = tabs.find((t) => t.id === activeTab)!.icon;
                          return <Tab className="w-8 h-8" />;
                        })()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h3>
                  <p className="text-gray-600">
                    This section is under development and will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
