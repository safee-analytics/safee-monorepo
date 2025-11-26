"use client";

import { AnimatePresence, useAnimate, usePresence } from "framer-motion";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FiClock, FiPlus, FiTrash2, FiCheck } from "react-icons/fi";
import { motion } from "framer-motion";

type TODO = {
  id: number;
  text: string;
  checked: boolean;
  priority: "low" | "medium" | "high";
};

export const TodoWidget = () => {
  const [todos, setTodos] = useState<TODO[]>([
    {
      id: 1,
      text: "Review quarterly financial reports",
      checked: false,
      priority: "high",
    },
    {
      id: 2,
      text: "Follow up with pending invoices",
      checked: false,
      priority: "medium",
    },
    {
      id: 3,
      text: "Schedule team meeting",
      checked: true,
      priority: "low",
    },
  ]);

  const handleCheck = (id: number) => {
    setTodos((pv) => pv.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  const removeElement = (id: number) => {
    setTodos((pv) => pv.filter((t) => t.id !== id));
  };

  return (
    <div className="w-full">
      <Header todosCount={todos.filter((t) => !t.checked).length} />
      <Todos removeElement={removeElement} todos={todos} handleCheck={handleCheck} />
      <Form setTodos={setTodos} />
    </div>
  );
};

const Header = ({ todosCount }: { todosCount: number }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
          <p className="text-sm text-gray-600">
            {todosCount} {todosCount === 1 ? "task" : "tasks"} remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full">
            <FiClock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Form = ({ setTodos }: { setTodos: Dispatch<SetStateAction<TODO[]>> }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleSubmit = () => {
    if (!text.length) {
      return;
    }

    setTodos((pv) => [
      {
        id: Math.random(),
        text,
        checked: false,
        priority,
      },
      ...pv,
    ]);

    setText("");
    setPriority("medium");
    setVisible(false);
  };

  return (
    <div className="mt-4">
      <AnimatePresence>
        {visible && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mb-3 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full resize-none rounded bg-white p-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPriority("low")}
                  className={`rounded px-2 py-1 text-xs ${priority === "low" ? "bg-green-100 text-green-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("medium")}
                  className={`rounded px-2 py-1 text-xs ${priority === "medium" ? "bg-yellow-100 text-yellow-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("high")}
                  className={`rounded px-2 py-1 text-xs ${priority === "high" ? "bg-red-100 text-red-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  High
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setVisible(false);
                  }}
                  className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-safee-600 px-3 py-1 text-xs text-white hover:bg-safee-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {!visible && (
        <button
          onClick={() => setVisible(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-3 text-sm font-medium text-gray-600 hover:border-safee-400 hover:bg-safee-50 hover:text-safee-700 transition-all"
        >
          <FiPlus className="w-4 h-4" />
          Add New Task
        </button>
      )}
    </div>
  );
};

const Todos = ({
  todos,
  handleCheck,
  removeElement,
}: {
  todos: TODO[];
  handleCheck: (id: number) => void;
  removeElement: (id: number) => void;
}) => {
  return (
    <div className="w-full space-y-2">
      <AnimatePresence>
        {todos.map((t) => (
          <Todo
            handleCheck={handleCheck}
            removeElement={removeElement}
            id={t.id}
            key={t.id}
            checked={t.checked}
            priority={t.priority}
          >
            {t.text}
          </Todo>
        ))}
      </AnimatePresence>
      {todos.length === 0 && (
        <div className="text-center py-8">
          <FiCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">All tasks completed!</p>
        </div>
      )}
    </div>
  );
};

const Todo = ({
  removeElement,
  handleCheck,
  id,
  children,
  checked,
  priority,
}: {
  removeElement: (id: number) => void;
  handleCheck: (id: number) => void;
  id: number;
  children: string;
  checked: boolean;
  priority: "low" | "medium" | "high";
}) => {
  const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!isPresent) {
      const exitAnimation = async () => {
        await animate(
          scope.current,
          {
            opacity: 0,
            x: -20,
          },
          {
            duration: 0.2,
          },
        );
        safeToRemove();
      };

      exitAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  const priorityColors = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <motion.div
      ref={scope}
      layout
      className={`relative flex w-full items-center gap-3 rounded-lg border p-3 transition-all ${
        checked ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-safee-300 hover:shadow-sm"
      }`}
    >
      <button
        onClick={() => handleCheck(id)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked
            ? "bg-safee-600 border-safee-600"
            : "border-gray-300 hover:border-safee-500 hover:bg-safee-50"
        }`}
      >
        {checked && <FiCheck className="w-3 h-3 text-white" />}
      </button>

      <p className={`text-sm flex-1 transition-all ${checked ? "text-gray-400 line-through" : "text-gray-900"}`}>
        {children}
      </p>

      <div className="flex items-center gap-2">
        {!checked && (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityColors[priority]}`}
          >
            {priority}
          </span>
        )}
        <button
          onClick={() => removeElement(id)}
          className="flex-shrink-0 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
