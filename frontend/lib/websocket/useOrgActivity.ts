/**
 * Organization Activity Hook
 * Subscribes to real-time organization-wide events
 */

import { useEffect } from "react";
import { useWebSocketContext } from "./WebSocketProvider";
import { useSession } from "@/lib/api/hooks";
import type { ActivityEvent } from "@safee/database";

export function useOrgActivity(onActivity: (activity: ActivityEvent) => void) {
  const { subscribe } = useWebSocketContext();
  const { data: session } = useSession();

  useEffect(() => {
    const activeOrgId = session?.session?.activeOrganizationId;
    if (!activeOrgId) return;

    const channel = `org:${activeOrgId}`;
    const unsubscribe = subscribe(channel, "activity", onActivity);

    return unsubscribe;
  }, [session, subscribe, onActivity]);
}
