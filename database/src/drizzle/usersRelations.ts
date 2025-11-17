import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { userServices } from "./userServices.js";
import { members } from "./members.js";
import { teamMembers } from "./teamMembers.js";

export const usersRelations = relations(users, ({ many }) => ({
  userServices: many(userServices),
  members: many(members),
  teamMemberships: many(teamMembers),
}));
