"use client";

import { useState } from "react";
import { FiBell, FiCheck, FiX, FiTrash2, FiFilter } from "react-icons/fi";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useDeleteNotification,
} from "@/lib/api/hooks";
import { formatDistanceToNow } from "date-fns";
import type { components } from "@/lib/api/types/dashboard";
import { notificationConfig, notificationCategories } from "@/components/layout/NotificationDropdown";

type NotificationResponse = components["schemas"]["NotificationResponse"];
type NotificationCategory = "all" | "unread" | "read" | "mentions" | "tasks";

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAsUnread = useMarkNotificationAsUnread();
  const deleteNotification = useDeleteNotification();

  const handleToggleRead = async (notificationId: string, isRead: boolean) => {
    if (isRead) {
      await markAsUnread.mutateAsync(notificationId);
    } else {
      await markAsRead.mutateAsync(notificationId);
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification.mutateAsync(notificationId);
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      next.delete(notificationId);
      return next;
    });
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    await Promise.all(unreadNotifications.map((n) => markAsRead.mutateAsync(n.id)));
  };

  const handleToggleSelect = (notificationId: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    await Promise.all(Array.from(selectedNotifications).map((id) => markAsRead.mutateAsync(id)));
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    await Promise.all(Array.from(selectedNotifications).map((id) => deleteNotification.mutateAsync(id)));
    setSelectedNotifications(new Set());
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "unread") return !n.isRead;
    if (selectedCategory === "read") return n.isRead;
    if (selectedCategory === "mentions" || selectedCategory === "tasks") {
      return notificationCategories[n.type] === selectedCategory;
    }
    return true;
  });

  const NotificationItem = ({ notification }: { notification: NotificationResponse }) => {
    const config = notificationConfig[notification.type];
    const Icon = config.icon;
    const isSelected = selectedNotifications.has(notification.id);

    return (
      <div
        className={`
          group relative p-4 hover:bg-gray-50 transition-all border-l-4
          ${notification.isRead ? "border-transparent bg-white" : "border-blue-500 bg-blue-50/30"}
          ${isSelected ? "bg-blue-50" : ""}
        `}
      >
        <div className="flex gap-4">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelect(notification.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          {/* Icon */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </span>
                  {!notification.isRead && <span className="text-xs font-medium text-blue-600">New</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {notification.actionUrl && (
                  <a
                    href={notification.actionUrl}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {notification.actionLabel || "View"}
                  </a>
                )}
                <button
                  onClick={() => void handleToggleRead(notification.id, notification.isRead)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-all"
                  title={notification.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {notification.isRead ? (
                    <FiX className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FiCheck className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => void handleDelete(notification.id)}
                  className="p-2 rounded-lg hover:bg-red-100 transition-all"
                  title="Delete notification"
                >
                  <FiTrash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => void handleMarkAllAsRead()}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="w-5 h-5 text-gray-400" />
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "read", label: "Read" },
              { key: "mentions", label: "Mentions" },
              { key: "tasks", label: "Tasks" },
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key as NotificationCategory)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    selectedCategory === category.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-gray-900">{selectedNotifications.size} selected</span>
              <button
                onClick={() => void handleBulkMarkAsRead()}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Mark as read
              </button>
              <button
                onClick={() => void handleBulkDelete()}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedNotifications(new Set())}
                className="ml-auto px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        {/* Notifications list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Select all bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <input
              type="checkbox"
              checked={
                selectedNotifications.size === filteredNotifications.length &&
                filteredNotifications.length > 0
              }
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Select all</span>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiBell className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-900">No notifications</p>
              <p className="text-sm text-gray-500 mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
