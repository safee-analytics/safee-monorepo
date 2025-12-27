import type { PubSub, PubSubMessage } from "../pubsub/index.js";
import type { DbDeps } from "../deps.js";
import {
  notifyCaseCreated,
  notifyCaseAssigned,
  notifyCaseCompleted,
  type NotificationServiceDeps,
} from "./notificationService.js";

export type CaseEventType = "case.created" | "case.assigned" | "case.completed" | "case.status_changed";

export interface CaseEvent {
  type: CaseEventType;
  caseId: string;
  caseNumber: string;
  clientName: string;
  organizationId: string;
  userId?: string; // Actor who triggered the event
  assignedUserId?: string; // For assignment events
  assignedUserIds?: string[]; // For notifications to multiple users
  status?: string; // For status change events
  userName?: string; // For completed events
}

export async function initializeCaseEventHandlers(pubsub: PubSub, deps: DbDeps): Promise<void> {
  const { logger } = deps;

  await pubsub.createTopic("case.events");

  await pubsub.subscribe("case-events-subscription", async (message: PubSubMessage) => {
    try {
      const event = JSON.parse(message.data.toString()) as CaseEvent;
      logger.info({ event }, "Processing case event for notifications");

      const notificationDeps: NotificationServiceDeps = {
        ...deps,
        pubsub,
      };

      switch (event.type) {
        case "case.created":
          if (event.userId) {
            await notifyCaseCreated(notificationDeps, {
              organizationId: event.organizationId,
              userId: event.userId,
              caseId: event.caseId,
              caseNumber: event.caseNumber,
              clientName: event.clientName,
            });
          }
          break;

        case "case.assigned":
          if (event.assignedUserId) {
            await notifyCaseAssigned(notificationDeps, {
              organizationId: event.organizationId,
              userId: event.assignedUserId,
              caseId: event.caseId,
              caseNumber: event.caseNumber,
              clientName: event.clientName,
            });
          }
          break;

        case "case.completed":
          if (event.assignedUserIds && event.userName) {
            await notifyCaseCompleted(notificationDeps, {
              organizationId: event.organizationId,
              userIds: event.assignedUserIds,
              caseId: event.caseId,
              caseNumber: event.caseNumber,
              clientName: event.clientName,
              userName: event.userName,
            });
          }
          break;

        default:
          logger.warn({ eventType: event.type }, "Unknown case event type");
      }

      logger.info({ eventType: event.type, caseId: event.caseId }, "Case event processed");
    } catch (err) {
      logger.error({ error: err, message: message.data.toString() }, "Error processing case event");
    }
  });

  logger.info("Case event handlers initialized");
}

export async function publishCaseEvent(pubsub: PubSub, event: CaseEvent): Promise<void> {
  await pubsub.publish("case.events", event, {
    eventType: event.type,
    caseId: event.caseId,
  });
}
