import { commonEn } from "./common/en";
import { hisabiqEn } from "./hisabiq/en";
import { kanzEn } from "./kanz/en";
import { nisbahEn } from "./nisbah/en";
import { auditEn } from "../app/(app)/audit/messages/en";

export default {
  ...commonEn,
  ...hisabiqEn,
  ...kanzEn,
  ...nisbahEn,
  ...auditEn,
} as const;
