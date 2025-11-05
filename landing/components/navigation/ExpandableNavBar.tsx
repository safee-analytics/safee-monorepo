"use client";

import React, { ReactNode, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import Link from "next/link";
import { Logo } from "./Logo";
import { DesktopLinks } from "./DesktopLinks";
import { MobileLinks } from "./MobileLinks";
import { Announcement } from "./Announcement";
import { Button } from "../shared/Button";
import { config } from "@/lib/config";

type LinkType = {
  title: string;
  sublinks: { title: string; href: string }[];
};

export const ExpandableNavBar = ({
  children,
  links,
}: {
  children?: ReactNode;
  links: LinkType[];
}) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeSublinks = useMemo(() => {
    if (!hovered) return [];
    const link = links.find((l) => l.title === hovered);

    return link ? link.sublinks : [];
  }, [hovered]);

  return (
    <>
      <div className="bg-indigo-600 pt-2">
        <Announcement />
        <nav
          onMouseLeave={() => setHovered(null)}
          className="rounded-t-2xl bg-white p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Logo />
              <DesktopLinks
                links={links}
                setHovered={setHovered}
                hovered={hovered}
                activeSublinks={activeSublinks}
              />
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href={`${config.appUrl}/login`}>
                <Button intent="outline" size="small">
                  Login
                </Button>
              </Link>
              <Link href={`${config.appUrl}/register`}>
                <Button intent="secondary" size="small">
                  <span className="font-bold">Get started</span>
                </Button>
              </Link>
            </div>
            <button
              onClick={() => setMobileNavOpen((pv) => !pv)}
              className="mt-0.5 block text-2xl md:hidden"
            >
              <FiMenu />
            </button>
          </div>
          <MobileLinks links={links} open={mobileNavOpen} />
        </nav>
      </div>
      <motion.main layout>
        <div className="bg-white">{children}</div>
      </motion.main>
    </>
  );
};
