"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare, Volume2, Save } from "lucide-react";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    notificationTypes: {
      auditUpdates: true,
      documentUploads: true,
      taskAssignments: true,
      systemAlerts: true,
      teamMentions: true,
      deadlineReminders: true,
    },
    frequency: "instant",
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(t.settings.notifications.successMessage);
  };

  const toggleNotificationType = (type: keyof typeof notifications.notificationTypes) => {
    setNotifications({
      ...notifications,
      notificationTypes: {
        ...notifications.notificationTypes,
        [type]: !notifications.notificationTypes[type],
      },
    });
  };

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.notifications.title}</h1>
          <p className="text-gray-600">{t.settings.notifications.subtitle}</p>
        </div>

        {/* Notification Channels */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.settings.notifications.channels.title}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{t.settings.notifications.channels.email.title}</p>
                  <p className="text-sm text-gray-500">{t.settings.notifications.channels.email.subtitle}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    setNotifications({ ...notifications, emailNotifications: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{t.settings.notifications.channels.push.title}</p>
                  <p className="text-sm text-gray-500">{t.settings.notifications.channels.push.subtitle}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) =>
                    setNotifications({ ...notifications, pushNotifications: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{t.settings.notifications.channels.sms.title}</p>
                  <p className="text-sm text-gray-500">{t.settings.notifications.channels.sms.subtitle}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{t.settings.notifications.channels.sound.title}</p>
                  <p className="text-sm text-gray-500">{t.settings.notifications.channels.sound.subtitle}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.soundEnabled}
                  onChange={(e) => setNotifications({ ...notifications, soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.settings.notifications.types.title}</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.auditUpdates}
                onChange={() => toggleNotificationType("auditUpdates")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.auditUpdates}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.documentUploads}
                onChange={() => toggleNotificationType("documentUploads")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.documentUploads}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.taskAssignments}
                onChange={() => toggleNotificationType("taskAssignments")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.taskAssignments}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.systemAlerts}
                onChange={() => toggleNotificationType("systemAlerts")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.systemAlerts}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.teamMentions}
                onChange={() => toggleNotificationType("teamMentions")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.teamMentions}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.notificationTypes.deadlineReminders}
                onChange={() => toggleNotificationType("deadlineReminders")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-900">{t.settings.notifications.types.deadlineReminders}</span>
            </label>
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.settings.notifications.frequency.title}</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="instant"
                checked={notifications.frequency === "instant"}
                onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <p className="font-medium text-gray-900">{t.settings.notifications.frequency.instant.title}</p>
                <p className="text-sm text-gray-500">{t.settings.notifications.frequency.instant.subtitle}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="hourly"
                checked={notifications.frequency === "hourly"}
                onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <p className="font-medium text-gray-900">{t.settings.notifications.frequency.hourly.title}</p>
                <p className="text-sm text-gray-500">{t.settings.notifications.frequency.hourly.subtitle}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={notifications.frequency === "daily"}
                onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <p className="font-medium text-gray-900">{t.settings.notifications.frequency.daily.title}</p>
                <p className="text-sm text-gray-500">{t.settings.notifications.frequency.daily.subtitle}</p>
              </div>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t.settings.notifications.quietHours.title}</h2>
              <p className="text-sm text-gray-500">{t.settings.notifications.quietHours.subtitle}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.quietHoursEnabled}
                onChange={(e) => setNotifications({ ...notifications, quietHoursEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {notifications.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.notifications.quietHours.startTime}</label>
                <input
                  type="time"
                  value={notifications.quietHoursStart}
                  onChange={(e) => setNotifications({ ...notifications, quietHoursStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.notifications.quietHours.endTime}</label>
                <input
                  type="time"
                  value={notifications.quietHoursEnd}
                  onChange={(e) => setNotifications({ ...notifications, quietHoursEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t.settings.notifications.saving : t.settings.notifications.saveChanges}
          </button>
        </div>
      </motion.div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      </div>  );
}
