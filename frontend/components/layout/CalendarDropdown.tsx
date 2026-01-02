"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiUsers,
  FiVideo,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: "meeting" | "deadline" | "reminder" | "event";
  location?: string;
  attendees?: number;
  color: string;
}

// Mock events - replace with actual API call
const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup",
    startTime: new Date(2026, 0, 2, 9, 0),
    endTime: new Date(2026, 0, 2, 9, 30),
    type: "meeting",
    attendees: 8,
    color: "blue",
  },
  {
    id: "2",
    title: "Client Presentation",
    startTime: new Date(2026, 0, 2, 14, 0),
    endTime: new Date(2026, 0, 2, 15, 30),
    type: "meeting",
    location: "Conference Room A",
    attendees: 5,
    color: "purple",
  },
  {
    id: "3",
    title: "Q1 Report Due",
    startTime: new Date(2026, 0, 5, 17, 0),
    endTime: new Date(2026, 0, 5, 17, 0),
    type: "deadline",
    color: "red",
  },
  {
    id: "4",
    title: "Design Review",
    startTime: new Date(2026, 0, 8, 10, 0),
    endTime: new Date(2026, 0, 8, 11, 0),
    type: "meeting",
    attendees: 4,
    color: "green",
  },
];

const eventTypeColors = {
  meeting: "bg-blue-100 text-blue-700 border-blue-300",
  deadline: "bg-red-100 text-red-700 border-red-300",
  reminder: "bg-yellow-100 text-yellow-700 border-yellow-300",
  event: "bg-purple-100 text-purple-700 border-purple-300",
};

export function CalendarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get calendar dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for selected date or today
  const displayDate = selectedDate || new Date();
  const todayEvents = mockEvents.filter((event) =>
    isSameDay(event.startTime, displayDate)
  );

  const upcomingEvents = mockEvents
    .filter((event) => event.startTime >= displayDate)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3);

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

  const hasEventOnDay = (day: Date) => {
    return mockEvents.some((event) => isSameDay(event.startTime, day));
  };

  const EventItem = ({ event }: { event: CalendarEvent }) => (
    <div
      className={`
        group p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer
        ${eventTypeColors[event.type]}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold line-clamp-1">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
            <FiClock className="w-3 h-3" />
            <span>{format(event.startTime, "h:mm a")}</span>
            {event.endTime && event.endTime.getTime() !== event.startTime.getTime() && (
              <>
                <span>-</span>
                <span>{format(event.endTime, "h:mm a")}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            {event.location && (
              <div className="flex items-center gap-1">
                <FiMapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}
            {event.attendees && (
              <div className="flex items-center gap-1">
                <FiUsers className="w-3 h-3" />
                <span>{event.attendees}</span>
              </div>
            )}
          </div>
        </div>
        {event.type === "meeting" && (
          <button className="p-1.5 rounded-md hover:bg-white/50 transition-colors">
            <FiVideo className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Calendar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-all
          ${isOpen ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}
        `}
      >
        <FiCalendar className={`w-5 h-5 transition-transform ${isOpen ? "scale-110" : ""}`} />

        {/* Event indicator */}
        {todayEvents.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[420px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-white rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors"
                >
                  <FiChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors ml-1"
                >
                  <FiX className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasEvent = hasEventOnDay(day);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    disabled={!isCurrentMonth}
                    className={`
                      relative aspect-square rounded-lg text-sm font-medium transition-all
                      ${!isCurrentMonth ? "text-gray-300 cursor-not-allowed" : ""}
                      ${isCurrentMonth && !isTodayDate && !isSelected ? "text-gray-700 hover:bg-gray-100" : ""}
                      ${isTodayDate && !isSelected ? "bg-blue-100 text-blue-700 font-bold" : ""}
                      ${isSelected ? "bg-blue-600 text-white shadow-md scale-105" : ""}
                    `}
                  >
                    {format(day, "d")}
                    {hasEvent && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events Section */}
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900">
                  {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Today's Events"}
                </h4>
                <Link
                  href="/calendar/new"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FiPlus className="w-3 h-3" />
                  New
                </Link>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todayEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FiCalendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">No events for this day</p>
                  </div>
                ) : (
                  todayEvents.map((event) => <EventItem key={event.id} event={event} />)
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="px-4 pb-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Upcoming</h4>
                <div className="space-y-1">
                  {upcomingEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${event.color === "blue" ? "bg-blue-500" : event.color === "red" ? "bg-red-500" : event.color === "green" ? "bg-green-500" : "bg-purple-500"}`}></div>
                      <span className="flex-1 font-medium text-gray-700 line-clamp-1">{event.title}</span>
                      <span className="text-gray-500">{format(event.startTime, "MMM d")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <Link
                href="/calendar"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Open Calendar
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
