import { commonAr } from "./common/ar";
import { hisabiqAr } from "./hisabiq/ar";
import { kanzAr } from "./kanz/ar";
import { nisbahAr } from "./nisbah/ar";
import { auditAr } from "../app/(app)/audit/messages/ar";
import { settingsAr } from "./settings/ar";

export default {
  ...commonAr,
  ...settingsAr,
  ...hisabiqAr,
  ...kanzAr,
  ...nisbahAr,
  ...auditAr,
} as const;
