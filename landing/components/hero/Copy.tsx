"use client";

import Link from "next/link";
import React from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { Button } from "../shared/Button";
import { config } from "@/lib/config";

export const Copy = () => {
  return (
    <>
      <div className="mb-1.5 rounded-full bg-zinc-600">
        <div className="flex origin-top-left items-center rounded-full border border-zinc-900 bg-white p-0.5 text-sm transition-transform hover:-rotate-2">
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 font-medium text-white">
            NEW
          </span>
          <span className="ml-1.5 mr-1 inline-block">
            Now available in MENA region
          </span>
          <FiArrowUpRight className="mr-2 inline-block" />
        </div>
      </div>
      <h1 className="max-w-4xl text-center text-4xl font-black leading-[1.15] md:text-7xl md:leading-[1.15]">
        Safee Analytics
      </h1>
      <h2 className="max-w-4xl text-center text-3xl font-black leading-[1.15] text-zinc-700 md:text-5xl md:leading-[1.15]">
        حلول الأعمال الذكية
      </h2>
      <p className="mx-auto my-4 max-w-3xl text-center text-base leading-relaxed md:my-6 md:text-2xl md:leading-relaxed">
        Integrated business management platform for MENA region. Accounting, HR, Payroll, and CRM - all in one place.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`${config.appUrl}/register`}>
          <Button>
            <span className="font-bold">Get started - </span> no CC required
          </Button>
        </Link>
        <Link href={`${config.appUrl}/login`}>
          <Button intent="outline">
            <span className="font-bold">Login</span>
          </Button>
        </Link>
      </div>
    </>
  );
};
