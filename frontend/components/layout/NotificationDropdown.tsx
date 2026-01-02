"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiUser,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiUsers,
  FiX,
  FiClock,
  FiAlertTriangle,
  FiMessageSquare,
  FiAtSign,
  FiCheckSquare,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiArchive,
  FiBriefcase,
  FiClipboard,
  FiCreditCard,
  FiXOctagon,
  FiSend,
  FiEdit,
  FiActivity,
  FiTrash2,
} from "react-icons/fi";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useDeleteNotification,
} from "@/lib/api/hooks";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { components } from "@/lib/api/types/dashboard";

type NotificationType = components["schemas"]["NotificationType"];
type NotificationResponse = components["schemas"]["NotificationResponse"];
type NotificationCategory = "all" | "mentions" | "tasks" | "system";

// Category mapping for notification types
export const notificationCategories: Record<NotificationType, NotificationCategory> = {
  // Mentions
  mention: "mentions",
  comment: "mentions",

  // Tasks
  task_assigned: "tasks",
  task_completed: "tasks",
  task_overdue: "tasks",
  task_reminder: "tasks",
  assignment: "tasks",
  deadline: "tasks",
  reminder: "tasks",

  // System notifications
  info: "system",
  success: "system",
  warning: "system",
  error: "system",
  alert: "system",
  review: "system",
  completed: "system",
  team: "system",

  // Approvals (system)
  approval_requested: "system",
  approval_approved: "system",
  approval_rejected: "system",
  approval_cancelled: "system",
  approval_reminder: "system",
  request_submitted: "system",
  request_updated: "system",
  request_withdrawn: "system",
  request_escalated: "system",

  // Cases (system)
  case_update: "system",
  case_created: "system",
  case_assigned: "system",
  case_completed: "system",
  case_overdue: "system",
  case_archived: "system",
  document: "system",
  document_uploaded: "system",
  document_reviewed: "system",
  document_approved: "system",
  document_rejected: "system",

  // Accounting (system)
  invoice_created: "system",
  invoice_submitted: "system",
  invoice_approved: "system",
  invoice_rejected: "system",
  invoice_paid: "system",
  invoice_overdue: "system",
  invoice_cancelled: "system",
  payment_received: "system",
  payment_sent: "system",
  payment_failed: "system",
  payment_pending: "system",
  bill_created: "system",
  bill_submitted: "system",
  bill_approved: "system",
  bill_rejected: "system",
  bill_paid: "system",
  bill_overdue: "system",
  expense_submitted: "system",
  expense_approved: "system",
  expense_rejected: "system",
  expense_reimbursed: "system",

  // HR (system)
  leave_requested: "system",
  leave_approved: "system",
  leave_rejected: "system",
  leave_cancelled: "system",
  leave_reminder: "system",
  payslip_generated: "system",
  payslip_available: "system",
  contract_created: "system",
  contract_expiring: "system",
  contract_expired: "system",
  contract_renewed: "system",
  employee_onboarded: "system",
  employee_offboarded: "system",
  timesheet_submitted: "system",
  timesheet_approved: "system",
  timesheet_rejected: "system",

  // CRM (system)
  deal_created: "system",
  deal_updated: "system",
  deal_won: "system",
  deal_lost: "system",
  deal_assigned: "system",
  contact_added: "system",
  contact_updated: "system",
  meeting_scheduled: "system",
  meeting_reminder: "system",
  meeting_cancelled: "system",
  follow_up_due: "system",
};

// Icon mapping for each notification type
export const notificationConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
  }
