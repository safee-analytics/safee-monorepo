"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { z } from "zod";
import { useUpdateCase, useAssignCase, useRemoveCaseAssignment } from "@/lib/api/hooks";
import type { components } from "@/lib/api/types";
import { StatusBadge } from "@/components/audit/ui/StatusBadge";
import { PriorityBadge } from "@/components/audit/ui/PriorityBadge";

type CaseStatus = components["schemas"]["CaseResponse"]["status"];
type CasePriority = components["schemas"]["CaseResponse"]["priority"];

// Zod schemas for validation
const StatusBadgeStatusSchema = z.enum([
  "completed",
  "in-progress",
  "pending",
  "overdue",
  "under-review",
  "archived",
]);

const PriorityBadgePrioritySchema = z.enum(["low", "medium", "high", "critical"]);

interface InlineStatusProps {
  caseId: string;
  currentStatus: CaseStatus;
  onUpdate?: () => void;
}

export function InlineStatus({ caseId, currentStatus, onUpdate }: InlineStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const updateCase = useUpdateCase();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
  }, [isOpen]);

  const statuses: { value: CaseStatus; label: string; color: string }[] = [
    { value: "pending", label: "Pending", color: "bg-ray-100 text-gray-700" },
    { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
    { value: "under-review", label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
    { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
    { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-500" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }
  }, [isOpen]);

  const handleStatusChange = async (newStatus: CaseStatus) => {
    setStatus(newStatus);
    setIsOpen(false);
    try {
      await updateCase.mutateAsync({
        caseId,
        updates: { status: newStatus },
      });
      onUpdate?.();
    } catch (err) {
      setStatus(currentStatus); // Revert on error
      console.error("Failed to update status:", err);
    }
  };

  // Validate status for StatusBadge component
  const validatedStatus = StatusBadgeStatusSchema.safeParse(status);
  const badgeStatus = validatedStatus.success ? validatedStatus.data : "pending";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="hover:opacity-80 transition-opacity cursor-pointer"
      >
        <StatusBadge status={badgeStatus} />
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-fit"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {statuses
            .filter((s) => s.value !== status)
            .map((s) => {
              const validatedStatus = StatusBadgeStatusSchema.safeParse(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className="px-2 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {validatedStatus.success ? (
                    <StatusBadge status={validatedStatus.data} />
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

interface InlinePriorityProps {
  caseId: string;
  currentPriority: CasePriority;
  onUpdate?: () => void;
}

export function InlinePriority({ caseId, currentPriority, onUpdate }: InlinePriorityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priority, setPriority] = useState(currentPriority);
  const updateCase = useUpdateCase();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
  }, [isOpen]);

  const priorities: { value: CasePriority; label: string; color: string; icon: string }[] = [
    { value: "low", label: "Low", color: "text-green-600 bg-green-100", icon: "🟢" },
    { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-100", icon: "🟡" },
    { value: "high", label: "High", color: "text-orange-600 bg-orange-100", icon: "🟠" },
    { value: "critical", label: "Critical", color: "text-red-600 bg-red-100", icon: "🔴" },
  ];

  // Validate priority for PriorityBadge component
  const validatedPriority = PriorityBadgePrioritySchema.safeParse(priority);
  const badgePriority = validatedPriority.success ? validatedPriority.data : "medium";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }
  }, [isOpen]);

  const handlePriorityChange = async (newPriority: CasePriority) => {
    setPriority(newPriority);
    setIsOpen(false);
    try {
      await updateCase.mutateAsync({
        caseId,
        updates: { priority: newPriority },
      });
      onUpdate?.();
    } catch (err) {
      setPriority(currentPriority);
      console.error("Failed to update priority:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="hover:opacity-80 transition-opacity cursor-pointer"
      >
        <PriorityBadge priority={badgePriority} />
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-fit"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {priorities
            .filter((p) => p.value !== priority)
            .map((p) => {
              const validatedPriority = PriorityBadgePrioritySchema.safeParse(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => handlePriorityChange(p.value)}
                  className="px-2 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {validatedPriority.success ? (
                    <PriorityBadge priority={validatedPriority.data} />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.color}`}>
                        {p.label}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

interface InlineAssigneeProps {
  caseId: string;
  currentAssignee: { name: string; avatar: string; id?: string };
  availableUsers: { id: string; name: string }[];
  onUpdate?: () => void;
}

export function InlineAssignee({ caseId, currentAssignee, availableUsers, onUpdate }: InlineAssigneeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const assignCase = useAssignCase();
  const removeAssignment = useRemoveCaseAssignment();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
  }, [isOpen]);

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedUser = selectedUserId ? filteredUsers.find((u) => u.id === selectedUserId) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setSelectedUserId(null);
        setHighlightedIndex(0);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      searchInputRef.current?.focus();
      return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }
  }, [isOpen]);

  const handleAssigneeChange = async (userId: string) => {
    setIsOpen(false);
    setSearchTerm("");
    setSelectedUserId(null);
    setHighlightedIndex(0);
    try {
      // Remove current assignment if exists
      if (currentAssignee.id) {
        await removeAssignment.mutateAsync({ caseId, userId: currentAssignee.id });
      }
      // Add new assignment
      await assignCase.mutateAsync({
        caseId,
        assignment: { userId, role: "lead" },
      });
      onUpdate?.();
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedUserId) {
        handleAssigneeChange(selectedUserId);
      } else if (filteredUsers[highlightedIndex]) {
        handleAssigneeChange(filteredUsers[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setSelectedUserId(null);
      setHighlightedIndex(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="flex items-center gap-2 hover:bg-gray-50 rounded px-2 py-1 transition-colors cursor-pointer"
      >
        <img src={currentAssignee.avatar} alt={currentAssignee.name} className="w-6 h-6 rounded-full" />
        <span className="text-sm text-gray-700">{currentAssignee.name}</span>
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 w-64"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder="Search users... (Press Enter to save)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedUser && (
              <div className="mt-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700 flex items-center justify-between">
                <span>Selected: {selectedUser.name}</span>
                <span className="text-xs text-gray-500">Press Enter ↵</span>
              </div>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUserId(user.id); }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                    user.id === selectedUserId
                      ? "bg-blue-100 text-blue-900"
                      : index === highlightedIndex
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{user.name}</span>
                  {user.id === currentAssignee.id && (
                    <span className="ml-auto text-xs text-gray-500">(current)</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface InlineDueDateProps {
  caseId: string;
  currentDueDate: string; // ISO string or "N/A"
  onUpdate?: () => void;
}

export function InlineDueDate({ caseId, currentDueDate, onUpdate }: InlineDueDateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateCase = useUpdateCase();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      inputRef.current?.focus();
      return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }
  }, [isOpen]);

  const handleDateChange = async (newDate: string) => {
    setIsOpen(false);
    try {
      await updateCase.mutateAsync({
        caseId,
        updates: { dueDate: newDate },
      });
      onUpdate?.();
    } catch (err) {
      console.error("Failed to update due date:", err);
    }
  };

  // Convert display date to input format (YYYY-MM-DD)
  const getInputValue = () => {
    if (currentDueDate === "N/A" || !currentDueDate) return "";
    try {
      const date = new Date(currentDueDate);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="text-sm text-gray-700 hover:bg-gray-50 rounded px-2 py-1 transition-colors cursor-pointer"
      >
        {currentDueDate}
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 p-3"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <input
            ref={inputRef}
            type="date"
            defaultValue={getInputValue()}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
