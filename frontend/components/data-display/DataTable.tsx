"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FiAward, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Button } from "@safee/ui";
import { type DisplayUser, displayUserSchema } from "@/lib/validation";

const ShuffleSortTable = () => {
  return (
    <div className="p-8 w-full bg-gradient-to-br from-violet-600 to-indigo-600">
      <Table />
    </div>
  );
};

// TODO: [Backend/Frontend] - Fetch user data from API
//   Details: The `userData` is currently mocked. Implement a backend API endpoint to fetch the user data and integrate it here.
//   Priority: High
const userData: DisplayUser[] = displayUserSchema.array().parse([
  {
    id: 1,
    name: "Andrea Thompson",
    contact: "andythompson@example.com",
    photoURL: "/imgs/head-shots/1.jpg",
    maxRank: 112,
    status: "online",
  },
  {
    id: 2,
    name: "Thomas Smith",
    contact: "tsmith@example.com",
    photoURL: "/imgs/head-shots/5.jpg",
    maxRank: 41,
    status: "online",
  },
  {
    id: 3,
    name: "John Anderson",
    contact: "john.a@example.com",
    photoURL: "/imgs/head-shots/2.jpg",
    maxRank: 9,
    status: "offline",
  },

  {
    id: 4,
    name: "Craig Peterson",
    contact: "craigpeterson@example.com",
    photoURL: "/imgs/head-shots/6.jpg",
    maxRank: 1,
    status: "online",
  },
  {
    id: 5,
    name: "Jen Horowitz",
    contact: "j.horowitz@example.com",
    photoURL: "/imgs/head-shots/3.jpg",
    maxRank: 9999,
    status: "pending",
  },
]);

const Table = () => {
  const [users, setUsers] = useState(userData);

  const shift = (id: number, direction: "up" | "down") => {
    const index = users.findIndex((u) => u.id === id);
    const usersCopy = [...users];

    if (direction === "up") {
      if (index > 0) {
        [usersCopy[index], usersCopy[index - 1]] = [usersCopy[index - 1], usersCopy[index]];
      }
    } else if (index < usersCopy.length - 1) {
      [usersCopy[index], usersCopy[index + 1]] = [usersCopy[index + 1], usersCopy[index]];
    }

    setUsers(usersCopy);
  };

  return (
    <div className="w-full bg-white shadow-lg rounded-lg overflow-x-scroll max-w-4xl mx-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-[1px] border-slate-200 text-slate-400 text-sm uppercase">
            <th className="pl-4 w-8"></th>
            <th className="text-start p-4 font-medium">Team Member</th>
            <th className="text-start p-4 font-medium">Rank</th>
            <th className="text-start p-4 font-medium">Max Rank</th>
            <th className="text-start p-4 font-medium">Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => {
            return <TableRows key={user.id} user={user} index={index} shift={shift} />;
          })}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowsProps {
  user: DisplayUser;
  index: number;
  shift: (id: number, direction: "up" | "down") => void;
}

const TableRows = ({ user, index, shift }: TableRowsProps) => {
  const rankOrdinal = numberToOrdinal(index + 1);
  const maxRankOrdinal = numberToOrdinal(user.maxRank);

  return (
    <motion.tr layoutId={`row-${user.id}`} className={`text-sm ${user.id % 2 ? "bg-slate-100" : "bg-white"}`}>
      <td className="pl-4 w-8 text-lg">
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-violet-600"
          onClick={() => {
            shift(user.id, "up");
          }}
        >
          <FiChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-violet-600"
          onClick={() => {
            shift(user.id, "down");
          }}
        >
          <FiChevronDown />
        </Button>
      </td>

      <td className="p-4 flex items-center gap-3 overflow-hidden">
        <img
          src={user.photoURL}
          alt="Example user photo"
          className="w-10 h-10 rounded-full bg-slate-300 object-cover object-top shrink-0"
        />
        <div>
          <span className="block mb-1 font-medium">{user.name}</span>
          <span className="block text-xs text-slate-500">{user.contact}</span>
        </div>
      </td>

      <td className="p-4">
        <div className={`flex items-center gap-2 font-medium ${rankOrdinal === "1st" && "text-violet-500"}`}>
          <span>{rankOrdinal}</span>
          {rankOrdinal === "1st" && <FiAward className="text-xl" />}{" "}
        </div>
      </td>

      <td className="p-4 font-medium">{maxRankOrdinal}</td>

      <td className="p-4">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            user.status === "online"
              ? "bg-green-200 text-green-800"
              : user.status === "offline"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-slate-200 text-slate-800"
          }`}
        >
          {user.status}
        </span>
      </td>
    </motion.tr>
  );
};

export default ShuffleSortTable;

const numberToOrdinal = (n: number) => {
  let ord = "th";

  if (n % 10 === 1 && n % 100 !== 11) {
    ord = "st";
  } else if (n % 10 === 2 && n % 100 !== 12) {
    ord = "nd";
  } else if (n % 10 === 3 && n % 100 !== 13) {
    ord = "rd";
  }

  return n + ord;
};