> = {
  // General
  info: { icon: FiInfo, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  success: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  warning: { icon: FiAlertTriangle, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
  error: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  alert: { icon: FiAlertCircle, bgColor: "bg-orange-50", textColor: "text-orange-600" },
  reminder: { icon: FiClock, bgColor: "bg-purple-50", textColor: "text-purple-600" },
  deadline: { icon: FiClock, bgColor: "bg-red-50", textColor: "text-red-600" },
  review: { icon: FiCheckSquare, bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  completed: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  team: { icon: FiUsers, bgColor: "bg-cyan-50", textColor: "text-cyan-600" },
  assignment: { icon: FiClipboard, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  comment: { icon: FiMessageSquare, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  mention: { icon: FiAtSign, bgColor: "bg-pink-50", textColor: "text-pink-600" },

  // Approvals & Requests
  approval_requested: { icon: FiCheckSquare, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  approval_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  approval_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  approval_cancelled: { icon: FiXOctagon, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  approval_reminder: { icon: FiClock, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
  request_submitted: { icon: FiSend, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  request_updated: { icon: FiEdit, bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  request_withdrawn: { icon: FiXOctagon, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  request_escalated: { icon: FiAlertTriangle, bgColor: "bg-orange-50", textColor: "text-orange-600" },

  // Cases/Audit
  case_update: { icon: FiActivity, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  case_created: { icon: FiBriefcase, bgColor: "bg-green-50", textColor: "text-green-600" },
  case_assigned: { icon: FiUser, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  case_completed: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  case_overdue: { icon: FiAlertTriangle, bgColor: "bg-red-50", textColor: "text-red-600" },
  case_archived: { icon: FiArchive, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  document: { icon: FiFileText, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  document_uploaded: { icon: FiFileText, bgColor: "bg-green-50", textColor: "text-green-600" },
  document_reviewed: { icon: FiCheckSquare, bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  document_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  document_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },

  // Accounting - Invoices
  invoice_created: { icon: FiFileText, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  invoice_submitted: { icon: FiSend, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  invoice_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  invoice_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  invoice_paid: { icon: FiDollarSign, bgColor: "bg-green-50", textColor: "text-green-600" },
  invoice_overdue: { icon: FiAlertTriangle, bgColor: "bg-red-50", textColor: "text-red-600" },
  invoice_cancelled: { icon: FiXOctagon, bgColor: "bg-gray-50", textColor: "text-gray-600" },

  // Accounting - Payments
  payment_received: { icon: FiDollarSign, bgColor: "bg-green-50", textColor: "text-green-600" },
  payment_sent: { icon: FiSend, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  payment_failed: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  payment_pending: { icon: FiClock, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },

  // Accounting - Bills & Expenses
  bill_created: { icon: FiFileText, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  bill_submitted: { icon: FiSend, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  bill_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  bill_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  bill_paid: { icon: FiDollarSign, bgColor: "bg-green-50", textColor: "text-green-600" },
  bill_overdue: { icon: FiAlertTriangle, bgColor: "bg-red-50", textColor: "text-red-600" },
  expense_submitted: { icon: FiCreditCard, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  expense_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  expense_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  expense_reimbursed: { icon: FiDollarSign, bgColor: "bg-green-50", textColor: "text-green-600" },

  // HR - Leave
  leave_requested: { icon: FiCalendar, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  leave_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  leave_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  leave_cancelled: { icon: FiXOctagon, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  leave_reminder: { icon: FiClock, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },

  // HR - Payroll & Contracts
  payslip_generated: { icon: FiFileText, bgColor: "bg-green-50", textColor: "text-green-600" },
  payslip_available: { icon: FiDollarSign, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  contract_created: { icon: FiFileText, bgColor: "bg-green-50", textColor: "text-green-600" },
  contract_expiring: { icon: FiAlertTriangle, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
  contract_expired: { icon: FiAlertCircle, bgColor: "bg-red-50", textColor: "text-red-600" },
  contract_renewed: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },

  // HR - Employee
  employee_onboarded: { icon: FiUser, bgColor: "bg-green-50", textColor: "text-green-600" },
  employee_offboarded: { icon: FiUser, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  timesheet_submitted: { icon: FiClock, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  timesheet_approved: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  timesheet_rejected: { icon: FiXCircle, bgColor: "bg-red-50", textColor: "text-red-600" },

  // CRM - Deals
  deal_created: { icon: FiBriefcase, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  deal_updated: { icon: FiEdit, bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  deal_won: { icon: FiTrendingUp, bgColor: "bg-green-50", textColor: "text-green-600" },
  deal_lost: { icon: FiTrendingDown, bgColor: "bg-red-50", textColor: "text-red-600" },
  deal_assigned: { icon: FiUser, bgColor: "bg-blue-50", textColor: "text-blue-600" },

  // CRM - Contacts & Tasks
  contact_added: { icon: FiUser, bgColor: "bg-green-50", textColor: "text-green-600" },
  contact_updated: { icon: FiEdit, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  task_assigned: { icon: FiCheckSquare, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  task_completed: { icon: FiCheckCircle, bgColor: "bg-green-50", textColor: "text-green-600" },
  task_overdue: { icon: FiAlertTriangle, bgColor: "bg-red-50", textColor: "text-red-600" },
  task_reminder: { icon: FiClock, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },

  // CRM - Meetings
  meeting_scheduled: { icon: FiCalendar, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  meeting_reminder: { icon: FiClock, bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
  meeting_cancelled: { icon: FiXOctagon, bgColor: "bg-gray-50", textColor: "text-gray-600" },
  follow_up_due: { icon: FiClock, bgColor: "bg-orange-50", textColor: "text-orange-600" },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  user: FiUser,
  calendar: FiCalendar,
  document: FiFileText,
  payment: FiDollarSign,
  team: FiUsers,
  default: FiBell,
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAsUnread = useMarkNotificationAsUnread();
  const deleteNotification = useDeleteNotification();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close with ESC key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen]);

  const handleToggleRead = async (notificationId: string, isRead: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRead) {
      await markAsUnread.mutateAsync(notificationId);
    } else {
      await markAsRead.mutateAsync(notificationId);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    await Promise.all(unreadNotifications.map((n) => markAsRead.mutateAsync(n.id)));
  };

  const filteredNotifications =
    selectedCategory === "all"
      ? notifications
      : notifications.filter((n) => notificationCategories[n.type] === selectedCategory);

  const NotificationItem = ({ notification }: { notification: NotificationResponse }) => {
    const config = notificationConfig[notification.type];
    const Icon = config.icon;

    return (
      <div
        className={`
          group relative p-4 hover:bg-gray-50 transition-all cursor-pointer border-l-2
          ${notification.isRead ? "border-transparent bg-white" : "border-blue-500 bg-blue-50/30"}
        `}
        onClick={() => {
          if (!notification.isRead) {
            void markAsRead.mutateAsync(notification.id);
          }
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        }}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${config.textColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{notification.title}</h4>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    void handleToggleRead(notification.id, notification.isRead, e);
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-all"
                  title={notification.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {notification.isRead ? (
                    <FiX className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FiCheck className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    void handleDelete(notification.id, e);
                  }}
                  className="p-1 rounded hover:bg-red-100 transition-all"
                  title="Delete notification"
                >
                  <FiTrash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.description}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </span>
              {!notification.isRead && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-all
          ${isOpen ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}
        `}
      >
        <FiBell className={`w-5 h-5 transition-transform ${isOpen ? "scale-110" : ""}`} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Ring animation on new notification */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full animate-ping opacity-75" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => void handleMarkAllAsRead()}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mt-3">
              {[
                { key: "all", label: "All" },
                { key: "mentions", label: "Mentions" },
                { key: "tasks", label: "Tasks" },
                { key: "system", label: "System" },
              ].map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key as NotificationCategory)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
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
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FiBell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No notifications</p>
                <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/notifications"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
                <span className="text-xs">→</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
