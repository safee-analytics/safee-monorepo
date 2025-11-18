import React from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  Views,
  Event as CalendarEvent,
  SlotInfo,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale";

// Setup localizer for date-fns
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export interface CalendarEventData extends CalendarEvent {
  id?: string | number;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  allDay?: boolean;
}

export interface CalendarSchedulerProps {
  events: CalendarEventData[];
  onSelectEvent?: (event: CalendarEventData) => void;
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  onNavigate?: (date: Date, view: View) => void;
  defaultView?: View;
  views?: View[];
  height?: number | string;
  selectable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Calendar/Scheduler component wrapper for React Big Calendar
 * Provides a Google Calendar-like interface for scheduling
 */
export const CalendarScheduler: React.FC<CalendarSchedulerProps> = ({
  events,
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  defaultView = Views.WEEK,
  views = [Views.MONTH, Views.WEEK, Views.DAY],
  height = 600,
  selectable = true,
  className = "",
  style = {},
}) => {
  const containerStyle: React.CSSProperties = {
    height,
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        onNavigate={onNavigate}
        defaultView={defaultView}
        views={views}
        selectable={selectable}
        popup
        style={{ height: "100%" }}
      />
    </div>
  );
};

// Export types for convenience
export type { View, Views, SlotInfo } from "react-big-calendar";
