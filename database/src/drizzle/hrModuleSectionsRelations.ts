import { relations } from "drizzle-orm";
import { hrModuleSections } from "./hrModuleSections.js";

export const hrModuleSectionsRelations = relations(hrModuleSections, () => ({}));
