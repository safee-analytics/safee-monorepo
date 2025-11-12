"use client";

import React, { Dispatch, SetStateAction, useState } from "react";

export const ShiftHightlightTabs = () => {
  const [selected, setSelected] = useState(1);
  return (
    <div className="bg-zinc-50">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-8 py-12 lg:grid-cols-4">
        {TAB_DATA.map((t) => (
          <ToggleButton key={t.id} id={t.id} selected={selected} setSelected={setSelected}>
            {t.title}
          </ToggleButton>
        ))}
      </div>
    </div>
  );
};

const ToggleButton = ({
  children,
  selected,
  setSelected,
  id,
}: {
  children: string;
  selected: number;
  setSelected: Dispatch<SetStateAction<number>>;
  id: number;
}) => {
  return (
    <div className={`rounded-lg transition-colors ${selected === id ? "bg-indigo-600" : "bg-zinc-900"}`}>
      <button
        onClick={() => setSelected(id)}
        className={`w-full origin-top-left rounded-lg border py-3 text-xs font-medium transition-all md:text-base ${
          selected === id
            ? "-translate-y-1 border-indigo-600 bg-white text-indigo-600"
            : "border-zinc-900 bg-white text-zinc-900 hover:-rotate-2"
        }`}
      >
        {children}
      </button>
    </div>
  );
};

const TAB_DATA = [
  {
    id: 1,
    title: "Issues",
  },
  {
    id: 2,
    title: "Kanban",
  },
  {
    id: 3,
    title: "Gantt",
  },
  {
    id: 4,
    title: "Documentation",
  },
];
