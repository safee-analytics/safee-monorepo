"use client";

import { useState, useRef, useEffect } from "react";
import { CaseStatus, CasePriority } from "@/types/audit";

export interface FilterToken {
  type: "status" | "priority" | "assignee" | "text";
  value: string;
  display: string;
  avatarId?: string; // For assignee filters
}

export interface AssigneeFilterToken extends FilterToken {
  type: "assignee";
  avatarId: string;
}

// Type guard for assignee filters
function isAssigneeFilter(filter: FilterToken): filter is AssigneeFilterToken {
  return filter.type === "assignee" && !!filter.avatarId;
}

interface CaseFiltersProps {
  filters?: FilterToken[];
  onFiltersChange: (filters: FilterToken[]) => void;
  availableAssignees?: Array<{ id: string; name: string }>;
}

export function CaseFilters({
  filters: externalFilters = [],
  onFiltersChange,
  availableAssignees = [],
}: CaseFiltersProps) {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterToken[]>(externalFilters);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [assigneeSearchText, setAssigneeSearchText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external filters prop
  useEffect(() => {
    setFilters(externalFilters);
    // Update search text if there's a text filter
    const textFilter = externalFilters.find((f) => f.type === "text");
    if (textFilter) {
      setSearchText(textFilter.value);
    } else {
      setSearchText("");
    }
  }, [externalFilters]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target as Node)) {
        setShowAssigneeMenu(false);
        setAssigneeSearchText("");
      }
    };

    if (showStatusMenu || showPriorityMenu || showAssigneeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusMenu, showPriorityMenu, showAssigneeMenu]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close all menus on Escape
      if (event.key === "Escape") {
        setShowStatusMenu(false);
        setShowPriorityMenu(false);
        setShowAssigneeMenu(false);
        setAssigneeSearchText("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const statusOptions: Array<{ value: CaseStatus; label: string; color: string }> = [
    { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
    { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
    { value: "under-review", label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
    { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
    { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-500" },
  ];

  const priorityOptions: Array<{ value: CasePriority; label: string; icon: string }> = [
    { value: "critical", label: "Critical", icon: "🔴" },
    { value: "high", label: "High", icon: "🟠" },
    { value: "medium", label: "Medium", icon: "🟡" },
    { value: "low", label: "Low", icon: "🟢" },
  ];

  const addFilter = (type: FilterToken["type"], value: string, display: string, avatarId?: string) => {
    // Check if filter already exists
    const exists = filters.some((f) => f.type === type && f.value === value);
    if (exists) return;

    let newFilter: FilterToken;
    // Store avatar ID for assignee filters
    if (type === "assignee" && avatarId) {
      newFilter = { type, value, display, avatarId };
    } else {
      newFilter = { type, value, display };
    }

    const newFilters = [...filters, newFilter];
    setFilters(newFilters);
    onFiltersChange(newFilters);

    // Close menus (except assignee menu to allow multi-select)
    setShowStatusMenu(false);
    setShowPriorityMenu(false);
    // Don't close assignee menu to allow multiple selections
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters([]);
    setSearchText("");
    setAssigneeSearchText("");
    onFiltersChange([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    // Update text filter
    const textFilters = filters.filter((f) => f.type !== "text");
    if (value.trim()) {
      textFilters.push({ type: "text", value: value.trim(), display: value.trim() });
    }
    setFilters(textFilters);
    onFiltersChange(textFilters);
  };

  const clearSearch = () => {
    setSearchText("");
    const nonTextFilters = filters.filter((f) => f.type !== "text");
    setFilters(nonTextFilters);
    onFiltersChange(nonTextFilters);
  };

  const getFilterColor = (type: FilterToken["type"]) => {
    switch (type) {
      case "status":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "priority":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "assignee":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 mb-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search by case number, client name, or audit type..."
          className="flex-1 outline-none text-sm"
        />
        {searchText && (
          <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500 mr-2">Filter by:</span>

        {/* Status Filter */}
        <div className="relative" ref={statusMenuRef}>
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowPriorityMenu(false);
              setShowAssigneeMenu(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowStatusMenu(!showStatusMenu);
                setShowPriorityMenu(false);
                setShowAssigneeMenu(false);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Status
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showStatusMenu && (
            <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
              {statusOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => addFilter("status", option.value, option.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addFilter("status", option.value, option.label);
                    } else if (e.key === "ArrowDown" && index < statusOptions.length - 1) {
                      e.preventDefault();
                      (e.currentTarget.nextElementSibling as HTMLButtonElement)?.focus();
                    } else if (e.key === "ArrowUp" && index > 0) {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLButtonElement)?.focus();
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                  autoFocus={index === 0}
                >
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative" ref={priorityMenuRef}>
          <button
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowStatusMenu(false);
              setShowAssigneeMenu(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowPriorityMenu(!showPriorityMenu);
                setShowStatusMenu(false);
                setShowAssigneeMenu(false);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Priority
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showPriorityMenu && (
            <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
              {priorityOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => addFilter("priority", option.value, option.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addFilter("priority", option.value, option.label);
                    } else if (e.key === "ArrowDown" && index < priorityOptions.length - 1) {
                      e.preventDefault();
                      (e.currentTarget.nextElementSibling as HTMLButtonElement)?.focus();
                    } else if (e.key === "ArrowUp" && index > 0) {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLButtonElement)?.focus();
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center gap-2 focus:outline-none focus:bg-gray-50"
                  autoFocus={index === 0}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee Filter - Jira Style */}
        <div className="relative" ref={assigneeMenuRef}>
          <button
            onClick={() => {
              setShowAssigneeMenu(!showAssigneeMenu);
              setShowStatusMenu(false);
              setShowPriorityMenu(false);
              if (!showAssigneeMenu) {
                setTimeout(() => assigneeSearchRef.current?.focus(), 100);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowAssigneeMenu(!showAssigneeMenu);
                setShowStatusMenu(false);
                setShowPriorityMenu(false);
                if (!showAssigneeMenu) {
                  setTimeout(() => assigneeSearchRef.current?.focus(), 100);
                }
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Show stacked avatars if assignees are selected */}
            {(() => {
              const assigneeFilters = filters.filter((f) => f.type === "assignee");
              if (assigneeFilters.length > 0) {
                const displayCount = Math.min(3, assigneeFilters.length);
                return (
                  <div className="flex items-center -space-x-2">
                    {assigneeFilters.slice(0, displayCount).map((filter, idx) => (
                      <img
                        key={idx}
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${filter.avatarId}`}
                        alt={filter.display}
                        className="w-6 h-6 rounded-full border-2 border-white"
                      />
                    ))}
                    {assigneeFilters.length > displayCount && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{assigneeFilters.length - displayCount}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              );
            })()}
            <span>Assignee</span>
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showAssigneeMenu && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200">
                <div className="flex items-center gap-2 px-2 py-1.5 border border-gray-300 rounded">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <input
                    ref={assigneeSearchRef}
                    type="text"
                    value={assigneeSearchText}
                    onChange={(e) => setAssigneeSearchText(e.target.value)}
                    placeholder="Search people..."
                    className="flex-1 outline-none text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Assignee List */}
              <div className="max-h-60 overflow-y-auto">
                {(() => {
                  if (availableAssignees.length === 0) {
                    return (
                      <div className="px-4 py-8 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="w-12 h-12 mx-auto"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No assignees yet</p>
                        <p className="text-xs text-gray-400 mt-1">Assign users to cases to see them here</p>
                      </div>
                    );
                  }

                  const filteredAssignees = availableAssignees.filter((assignee) =>
                    assignee.name.toLowerCase().includes(assigneeSearchText.toLowerCase()),
                  );

                  if (filteredAssignees.length === 0) {
                    return <div className="px-4 py-8 text-center text-sm text-gray-500">No people found</div>;
                  }

                  return filteredAssignees.map((assignee, index) => {
                    const isSelected = filters.some((f) => f.type === "assignee" && f.value === assignee.id);
                    return (
                      <button
                        key={assignee.id}
                        onClick={() => {
                          if (isSelected) {
                            // Remove filter
                            const filterIndex = filters.findIndex(
                              (f) => f.type === "assignee" && f.value === assignee.id,
                            );
                            if (filterIndex !== -1) removeFilter(filterIndex);
                          } else {
                            // Add filter
                            addFilter("assignee", assignee.id, assignee.name, assignee.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (isSelected) {
                              const filterIndex = filters.findIndex(
                                (f) => f.type === "assignee" && f.value === assignee.id,
                              );
                              if (filterIndex !== -1) removeFilter(filterIndex);
                            } else {
                              addFilter("assignee", assignee.id, assignee.name, assignee.id);
                            }
                          } else if (e.key === "ArrowDown" && index < filteredAssignees.length - 1) {
                            e.preventDefault();
                            (e.currentTarget.nextElementSibling as HTMLButtonElement)?.focus();
                          } else if (e.key === "ArrowUp" && index > 0) {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLButtonElement)?.focus();
                          }
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center gap-3 focus:outline-none focus:bg-gray-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.id}`}
                          alt={assignee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium text-gray-900 flex-1">{assignee.name}</span>
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <button
          onClick={() => addFilter("status", "unassigned", "Unassigned")}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Unassigned
        </button>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-500">Active:</span>
          {filters.map((filter, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${getFilterColor(filter.type)}`}
            >
              {isAssigneeFilter(filter) && (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${filter.avatarId}`}
                  alt={filter.display}
                  className="w-4 h-4 rounded-full"
                />
              )}
              {filter.type !== "text" && filter.type !== "assignee" && (
                <span className="text-xs opacity-60">{filter.type}:</span>
              )}
              <span>{filter.display}</span>
              <button onClick={() => removeFilter(index)} className="hover:bg-black/10 rounded p-0.5 ml-0.5">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
