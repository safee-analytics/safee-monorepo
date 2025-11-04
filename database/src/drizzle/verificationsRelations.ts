import { relations } from "drizzle-orm";
import { verifications } from "./verifications.js";

// No relations for verifications table - it's standalone
export const verificationsRelations = relations(verifications, () => ({}));
