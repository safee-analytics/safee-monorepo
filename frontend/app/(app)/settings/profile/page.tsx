"use client";

import { motion } from "framer-motion";
import { ProfileTabs } from "./profile-tabs";

export default function ProfileSettings() {
  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information, security, and account settings</p>
        </div>

        {/* Profile Tabs Component */}
        <ProfileTabs />
      </motion.div>
    </div>
  );
}
