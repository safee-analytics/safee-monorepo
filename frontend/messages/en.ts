import { commonEn } from "./common/en";
import { hisabiqEn } from "./hisabiq/en";
import { kanzEn } from "./kanz/en";
import { nisbahEn } from "./nisbah/en";
import { auditEn } from "../app/(app)/audit/messages/en";
import { settingsEn } from "./settings/en";

export default {
  ...commonEn,
  ...settingsEn,
  ...hisabiqEn,
  ...kanzEn,
  ...nisbahEn,
  ...auditEn,
} as const;
