"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Check, Settings, ExternalLink, Plus, Trash2, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import {
  useGetIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  type Integration,
} from "@/lib/api/hooks/integrations";

export default function IntegrationsSettings() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch data
  const { data: integrations = [], isLoading } = useGetIntegrations();

  // Mutations
  const connectIntegration = useConnectIntegration();
  const disconnectIntegration = useDisconnectIntegration();

  const categories = [
    { id: "all", name: "All Integrations" },
    { id: "accounting", name: "Accounting" },
    { id: "communication", name: "Communication" },
    { id: "storage", name: "Storage" },
    { id: "productivity", name: "Productivity" },
  ];

  const filteredIntegrations =
    selectedCategory === "all" ? integrations : integrations.filter((i) => i.category === selectedCategory);

  const handleToggleIntegration = async (id: string, connected: boolean) => {
    try {
      if (connected) {
        await disconnectIntegration.mutateAsync(id);
      } else {
        await connectIntegration.mutateAsync(id);
      }
    } catch (error) {
      alert(`Failed to ${connected ? "disconnect" : "connect"} integration`);
    }
  };

  return (
    <SettingsPermissionGate>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.integrations.title}</h1>
            <p className="text-gray-600">{t.settings.integrations.subtitle}</p>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Connected Integrations */}
              {integrations.some((i) => i.connected) && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations
                  .filter((i) => i.connected)
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{integration.logo}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">Connected</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleIntegration(integration.id, integration.connected)}
                          disabled={disconnectIntegration.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Disconnect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                      {integration.configUrl && (
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          <Settings className="w-4 h-4" />
                          Configure
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedCategory === "all" ? "Available Integrations" : "Available"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations
                .filter((i) => !i.connected)
                .map((integration) => (
                  <div
                    key={integration.id}
                    className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{integration.logo}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-1">
                            {integration.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    <button
                      onClick={() => handleToggleIntegration(integration.id, integration.connected)}
                      disabled={connectIntegration.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {connectIntegration.isPending ? "Connecting..." : "Connect"}
                    </button>
                  </div>
                ))}
            </div>

            {filteredIntegrations.filter((i) => !i.connected).length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">All integrations in this category are connected</p>
              </div>
            )}
          </div>

          {/* Custom Integration */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a custom integration?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We can build custom integrations for your specific needs. Contact our team to discuss your
                  requirements.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Contact Sales
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Webhooks Section */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
                <p className="text-sm text-gray-600 mt-1">Receive real-time data from Safee</p>
              </div>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                Add Webhook
              </button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No webhooks configured yet</p>
            </div>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </SettingsPermissionGate>
  );
}
