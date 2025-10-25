'use client'

import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";

const StackedNotifications = () => {
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );

  const removeNotif = () => {
    setNotification(null);
  };

  return (
    <AnimatePresence>
      {notification && (
        <Notification
          removeNotif={removeNotif}
          key={notification.id}
          {...notification}
        />
      )}
    </AnimatePresence>
  );
};

export const StackedNotificationsContainer = StackedNotifications;

const NOTIFICATION_TTL = 5000;

type NotificationType = {
  id: number;
  text: string;
};

const Notification = ({
  text,
  removeNotif,
}: Omit<NotificationType, 'id'> & { removeNotif: () => void }) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      removeNotif();
    }, NOTIFICATION_TTL);

    return () => clearTimeout(timeoutRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      layout
      initial={{ y: 15, scale: 0.9, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: -25, scale: 0.9, opacity: 0 }}
      transition={{ type: "spring" }}
      className="p-4 w-80 flex items-start rounded-lg gap-2 text-sm font-medium shadow-lg text-white bg-violet-600 fixed z-50 bottom-4 right-4"
    >
      <FiAlertCircle className="text-3xl absolute -top-4 -left-4 p-2 rounded-full bg-white text-violet-600 shadow" />
      <span>{text}</span>
      <button onClick={() => removeNotif()} className="ml-auto mt-0.5">
        <FiX />
      </button>
    </motion.div>
  );
};

export default StackedNotifications;

export const generateRandomNotif = (): NotificationType => {
  const names = [
    "John Anderson",
    "Emily Peterson",
    "Frank Daniels",
    "Laura Williams",
    "Donald Sanders",
    "Tom Smith",
    "Alexandra Black",
  ];

  const randomIndex = Math.floor(Math.random() * names.length);

  const data: NotificationType = {
    id: Math.random(),
    text: `New notification from ${names[randomIndex]}`,
  };

  return data;
};
