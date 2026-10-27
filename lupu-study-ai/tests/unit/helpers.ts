import type { AppData } from "@/types";
import { emptyData } from "@/services/data/defaults";

export function makeData(patch: Partial<AppData> = {}): AppData {
  return { ...emptyData(), ...patch };
}
