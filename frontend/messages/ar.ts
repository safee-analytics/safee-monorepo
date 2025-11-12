import { commonAr } from "./common/ar";
import { hisabiqAr } from "./hisabiq/ar";
import { kanzAr } from "./kanz/ar";
import { nisbahAr } from "./nisbah/ar";
import { auditAr } from "../app/(app)/audit/messages/ar";

export default {
  ...commonAr,
  ...hisabiqAr,
  ...kanzAr,
  ...nisbahAr,
  ...auditAr,
} as const;
