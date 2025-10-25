'use client'

import React, {
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { FiArrowLeft, FiArrowRight, FiEdit } from "react-icons/fi";
import { DateObj, useDayzed } from "dayzed";

export const FlipCalendarExample = () => {
  return (
    <div className="grid place-content-center bg-indigo-50 px-4 py-24 md:flex-row">
      <FlipCalendar />
    </div>
  );
};

const FlipCalendar = () => {
  const [index, setIndex] = useState(0);
  const [date, setDate] = useState(new Date());
  const [visible, setVisible] = useState(true);

  const handleSelectDate = (selectedDate: { date: Date }) => {
    setDate(selectedDate.date);
    setIndex((pv) => pv + 1);
  };

  return (
    <div className="relative flex flex-col items-center text-indigo-950">
      <CalendarDisplay
        index={index}
        date={date}
        visible={visible}
        setVisible={setVisible}
      />
      <AnimatePresence>
        {visible && (
          <DatePicker selected={date} onDateSelected={handleSelectDate} />
        )}
      </AnimatePresence>
    </div>
  );
};

const CalendarDisplay = ({
  index,
  date,
  visible,
  setVisible,
}: CalendarDisplayProps) => {
  return (
    <div className="w-fit overflow-hidden rounded-xl border-2 border-indigo-500 bg-indigo-500">
      <div className="flex items-center justify-between px-1.5 py-0.5">
        <span className="text-center uppercase text-white">
          {format(date, "LLLL")}
        </span>
        <button
          onClick={() => setVisible((pv) => !pv)}
          className="text-white transition-colors hover:text-indigo-200"
        >
          {visible ? <FiArrowLeft /> : <FiEdit />}
        </button>
      </div>
      <div className="relative z-0 h-36 w-52 shrink-0">
        <AnimatePresence mode="sync">
          <motion.div
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
              zIndex: -index,
              backfaceVisibility: "hidden",
            }}
            key={index}
            transition={{
              duration: 0.75,
              ease: "easeInOut",
            }}
            initial={{ rotateX: "0deg" }}
            animate={{ rotateX: "0deg" }}
            exit={{ rotateX: "-180deg" }}
            className="absolute inset-0"
          >
            <div className="grid h-full w-full place-content-center rounded-lg bg-white text-6xl">
              {format(date, "do")}
            </div>
          </motion.div>
          <motion.div
            style={{
              clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
              zIndex: index,
              backfaceVisibility: "hidden",
            }}
            key={(index + 1) * 2}
            initial={{ rotateX: "180deg" }}
            animate={{ rotateX: "0deg" }}
            exit={{ rotateX: "0deg" }}
            transition={{
              duration: 0.75,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <div className="relative grid h-full w-full place-content-center rounded-lg bg-white text-6xl">
              {format(date, "do")}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs">
                {format(date, "yyyy")}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const DatePicker = (props: DatePickerProps) => {
  const { calendars, getBackProps, getForwardProps, getDateProps } =
    useDayzed(props);

  const calendar = calendars[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="-right-4 top-0 mt-4 w-fit rounded-lg border border-indigo-500 bg-white p-3 md:absolute md:mt-0 md:translate-x-full"
    >
      <div className="mb-2 flex items-center justify-between">
        <button {...getBackProps({ calendars })}>
          <FiArrowLeft />
        </button>
        <span>
          {MONTH_NAMES[calendar.month]} {calendar.year}
        </span>
        <button {...getForwardProps({ calendars })}>
          <FiArrowRight />
        </button>
      </div>
      <div key={`${calendar.month}${calendar.year}`} className="w-52">
        <div className="mb-2 flex">
          {WEEKDAY_NAMES.map((weekday) => (
            <div
              key={`${calendar.month}${calendar.year}${weekday}`}
              className="block w-[calc(100%_/_7)] text-center text-xs"
            >
              {weekday}
            </div>
          ))}
        </div>
        {calendar.weeks.map((week, weekIndex) =>
          week.map((dateObj, index) => {
            const key = `${calendar.month}${calendar.year}${weekIndex}${index}`;
            if (!dateObj) {
              return (
                <div key={key} className="inline-block w-[calc(100%_/_7)]" />
              );
            }
            const { date, selected } = dateObj;
            return (
              <button
                className={`inline-block w-[calc(100%_/_7)] rounded text-sm transition-colors ${selected ? "bg-indigo-500 text-white" : "bg-transparent"}`}
                key={key}
                {...getDateProps({ dateObj })}
              >
                {date.getDate()}
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

interface CalendarDisplayProps {
  index: number;
  date: Date;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

interface DatePickerProps {
  selected: Date;
  onDateSelected: (
    selectedDate: DateObj,
    event: SyntheticEvent<Element, Event>
  ) => void;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
