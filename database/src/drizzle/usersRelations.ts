import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { userServices } from "./userServices.js";
import { members } from "./members.js";
import { teamMembers } from "./teamMembers.js";
import { twoFactors } from "./twoFactors.js";
import { apikeys } from "./apikeys.js";
import { sessions } from "./sessions.js";
import { oauthAccounts } from "./oauthAccounts.js";

export const usersRelations = relations(users, ({ many }) => ({
  userServices: many(userServices),
  members: many(members),
  teamMemberships: many(teamMembers),
  twoFactors: many(twoFactors),
  apiKeys: many(apikeys),
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
}));
