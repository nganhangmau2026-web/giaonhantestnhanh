/**
 * ============================================================================
 *  FRONTEND APP – QUẢN LÝ TEST NHANH MIỄN DỊCH (BM.04 / BM.13) - BẢN TỐI HẬU V13
 *  Khoa Xét Nghiệm – Bệnh viện Đa khoa Cà Mau
 *  AN INTELLECTUAL PRODUCT OF HANDSOME LONG
 * ============================================================================
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  ShieldCheck,
  KeyRound,
  Settings,
  Database,
  FileSpreadsheet,
  Clock,
  UserCheck,
  Users,
  Search,
  Sparkles,
  Edit2,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  WifiOff,
  AlertOctagon,
  Layers,
} from "lucide-react";

/* ============================== CẤU HÌNH KẾT NỐI ============================== */

const DEFAULT_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAS_API_URL) ||
  'https://script.google.com/macros/s/AKfycbx0jakdbvQoA9-trw7tF1vsbpdpmJQI4M4Jh0YhFSzEvLQxvO3xvSxLIs3zFj-0b2g/exec';

const STORAGE_KEYS = Object.freeze({
  API_URL: "MD_API_URL_V2",
  AUTH: "MD_AUTH_V2",
  CHECKER: "MD_CHECKER_V2",
  TESTS: "MD_TESTS_V2",
  BM04: "MD_BM04_V2",
  PENDING: "MD_PENDING_V2",
  BM13_RAW: "MD_BM13_RAW_V2",
  BM13_DIRTY: "MD_BM13_DIRTY_V2",
  DRAFTS: "MD_DRAFTS_V2",
  TIMERS: "MD_TIMERS_V2",
  OUTBOX: "MD_OUTBOX_V2",
  DATA_VERSION: "MD_DATA_VERSION_V2",
  SERVER_OFFSET: "MD_SERVER_OFFSET_V2",
});

/* ============================== KIỂU DỮ LIỆU ============================== */

export type Role = "Admin" | "User";
export type ShiftNumber = 1 | 2 | 3 | 4;
export type ShiftStatus = "OPEN" | "PENDING_RECEIVE" | "HOAN_THANH";
export type DocChungValue = "Dương tính" | "Âm Tính";
export type TimerPresetMinutes = 10 | 15 | 20;

export interface UserInfo {
  id: string;
  name: string;
  role: Role;
  mustChange?: boolean;
}

export interface AuthState {
  token: string;
  user: UserInfo;
  mustChange: boolean;
}

export interface CheckerState {
  id: string;
  name: string;
  proof: string;
  verifiedForUserId: string;
}

export interface TestConfig {
  code: string;
  name: string;
  unit: string;
  quota: number;
  noStock?: boolean;
}

export interface QueueItem {
  id: string;
  ngayBC: string;
  caTruc: ShiftNumber;
  tenXetNghiem: string;
  maTest: string;
  hoTenBN: string;
  namSinhNam: string;
  namSinhNu: string;
  isAgeMode?: boolean;
  barcode: string;
  docChung: DocChungValue;
  ketQua?: string;
  thoiGianDocKQ?: string;
  nguoiThucHien: string;
  nguoiKiemTra: string;
  timestamp: string;
  lanSuaCuoi?: string;
}

export interface PatientTimer {
  startAt: number;
  durationMs: number;
  presetMin: TimerPresetMinutes;
}

export interface ShiftCellData {
  boiHoan: number;
  suDungQC: number;
  suDung: number;
  tonCuoi: number;
}

export interface ShiftMeta {
  gioGiao: string;
  nguoiGiao: string;
  nguoiNhan: string;
  trangThai: ShiftStatus;
}

export interface DayComputed {
  ngayBC: string;
  ghiChu: string;
  tests: TestConfig[];
  tonDau: Record<string, number>;
  manualTonDau: Record<string, number>;
  shifts: Record<ShiftNumber, Record<string, ShiftCellData>>;
  meta: Record<ShiftNumber, ShiftMeta>;
  tonCuoiNgay: Record<string, number>;
}

export interface RawBM13Row {
  shiftId: string;
  ngayBC: string;
  caTruc: number;
  gioGiao: string;
  nguoiGiao: string;
  nguoiNhan: string;
  ghiChu: string;
  dataJson: string;
  trangThai: string;
}

export interface ActiveSession {
  date: string;
  shift: ShiftNumber;
  mainUser: string;
  mainUserId?: string;
  checkerUser: string;
  lastPing: number;
  epoch?: string;
}

export interface OutboxItem {
  qid: string;
  action: string;
  payload: Record<string, any>;
  createdAt: number;
  attempts: number;
  lastError?: string;
  paused?: boolean;
}

export interface DraftResult {
  docChung: DocChungValue;
  ketQua: string;
}

/* ==================== DANH MỤC MẶC ĐỊNH & CẤU HÌNH CA ==================== */

// Các mã xét nghiệm chỉ ghi nhận kết quả BM.04, KHÔNG quản lý tồn kho BM.13
const NON_STOCK_TESTS: Record<string, boolean> = Object.freeze({
  WIDAL: true,
});

export function isStockTestCode(code: string): boolean {
  const c = String(code || "")
    .trim()
    .toUpperCase();
  return Boolean(c) && !NON_STOCK_TESTS[c];
}

const DEFAULT_TESTS: TestConfig[] = [
  { code: "HCV", name: "HCV (TN)", unit: "TEST", quota: 20 },
  { code: "HBSAB", name: "HBsAb (TN)", unit: "TEST", quota: 5 },
  { code: "HIV", name: "HIV (TN)", unit: "TEST", quota: 10 },
  { code: "SYPHI", name: "SYPHI", unit: "TEST", quota: 5 },
  { code: "KSTSR", name: "KSTSR", unit: "TEST", quota: 10 },
  { code: "DENGUE", name: "DENGUE", unit: "TEST", quota: 10 },
  { code: "NS1", name: "NS1", unit: "TEST", quota: 10 },
  {
    code: "DRUG4",
    name: "test gây nghiện 4 test thử",
    unit: "TEST",
    quota: 10,
  },
  { code: "MOP", name: "MOP", unit: "TEST", quota: 10 },
  { code: "AMP", name: "AMP", unit: "TEST", quota: 10 },
  { code: "MET", name: "MET", unit: "TEST", quota: 10 },
  { code: "THC", name: "THC", unit: "TEST", quota: 10 },
  { code: "HBEAB", name: "HBeAb (TN)", unit: "TEST", quota: 5 },
  { code: "HBEAG", name: "HBeAg (TN)", unit: "TEST", quota: 5 },
  { code: "HBCAB", name: "HBcAb (TN)", unit: "TEST", quota: 5 },
  { code: "CODEIN", name: "CODEIN", unit: "TEST", quota: 10 },
  { code: "WIDAL", name: "WIDAL", unit: "TEST", quota: 0, noStock: true },
];

export const SHIFT_INFO: Record<
  ShiftNumber,
  { label: string; short: string; timeRange: string }
> = {
  1: {
    label: "Lần 1 (07h00 - 11h00)",
    short: "Ca 1",
    timeRange: "07h00 - 11h00",
  },
  2: {
    label: "Lần 2 (11h00 - 13h30)",
    short: "Ca 2",
    timeRange: "11h00 - 13h30",
  },
  3: {
    label: "Lần 3 (13h30 - 17h00)",
    short: "Ca 3",
    timeRange: "13h30 - 17h00",
  },
  4: {
    label: "Lần 4 (17h00 - 07h00)",
    short: "Ca 4",
    timeRange: "17h00 - 07h00",
  },
};

/**
 * Bảng màu nhận diện riêng cho từng Ca trực (Ca 1: Xanh dương, Ca 2: Cam, Ca 3: Xanh lá, Ca 4: Tím)
 */
export const SHIFT_THEME: Record<
  ShiftNumber,
  {
    badgeBg: string;
    badgeText: string;
    border: string;
    softBg: string;
    headerSelectBg: string;
    optionStyle: { backgroundColor: string; color: string; fontWeight: number };
  }
> = {
  1: {
    badgeBg: "bg-sky-600",
    badgeText: "text-white",
    border: "border-sky-200",
    softBg: "bg-sky-50/60",
    headerSelectBg: "bg-sky-600/90 border-sky-400/60 text-white",
    optionStyle: {
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
      fontWeight: 700,
    },
  },
  2: {
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    border: "border-amber-200",
    softBg: "bg-amber-50/60",
    headerSelectBg: "bg-amber-500/90 border-amber-300/60 text-white",
    optionStyle: {
      backgroundColor: "#fef3c7",
      color: "#b45309",
      fontWeight: 700,
    },
  },
  3: {
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    border: "border-emerald-200",
    softBg: "bg-emerald-50/60",
    headerSelectBg: "bg-emerald-600/90 border-emerald-400/60 text-white",
    optionStyle: {
      backgroundColor: "#d1fae5",
      color: "#047857",
      fontWeight: 700,
    },
  },
  4: {
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    border: "border-purple-200",
    softBg: "bg-purple-50/60",
    headerSelectBg: "bg-purple-600/90 border-purple-400/60 text-white",
    optionStyle: {
      backgroundColor: "#f3e8ff",
      color: "#6d28d9",
      fontWeight: 700,
    },
  },
};

/* ====================== TIỆN ÍCH NGÀY GIỜ (GMT+7) ====================== */

let serverOffsetMs = 0;
try {
  const savedOffset = localStorage.getItem(STORAGE_KEYS.SERVER_OFFSET);
  if (savedOffset) serverOffsetMs = Number(savedOffset) || 0;
} catch {}

export function updateServerOffset(serverTimeMs?: number) {
  if (
    typeof serverTimeMs === "number" &&
    Number.isFinite(serverTimeMs) &&
    serverTimeMs > 1700000000000
  ) {
    serverOffsetMs = serverTimeMs - Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.SERVER_OFFSET, String(serverOffsetMs));
    } catch {}
  }
}

export function getTrustedNow(): Date {
  return new Date(Date.now() + serverOffsetMs);
}

function getVnParts(d: Date = getTrustedNow()) {
  const vnMs = d.getTime() + 7 * 3600 * 1000;
  const vn = new Date(vnMs);
  return {
    year: vn.getUTCFullYear(),
    month: vn.getUTCMonth() + 1,
    day: vn.getUTCDate(),
    hour: vn.getUTCHours(),
    minute: vn.getUTCMinutes(),
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function isDateStr(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
}

export function addDays(dateStr: string, delta: number): string {
  if (!isDateStr(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(
    dt.getUTCDate()
  )}`;
}

export function businessDate(d: Date = getTrustedNow()): string {
  const p = getVnParts(d);
  const today = `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
  return p.hour < 7 ? addDays(today, -1) : today;
}

export function shiftOfDay(d: Date = getTrustedNow()): ShiftNumber {
  const { hour, minute } = getVnParts(d);
  const mins = hour * 60 + minute;
  if (mins >= 7 * 60 && mins < 11 * 60) return 1;
  if (mins >= 11 * 60 && mins < 13 * 60 + 30) return 2;
  if (mins >= 13 * 60 + 30 && mins < 17 * 60) return 3;
  return 4;
}

export function formatVnTimeNow(d: Date = getTrustedNow()): string {
  const p = getVnParts(d);
  return `${pad2(p.hour)}h${pad2(p.minute)} ${pad2(p.day)}/${pad2(p.month)}/${
    p.year
  }`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!isDateStr(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function isShiftOverdue(
  selectedDate: string,
  shift: ShiftNumber,
  now: Date = getTrustedNow()
): boolean {
  const bToday = businessDate(now);
  if (selectedDate < bToday) return true;
  if (selectedDate > bToday) return false;
  const curShift = shiftOfDay(now);
  return shift < curShift;
}

export function formatCountdownMmSs(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${pad2(mins)}:${pad2(secs)}`;
}

/* ============= CHUẨN HÓA BỘ TEST ĐA CHÂN (DRUG4, DENGUE, KSTSR, WIDAL) ============= */

export const MULTI_TEST_CONFIG: Record<string, string[]> = {
  DRUG4: ["MOP", "AMP", "THC", "Codein", "Heroin"],
  DENGUE: ["IgG", "IgM"],
  KSTSR: ["P. falciparum", "P. vivax"],
  WIDAL: ["Typhi O", "Typhi H", "AO", "AH", "BO", "BH", "CO", "CH"],
};

export function getSubTests(maTest: string): string[] | null {
  const code = String(maTest || "")
    .trim()
    .toUpperCase();
  return MULTI_TEST_CONFIG[code] || null;
}

function buildSubKeyRegex(key: string): RegExp {
  let altKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (key === "Codein") altKey = "(?:Codein|COD)";
  else if (key === "Heroin") altKey = "(?:Heroin|HER)";
  else if (key === "P. falciparum")
    altKey = "(?:P\\.\\s*falciparum|P\\.\\s*falci|Pf)";
  else if (key === "P. vivax") altKey = "(?:P\\.\\s*vivax|Pv)";
  else if (key === "Typhi O") altKey = "(?:Typhi\\s*O|TO)";
  else if (key === "Typhi H") altKey = "(?:Typhi\\s*H|TH)";

  const valTokens = [
    "Dương(?:\\s*tính)?",
    "Duong(?:\\s*tinh)?",
    "Âm(?:\\s*tính)?",
    "Am(?:\\s*tinh)?",
    "D",
    "Â",
    "A",
    "\\+",
    "\\-",
    "\\?",
  ].join("|");

  return new RegExp(
    "(?:^|[|;,\\s])" + altKey + "\\s*(?:[:=]|\\()\\s*(" + valTokens + ")\\)?",
    "gi"
  );
}

export function parseMultiResultWithNote(
  maTest: string,
  ketQua: string
): {
  map: Record<string, "Âm" | "Dương" | "">;
  extraNote: string;
} {
  const subs = getSubTests(maTest);
  const res: Record<string, "Âm" | "Dương" | ""> = {};
  if (!subs) return { map: res, extraNote: "" };
  subs.forEach((k) => {
    res[k] = "";
  });

  const raw = String(ketQua || "").trim();
  if (!raw) return { map: res, extraNote: "" };

  const rawLower = raw.toLowerCase();
  if (
    rawLower === "âm tính" ||
    rawLower === "am tinh" ||
    rawLower === "âm" ||
    rawLower === "am"
  ) {
    subs.forEach((k) => {
      res[k] = "Âm";
    });
    return { map: res, extraNote: "" };
  }

  let leftover = raw;
  const explicitNoteMatch = leftover.match(/(?:\|\s*)?Ghi\s*chú\s*:\s*(.+)$/i);
  let explicitNote = "";
  if (explicitNoteMatch && explicitNoteMatch.index !== undefined) {
    explicitNote = explicitNoteMatch[1].trim();
    leftover = leftover.slice(0, explicitNoteMatch.index).trim();
  }

  for (const key of subs) {
    const re = buildSubKeyRegex(key);
    let m: RegExpExecArray | null;
    while ((m = re.exec(leftover)) !== null) {
      const valStr = String(m[1] || "")
        .trim()
        .toLowerCase();
      if (valStr === "?") {
        if (!res[key]) res[key] = "";
      } else if (
        valStr.startsWith("dương") ||
        valStr.startsWith("duong") ||
        valStr === "+" ||
        valStr === "d"
      ) {
        res[key] = "Dương";
      } else {
        res[key] = "Âm";
      }
    }
    leftover = leftover.replace(re, " ");
  }

  const cleanedLeftover = leftover
    .replace(/[|;,()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const extraNote = [explicitNote, cleanedLeftover]
    .filter(Boolean)
    .join(" - ")
    .trim();
  return { map: res, extraNote };
}

export function parseMultiResult(
  maTest: string,
  ketQua: string
): Record<string, "Âm" | "Dương" | ""> {
  return parseMultiResultWithNote(maTest, ketQua).map;
}

export function formatMultiResult(
  maTest: string,
  map: Record<string, "Âm" | "Dương" | "">,
  extraNote = ""
): string {
  const subs = getSubTests(maTest);
  if (!subs) return "";
  const base = subs.map((k) => `${k}: ${map[k] || "?"}`).join(" | ");
  const note = String(extraNote || "").trim();
  return note ? `${base} | Ghi chú: ${note}` : base;
}

export function validateAndNormalizeMulti(
  maTest: string,
  rawKetQua: string
): {
  ok: boolean;
  normalized: string;
  error: string;
} {
  const raw = String(rawKetQua || "").trim();
  if (!raw)
    return {
      ok: false,
      normalized: "",
      error: "Vui lòng nhập Kết quả xét nghiệm!",
    };

  const subs = getSubTests(maTest);
  if (!subs) return { ok: true, normalized: raw, error: "" };

  const rawLower = raw.toLowerCase();
  if (
    rawLower === "âm tính" ||
    rawLower === "am tinh" ||
    rawLower === "âm" ||
    rawLower === "am"
  ) {
    const allNeg: Record<string, "Âm" | "Dương" | ""> = {};
    subs.forEach((k) => {
      allNeg[k] = "Âm";
    });
    return {
      ok: true,
      normalized: formatMultiResult(maTest, allNeg),
      error: "",
    };
  }

  for (const key of subs) {
    const re = buildSubKeyRegex(key);
    let m: RegExpExecArray | null;
    let seen = "";
    while ((m = re.exec(raw)) !== null) {
      const vRaw = String(m[1] || "")
        .trim()
        .toLowerCase();
      if (vRaw === "?") continue;
      const norm =
        vRaw.startsWith("dương") ||
        vRaw.startsWith("duong") ||
        vRaw === "+" ||
        vRaw === "d"
          ? "Dương"
          : "Âm";
      if (seen && seen !== norm) {
        return {
          ok: false,
          normalized: raw,
          error: `Chân "${key}" bị nhập lặp lại với 2 giá trị mâu thuẫn!`,
        };
      }
      seen = norm;
    }
  }

  const { map, extraNote } = parseMultiResultWithNote(maTest, raw);
  const missing = subs.filter((k) => !map[k]);
  if (missing.length > 0) {
    return {
      ok: false,
      normalized: raw,
      error: `Xét nghiệm [${maTest}] chưa chọn đủ kết quả cho chân: ${missing.join(
        ", "
      )}`,
    };
  }
  return {
    ok: true,
    normalized: formatMultiResult(maTest, map, extraNote),
    error: "",
  };
}

/**
 * Hiển thị thông minh kết quả đa chân (dùng cho cả Nhật ký BM.04 và Bản in A4).
 * - Đối với WIDAL (8 chân): Nếu cả 8 chân đều Âm -> hiện "Âm tính". Nếu có chân Dương -> chỉ hiện đúng các chân Dương: "Typhi O (D), AO (D)".
 * - Đối với DRUG4 / DENGUE / KSTSR: Hiện "MOP (D)", "AMP (Â)" kèm ghi chú lâm sàng bên dưới nếu có.
 */
export function formatShortMultiSummary(
  maTest: string,
  ketQua: string
): string {
  const code = String(maTest || "")
    .trim()
    .toUpperCase();
  const subs = getSubTests(code);
  if (!subs || !ketQua) return ketQua || "";
  const { map, extraNote } = parseMultiResultWithNote(code, ketQua);
  const hasAny = subs.some((k) => map[k] !== "");
  if (!hasAny) return ketQua;

  if (code === "WIDAL") {
    const posList = subs.filter((k) => map[k] === "Dương");
    const mainText =
      posList.length === 0
        ? "Âm tính"
        : posList.map((k) => `${k} (D)`).join(", ");
    return extraNote ? `${mainText} (${extraNote})` : mainText;
  }

  const parts = subs
    .map((k) => {
      const label =
        k === "Codein"
          ? "COD"
          : k === "Heroin"
          ? "HER"
          : k === "P. falciparum"
          ? "P.falci"
          : k === "P. vivax"
          ? "P.vivax"
          : k;
      const v = map[k];
      const shortV = v === "Dương" ? "D" : v === "Âm" ? "Â" : "?";
      return `${label} (${shortV})`;
    })
    .join(" | ");
  return extraNote ? `${parts} | Ghi chú: ${extraNote}` : parts;
}

/* ==================== LƯU TRỮ BỀN VỮNG & TÍNH TỒN KHO BM.13 ==================== */

function loadJSON<T>(
  key: string,
  fallback: T,
  validator?: (v: any) => boolean
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(
  key: string,
  initialValue: T,
  validator?: (v: any) => boolean
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() =>
    loadJSON(key, initialValue, validator)
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (!validator || validator(parsed)) setState(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, validator]);

  return [state, setState];
}

function safeParseObj(str: string | undefined): Record<string, any> {
  if (!str) return {};
  try {
    const o = JSON.parse(str);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function clampInt(v: any, min = 0, max = 99999): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

/**
 * Tính toán tồn kho BM.13 chính xác tuyệt đối cho một ngày:
 * - Tự động loại bỏ các test miễn trừ tồn kho (WIDAL).
 * - Ép kiểu Number(caTruc) và chuẩn hóa maTest viết hoa để không bao giờ rớt lượt Sử dụng ở Ca 2, Ca 3, Ca 4.
 */
export function computeDaySingle(
  targetDate: string,
  liveTests: TestConfig[],
  bm04Logs: QueueItem[],
  pendingQueue: QueueItem[],
  bm13Raw: RawBM13Row[],
  dirtyOverrides: Record<string, any>,
  prevDayTonCuoi?: Record<string, number> | null
): DayComputed {
  const stockLiveTests = liveTests.filter(
    (t) => isStockTestCode(t.code) && !t.noStock
  );

  const usage: Record<ShiftNumber, Record<string, number>> = {
    1: {},
    2: {},
    3: {},
    4: {},
  };
  const addUsage = (item: QueueItem | null | undefined) => {
    if (!item || String(item.ngayBC || "").trim() !== targetDate) return;
    const caNum = Number(item.caTruc);
    const ca: ShiftNumber =
      caNum === 1 || caNum === 2 || caNum === 3 || caNum === 4 ? caNum : 1;
    const code = String(item.maTest || "")
      .trim()
      .toUpperCase();
    if (!isStockTestCode(code)) return;
    usage[ca][code] = (usage[ca][code] || 0) + 1;
  };
  bm04Logs.forEach(addUsage);
  pendingQueue.forEach(addUsage);

  let dayRow: RawBM13Row | undefined;
  const shiftRows: Partial<Record<ShiftNumber, RawBM13Row>> = {};
  let fallbackPrevTonCuoi: Record<string, number> | null =
    prevDayTonCuoi || null;
  let fallbackPrevDate = "";

  for (const r of bm13Raw) {
    if (!r) continue;
    const rDate = String(r.ngayBC || "").trim();
    const rCa = Number(r.caTruc);
    if (rDate === targetDate) {
      if (rCa === 0) dayRow = r;
      else if (rCa === 1 || rCa === 2 || rCa === 3 || rCa === 4)
        shiftRows[rCa] = r;
    } else if (!prevDayTonCuoi && rDate && rDate < targetDate && rCa === 0) {
      if (rDate >= fallbackPrevDate) {
        const pj = safeParseObj(r.dataJson);
        if (pj.tonCuoi && typeof pj.tonCuoi === "object") {
          fallbackPrevDate = rDate;
          fallbackPrevTonCuoi = pj.tonCuoi;
        }
      }
    }
  }

  const dayJson = dayRow ? safeParseObj(dayRow.dataJson) : {};
  const dirtyDay = dirtyOverrides[`${targetDate}_DAY`] || {};
  const manualTonDau: Record<string, number> = {
    ...(dayJson.tonDau || {}),
    ...(dirtyDay.tonDau || {}),
  };
  const ghiChu =
    dirtyDay.ghiChu !== undefined
      ? String(dirtyDay.ghiChu)
      : dayRow?.ghiChu || "";

  const isPastDay = targetDate < businessDate();
  const snapObj =
    dayJson.testMetaSnapshot && typeof dayJson.testMetaSnapshot === "object"
      ? dayJson.testMetaSnapshot
      : null;

  let effectiveTests: TestConfig[] = [];
  if (isPastDay && snapObj && Object.keys(snapObj).length > 0) {
    const seen: Record<string, boolean> = {};
    stockLiveTests.forEach((t) => {
      if (snapObj[t.code]) {
        seen[t.code] = true;
        effectiveTests.push({
          code: t.code,
          name: snapObj[t.code].name || t.name,
          unit: snapObj[t.code].unit || t.unit,
          quota: Number(snapObj[t.code].quota ?? t.quota),
        });
      }
    });
    Object.keys(snapObj).forEach((code) => {
      if (!seen[code] && isStockTestCode(code)) {
        effectiveTests.push({
          code,
          name: snapObj[code].name || code,
          unit: snapObj[code].unit || "TEST",
          quota: Number(snapObj[code].quota || 0),
        });
      }
    });
  } else {
    effectiveTests = [...stockLiveTests];
  }

  const tonDau: Record<string, number> = {};
  const shifts: Record<ShiftNumber, Record<string, ShiftCellData>> = {
    1: {},
    2: {},
    3: {},
    4: {},
  };
  const tonCuoiNgay: Record<string, number> = {};

  const shiftJsonByCa: Record<ShiftNumber, Record<string, any>> = {
    1: {},
    2: {},
    3: {},
    4: {},
  };
  ([1, 2, 3, 4] as ShiftNumber[]).forEach((ca) => {
    const rawJson = shiftRows[ca] ? safeParseObj(shiftRows[ca]!.dataJson) : {};
    const dirtyCa = dirtyOverrides[`${targetDate}_CA${ca}`]?.cells || {};
    const merged: Record<string, any> = { ...rawJson };
    Object.keys(dirtyCa).forEach((code) => {
      merged[code] = { ...(merged[code] || {}), ...dirtyCa[code] };
    });
    shiftJsonByCa[ca] = merged;
  });

  effectiveTests.forEach((t) => {
    const code = t.code;
    const base =
      manualTonDau[code] !== undefined
        ? Number(manualTonDau[code])
        : fallbackPrevTonCuoi && fallbackPrevTonCuoi[code] !== undefined
        ? Number(fallbackPrevTonCuoi[code])
        : Number(t.quota || 0);
    tonDau[code] = base;

    let running = base;
    ([1, 2, 3, 4] as ShiftNumber[]).forEach((ca) => {
      const cellRaw = shiftJsonByCa[ca][code] || {};
      const boiHoan = clampInt(cellRaw.boiHoan, 0, 99999);
      const suDungQC = clampInt(cellRaw.suDungQC, 0, 99999);
      const suDung = Number(usage[ca][code] || 0);
      const tonCuoi = running + boiHoan - (suDungQC + suDung);
      shifts[ca][code] = { boiHoan, suDungQC, suDung, tonCuoi };
      running = tonCuoi;
    });
    tonCuoiNgay[code] = running;
  });

  const meta: Record<ShiftNumber, ShiftMeta> = {
    1: { gioGiao: "", nguoiGiao: "", nguoiNhan: "", trangThai: "OPEN" },
    2: { gioGiao: "", nguoiGiao: "", nguoiNhan: "", trangThai: "OPEN" },
    3: { gioGiao: "", nguoiGiao: "", nguoiNhan: "", trangThai: "OPEN" },
    4: { gioGiao: "", nguoiGiao: "", nguoiNhan: "", trangThai: "OPEN" },
  };
  ([1, 2, 3, 4] as ShiftNumber[]).forEach((ca) => {
    const r = shiftRows[ca];
    const dirtyMeta = dirtyOverrides[`${targetDate}_CA${ca}`]?.meta;
    const rawStatus = (dirtyMeta?.trangThai ??
      r?.trangThai ??
      "OPEN") as ShiftStatus;
    meta[ca] = {
      gioGiao: dirtyMeta?.gioGiao ?? r?.gioGiao ?? "",
      nguoiGiao: dirtyMeta?.nguoiGiao ?? r?.nguoiGiao ?? "",
      nguoiNhan: dirtyMeta?.nguoiNhan ?? r?.nguoiNhan ?? "",
      trangThai:
        rawStatus === "PENDING_RECEIVE" || rawStatus === "HOAN_THANH"
          ? rawStatus
          : "OPEN",
    };
  });

  return {
    ngayBC: targetDate,
    ghiChu,
    tests: effectiveTests,
    tonDau,
    manualTonDau,
    shifts,
    meta,
    tonCuoiNgay,
  };
}

/* ============================ GIAO THỨC API (RPC) ============================ */

export interface RpcResult {
  net: boolean;
  body: Record<string, any>;
}

export async function rpcCall(
  apiUrl: string,
  action: string,
  payload: Record<string, any> = {},
  token?: string,
  timeoutMs = 22000
): Promise<RpcResult> {
  const url = String(apiUrl || "").trim();
  if (!url || url.includes("THAY_BANG_URL_DEPLOY")) {
    return {
      net: false,
      body: {
        status: "error",
        code: "NO_URL",
        message: "Chưa cấu hình URL API Google Apps Script.",
      },
    };
  }
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token, ...payload }),
      signal: ctrl.signal,
      redirect: "follow",
    });
    window.clearTimeout(timer);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json && typeof json === "object") {
        if (typeof json.serverTimeMs === "number")
          updateServerOffset(json.serverTimeMs);
        return { net: true, body: json };
      }
      return {
        net: false,
        body: {
          status: "error",
          code: "BAD_JSON",
          message: "Phản hồi máy chủ không đúng định dạng.",
        },
      };
    } catch {
      return {
        net: false,
        body: {
          status: "error",
          code: "PARSE_ERR",
          message: "Không đọc được JSON từ Google Apps Script.",
        },
      };
    }
  } catch (err: any) {
    window.clearTimeout(timer);
    return {
      net: false,
      body: {
        status: "error",
        code: "NETWORK",
        message:
          err?.name === "AbortError"
            ? "Quá thời gian chờ phản hồi máy chủ."
            : "Mất kết nối mạng.",
      },
    };
  }
}

export async function testApiEndpoint(
  apiUrl: string
): Promise<{ ok: boolean; message: string }> {
  const url = String(apiUrl || "").trim();
  if (
    !url.startsWith("https://script.google.com/macros/s/") ||
    !url.endsWith("/exec")
  ) {
    return {
      ok: false,
      message:
        "URL phải bắt đầu bằng https://script.google.com/macros/s/... và kết thúc bằng /exec",
    };
  }
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
    });
    window.clearTimeout(timer);
    const txt = await res.text();
    const json = JSON.parse(txt);
    if (json && json.status === "success") {
      if (typeof json.serverTimeMs === "number")
        updateServerOffset(json.serverTimeMs);
      return {
        ok: true,
        message: "Kết nối máy chủ Google Apps Script thành công!",
      };
    }
    return {
      ok: false,
      message: "Endpoint phản hồi nhưng không đúng chuẩn API Khoa Xét Nghiệm.",
    };
  } catch {
    return {
      ok: false,
      message:
        "Không thể kết nối tới URL này (Kiểm tra quyền Deploy: Anyone / Bất kỳ ai).",
    };
  }
}

/* ==================== ERROR BOUNDARY CHỐNG TRẮNG MÀN HÌNH ==================== */

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return {
      hasError: true,
      errorMsg: String(error?.message || error || "Lỗi không xác định"),
    };
  }
  handleSafeReset = () => {
    try {
      // Bảo toàn Outbox và Auth, chỉ làm sạch bộ nhớ hiển thị tạm nếu bị hỏng
      localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    } catch {}
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertOctagon className="w-8 h-8 shrink-0" />
              <h2 className="text-lg font-black uppercase">
                Hệ thống tự bảo vệ an toàn
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Phát hiện dữ liệu bộ nhớ đệm không đồng nhất:{" "}
              <span className="text-rose-300 font-mono">
                {this.state.errorMsg}
              </span>
              . Toàn bộ hàng đợi đồng bộ của bạn vẫn được giữ an toàn.
            </p>
            <button
              onClick={this.handleSafeReset}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm uppercase tracking-wider transition"
            >
              Tải lại giao diện an toàn
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============= COMPONENT CHỌN KẾT QUẢ ĐA CHÂN DÙNG CHUNG (CỘT 2 & MODAL SỬA) ============= */

interface MultiPanelResultInputProps {
  maTest: string;
  value: string;
  onChange: (nextVal: string) => void;
  onEnterSubmit?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export function MultiPanelResultInput({
  maTest,
  value,
  onChange,
  onEnterSubmit,
  compact = false,
  disabled = false,
}: MultiPanelResultInputProps) {
  const code = String(maTest || "")
    .trim()
    .toUpperCase();
  const subs = getSubTests(code) || [];

  // Sử dụng state cục bộ để đảm bảo nút bấm luôn nhạy và lên màu ngay lập tức
  const [localMap, setLocalMap] = useState<Record<string, "Âm" | "Dương" | "">>(
    {}
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    const { map, extraNote } = parseMultiResultWithNote(code, value);
    setLocalMap(map);
    setNote(extraNote);
  }, [code, value]);

  const updateValue = (
    newMap: Record<string, "Âm" | "Dương" | "">,
    newNote: string
  ) => {
    if (disabled) return;
    onChange(formatMultiResult(code, newMap, newNote));
  };

  const handleToggleSub = (subKey: string, targetVal: "Âm" | "Dương") => {
    if (disabled) return;
    const nextMap = { ...localMap, [subKey]: targetVal };
    setLocalMap(nextMap);
    updateValue(nextMap, note);
  };

  const handleAllNegative = () => {
    if (disabled) return;
    const nextMap: Record<string, "Âm" | "Dương" | ""> = {};
    subs.forEach((k) => {
      nextMap[k] = "Âm";
    });
    setLocalMap(nextMap);
    updateValue(nextMap, note);
  };

  const gridClass =
    subs.length === 8
      ? "grid-cols-2 sm:grid-cols-4"
      : subs.length === 5
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Chọn từng chân:
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={handleAllNegative}
          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 text-[11px] font-black transition"
        >
          ⚡ Tất cả Âm
        </button>
      </div>

      <div className={`grid ${gridClass} gap-1.5`}>
        {subs.map((subKey) => {
          const curVal = localMap[subKey];
          const isNeg = curVal === "Âm";
          const isPos = curVal === "Dương";
          return (
            <div
              key={subKey}
              className="rounded-xl border p-1.5 bg-slate-50 border-slate-200"
            >
              <div className="text-[11px] font-black text-slate-700 truncate mb-1 text-center">
                {subKey}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleSub(subKey, "Âm")}
                  className={`py-1 rounded-lg text-[11px] font-black transition disabled:opacity-50 ${
                    isNeg
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-blue-50"
                  }`}
                >
                  Âm
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleSub(subKey, "Dương")}
                  className={`py-1 rounded-lg text-[11px] font-black transition disabled:opacity-50 ${
                    isPos
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-red-50"
                  }`}
                >
                  Dương
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnterSubmit && !disabled) {
            e.preventDefault();
            onEnterSubmit();
          }
        }}
        placeholder="Ghi chú hoặc nhập kết quả thủ công..."
        className={`w-full rounded-xl border border-slate-200 bg-white disabled:bg-slate-100 px-3 ${
          compact ? "py-1.5 text-xs" : "py-2 text-xs"
        } font-semibold text-slate-800`}
      />
    </div>
  );
}

/* ==================== MÀN HÌNH ĐĂNG NHẬP & MODAL XÁC THỰC ==================== */

interface LoginScreenProps {
  apiUrl: string;
  onSuccess: (auth: AuthState, initialSession?: ActiveSession | null) => void;
  onChangeApiUrl: (nextUrl: string) => void;
}

export function LoginScreen({
  apiUrl,
  onSuccess,
  onChangeApiUrl,
}: LoginScreenProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [testingUrl, setTestingUrl] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!id.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ ID và Mật khẩu.");
      return;
    }
    setLoading(true);
    const res = await rpcCall(apiUrl, "login", {
      id: id.trim(),
      password: password.trim(),
    });
    setLoading(false);
    if (!res.net) {
      setError(
        res.body.message ||
          "Không thể kết nối máy chủ. Kiểm tra mạng hoặc cấu hình URL API."
      );
      return;
    }
    if (res.body.status !== "success") {
      setError(res.body.message || "Đăng nhập thất bại.");
      return;
    }
    onSuccess(
      {
        token: res.body.token,
        user: res.body.user,
        mustChange: Boolean(res.body.mustChange),
      },
      res.body.activeSession || null
    );
  };

  const handleSaveEndpoint = async () => {
    setTestingUrl(true);
    setError("");
    const check = await testApiEndpoint(tempUrl);
    setTestingUrl(false);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    onChangeApiUrl(tempUrl.trim());
    setShowUrlConfig(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col justify-between p-4">
      <div />
      <div className="max-w-md w-full mx-auto bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-6 text-center border-b border-amber-400/30">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wider text-white">
            BỆNH VIỆN ĐA KHOA CÀ MAU
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300 mt-0.5">
            KHOA XÉT NGHIỆM • QUẢN LÝ TEST NHANH MIỄN DỊCH
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
              ID Nhân viên (hoặc Họ tên)
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Ví dụ: thlong, lhthinh..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-600/25 transition"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">
              BM.04 & BM.13 • ISO 15189
            </span>
            <button
              type="button"
              onClick={() => {
                setTempUrl(apiUrl);
                setShowUrlConfig(!showUrlConfig);
              }}
              className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" /> Cấu hình URL API
            </button>
          </div>

          {showUrlConfig && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-600">
                Google Apps Script Web App URL (/exec)
              </label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-700"
              />
              <button
                type="button"
                disabled={testingUrl}
                onClick={handleSaveEndpoint}
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                {testingUrl
                  ? "Đang kiểm tra kết nối..."
                  : "Kiểm tra & Lưu kết nối"}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="text-center py-3">
        <span className="text-[11px] font-black tracking-[0.22em] uppercase bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
          AN INTELLECTUAL PRODUCT OF HANDSOME LONG
        </span>
      </div>
    </div>
  );
}

/* ==================== MODAL ĐỔI MẬT KHẨU & XÁC THỰC NGƯỜI KIỂM TRA ==================== */

interface ChangePasswordModalProps {
  open: boolean;
  forced: boolean;
  apiUrl: string;
  token: string;
  userName: string;
  onClose: () => void;
  onChanged: (newToken: string) => void;
  onLogout: () => void;
}

export function ChangePasswordModal({
  open,
  forced,
  apiUrl,
  token,
  userName,
  onClose,
  onChanged,
  onLogout,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (newPassword.trim().length < 6) {
      setErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword.trim() !== confirmPw.trim()) {
      setErr("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    const res = await rpcCall(
      apiUrl,
      "changePassword",
      {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      },
      token
    );
    setLoading(false);
    if (!res.net || res.body.status !== "success") {
      setErr(res.body.message || "Không thể đổi mật khẩu.");
      return;
    }
    setOldPassword("");
    setNewPassword("");
    setConfirmPw("");
    onChanged(res.body.token);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                {forced
                  ? "Đổi mật khẩu mặc định bắt buộc"
                  : "Đổi mật khẩu cá nhân"}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Nhân viên: {userName}
              </p>
            </div>
          </div>
          {!forced && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {forced && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            Tài khoản của bạn đang dùng mật khẩu mặc định. Để bảo vệ dữ liệu
            bệnh nhân, vui lòng thiết lập mật khẩu riêng trước khi làm việc.
          </div>
        )}

        {err && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Nhập lại mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {forced ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider"
            >
              {loading ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CheckerVerifyModalProps {
  open: boolean;
  apiUrl: string;
  token: string;
  mainUser: UserInfo;
  onClose: () => void;
  onVerified: (checker: CheckerState) => void;
}

export function CheckerVerifyModal({
  open,
  apiUrl,
  token,
  mainUser,
  onClose,
  onVerified,
}: CheckerVerifyModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!id.trim() || !password.trim()) {
      setErr("Vui lòng nhập ID và Mật khẩu của Người kiểm tra.");
      return;
    }
    setLoading(true);
    const res = await rpcCall(
      apiUrl,
      "verifyChecker",
      { id: id.trim(), password: password.trim() },
      token
    );
    setLoading(false);
    if (!res.net || res.body.status !== "success") {
      setErr(res.body.message || "Xác thực Người kiểm tra thất bại.");
      return;
    }
    setId("");
    setPassword("");
    onVerified({
      id: res.body.checker.id,
      name: res.body.checker.name,
      proof: res.body.checkerProof,
      verifiedForUserId: mainUser.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Xác thực Người kiểm tra
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Người thực hiện: {mainUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ID Người kiểm tra
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Nhập ID đồng nghiệp kiểm tra..."
              autoFocus
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Mật khẩu Người kiểm tra
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
            >
              {loading ? "Đang ký..." : "Xác nhận ký duyệt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==================== MODAL SỬA KẾT QUẢ ĐÃ LƯU (NÚT CÂY BÚT) ==================== */

interface EditBM04ModalProps {
  item: QueueItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    nextDocChung: DocChungValue,
    nextKetQua: string
  ) => Promise<void>;
}

export function EditBM04Modal({ item, onClose, onSave }: EditBM04ModalProps) {
  const [docChung, setDocChung] = useState<DocChungValue>("Dương tính");
  const [ketQua, setKetQua] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setDocChung(item.docChung === "Âm Tính" ? "Âm Tính" : "Dương tính");
      setKetQua(item.ketQua || "");
      setErr("");
    }
  }, [item]);

  if (!item) return null;

  const isMulti = Boolean(getSubTests(item.maTest));
  const theme = SHIFT_THEME[item.caTruc] || SHIFT_THEME[1];

  const handleConfirm = async () => {
    setErr("");
    const check = validateAndNormalizeMulti(item.maTest, ketQua);
    if (!check.ok) {
      setErr(check.error);
      return;
    }
    setSaving(true);
    try {
      await onSave(item.id, docChung, check.normalized);
      onClose();
    } catch (e: any) {
      setErr(String(e?.message || "Lỗi khi cập nhật kết quả."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${theme.badgeBg} ${theme.badgeText}`}
              >
                Ca {item.caTruc}
              </span>
              <span className="text-xs font-black text-amber-700 uppercase">
                [{item.tenXetNghiem}]
              </span>
              <span className="text-sm font-black text-slate-900 uppercase">
                {item.hoTenBN}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Barcode:{" "}
              <span className="font-bold text-slate-700">{item.barcode}</span> •
              Giờ trả KQ lần đầu (giữ nguyên):{" "}
              <span className="font-bold text-sky-700">
                {item.thoiGianDocKQ}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] font-semibold text-amber-900">
          Lưu ý: Thao tác cập nhật kết quả sẽ giữ nguyên thời gian trả kết quả
          lần đầu ({item.thoiGianDocKQ}), gắn nhãn{" "}
          <span className="font-black">(Đã sửa)</span> trên màn hình (không in
          ra giấy A4) và lưu vết vào Sổ kiểm toán AUDIT_LOGS.
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
            <span className="text-xs font-black uppercase text-indigo-900">
              Đọc chứng (Control):
            </span>
            <div className="flex items-center gap-1.5">
              {(["Dương tính", "Âm Tính"] as DocChungValue[]).map((val) => {
                const active = docChung === val;
                const activeCls =
                  val === "Dương tính"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200"
                    : "bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200";
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDocChung(val)}
                    className={`px-3.5 py-1 rounded-lg text-xs font-black border transition ${
                      active
                        ? activeCls
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {val === "Dương tính" ? "● Dương tính" : "○ Âm tính"}
                  </button>
                );
              })}
            </div>
          </div>

          {isMulti ? (
            <MultiPanelResultInput
              maTest={item.maTest}
              value={ketQua}
              onChange={setKetQua}
              onEnterSubmit={handleConfirm}
            />
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-600">
                Kết quả xét nghiệm:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKetQua("Âm tính")}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase border transition ${
                    ketQua.trim().toLowerCase() === "âm tính"
                      ? "bg-sky-600 text-white border-sky-600 shadow-md"
                      : "bg-sky-50/60 text-sky-800 border-sky-200 hover:bg-sky-100"
                  }`}
                >
                  Âm tính
                </button>
                <button
                  type="button"
                  onClick={() => setKetQua("Dương tính")}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase border transition ${
                    ketQua.trim().toLowerCase() === "dương tính"
                      ? "bg-rose-600 text-white border-rose-600 shadow-md"
                      : "bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  Dương tính
                </button>
              </div>
              <input
                type="text"
                value={ketQua}
                onChange={(e) => setKetQua(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder="Hoặc gõ trực tiếp kết quả / ghi chú..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {saving ? "Đang cập nhật..." : "Lưu cập nhật kết quả"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== MODAL BỒI HOÀN NHANH & KIỂM TRA CHỐT CA ==================== */

interface BulkReplenishModalProps {
  open: boolean;
  shift: ShiftNumber;
  dateStr: string;
  computed: DayComputed;
  onClose: () => void;
  onApply: (map: Record<string, number>) => void;
}

export function BulkReplenishModal({
  open,
  shift,
  dateStr,
  computed,
  onClose,
  onApply,
}: BulkReplenishModalProps) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, number>>({});

  const stockTests = useMemo(
    () => computed.tests.filter((t) => isStockTestCode(t.code) && !t.noStock),
    [computed.tests]
  );

  useEffect(() => {
    if (open) {
      const init: Record<string, number> = {};
      stockTests.forEach((t) => {
        init[t.code] = computed.shifts[shift]?.[t.code]?.boiHoan || 0;
      });
      setValues(init);
      setSearch("");
    }
  }, [open, shift, stockTests, computed.shifts]);

  if (!open) return null;

  const handleAutoQuota = () => {
    const next: Record<string, number> = { ...values };
    stockTests.forEach((t) => {
      const cell = computed.shifts[shift]?.[t.code] || {
        boiHoan: 0,
        suDungQC: 0,
        suDung: 0,
        tonCuoi: 0,
      };
      const currentWithoutBh = cell.tonCuoi - cell.boiHoan;
      const need = Math.max(0, Number(t.quota || 0) - currentWithoutBh);
      next[t.code] = need;
    });
    setValues(next);
  };

  const handleClearAll = () => {
    const next: Record<string, number> = {};
    stockTests.forEach((t) => {
      next[t.code] = 0;
    });
    setValues(next);
  };

  const filtered = stockTests.filter(
    (t) =>
      t.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      t.code.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Bồi hoàn / Nhập thêm Kit — Ca {shift} (
              {formatDateDisplay(dateStr)})
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Nhập số lượng test nhận thêm từ kho chính trong Ca {shift} (Không
              áp dụng cho WIDAL).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh tên test (dữ liệu đã gõ vẫn giữ nguyên khi lọc)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoQuota}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Bù tự động theo cơ số
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
            >
              Đặt về 0
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {filtered.map((t) => {
            const cell = computed.shifts[shift]?.[t.code] || {
              boiHoan: 0,
              suDungQC: 0,
              suDung: 0,
              tonCuoi: 0,
            };
            const baseWithoutBh = cell.tonCuoi - cell.boiHoan;
            const newBh = clampInt(values[t.code] ?? 0, 0, 99999);
            const projectedEnd = baseWithoutBh + newBh;
            return (
              <div
                key={t.code}
                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50"
              >
                <div>
                  <div className="text-xs font-black text-slate-800">
                    {t.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Cơ số:{" "}
                    <span className="font-bold text-slate-700">{t.quota}</span>{" "}
                    • Tồn trước bù:{" "}
                    <span
                      className={
                        baseWithoutBh < 0
                          ? "font-black text-rose-600"
                          : "font-bold text-slate-700"
                      }
                    >
                      {baseWithoutBh}
                    </span>{" "}
                    → Tồn cuối sau bù:{" "}
                    <span className="font-black text-sky-700">
                      {projectedEnd}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700">+</span>
                  <input
                    type="number"
                    min={0}
                    value={values[t.code] ?? 0}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [t.code]: clampInt(e.target.value, 0, 99999),
                      }))
                    }
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-center text-xs font-black text-emerald-800"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(values);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
          >
            Áp dụng Bồi hoàn Ca {shift}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClosingReviewModalProps {
  open: boolean;
  shift: ShiftNumber;
  dateStr: string;
  computed: DayComputed;
  pendingCountOfShift: number;
  isAdmin: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirmCloseShift: () => void;
}

export function ClosingReviewModal({
  open,
  shift,
  dateStr,
  computed,
  pendingCountOfShift,
  isAdmin,
  loading,
  onClose,
  onConfirmCloseShift,
}: ClosingReviewModalProps) {
  if (!open) return null;

  const stockTests = computed.tests.filter(
    (t) => isStockTestCode(t.code) && !t.noStock
  );
  const blockedByPending = pendingCountOfShift > 0 && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-black text-slate-900 uppercase">
              KIỂM TRA LẠI TRƯỚC KHI CHỐT CA {shift} (
              {formatDateDisplay(dateStr)})
            </h3>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Sau khi chốt, số liệu Ca {shift} sẽ khóa lại (chỉ Admin sửa được) và
            tài khoản sẽ đăng xuất để ca sau nhận bàn giao.
          </p>
        </div>

        {pendingCountOfShift > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
            <span>
              ⚠️ Còn {pendingCountOfShift} xét nghiệm trong hàng đợi của Ca{" "}
              {shift} chưa đọc kết quả! Vui lòng hoàn tất đọc kết quả ở Tab 1
              trước khi chốt ca.
            </span>
          </div>
        )}

        <div className="my-4 flex-1 overflow-y-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-black sticky top-0">
              <tr>
                <th className="py-2.5 px-3 text-left">TEST</th>
                <th className="py-2.5 px-3 text-center">TỒN ĐẦU CA</th>
                <th className="py-2.5 px-3 text-center">BỒI HOÀN</th>
                <th className="py-2.5 px-3 text-center">QC/CALI</th>
                <th className="py-2.5 px-3 text-center">SỬ DỤNG</th>
                <th className="py-2.5 px-3 text-center">TỒN CUỐI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockTests.map((t) => {
                const prevEnd =
                  shift === 1
                    ? computed.tonDau[t.code] ?? 0
                    : computed.shifts[(shift - 1) as ShiftNumber]?.[t.code]
                        ?.tonCuoi ?? 0;
                const cell = computed.shifts[shift]?.[t.code] || {
                  boiHoan: 0,
                  suDungQC: 0,
                  suDung: 0,
                  tonCuoi: prevEnd,
                };
                return (
                  <tr key={t.code} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-black text-slate-800">
                      {t.name}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700">
                      {prevEnd}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">
                      {cell.boiHoan > 0 ? cell.boiHoan : "–"}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-purple-700">
                      {cell.suDungQC > 0 ? cell.suDungQC : "–"}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-rose-600">
                      {cell.suDung > 0 ? cell.suDung : "–"}
                    </td>
                    <td
                      className={`py-2 px-3 text-center font-black ${
                        cell.tonCuoi < 0 ? "text-rose-600" : "text-sky-700"
                      }`}
                    >
                      {cell.tonCuoi}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
          >
            ← Quay lại sửa số liệu
          </button>
          <button
            type="button"
            disabled={blockedByPending || loading}
            onClick={onConfirmCloseShift}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/25 transition"
          >
            {loading
              ? "Đang khóa sổ..."
              : `Xác nhận chốt Ca ${shift} & đăng xuất`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== BIỂU MẪU IN SỔ BM.04 (CHUẨN A4 NGANG) ==================== */

export function renderKetQuaBM04(r: QueueItem | null) {
  if (!r || !r.ketQua)
    return <div className="font-bold uppercase min-h-[16px]" />;
  const code = String(r.maTest || "")
    .trim()
    .toUpperCase();
  const subs = getSubTests(code);

  if (subs) {
    const { map: parsed, extraNote } = parseMultiResultWithNote(code, r.ketQua);
    const hasStructured = subs.some((k) => parsed[k] !== "");

    if (hasStructured) {
      // Quy tắc cho WIDAL (8 chân): Hiển thị lưới 4 cột x 2 dòng theo từng cặp O (dòng 1) và H (dòng 2)
      // Dòng 1: Typhi O | AO | BO | CO
      // Dòng 2: Typhi H | AH | BH | CH
      if (code === "WIDAL") {
        const widalOrder = [
          "Typhi O",
          "AO",
          "BO",
          "CO",
          "Typhi H",
          "AH",
          "BH",
          "CH",
        ];
        return (
          <div className="py-0.5 px-0.5 leading-none">
            <div className="grid grid-cols-4 gap-x-1 gap-y-0.5 text-[7.5px] text-left">
              {widalOrder.map((k) => {
                const val = parsed[k];
                const isPos = val === "Dương";
                const shortVal = isPos ? "D" : val === "Âm" ? "Â" : "-";
                return (
                  <span
                    key={k}
                    className={`whitespace-nowrap ${
                      isPos ? "font-black" : "font-semibold"
                    }`}
                  >
                    {k} ({shortVal})
                  </span>
                );
              })}
            </div>
            {extraNote && (
              <div className="text-[7.5px] italic font-semibold text-black leading-tight mt-0.5 text-center">
                ({extraNote})
              </div>
            )}
          </div>
        );
      }

      // Quy tắc cho DENGUE & KSTSR (2 chân)
      if (subs.length === 2) {
        return (
          <div className="py-0.5 px-0.5 leading-none">
            <div className="flex items-center justify-center gap-1 text-[8.5px]">
              {subs.map((k, idx) => {
                const label =
                  k === "P. falciparum"
                    ? "P.falci"
                    : k === "P. vivax"
                    ? "P.vivax"
                    : k;
                const val = parsed[k];
                const isPos = val === "Dương";
                const shortVal = isPos ? "D" : val === "Âm" ? "Â" : "-";
                return (
                  <React.Fragment key={k}>
                    {idx > 0 && (
                      <span className="text-black font-normal">|</span>
                    )}
                    <span className={isPos ? "font-black" : "font-semibold"}>
                      {label} ({shortVal})
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
            {extraNote && (
              <div className="text-[7.5px] italic font-semibold text-black leading-tight mt-0.5">
                ({extraNote})
              </div>
            )}
          </div>
        );
      }

      // Quy tắc cho DRUG4 (5 chân - lưới 3 cột gọn gàng: MOP (D) | AMP (Â) | THC (Â)...)
      return (
        <div className="py-0.5 px-0.5 leading-none">
          <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 text-[8px] text-left">
            {subs.map((k) => {
              const label = k === "Codein" ? "COD" : k === "Heroin" ? "HER" : k;
              const val = parsed[k];
              const isPos = val === "Dương";
              const shortVal = isPos ? "D" : val === "Âm" ? "Â" : "-";
              return (
                <span
                  key={k}
                  className={isPos ? "font-black" : "font-semibold"}
                >
                  {label} ({shortVal})
                </span>
              );
            })}
          </div>
          {extraNote && (
            <div className="text-[7.5px] italic font-semibold text-black leading-tight mt-0.5 text-center">
              ({extraNote})
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="font-bold uppercase min-h-[16px] truncate px-0.5">
      {r.ketQua}
    </div>
  );
}

interface PrintBm04Props {
  selectedDate: string;
  logs: QueueItem[];
  testsConfig: TestConfig[];
}

export function PrintBm04({ selectedDate, logs, testsConfig }: PrintBm04Props) {
  const [filterTest, setFilterTest] = useState<string>("ALL");
  const [filterShift, setFilterShift] = useState<string>("ALL");

  const dayLogs = useMemo(() => {
    const list = logs.filter((l) => {
      if (String(l.ngayBC || "").trim() !== selectedDate) return false;
      if (filterTest !== "ALL" && l.maTest !== filterTest) return false;
      if (filterShift !== "ALL" && Number(l.caTruc) !== Number(filterShift))
        return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(a.timestamp || "").localeCompare(String(b.timestamp || ""));
    });
  }, [logs, selectedDate, filterTest, filterShift]);

  // THUẬT TOÁN TỰ ĐỘNG CHIA TRANG (CHUNKING)
  const ROWS_PER_PAGE = 18;
  const totalPages = Math.max(1, Math.ceil(dayLogs.length / ROWS_PER_PAGE));

  const pages = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalPages; i++) {
      const chunk: (QueueItem | null)[] = dayLogs.slice(
        i * ROWS_PER_PAGE,
        (i + 1) * ROWS_PER_PAGE
      );
      while (chunk.length < ROWS_PER_PAGE) {
        chunk.push(null); // Bơm dòng trống cho đủ 18 dòng
      }
      result.push(chunk);
    }
    return result;
  }, [dayLogs, totalPages]);

  return (
    <div className="space-y-4">
      <div className="no-print bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-xs font-black uppercase text-slate-500 block">
              Biểu mẫu in BM.04
            </span>
            <span className="text-sm font-black text-slate-900">
              Ngày báo cáo: {formatDateDisplay(selectedDate)} ({dayLogs.length}{" "}
              kết quả)
            </span>
          </div>

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="ALL">Tất cả các Ca (Ca 1 → Ca 4)</option>
            <option value="1">Chỉ in Ca 1 (07h00 - 11h00)</option>
            <option value="2">Chỉ in Ca 2 (11h00 - 13h30)</option>
            <option value="3">Chỉ in Ca 3 (13h30 - 17h00)</option>
            <option value="4">Chỉ in Ca 4 (17h00 - 07h00)</option>
          </select>

          <select
            value={filterTest}
            onChange={(e) => setFilterTest(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="ALL">Tất cả loại Xét nghiệm</option>
            {testsConfig.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
        >
          <Printer className="w-4 h-4" /> In Sổ BM.04 (Khổ A4 Ngang)
        </button>
      </div>

      {/* LẶP QUA TỪNG TRANG VÀ IN RA (Áp dụng pageBreakAfter để ngắt trang A4) */}
      {pages.map((pageRows, pageIndex) => (
        <div
          key={pageIndex}
          className="print-sheet bg-white px-2 py-4 text-black"
          style={{
            pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
          }}
        >
          <div className="flex items-end justify-between mb-4 border-b-2 border-black pb-2">
            <div className="text-sm font-bold">
              Sổ lưu kết quả xét nghiệm thực hiện thủ công
            </div>
            <div className="text-sm font-bold">BM.04.XN.QTQL.37</div>
          </div>

          <table className="w-full border-collapse border border-black text-[10px] text-center">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th rowSpan={2} className="border border-black px-1 py-1 w-8">
                  STT
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-28"
                >
                  TÊN XÉT NGHIỆM
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-1 text-left"
                >
                  HỌ VÀ TÊN BỆNH NHÂN
                </th>
                <th colSpan={2} className="border border-black px-1 py-1">
                  NĂM SINH
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-24"
                >
                  BARCODE
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 w-20">
                  ĐỌC CHỨNG
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-48"
                >
                  KẾT QUẢ
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-28"
                >
                  THỜI GIAN ĐỌC KQ
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-32"
                >
                  NGƯỜI THỰC HIỆN
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-32"
                >
                  NGƯỜI KIỂM TRA
                </th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black px-1 py-0.5 w-12">Nam</th>
                <th className="border border-black px-1 py-0.5 w-12">Nữ</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr
                  key={r ? r.id : `empty_${pageIndex}_${idx}`}
                  className="h-6"
                >
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    {r ? pageIndex * ROWS_PER_PAGE + idx + 1 : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-bold uppercase truncate">
                    {r ? r.tenXetNghiem : ""}
                  </td>
                  <td className="border border-black px-2 py-0.5 text-left font-bold uppercase">
                    {r ? r.hoTenBN : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    {r ? r.namSinhNam : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    {r ? r.namSinhNu : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-bold">
                    {r ? r.barcode : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 font-semibold">
                    {r ? r.docChung : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5">
                    {renderKetQuaBM04(r)}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold">
                    {r ? r.thoiGianDocKQ : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold truncate">
                    {r ? r.nguoiThucHien : ""}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold truncate">
                    {r ? r.nguoiKiemTra : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 border-t border-black pt-2 text-[11px] italic">
            <div>Ngày ban hành: 01/07/2025</div>
            <div>Lần ban hành: 02</div>
            <div className="font-semibold text-[12px]">
              Trang {pageIndex + 1}/{totalPages}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== BIỂU MẪU IN SỔ BM.13 (CHUẨN A4 NGANG) ==================== */

interface PrintBm13Props {
  selectedDate: string;
  computed: DayComputed;
}

export function PrintBm13({ selectedDate, computed }: PrintBm13Props) {
  const stockTests = useMemo(
    () => computed.tests.filter((t) => isStockTestCode(t.code) && !t.noStock),
    [computed.tests]
  );

  const shiftLabels: Record<ShiftNumber, string> = {
    1: "Lần 1: 7h00 - 11h00",
    2: "Lần 2: 11h00 - 13h30",
    3: "Lần 3: 13h30 - 17h00",
    4: "Lần 4: 17h00 - 7h00",
  };

  return (
    <div className="space-y-4">
      <div className="no-print bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase text-slate-500 block">
            Biểu mẫu in BM.13
          </span>
          <span className="text-sm font-black text-slate-900">
            Sổ Bàn Giao Test Nhanh Ngày: {formatDateDisplay(selectedDate)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
        >
          <Printer className="w-4 h-4" /> In Sổ BM.13 (Khổ A4 Ngang)
        </button>
      </div>

      <div
        className="print-sheet bg-white px-2 py-4 text-black"
        style={{ pageBreakInside: "avoid" }}
      >
        {/* HEADER BM.13 */}
        <div className="flex items-end justify-between mb-2">
          <div className="text-sm font-bold">
            Biên bản bàn giao hóa chất hằng ngày
          </div>
          <div className="text-sm font-bold">BM.13.XN.QTQL.23</div>
        </div>

        <table className="w-full border-collapse border border-black text-[9px] text-center">
          <thead>
            <tr>
              <th
                colSpan={3 + stockTests.length + 3}
                className="border border-black py-2 text-base font-bold uppercase"
              >
                BIÊN BẢN BÀN GIAO HÓA CHẤT HẰNG NGÀY
              </th>
            </tr>
            <tr>
              <th
                colSpan={3 + stockTests.length}
                className="border border-black py-1 text-[13px] font-bold uppercase text-center"
              >
                PHÒNG MIỄN DỊCH
              </th>
              <th
                colSpan={3}
                className="border border-black py-1 text-[11px] font-bold text-left px-2"
              >
                NGÀY: {formatDateDisplay(selectedDate)}
              </th>
            </tr>

            <tr className="bg-slate-100 font-bold">
              <th className="border border-black px-1 py-1 w-28 text-left">
                DANH MỤC
              </th>
              <th className="border border-black px-1 py-1 w-10">ĐVT</th>
              <th className="border border-black px-1 py-1 w-10">CƠ SỐ</th>
              {stockTests.map((t) => (
                <th
                  key={t.code}
                  className="border border-black px-1 py-1 min-w-[38px]"
                >
                  <div className="font-black leading-tight">{t.name}</div>
                </th>
              ))}
              <th className="border border-black px-1 py-1 w-20">GIỜ GIAO</th>
              <th className="border border-black px-1 py-1 w-28">NGƯỜI GIAO</th>
              <th className="border border-black px-1 py-1 w-28">NGƯỜI NHẬN</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50 font-bold">
              <td className="border border-black px-1.5 py-1 text-left">
                Đơn vị tính
              </td>
              <td className="border border-black px-1 py-1">TEST</td>
              <td className="border border-black px-1 py-1">-</td>
              {stockTests.map((t) => (
                <td key={t.code} className="border border-black px-1 py-1">
                  {t.unit || "TEST"}
                </td>
              ))}
              <td colSpan={3} className="border border-black px-1 py-1" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td className="border border-black px-1.5 py-1 text-left">
                Cơ số quy định
              </td>
              <td className="border border-black px-1 py-1">TEST</td>
              <td className="border border-black px-1 py-1">Chuẩn</td>
              {stockTests.map((t) => (
                <td
                  key={t.code}
                  className="border border-black px-1 py-1 font-black"
                >
                  {t.quota}
                </td>
              ))}
              <td colSpan={3} className="border border-black px-1 py-1" />
            </tr>
            <tr className="bg-sky-50/70 font-black">
              <td
                colSpan={3}
                className="border border-black px-1.5 py-1 text-left uppercase"
              >
                TỒN ĐẦU NGÀY ({formatDateDisplay(selectedDate)})
              </td>
              {stockTests.map((t) => (
                <td
                  key={t.code}
                  className="border border-black px-1 py-1 text-[10px]"
                >
                  {computed.tonDau[t.code] ?? 0}
                </td>
              ))}
              <td colSpan={3} className="border border-black px-1 py-1" />
            </tr>

            {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => {
              const m = computed.meta[ca];
              return (
                <React.Fragment key={ca}>
                  <tr className="bg-slate-100/80 font-bold">
                    <td
                      colSpan={3}
                      className="border border-black px-1.5 py-0.5 text-left uppercase"
                    >
                      {shiftLabels[ca]}
                    </td>
                    {stockTests.map((t) => (
                      <td
                        key={t.code}
                        className="border border-black px-1 py-0.5 text-slate-400"
                      >
                        -
                      </td>
                    ))}
                    <td
                      rowSpan={5}
                      className="border border-black px-1 py-1 font-semibold text-[8.5px]"
                    >
                      {m.gioGiao}
                    </td>
                    <td
                      rowSpan={5}
                      className="border border-black px-1 py-1 font-bold text-[9px]"
                    >
                      {m.nguoiGiao}
                    </td>
                    <td
                      rowSpan={5}
                      className="border border-black px-1 py-1 font-bold text-[9px]"
                    >
                      {m.nguoiNhan}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black px-2 py-0.5 text-left"
                    >
                      + Bồi hoàn
                    </td>
                    {stockTests.map((t) => {
                      const v = computed.shifts[ca]?.[t.code]?.boiHoan || 0;
                      return (
                        <td
                          key={t.code}
                          className="border border-black px-1 py-0.5 font-semibold"
                        >
                          {v > 0 ? v : ""}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black px-2 py-0.5 text-left"
                    >
                      - Sử dụng QC / Cali
                    </td>
                    {stockTests.map((t) => {
                      const v = computed.shifts[ca]?.[t.code]?.suDungQC || 0;
                      return (
                        <td
                          key={t.code}
                          className="border border-black px-1 py-0.5 font-semibold"
                        >
                          {v > 0 ? v : ""}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black px-2 py-0.5 text-left"
                    >
                      - Sử dụng Bệnh nhân
                    </td>
                    {stockTests.map((t) => {
                      const v = computed.shifts[ca]?.[t.code]?.suDung || 0;
                      return (
                        <td
                          key={t.code}
                          className="border border-black px-1 py-0.5 font-bold"
                        >
                          {v > 0 ? v : ""}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="font-black bg-slate-50">
                    <td
                      colSpan={3}
                      className="border border-black px-2 py-0.5 text-left"
                    >
                      = Tồn cuối Ca {ca}
                    </td>
                    {stockTests.map((t) => {
                      const v = computed.shifts[ca]?.[t.code]?.tonCuoi ?? 0;
                      return (
                        <td
                          key={t.code}
                          className="border border-black px-1 py-0.5"
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="mt-2 text-xs font-bold">
          Ghi chú trong ngày:{" "}
          <span className="font-normal">
            {computed.ghiChu || "Không có ghi chú phát sinh."}
          </span>
        </div>

        {/* FOOTER BM.13 */}
        <div className="flex items-center justify-between mt-4 border-t border-black pt-2 text-[11px] italic">
          <div>Ngày ban hành: 18/06/2025</div>
          <div>Lần ban hành: 03</div>
          <div className="font-semibold text-[12px]">Trang 1/1</div>
        </div>
      </div>
    </div>
  );
}

/* ============================ PHÂN HỆ QUẢN TRỊ ADMIN ============================ */

interface AdminPanelProps {
  apiUrl: string;
  token: string;
  currentUser: UserInfo;
  testsConfig: TestConfig[];
  activeSession: ActiveSession | null;
  outboxCount: number;
  onUpdateTestsConfig: (nextTests: TestConfig[]) => void;
  onForceUnlockSession: () => Promise<void>;
  onApiUrlChanged: (nextUrl: string) => void;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
}

export function AdminPanel({
  apiUrl,
  token,
  currentUser,
  testsConfig,
  activeSession,
  outboxCount,
  onUpdateTestsConfig,
  onForceUnlockSession,
  onApiUrlChanged,
  notify,
}: AdminPanelProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("User");
  const [newPw, setNewPw] = useState("");

  const [draftTests, setDraftTests] = useState<TestConfig[]>(testsConfig);
  const [savingTests, setSavingTests] = useState(false);
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [verifyingUrl, setVerifyingUrl] = useState(false);

  useEffect(() => {
    setDraftTests(testsConfig);
  }, [testsConfig]);

  const loadAdminData = useCallback(async () => {
    setLoadingUsers(true);
    const res = await rpcCall(apiUrl, "adminListUsers", {}, token);
    setLoadingUsers(false);
    if (res.net && res.body.status === "success") {
      setUsers(Array.isArray(res.body.users) ? res.body.users : []);
      setSheets(Array.isArray(res.body.sheets) ? res.body.sheets : []);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      notify("Vui lòng nhập đủ ID và Họ tên nhân viên.", "error");
      return;
    }
    const res = await rpcCall(
      apiUrl,
      "adminUpsertUser",
      {
        id: newId.trim(),
        name: newName.trim(),
        role: newRole,
        password: newPw.trim(),
      },
      token
    );
    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể lưu tài khoản.", "error");
      return;
    }
    setUsers(res.body.users || []);
    setNewId("");
    setNewName("");
    setNewPw("");
    notify("Đã lưu thông tin nhân viên thành công.", "success");
  };

  const handleResetPw = async (u: UserInfo) => {
    if (!window.confirm(`Đặt lại mật khẩu mặc định cho [${u.name}] (${u.id})?`))
      return;
    const res = await rpcCall(
      apiUrl,
      "adminResetPassword",
      { userId: u.id },
      token
    );
    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Lỗi đặt lại mật khẩu.", "error");
      return;
    }
    notify(res.body.message || "Đã đặt lại mật khẩu mặc định.", "success");
    loadAdminData();
  };

  const handleDeleteUser = async (u: UserInfo) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản [${u.name}] (${u.id})?`))
      return;
    const res = await rpcCall(
      apiUrl,
      "adminDeleteUser",
      { userId: u.id },
      token
    );
    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể xóa tài khoản.", "error");
      return;
    }
    setUsers(res.body.users || []);
    notify(`Đã xóa tài khoản ${u.name}.`, "info");
  };

  const handleSaveCatalog = async () => {
    setSavingTests(true);
    const res = await rpcCall(
      apiUrl,
      "updateTestsConfig",
      { tests: draftTests },
      token
    );
    setSavingTests(false);
    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể lưu danh mục xét nghiệm.", "error");
      return;
    }
    onUpdateTestsConfig(res.body.testsConfig || draftTests);
    notify("Đã cập nhật danh mục xét nghiệm & cơ số thành công!", "success");
  };

  const handleCheckSheets = async () => {
    const res = await rpcCall(apiUrl, "adminCleanupSheets", {}, token);
    if (!res.net || res.body.status !== "success") {
      notify(
        res.body.message || "Không thể kiểm tra danh sách Sheet.",
        "error"
      );
      return;
    }
    setSheets(res.body.sheets || []);
    notify(res.body.message || "Đã kiểm tra cấu trúc Sheet an toàn.", "info");
  };

  const handleSwitchEndpoint = async () => {
    if (outboxCount > 0) {
      notify(
        `Còn ${outboxCount} thao tác trong hàng đợi chưa đồng bộ. Vui lòng đồng bộ xong trước khi đổi URL API!`,
        "error"
      );
      return;
    }
    setVerifyingUrl(true);
    const check = await testApiEndpoint(urlInput);
    setVerifyingUrl(false);
    if (!check.ok) {
      notify(check.message, "error");
      return;
    }
    onApiUrlChanged(urlInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Khung Khóa phiên & Kết nối Database */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Trạng thái Phiên làm
              việc (Session Lock)
            </h3>
            <button
              type="button"
              onClick={onForceUnlockSession}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" /> Cưỡng chế giải phóng phiên
            </button>
          </div>
          {activeSession ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <div>
                Đang giữ phiên:{" "}
                <span className="font-black text-slate-900">
                  {activeSession.mainUser}
                </span>
                {activeSession.checkerUser
                  ? ` • Kiểm tra: ${activeSession.checkerUser}`
                  : ""}
              </div>
              <div className="text-slate-600 font-semibold">
                Ngày: {formatDateDisplay(activeSession.date)} • Ca{" "}
                {activeSession.shift} • Epoch: {activeSession.epoch || "N/A"}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              Hiện không có máy trạm nào đang khóa phiên.
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" /> Kết nối Google
              Sheets API (Chu kỳ 6 tháng)
            </h3>
            <button
              type="button"
              onClick={handleCheckSheets}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Kiểm tra các Sheet ({sheets.length})
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-700"
            />
            <button
              type="button"
              disabled={verifyingUrl}
              onClick={handleSwitchEndpoint}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase shrink-0"
            >
              {verifyingUrl ? "Đang kiểm tra..." : "Xác minh & Đổi URL"}
            </button>
          </div>
          {sheets.length > 0 && (
            <div className="text-[11px] font-semibold text-slate-500">
              Các Sheet hiện có:{" "}
              <span className="font-mono text-slate-700">
                {sheets.join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quản lý Danh mục Xét nghiệm */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Danh mục
              Xét nghiệm & Cơ số Tồn kho
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Lưu ý: Mã WIDAL được cấu hình đặc biệt (8 chân, chỉ ghi nhận
              BM.04, miễn trừ tồn kho BM.13).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDraftTests((prev) => [
                  ...prev,
                  { code: "", name: "", unit: "TEST", quota: 10 },
                ])
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Thêm mã test
            </button>
            <button
              type="button"
              disabled={savingTests}
              onClick={handleSaveCatalog}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase"
            >
              {savingTests ? "Đang lưu..." : "Lưu Danh Mục"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {draftTests.map((t, idx) => {
            const isWidal =
              String(t.code || "")
                .trim()
                .toUpperCase() === "WIDAL";
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex items-center gap-2 ${
                  isWidal
                    ? "bg-purple-50/50 border-purple-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <input
                  type="text"
                  value={t.code}
                  disabled={isWidal}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setDraftTests((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, code: v } : x))
                    );
                  }}
                  placeholder="Mã"
                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-black uppercase bg-white"
                />
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftTests((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, name: v } : x))
                    );
                  }}
                  placeholder="Tên hiển thị"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
                {isWidal ? (
                  <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-black shrink-0">
                    Không tính tồn
                  </span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={t.quota}
                    onChange={(e) => {
                      const v = clampInt(e.target.value, 0, 99999);
                      setDraftTests((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, quota: v } : x))
                      );
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-center bg-white"
                    title="Cơ số mặc định"
                  />
                )}
                {!isWidal && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftTests((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quản lý Nhân sự */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" /> Quản lý Tài khoản Nhân
            viên ({users.length})
          </h3>
          <button
            type="button"
            onClick={loadAdminData}
            className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`}
            />{" "}
            Làm mới
          </button>
        </div>

        <form
          onSubmit={handleSaveUser}
          className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200"
        >
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="ID (vd: nvmoi)"
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Họ và tên nhân viên"
            className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          >
            <option value="User">Quyền: Nhân viên (User)</option>
            <option value="Admin">Quyền: Quản trị (Admin)</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase"
          >
            + Thêm / Cập nhật
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">
                  {u.name}{" "}
                  <span className="text-[11px] font-mono text-slate-500">
                    ({u.id})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      u.role === "Admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role}
                  </span>
                  {u.mustChange && (
                    <span className="text-[10px] font-bold text-rose-600">
                      • Mật khẩu mặc định
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResetPw(u)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold"
                  title="Đặt lại mật khẩu mặc định Longdeptrai"
                >
                  Reset MK
                </button>
                {u.id.toLowerCase() !== "thlong" &&
                  u.id.toLowerCase() !== currentUser.id.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====================== LÕI ĐIỀU PHỐI TRUNG TÂM (APP) ====================== */

type TabKey = 'WORK' | 'BM13' | 'PRINT_BM04' | 'PRINT_BM13' | 'ADMIN';

interface ToastNotice {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Phát âm báo y tế 3 tiếng "Tít - Tít - Tít" (880Hz) bằng Web Audio API nội tại
 * khi đồng hồ ủ test (10' / 15' / 20') chạm mốc 00:00.
 */
function playTripleBeepAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.22, 0.44].forEach(offsetSec => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + offsetSec);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offsetSec);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + offsetSec + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offsetSec + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offsetSec);
      osc.stop(ctx.currentTime + offsetSec + 0.15);
    });
    window.setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 900);
  } catch {
    // Bỏ qua nếu trình duyệt chặn tự động phát âm thanh
  }
}

export function MainApp() {
  const [apiUrl, setApiUrl] = usePersistentState<string>(
    STORAGE_KEYS.API_URL,
    DEFAULT_API_URL,
    v => typeof v === 'string' && v.length > 5
  );

  const [auth, setAuth] = usePersistentState<AuthState | null>(
    STORAGE_KEYS.AUTH,
    null,
    v => v === null || (typeof v === 'object' && typeof v.token === 'string' && v.user && typeof v.user.id === 'string')
  );

  const [checker, setChecker] = usePersistentState<CheckerState | null>(
    STORAGE_KEYS.CHECKER,
    null,
    v => v === null || (typeof v === 'object' && typeof v.id === 'string' && typeof v.proof === 'string')
  );

  const [testsConfig, setTestsConfig] = usePersistentState<TestConfig[]>(
    STORAGE_KEYS.TESTS,
    DEFAULT_TESTS,
    v => Array.isArray(v) && v.length > 0
  );

  const [bm04Logs, setBm04Logs] = usePersistentState<QueueItem[]>(
    STORAGE_KEYS.BM04,
    [],
    v => Array.isArray(v)
  );

  const [pendingQueue, setPendingQueue] = usePersistentState<QueueItem[]>(
    STORAGE_KEYS.PENDING,
    [],
    v => Array.isArray(v)
  );

  const [bm13Raw, setBm13Raw] = usePersistentState<RawBM13Row[]>(
    STORAGE_KEYS.BM13_RAW,
    [],
    v => Array.isArray(v)
  );

  const [dirtyBm13, setDirtyBm13] = usePersistentState<Record<string, any>>(
    STORAGE_KEYS.BM13_DIRTY,
    {},
    v => Boolean(v && typeof v === 'object' && !Array.isArray(v))
  );

  const [drafts, setDrafts] = usePersistentState<Record<string, DraftResult>>(
    STORAGE_KEYS.DRAFTS,
    {},
    v => Boolean(v && typeof v === 'object' && !Array.isArray(v))
  );

  const [timers, setTimers] = usePersistentState<Record<string, PatientTimer>>(
    STORAGE_KEYS.TIMERS,
    {},
    v => Boolean(v && typeof v === 'object' && !Array.isArray(v))
  );

  const [outbox, setOutbox] = usePersistentState<OutboxItem[]>(
    STORAGE_KEYS.OUTBOX,
    [],
    v => Array.isArray(v)
  );

  const [dataVersion, setDataVersion] = usePersistentState<string>(
    STORAGE_KEYS.DATA_VERSION,
    '0',
    v => typeof v === 'string'
  );

  // Đảm bảo danh mục luôn có WIDAL (miễn trừ tồn kho)
  useEffect(() => {
    if (!testsConfig.some(t => String(t.code || '').toUpperCase() === 'WIDAL')) {
      setTestsConfig(prev => [...prev, { code: 'WIDAL', name: 'WIDAL', unit: 'TEST', quota: 0, noStock: true }]);
    }
  }, [testsConfig, setTestsConfig]);

  // Nếu đổi tài khoản chính thì xóa chữ ký Người kiểm tra của phiên trước
  useEffect(() => {
    if (auth && checker && checker.verifiedForUserId.toLowerCase() !== auth.user.id.toLowerCase()) {
      setChecker(null);
    }
  }, [auth, checker, setChecker]);

  const [activeTab, setActiveTab] = useState<TabKey>('WORK');
  const [nowTick, setNowTick] = useState<Date>(() => getTrustedNow());
  const todayStr = useMemo(() => businessDate(nowTick), [nowTick]);
  const realShift = useMemo(() => shiftOfDay(nowTick), [nowTick]);

  const [selectedDate, setSelectedDate] = useState<string>(() => businessDate());
  const [adminShiftOverride, setAdminShiftOverride] = useState<ShiftNumber | null>(null);
  const datePickedRef = useRef<boolean>(false);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionEpoch, setSessionEpoch] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  // State cho Form thêm Bệnh nhân (Cột 1 - Tab 1)
  const [hoTenBN, setHoTenBN] = useState('');
  const [gioiTinh, setGioiTinh] = useState<'Nam' | 'Nu'>('Nam');
  const [namSinh, setNamSinh] = useState('');
  const [isAgeMode, setIsAgeMode] = useState<boolean>(false);
  const [barcode, setBarcode] = useState('');
  const [docChungDefault] = useState<DocChungValue>('Dương tính');
  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>([]);
  const [journalShiftFilter, setJournalShiftFilter] = useState<'ALL' | ShiftNumber>('ALL');

  // State điều khiển Đồng hồ đếm ngược Hàng đợi (Cột 2A)
  const [openTimerMenuId, setOpenTimerMenuId] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState<number>(() => Date.now());
  const beepedTimerMarksRef = useRef<Record<string, number>>({});

  // State cho các Modal
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [showCheckerModal, setShowCheckerModal] = useState(false);
  const [editingBm04Item, setEditingBm04Item] = useState<QueueItem | null>(null);
  const [replenishShiftModal, setReplenishShiftModal] = useState<ShiftNumber | null>(null);
  const [closingShiftModal, setClosingShiftModal] = useState<ShiftNumber | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  // Nhịp đồng hồ hệ thống mỗi 15 giây
  useEffect(() => {
    const t = window.setInterval(() => {
      setNowTick(getTrustedNow());
    }, 15000);
    return () => window.clearInterval(t);
  }, []);

  // Vòng lặp 1 giây duy nhất cho toàn bộ Đồng hồ đếm ngược (chỉ kích hoạt khi có ít nhất 1 đồng hồ đang chạy)
  const hasActiveTimers = useMemo(() => Object.keys(timers).length > 0, [timers]);
  useEffect(() => {
    if (!hasActiveTimers) return;
    setTimerNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setTimerNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [hasActiveTimers]);

  // Phát đúng 3 tiếng "Tít - Tít - Tít" khi có bất kỳ đồng hồ nào vừa chạm mốc 00:00
  useEffect(() => {
    if (!hasActiveTimers) return;
    let shouldBeep = false;
    Object.keys(timers).forEach(itemId => {
      const t = timers[itemId];
      if (!t || !t.durationMs) return;
      const remain = t.durationMs - (timerNowMs - t.startAt);
      if (remain <= 0 && beepedTimerMarksRef.current[itemId] !== t.startAt) {
        beepedTimerMarksRef.current[itemId] = t.startAt;
        shouldBeep = true;
      }
    });
    if (shouldBeep) {
      playTripleBeepAlert();
    }
  }, [timerNowMs, timers, hasActiveTimers]);

  // Tự động dọn dẹp đồng hồ của những bản ghi không còn trong hàng đợi
  useEffect(() => {
    const validIds = new Set(pendingQueue.map(p => p.id));
    setTimers(prev => {
      const keys = Object.keys(prev);
      if (keys.every(k => validIds.has(k))) return prev;
      const next: Record<string, PatientTimer> = {};
      keys.forEach(k => {
        if (validIds.has(k)) next[k] = prev[k];
      });
      return next;
    });
  }, [pendingQueue, setTimers]);

  // Tự động chuyển sang ngày làm việc mới nếu người dùng không bấm chọn ngày lịch sử
  useEffect(() => {
    if (!datePickedRef.current && selectedDate !== todayStr) {
      setSelectedDate(todayStr);
      setAdminShiftOverride(null);
    }
  }, [todayStr, selectedDate]);

  const isAdmin = Boolean(auth?.user.role === 'Admin');

  /* ==================== TÍNH TOÁN TỒN KHO NGÀY HIỆN TẠI & HÔM TRƯỚC ==================== */

  const prevDateStr = useMemo(() => addDays(selectedDate, -1), [selectedDate]);

  const prevDayComputed = useMemo(
    () => computeDaySingle(prevDateStr, testsConfig, bm04Logs, pendingQueue, bm13Raw, dirtyBm13, null),
    [prevDateStr, testsConfig, bm04Logs, pendingQueue, bm13Raw, dirtyBm13]
  );

  const currentDayComputed = useMemo(
    () =>
      computeDaySingle(
        selectedDate,
        testsConfig,
        bm04Logs,
        pendingQueue,
        bm13Raw,
        dirtyBm13,
        prevDayComputed.tonCuoiNgay
      ),
    [selectedDate, testsConfig, bm04Logs, pendingQueue, bm13Raw, dirtyBm13, prevDayComputed.tonCuoiNgay]
  );

  const effectiveShift: ShiftNumber = useMemo(() => {
    for (const ca of [1, 2, 3, 4] as ShiftNumber[]) {
      const st = currentDayComputed.meta[ca]?.trangThai || 'OPEN';
      if (st !== 'HOAN_THANH') {
        return ca;
      }
    }
    return realShift;
  }, [currentDayComputed.meta, realShift]);

  const viewShift: ShiftNumber = useMemo(() => {
    if (isAdmin && adminShiftOverride) return adminShiftOverride;
    return effectiveShift;
  }, [isAdmin, adminShiftOverride, effectiveShift]);

  const yesterdayCa4PendingBlock = useMemo(() => {
    const hasPrevActivity =
      bm13Raw.some(r => r.ngayBC === prevDateStr) ||
      bm04Logs.some(l => l.ngayBC === prevDateStr) ||
      pendingQueue.some(p => p.ngayBC === prevDateStr);
    if (!hasPrevActivity) return null;
    const ca4Meta = prevDayComputed.meta[4];
    if (ca4Meta && ca4Meta.trangThai !== 'HOAN_THANH') {
      return {
        date: prevDateStr,
        shift: 4 as ShiftNumber,
        status: ca4Meta.trangThai,
        nguoiGiao: ca4Meta.nguoiGiao
      };
    }
    return null;
  }, [prevDateStr, bm13Raw, bm04Logs, pendingQueue, prevDayComputed.meta]);

  const currentShiftHandoverBlock = useMemo(() => {
    for (const ca of [1, 2, 3, 4] as ShiftNumber[]) {
      const m = currentDayComputed.meta[ca];
      if (m?.trangThai === 'PENDING_RECEIVE') {
        return { date: selectedDate, shift: ca, status: m.trangThai, nguoiGiao: m.nguoiGiao };
      }
    }
    return null;
  }, [selectedDate, currentDayComputed.meta]);

  const isShiftClosed = useCallback(
    (dateStr: string, shift: ShiftNumber): boolean => {
      const targetComp =
        dateStr === selectedDate
          ? currentDayComputed
          : dateStr === prevDateStr
          ? prevDayComputed
          : computeDaySingle(dateStr, testsConfig, bm04Logs, pendingQueue, bm13Raw, dirtyBm13, null);
      const st = targetComp.meta[shift]?.trangThai || 'OPEN';
      return st === 'PENDING_RECEIVE' || st === 'HOAN_THANH';
    },
    [selectedDate, prevDateStr, currentDayComputed, prevDayComputed, testsConfig, bm04Logs, pendingQueue, bm13Raw, dirtyBm13]
  );

  /**
   * NHẬN DIỆN KHÓA PHIÊN TOÀN CỤC & QUYỀN TỐI THƯỢNG ADMIN:
   * - isSessionHeldByOther: Cho biết hiện có đồng nghiệp khác đang giữ phiên chính thức hay không.
   * - isLockedByOtherUser: Chỉ khóa giao diện đối với User thường. Admin luôn có quyền tối thượng xuyên khóa phiên!
   */
  const isSessionHeldByOther = useMemo(() => {
    if (!auth || !activeSession) return false;
    const ownerId = String(activeSession.mainUserId || '').toLowerCase();
    if (ownerId) return ownerId !== auth.user.id.toLowerCase();
    return activeSession.mainUser !== auth.user.name;
  }, [auth, activeSession]);

  const isLockedByOtherUser = isSessionHeldByOther && !isAdmin;

  // Kiểm tra quyền chỉnh sửa / xóa bản ghi của người dùng hiện tại
  const canUserModifyRecord = useCallback(
    (item: QueueItem): boolean => {
      if (!auth) return false;
      if (isAdmin) return true; // Admin luôn có toàn quyền
      if (isLockedByOtherUser) return false; // User thường bị khóa nếu không phải chủ phiên
      if (isShiftClosed(item.ngayBC, item.caTruc)) return false;
      return item.nguoiThucHien === auth.user.name;
    },
    [auth, isAdmin, isLockedByOtherUser, isShiftClosed]
  );

  /* ==================== HÀNG ĐỢI ĐỒNG BỘ BẤT TỬ (OUTBOX ENGINE) ==================== */

  const outboxRef = useRef<OutboxItem[]>(outbox);
  useEffect(() => {
    outboxRef.current = outbox;
  }, [outbox]);

  const flushingRef = useRef<boolean>(false);

  const enqueueOutbox = useCallback(
    (action: string, payload: Record<string, any>) => {
      const nextPayload: Record<string, any> = { ...payload, sessionEpoch: sessionEpoch || undefined };
      const item: OutboxItem = {
        qid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        action,
        payload: nextPayload,
        createdAt: Date.now(),
        attempts: 0,
        paused: false
      };
      setOutbox(prev => {
        if (action === 'saveBM13Data') {
          const firstActiveIdx = flushingRef.current ? prev.findIndex(x => !x.paused) : -1;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (i === firstActiveIdx) continue;
            const ob = prev[i];
            if (
              ob.action === 'saveBM13Data' &&
              ob.payload.ngayBC === nextPayload.ngayBC &&
              Number(ob.payload.caTruc) === Number(nextPayload.caTruc)
            ) {
              const next = [...prev];
              next[i] = { ...ob, payload: nextPayload, paused: false, attempts: 0, lastError: undefined };
              outboxRef.current = next;
              return next;
            }
          }
        }
        const next = [...prev, item];
        outboxRef.current = next;
        return next;
      });
    },
    [sessionEpoch, setOutbox]
  );

  const syncFromCloud = useCallback(
    async (forceFull = false, targetDateOverride?: string) => {
      if (!auth || auth.mustChange) return;
      if (flushingRef.current) return;

      setIsSyncing(true);
      const res = await rpcCall(
        apiUrl,
        'getInitData',
        {
          knownVersion: forceFull ? '' : dataVersion,
          targetDate: targetDateOverride || selectedDate
        },
        auth.token
      );
      setIsSyncing(false);

      if (!res.net) {
        setIsOnline(false);
        return;
      }
      setIsOnline(true);

      if (res.body.status !== 'success') {
        if (res.body.code === 'AUTH') {
          notify('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (dữ liệu chưa đồng bộ vẫn được giữ an toàn).', 'error');
          setAuth(null);
        }
        return;
      }

      if (res.body.activeSession !== undefined) {
        setActiveSession(res.body.activeSession || null);
      }
      if (res.body.mustChange) {
        setAuth(prev => (prev ? { ...prev, mustChange: true } : prev));
        return;
      }
      if (res.body.unchanged) {
        return;
      }

      if (flushingRef.current) return;

      if (Array.isArray(res.body.testsConfig) && res.body.testsConfig.length > 0) {
        setTestsConfig(res.body.testsConfig);
      }

      const pendingAddIds = new Set<string>();
      const processedIds = new Set<string>();
      const deletedBm04Ids = new Set<string>();
      const deletedPendingIds = new Set<string>();
      const updatedBm04Map = new Map<string, { docChung?: DocChungValue; ketQua?: string }>();

      outboxRef.current.forEach(ob => {
        if (ob.action === 'addPending' && Array.isArray(ob.payload.items)) {
          ob.payload.items.forEach((x: any) => { if (x?.id) pendingAddIds.add(x.id); });
        } else if (ob.action === 'processPending' && ob.payload.data?.id) {
          processedIds.add(ob.payload.data.id);
          deletedPendingIds.add(ob.payload.data.id);
        } else if (ob.action === 'deleteBM04' && ob.payload.id) {
          deletedBm04Ids.add(ob.payload.id);
        } else if (ob.action === 'deletePending' && ob.payload.id) {
          deletedPendingIds.add(ob.payload.id);
        } else if (ob.action === 'updateBM04' && ob.payload.id) {
          updatedBm04Map.set(ob.payload.id, {
            docChung: ob.payload.docChung,
            ketQua: ob.payload.ketQua
          });
        }
      });

      if (Array.isArray(res.body.bm04)) {
        setBm04Logs(prev => {
          const serverList: QueueItem[] = (res.body.bm04 as QueueItem[])
            .filter(x => !deletedBm04Ids.has(x.id))
            .map(x => {
              const up = updatedBm04Map.get(x.id);
              return up ? { ...x, docChung: up.docChung || x.docChung, ketQua: up.ketQua ?? x.ketQua } : x;
            });
          const serverIds = new Set(serverList.map(x => x.id));
          const localUnsynced = prev.filter(
            x => processedIds.has(x.id) && !serverIds.has(x.id) && !deletedBm04Ids.has(x.id)
          );
          return [...localUnsynced, ...serverList];
        });
      }

      if (Array.isArray(res.body.pendingQueue)) {
        setPendingQueue(prev => {
          const serverList: QueueItem[] = (res.body.pendingQueue as QueueItem[]).filter(
            x => !deletedPendingIds.has(x.id)
          );
          const serverIds = new Set(serverList.map(x => x.id));
          const localUnsynced = prev.filter(
            x => pendingAddIds.has(x.id) && !serverIds.has(x.id) && !deletedPendingIds.has(x.id)
          );
          return [...serverList, ...localUnsynced];
        });
      }

      if (Array.isArray(res.body.bm13)) {
        setBm13Raw(res.body.bm13);
        if (outboxRef.current.length === 0) {
          setDirtyBm13({});
        }
      }

      if (res.body.version) {
        setDataVersion(String(res.body.version));
      }
    },
    [
      auth,
      apiUrl,
      dataVersion,
      selectedDate,
      notify,
      setAuth,
      setTestsConfig,
      setBm04Logs,
      setPendingQueue,
      setBm13Raw,
      setDirtyBm13,
      setDataVersion
    ]
  );

  const flushOutbox = useCallback(
    async (unpauseAll = false) => {
      if (!auth || auth.mustChange || isLockedByOtherUser || flushingRef.current) return;
      if (unpauseAll) {
        const unpaused = outboxRef.current.map(item => ({
          ...item,
          paused: false,
          attempts: 0,
          lastError: undefined
        }));
        setOutbox(unpaused);
        outboxRef.current = unpaused;
      }

      if (!outboxRef.current.some(x => !x.paused)) return;

      flushingRef.current = true;
      let changedVersion = false;

      try {
        while (true) {
          const item = outboxRef.current.find(x => !x.paused);
          if (!item) break;

          const payloadWithEpoch = {
            ...item.payload,
            sessionEpoch: sessionEpoch || item.payload.sessionEpoch
          };
          const res = await rpcCall(apiUrl, item.action, payloadWithEpoch, auth.token);

          if (!res.net) {
            setIsOnline(false);
            const nextAttempts = (item.attempts || 0) + 1;
            const shouldPause = nextAttempts >= 8;
            setOutbox(prev => {
              const next = prev.map(x =>
                x.qid === item.qid
                  ? {
                      ...x,
                      attempts: nextAttempts,
                      paused: shouldPause,
                      lastError: shouldPause
                        ? 'Tạm dừng sau 8 lần mất mạng. Bấm nút Đồng bộ trên Header để gửi lại.'
                        : 'Đang chờ mạng ổn định...'
                    }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            break;
          }

          setIsOnline(true);

          if (res.body.status === 'success') {
            if (res.body.version) {
              changedVersion = true;
              setDataVersion(String(res.body.version));
            }
            setOutbox(prev => {
              const next = prev.filter(x => x.qid !== item.qid);
              outboxRef.current = next;
              return next;
            });
            continue;
          }

          if (res.body.activeSession) {
            setActiveSession(res.body.activeSession);
          }

          const code = String(res.body.code || '');
          if (code === 'AUTH' || code === 'MUST_CHANGE' || code === 'SESSION_LOCKED' || code === 'SESSION_SUPERSEDED') {
            setOutbox(prev => {
              const next = prev.map(x =>
                x.qid === item.qid
                  ? { ...x, paused: true, lastError: res.body.message || 'Phiên bị khóa hoặc cần đăng nhập lại.' }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            if (code === 'AUTH') {
              notify('Phiên đăng nhập hết hạn. Dữ liệu vừa nhập vẫn được giữ trong Hàng đợi, vui lòng đăng nhập lại!', 'error');
              setAuth(null);
            } else {
              notify(res.body.message || 'Bạn đang ở chế độ Chỉ xem, không thể ghi dữ liệu.', 'error');
            }
            break;
          }

          if (res.body.retry || code === 'BUSY' || code === 'SERVER') {
            const nextAttempts = (item.attempts || 0) + 1;
            setOutbox(prev => {
              const next = prev.map(x =>
                x.qid === item.qid
                  ? {
                      ...x,
                      attempts: nextAttempts,
                      paused: nextAttempts >= 8,
                      lastError: res.body.message || 'Máy chủ đang bận, chờ thử lại...'
                    }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            break;
          }

          notify(res.body.message || `Thao tác [${item.action}] bị từ chối bởi máy chủ.`, 'error');
          setOutbox(prev => {
            const next = prev.map(x =>
              x.qid === item.qid
                ? { ...x, paused: true, lastError: res.body.message || 'Máy chủ từ chối thao tác.' }
                : x
            );
            outboxRef.current = next;
            return next;
          });
        }
      } finally {
        flushingRef.current = false;
      }

      if (changedVersion && !outboxRef.current.some(x => !x.paused)) {
        syncFromCloud(true);
      }
    },
    [auth, isLockedByOtherUser, apiUrl, sessionEpoch, notify, setAuth, setOutbox, setDataVersion, syncFromCloud]
  );

  useEffect(() => {
    if (!auth || auth.mustChange || isLockedByOtherUser) return;
    flushOutbox(false);
    const timer = window.setInterval(() => {
      flushOutbox(false);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [auth, isLockedByOtherUser, outbox, flushOutbox]);

  useEffect(() => {
    if (!auth || auth.mustChange) return;
    syncFromCloud(true, selectedDate);
    const timer = window.setInterval(() => {
      syncFromCloud(false, selectedDate);
    }, 18000);
    return () => window.clearInterval(timer);
  }, [auth?.token, auth?.mustChange, selectedDate, syncFromCloud]);

  /* ==================== KHÓA PHIÊN (HEARTBEAT PING SESSION) ==================== */

  const pingCurrentSession = useCallback(
    async (forceTakeover = false) => {
      if (!auth || auth.mustChange) return;
      const res = await rpcCall(
        apiUrl,
        'pingSession',
        {
          date: selectedDate,
          shift: viewShift,
          checkerUser: checker?.name || '',
          force: forceTakeover
        },
        auth.token
      );
      if (res.net && res.body.status === 'success' && res.body.activeSession) {
        setActiveSession(res.body.activeSession);
        if (res.body.activeSession.epoch) {
          setSessionEpoch(String(res.body.activeSession.epoch));
        }
        if (forceTakeover) {
          notify(`Đã tiếp quản phiên làm việc thành công! Bạn đang giữ phiên chính thức.`, 'success');
        }
      } else if (res.net && res.body.activeSession) {
        setActiveSession(res.body.activeSession);
        if (forceTakeover) {
          notify(res.body.message || 'Chưa thể tiếp quản phiên làm việc.', 'error');
        }
      }
    },
    [auth, apiUrl, selectedDate, viewShift, checker?.name, notify]
  );

  /**
   * CẢI TIẾN 1: Chỉ bắn nhịp pingSession tự động khi máy hiện tại đang giữ phiên (hoặc chưa có ai giữ phiên).
   * Nếu đồng nghiệp khác đang giữ phiên (isSessionHeldByOther === true), tự động ngắt bộ đếm pingSession
   * để tiết kiệm LockService trên Google Sheets và không tự ý cướp phiên của đồng nghiệp.
   */
  useEffect(() => {
    if (!auth || auth.mustChange || isSessionHeldByOther) return;
    pingCurrentSession(false);
    const t = window.setInterval(() => {
      pingCurrentSession(false);
    }, 28000);
    return () => window.clearInterval(t);
  }, [auth?.token, auth?.mustChange, isSessionHeldByOther, selectedDate, viewShift, checker?.name, pingCurrentSession]);

  /* ==================== CÁC HÀM THAO TÁC ĐỒNG HỒ ĐẾM NGƯỢC ==================== */

  const handleStartTimer = (itemId: string, minutes: TimerPresetMinutes) => {
    const now = Date.now();
    delete beepedTimerMarksRef.current[itemId];
    setTimers(prev => ({
      ...prev,
      [itemId]: {
        startAt: now,
        durationMs: minutes * 60 * 1000,
        presetMin: minutes
      }
    }));
    setTimerNowMs(now);
    setOpenTimerMenuId(null);
    notify(`Đã bật đồng hồ đếm ngược ${minutes} phút.`, 'info');
  };

  const handleCancelTimer = (itemId: string) => {
    delete beepedTimerMarksRef.current[itemId];
    setTimers(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setOpenTimerMenuId(null);
  };

  /* ==================== CÁC HÀM THAO TÁC NGHIỆP VỤ BM.04 ==================== */

  const handoverLockReason = useMemo(() => {
    if (isAdmin) return '';
    if (yesterdayCa4PendingBlock && selectedDate === todayStr) {
      return `Ca 4 ngày hôm qua (${formatDateDisplay(yesterdayCa4PendingBlock.date)}) chưa hoàn tất bàn giao. Vui lòng sang Tab 2 "Kho Hóa Chất (BM.13)" để Chốt/Nhận bàn giao trước khi thao tác ngày mới!`;
    }
    if (currentShiftHandoverBlock) {
      return `Ca ${currentShiftHandoverBlock.shift} ngày ${formatDateDisplay(currentShiftHandoverBlock.date)} đã chốt giao bởi [${currentShiftHandoverBlock.nguoiGiao}] và đang chờ ký nhận. Vui lòng sang Tab 2 để Nhận bàn giao trước khi làm việc tiếp!`;
    }
    return '';
  }, [isAdmin, yesterdayCa4PendingBlock, selectedDate, todayStr, currentShiftHandoverBlock]);

  const handleToggleTestCode = (code: string) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên. Bấm "Tiếp quản phiên" nếu muốn thao tác.`, 'error');
      return;
    }
    setSelectedTestCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (isLockedByOtherUser) {
      notify(`Hệ thống đang được giữ phiên bởi ${activeSession?.mainUser}. Bạn đang ở chế độ Chỉ xem!`, 'error');
      return;
    }
    if (handoverLockReason) {
      notify(handoverLockReason, 'error');
      setActiveTab('BM13');
      return;
    }
    if (isShiftClosed(selectedDate, viewShift) && !isAdmin) {
      notify(`Ca ${viewShift} ngày ${formatDateDisplay(selectedDate)} đã chốt bàn giao, không thể thêm bệnh nhân mới.`, 'error');
      return;
    }
    if (!checker || checker.verifiedForUserId.toLowerCase() !== auth.user.id.toLowerCase()) {
      notify('Vui lòng xác thực Người kiểm tra trước khi đẩy bệnh nhân vào hàng đợi!', 'error');
      setShowCheckerModal(true);
      return;
    }

    const cleanName = hoTenBN.trim().toUpperCase();
    const cleanBc = barcode.trim();
    const cleanYear = namSinh.trim();
    const currentYear = getVnParts().year;
    const yearNum = Number(cleanYear);

    if (!cleanName) {
      notify('Vui lòng nhập Họ và tên bệnh nhân.', 'error');
      return;
    }
    if (isAgeMode) {
      if (!cleanYear || !Number.isInteger(yearNum) || yearNum < 1 || yearNum > 130) {
        notify('Tuổi không hợp lệ (Vui lòng nhập số nguyên từ 1 đến 130).', 'error');
        return;
      }
    } else {
      if (!cleanYear || !Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        notify(`Năm sinh không hợp lệ (1900 - ${currentYear}). Nếu muốn nhập tuổi, hãy tích vào ô "Tuổi".`, 'error');
        return;
      }
    }
    if (!cleanBc) {
      notify('Vui lòng nhập Barcode bệnh nhân.', 'error');
      return;
    }
    if (selectedTestCodes.length === 0) {
      notify('Vui lòng tích chọn ít nhất 1 xét nghiệm.', 'error');
      return;
    }

    const catalogMap: Record<string, string> = {};
    testsConfig.forEach(t => { catalogMap[t.code] = t.name; });

    const nowIso = getTrustedNow().toISOString();
    const newItems: QueueItem[] = selectedTestCodes.map((code, idx) => {
      const upperCode = code.trim().toUpperCase();
      return {
        id: `REC_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        ngayBC: selectedDate,
        caTruc: viewShift,
        tenXetNghiem: catalogMap[upperCode] || upperCode,
        maTest: upperCode,
        hoTenBN: cleanName,
        namSinhNam: gioiTinh === 'Nam' ? cleanYear : '',
        namSinhNu: gioiTinh === 'Nu' ? cleanYear : '',
        isAgeMode,
        barcode: cleanBc,
        docChung: docChungDefault,
        nguoiThucHien: auth.user.name,
        nguoiKiemTra: checker.name,
        timestamp: nowIso
      };
    });

    setPendingQueue(prev => [...prev, ...newItems]);
    setDrafts(prev => {
      const next = { ...prev };
      newItems.forEach(it => {
        next[it.id] = { docChung: it.docChung, ketQua: '' };
      });
      return next;
    });

    enqueueOutbox('addPending', {
      items: newItems,
      checkerProof: checker.proof
    });

    // CẢI TIẾN 2: Xóa trắng Form và tự động trả dấu tick [✓] Tuổi về mặc định (Năm sinh)
    setHoTenBN('');
    setNamSinh('');
    setIsAgeMode(false);
    setBarcode('');
    setSelectedTestCodes([]);
    notify(`Đã đẩy ${newItems.length} xét nghiệm vào Hàng đợi (Ca ${viewShift}).`, 'success');
  };

  const handleSaveResultFromQueue = (item: QueueItem, rawKetQuaOverride?: string, docChungOverride?: DocChungValue) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    if (isShiftClosed(item.ngayBC, item.caTruc) && !isAdmin) {
      notify(`Ca ${item.caTruc} ngày ${formatDateDisplay(item.ngayBC)} đã chốt, không thể lưu kết quả mới.`, 'error');
      return;
    }

    const draft = drafts[item.id] || { docChung: item.docChung, ketQua: '' };
    const rawKq = rawKetQuaOverride !== undefined ? rawKetQuaOverride : draft.ketQua;
    const finalDocChung = docChungOverride !== undefined ? docChungOverride : draft.docChung;

    const check = validateAndNormalizeMulti(item.maTest, rawKq);
    if (!check.ok) {
      notify(check.error, 'error');
      return;
    }

    const completedRecord: QueueItem = {
      ...item,
      docChung: finalDocChung,
      ketQua: check.normalized,
      thoiGianDocKQ: formatVnTimeNow(),
      lanSuaCuoi: ''
    };

    delete beepedTimerMarksRef.current[item.id];
    setPendingQueue(prev => prev.filter(p => p.id !== item.id));
    setBm04Logs(prev => [completedRecord, ...prev.filter(x => x.id !== item.id)]);
    setDrafts(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setTimers(prev => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    enqueueOutbox('processPending', {
      data: completedRecord,
      checkerProof: checker?.proof || ''
    });

    notify(`Đã lưu kết quả [${item.tenXetNghiem}] cho BN ${item.hoTenBN}.`, 'success');
  };

  const handleUpdateBM04Result = async (id: string, nextDocChung: DocChungValue, nextKetQua: string) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      throw new Error(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`);
    }
    const target = bm04Logs.find(x => x.id === id);
    if (!target) return;

    if (!canUserModifyRecord(target)) {
      throw new Error('Ca trực đã chốt hoặc bạn không có quyền sửa bản ghi này (Chỉ Admin mới sửa được sau khi chốt ca).');
    }

    const stamp = `${formatVnTimeNow()} (${auth.user.name})`;

    setBm04Logs(prev =>
      prev.map(x =>
        x.id === id
          ? {
              ...x,
              docChung: nextDocChung,
              ketQua: nextKetQua,
              lanSuaCuoi: stamp
            }
          : x
      )
    );

    const res = await rpcCall(
      apiUrl,
      'updateBM04',
      {
        id,
        docChung: nextDocChung,
        ketQua: nextKetQua,
        sessionEpoch: sessionEpoch || undefined
      },
      auth.token
    );

    if (!res.net) {
      enqueueOutbox('updateBM04', { id, docChung: nextDocChung, ketQua: nextKetQua });
      notify('Đã cập nhật kết quả trên máy (sẽ tự đồng bộ lên Cloud khi có mạng).', 'info');
      return;
    }

    if (res.body.status !== 'success') {
      if (res.body.activeSession) setActiveSession(res.body.activeSession);
      setBm04Logs(prev => prev.map(x => (x.id === id ? target : x)));
      throw new Error(res.body.message || 'Máy chủ từ chối cập nhật kết quả.');
    }

    if (res.body.version) setDataVersion(String(res.body.version));
    notify(`Đã cập nhật kết quả [${target.tenXetNghiem}] (Giữ nguyên giờ trả KQ: ${target.thoiGianDocKQ}).`, 'success');
  };

  const handleDeletePendingItem = (item: QueueItem) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    if (!canUserModifyRecord(item)) {
      notify('Bạn chỉ được xóa xét nghiệm chờ do chính mình tạo trong ca đang mở.', 'error');
      return;
    }
    if (!window.confirm(`Hủy xét nghiệm chờ [${item.tenXetNghiem}] của BN ${item.hoTenBN} (Ca ${item.caTruc} - ${formatDateDisplay(item.ngayBC)})?`)) {
      return;
    }
    delete beepedTimerMarksRef.current[item.id];
    setPendingQueue(prev => prev.filter(x => x.id !== item.id));
    setTimers(prev => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    enqueueOutbox('deletePending', { id: item.id });
    notify(`Đã xóa xét nghiệm chờ [${item.tenXetNghiem}].`, 'info');
  };

  const handleDeleteBM04Item = (item: QueueItem) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    if (!canUserModifyRecord(item)) {
      notify('Ca trực đã chốt hoặc bạn không có quyền xóa kết quả này.', 'error');
      return;
    }
    if (!window.confirm(`Xóa kết quả [${item.tenXetNghiem}] của BN ${item.hoTenBN} khỏi Sổ BM.04? (Thao tác sẽ được ghi vào Sổ kiểm toán AUDIT_LOGS)`)) {
      return;
    }
    setBm04Logs(prev => prev.filter(x => x.id !== item.id));
    enqueueOutbox('deleteBM04', { id: item.id });
    notify(`Đã xóa kết quả [${item.tenXetNghiem}] của BN ${item.hoTenBN}.`, 'info');
  };

  /* ==================== CÁC HÀM THAO TÁC TỒN KHO & BÀN GIAO BM.13 ==================== */

  const handleUpdateShiftCell = (shift: ShiftNumber, code: string, field: 'boiHoan' | 'suDungQC', rawVal: any) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    if (!isStockTestCode(code)) return;
    if (isShiftClosed(selectedDate, shift) && !isAdmin) {
      notify(`Ca ${shift} đã chốt bàn giao, không thể sửa số liệu.`, 'error');
      return;
    }
    const val = clampInt(rawVal, 0, 99999);
    const key = `${selectedDate}_CA${shift}`;
    const existingShiftCells = currentDayComputed.shifts[shift] || {};
    const nextCellsPayload: Record<string, { boiHoan: number; suDungQC: number }> = {};

    currentDayComputed.tests.forEach(t => {
      if (!isStockTestCode(t.code)) return;
      const cur = existingShiftCells[t.code] || { boiHoan: 0, suDungQC: 0, suDung: 0, tonCuoi: 0 };
      nextCellsPayload[t.code] = {
        boiHoan: t.code === code && field === 'boiHoan' ? val : cur.boiHoan,
        suDungQC: t.code === code && field === 'suDungQC' ? val : cur.suDungQC
      };
    });

    setDirtyBm13(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        cells: nextCellsPayload
      }
    }));

    enqueueOutbox('saveBM13Data', {
      ngayBC: selectedDate,
      caTruc: shift,
      dataJson: JSON.stringify(nextCellsPayload)
    });
  };

  const handleApplyBulkReplenish = (shift: ShiftNumber, map: Record<string, number>) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    if (isShiftClosed(selectedDate, shift) && !isAdmin) {
      notify(`Ca ${shift} đã chốt bàn giao.`, 'error');
      return;
    }
    const key = `${selectedDate}_CA${shift}`;
    const existingShiftCells = currentDayComputed.shifts[shift] || {};
    const nextCellsPayload: Record<string, { boiHoan: number; suDungQC: number }> = {};

    currentDayComputed.tests.forEach(t => {
      if (!isStockTestCode(t.code)) return;
      const cur = existingShiftCells[t.code] || { boiHoan: 0, suDungQC: 0, suDung: 0, tonCuoi: 0 };
      nextCellsPayload[t.code] = {
        boiHoan: map[t.code] !== undefined ? clampInt(map[t.code], 0, 99999) : cur.boiHoan,
        suDungQC: cur.suDungQC
      };
    });

    setDirtyBm13(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        cells: nextCellsPayload
      }
    }));

    enqueueOutbox('saveBM13Data', {
      ngayBC: selectedDate,
      caTruc: shift,
      dataJson: JSON.stringify(nextCellsPayload)
    });

    notify(`Đã cập nhật Bồi hoàn cho Ca ${shift}.`, 'success');
  };

  const handleUpdateDayTonDauOrNote = (newTonDauMap?: Record<string, number>, newNote?: string) => {
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    const key = `${selectedDate}_DAY`;
    const nextTonDau = newTonDauMap !== undefined ? newTonDauMap : currentDayComputed.tonDau;
    const nextNote = newNote !== undefined ? newNote : currentDayComputed.ghiChu;

    setDirtyBm13(prev => ({
      ...prev,
      [key]: {
        tonDau: nextTonDau,
        ghiChu: nextNote
      }
    }));

    enqueueOutbox('saveBM13Data', {
      ngayBC: selectedDate,
      caTruc: 0,
      ghiChu: nextNote,
      dataJson: JSON.stringify({ tonDau: nextTonDau })
    });
  };

  const handleConfirmCloseShift = async (shift: ShiftNumber) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`, 'error');
      return;
    }
    const pendingOfThisShift = pendingQueue.filter(
      p => p.ngayBC === selectedDate && Number(p.caTruc) === Number(shift)
    ).length;

    if (pendingOfThisShift > 0 && !isAdmin) {
      notify(`Còn ${pendingOfThisShift} xét nghiệm chờ đọc kết quả ở Ca ${shift}. Vui lòng xử lý hết trước khi chốt ca!`, 'error');
      return;
    }

    const shiftCellsPayload: Record<string, { boiHoan: number; suDungQC: number }> = {};
    currentDayComputed.tests.forEach(t => {
      if (!isStockTestCode(t.code)) return;
      const c = currentDayComputed.shifts[shift]?.[t.code] || { boiHoan: 0, suDungQC: 0, suDung: 0, tonCuoi: 0 };
      shiftCellsPayload[t.code] = { boiHoan: c.boiHoan, suDungQC: c.suDungQC };
    });

    const gioGiao = formatVnTimeNow();
    setClosingLoading(true);

    await flushOutbox(false);

    const res = await rpcCall(
      apiUrl,
      'shiftOp',
      {
        ngayBC: selectedDate,
        caTruc: shift,
        op: 'close',
        gioGiao,
        shiftData: shiftCellsPayload,
        sessionEpoch: sessionEpoch || undefined
      },
      auth.token
    );
    setClosingLoading(false);

    if (!res.net || res.body.status !== 'success') {
      if (res.body.activeSession) setActiveSession(res.body.activeSession);
      notify(res.body.message || 'Chưa thể chốt ca (Kiểm tra kết nối mạng hoặc xử lý hết hàng đợi).', 'error');
      return;
    }

    setClosingShiftModal(null);
    if (!isSessionHeldByOther) {
      await rpcCall(apiUrl, 'clearSession', {}, auth.token);
    }
    setChecker(null);
    setAuth(null);
    notify(`Đã chốt bàn giao Ca ${shift} thành công và đăng xuất an toàn.`, 'success');
  };

  const handleReceiveShiftHandover = async (targetDate: string, shift: ShiftNumber) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(`Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên. Bấm "Tiếp quản phiên" trước khi ký nhận ca.`, 'error');
      return;
    }
    const res = await rpcCall(
      apiUrl,
      'shiftOp',
      {
        ngayBC: targetDate,
        caTruc: shift,
        op: 'receive',
        sessionEpoch: sessionEpoch || undefined
      },
      auth.token
    );

    if (!res.net || res.body.status !== 'success') {
      if (res.body.activeSession) setActiveSession(res.body.activeSession);
      notify(res.body.message || 'Không thể ký nhận bàn giao ca. Vui lòng thử lại.', 'error');
      return;
    }

    setAdminShiftOverride(null);
    await syncFromCloud(true, selectedDate);
    notify(`Đã ký nhận bàn giao Ca ${shift} ngày ${formatDateDisplay(targetDate)} thành công!`, 'success');
  };

  const handleAdminResetShift = async (shift: ShiftNumber) => {
    if (!auth || !isAdmin) return;
    if (!window.confirm(`Mở khóa lại Ca ${shift} ngày ${formatDateDisplay(selectedDate)}? (Thao tác được ghi vào AUDIT_LOGS)`)) {
      return;
    }
    const res = await rpcCall(
      apiUrl,
      'shiftOp',
      { ngayBC: selectedDate, caTruc: shift, op: 'reset' },
      auth.token
    );
    if (!res.net || res.body.status !== 'success') {
      notify(res.body.message || 'Không thể mở khóa ca.', 'error');
      return;
    }
    await syncFromCloud(true, selectedDate);
    notify(`Đã mở khóa lại Ca ${shift}.`, 'info');
  };

  const handleForceUnlockSession = async () => {
    if (!auth || !isAdmin) return;
    const res = await rpcCall(apiUrl, 'clearSession', { force: true }, auth.token);
    if (!res.net || res.body.status !== 'success') {
      notify(res.body.message || 'Không thể giải phóng phiên trên máy chủ.', 'error');
      return;
    }
    setActiveSession(null);
    notify('Đã cưỡng chế giải phóng khóa phiên thành công!', 'success');
  };

  const handleLogout = async () => {
    if (outbox.length > 0 && !isLockedByOtherUser) {
      await flushOutbox(false);
      if (outboxRef.current.length > 0) {
        if (!window.confirm(`Còn ${outboxRef.current.length} thao tác chưa đồng bộ lên máy chủ. Bạn vẫn muốn đăng xuất? (Dữ liệu hàng đợi vẫn được bảo toàn trên trình duyệt)`)) {
          return;
        }
      }
    }
    if (auth && !isSessionHeldByOther) {
      await rpcCall(apiUrl, 'clearSession', {}, auth.token);
    }
    setChecker(null);
    setAuth(null);
  };

  /* ==================== DỮ LIỆU HIỂN THỊ TRONG NGÀY (TAB 1 & TAB 2) ==================== */

  const visiblePending = useMemo(() => {
    const list = pendingQueue.filter(p => p.ngayBC === selectedDate || p.ngayBC < selectedDate);
    return [...list].sort((a, b) => {
      if (a.ngayBC !== b.ngayBC) return a.ngayBC.localeCompare(b.ngayBC);
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(a.timestamp || '').localeCompare(String(b.timestamp || ''));
    });
  }, [pendingQueue, selectedDate]);

  const todayBm04Logs = useMemo(() => {
    const list = bm04Logs.filter(l => {
      if (String(l.ngayBC || '').trim() !== selectedDate) return false;
      if (journalShiftFilter !== 'ALL' && Number(l.caTruc) !== Number(journalShiftFilter)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
    });
  }, [bm04Logs, selectedDate, journalShiftFilter]);

  const stockTestsForUi = useMemo(
    () => currentDayComputed.tests.filter(t => isStockTestCode(t.code) && !t.noStock),
    [currentDayComputed.tests]
  );

  const pausedOutboxCount = useMemo(() => outbox.filter(x => x.paused).length, [outbox]);

  /* ==================== RENDER MÀN HÌNH ĐĂNG NHẬP NẾU CHƯA AUTH ==================== */

  if (!auth) {
    return (
      <LoginScreen
        apiUrl={apiUrl}
        onSuccess={(nextAuth, initialSession) => {
          setAuth(nextAuth);
          if (initialSession !== undefined) {
            setActiveSession(initialSession);
            const ownerId = String(initialSession?.mainUserId || '').toLowerCase();
            const isOther =
              Boolean(initialSession) &&
              (ownerId
                ? ownerId !== nextAuth.user.id.toLowerCase()
                : initialSession!.mainUser !== nextAuth.user.name);
            if (isOther && initialSession) {
              if (nextAuth.user.role === 'Admin') {
                notify(
                  `Phiên đang được giữ bởi ${initialSession.mainUser} (Ca ${initialSession.shift}). Quyền Tối Thượng Admin đã kích hoạt!`,
                  'info'
                );
              } else {
                notify(
                  `Cảnh báo: Phiên làm việc đang được giữ bởi ${initialSession.mainUser} (Ca ${initialSession.shift}). Bạn đang ở chế độ CHỈ XEM!`,
                  'info'
                );
              }
            }
          }
          if (nextAuth.mustChange) {
            setShowChangePwModal(true);
          }
        }}
        onChangeApiUrl={nextUrl => {
          setApiUrl(nextUrl);
          notify('Đã lưu cấu hình URL API mới!', 'success');
        }}
      />
    );
  }

  const activeShiftTheme = SHIFT_THEME[viewShift] || SHIFT_THEME[1];
  const isWorkDisabled = Boolean(handoverLockReason) || isLockedByOtherUser;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between">
      {/* CSS IN ẤN A4 NGANG CHUẨN ISO */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>

      {/* TOAST THÔNG BÁO NỔI */}
      <div className="no-print fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
              t.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-400/40'
                : t.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-400/40'
                : 'bg-slate-900/95 text-white border-slate-600'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
            )}
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>

      {/* HEADER MASTER UI */}
      <header className="no-print bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white shadow-lg border-b border-amber-400/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Thương hiệu Khoa */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  KHOA XÉT NGHIỆM - BVĐK CÀ MAU
                </h1>
                <span className="hidden xl:inline-block px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-300/30 text-[10px] font-black tracking-widest uppercase text-amber-300">
                  AN INTELLECTUAL PRODUCT OF HANDSOME LONG
                </span>
              </div>
              <p className="text-[11px] font-semibold text-sky-300">
                Hệ thống Quản lý Test Nhanh Miễn Dịch (BM.04 & BM.13)
              </p>
            </div>
          </div>

          {/* Cụm điều khiển Ngày, Ca trực (4 Màu riêng biệt), Trạng thái đồng bộ & Tài khoản */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ chọn Ngày làm việc */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5">
              <input
                type="date"
                value={selectedDate}
                max={isAdmin ? undefined : todayStr}
                onChange={e => {
                  const val = e.target.value;
                  if (isDateStr(val)) {
                    datePickedRef.current = val !== todayStr;
                    setSelectedDate(val);
                    setAdminShiftOverride(null);
                  }
                }}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer [color-scheme:dark]"
              />
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => {
                    datePickedRef.current = false;
                    setSelectedDate(todayStr);
                    setAdminShiftOverride(null);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase"
                >
                  Về hôm nay
                </button>
              )}
            </div>

            {/* Bộ chọn Ca trực */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border shadow-sm transition ${activeShiftTheme.headerSelectBg}`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <select
                value={viewShift}
                disabled={!isAdmin || isLockedByOtherUser}
                onChange={e => {
                  const nextCa = Number(e.target.value) as ShiftNumber;
                  setAdminShiftOverride(nextCa === effectiveShift ? null : nextCa);
                }}
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer disabled:cursor-default"
              >
                {([1, 2, 3, 4] as ShiftNumber[]).map(ca => (
                  <option
                    key={ca}
                    value={ca}
                    style={SHIFT_THEME[ca].optionStyle}
                  >
                    {SHIFT_INFO[ca].label}
                  </option>
                ))}
              </select>
              {isAdmin && adminShiftOverride && !isLockedByOtherUser && (
                <button
                  type="button"
                  onClick={() => setAdminShiftOverride(null)}
                  title="Quay về ca tự động theo tiến trình thực tế"
                  className="ml-1 px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/40 text-[10px] font-black"
                >
                  Auto
                </button>
              )}
            </div>

            {/* Nút Người Kiểm Tra */}
            <button
              type="button"
              disabled={isLockedByOtherUser}
              onClick={() => setShowCheckerModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition disabled:opacity-50 ${
                checker
                  ? 'bg-emerald-600/90 border-emerald-400/50 text-white'
                  : 'bg-amber-500/90 border-amber-300 text-slate-950 animate-pulse'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{checker ? `KT: ${checker.name}` : 'Chọn Người Kiểm Tra'}</span>
            </button>

            {/* Nút Đồng bộ & Hàng đợi Outbox */}
            <button
              type="button"
              onClick={() => {
                if (!isLockedByOtherUser) flushOutbox(true);
                syncFromCloud(true, selectedDate);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition ${
                !isOnline || pausedOutboxCount > 0
                  ? 'bg-rose-600 border-rose-400 text-white'
                  : outbox.length > 0
                  ? 'bg-amber-500 border-amber-300 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title={
                pausedOutboxCount > 0
                  ? `Có ${pausedOutboxCount} thao tác đang tạm dừng. Bấm để gửi lại ngay!`
                  : 'Đồng bộ dữ liệu với Google Sheets'
              }
            >
              {isOnline ? (
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span>
                {outbox.length > 0
                  ? pausedOutboxCount > 0
                    ? `Gửi lại (${outbox.length})`
                    : `Đang lưu (${outbox.length})`
                  : isOnline
                  ? 'Đã đồng bộ'
                  : 'Offline'}
              </span>
            </button>

            {/* Thông tin User & Đổi MK / Đăng xuất */}
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1">
              <span className="text-xs font-black text-sky-200 px-1">
                {auth.user.name}
                {isAdmin && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px]">
                    ADMIN
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowChangePwModal(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
                title="Đổi mật khẩu"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-600/80"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* THANH ĐIỀU HƯỚNG TABS */}
        <div className="max-w-[1600px] mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('WORK')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'WORK'
                ? 'bg-slate-100 text-sky-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" /> 1. Test Miễn Dịch (BM.04)
            {visiblePending.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                {visiblePending.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BM13')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'BM13'
                ? 'bg-slate-100 text-sky-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> 2. Kho Hóa Chất (BM.13)
            {(yesterdayCa4PendingBlock || currentShiftHandoverBlock) && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                Chờ nhận ca
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRINT_BM04')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'PRINT_BM04'
                ? 'bg-slate-100 text-sky-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" /> 3. In Sổ BM.04 ({todayBm04Logs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRINT_BM13')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'PRINT_BM13'
                ? 'bg-slate-100 text-sky-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" /> 4. In Sổ BM.13
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('ADMIN')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
                activeTab === 'ADMIN'
                  ? 'bg-slate-100 text-amber-700 shadow-sm'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" /> 5. Quản Trị Hệ Thống
            </button>
          )}
        </div>
      </header>

      {/* CÁC BANNER CẢNH BÁO KHÓA PHIÊN (CHẾ ĐỘ CHỈ XEM / QUYỀN TỐI THƯỢNG ADMIN) & GIAO NHẬN CA */}
      <div className="no-print max-w-[1600px] w-full mx-auto px-4 pt-3 space-y-2">
        {isLockedByOtherUser && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-amber-900">
                  Cảnh báo: Bạn đang ở Chế độ Chỉ Xem (Read-Only)
                </div>
                <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                  Phiên làm việc hiện đang được giữ bởi đồng nghiệp{' '}
                  <strong className="underline font-black text-slate-900">{activeSession?.mainUser}</strong> (Ca{' '}
                  {activeSession?.shift} • Ngày {formatDateDisplay(activeSession?.date || selectedDate)}). Mọi thao tác chỉnh sửa đã tạm khóa để bảo vệ dữ liệu.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Xác nhận TIẾP QUẢN PHIÊN LÀM VIỆC từ đồng nghiệp [${activeSession?.mainUser}]?\n(Sau khi tiếp quản, máy của ${activeSession?.mainUser} sẽ chuyển sang chế độ Chỉ xem)`
                  )
                ) {
                  pingCurrentSession(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-sm transition shrink-0"
            >
              Tiếp quản phiên làm việc
            </button>
          </div>
        )}

        {/* BANNER QUYỀN TỐI THƯỢNG DÀNH RIÊNG CHO ADMIN KHI ĐỒNG NGHIỆP ĐANG GIỮ PHIÊN */}
        {isSessionHeldByOther && isAdmin && (
          <div className="p-3.5 rounded-2xl bg-purple-50 border-2 border-purple-400 text-purple-950 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-purple-900">
                  Quyền Tối Thượng Admin Đang Kích Hoạt
                </div>
                <div className="text-[11px] font-semibold text-purple-800 mt-0.5">
                  Phiên làm việc hiện đang được giữ bởi đồng nghiệp{' '}
                  <strong className="underline font-black text-slate-900">{activeSession?.mainUser}</strong> (Ca{' '}
                  {activeSession?.shift} • Ngày {formatDateDisplay(activeSession?.date || selectedDate)}). Bạn là Admin nên có toàn quyền thao tác xuyên phiên mà không làm văng phiên của đồng nghiệp.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Bạn có muốn chuyển hẳn quyền giữ phiên chính thức sang tài khoản Admin của bạn không?\n(Nếu chỉ muốn sửa/nhập hộ mà giữ nguyên phiên cho [${activeSession?.mainUser}], hãy bấm Hủy — bạn vẫn thao tác được bình thường!)`
                  )
                ) {
                  pingCurrentSession(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm transition shrink-0"
            >
              Chuyển phiên sang Admin
            </button>
          </div>
        )}

        {handoverLockReason && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{handoverLockReason}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (yesterdayCa4PendingBlock && selectedDate === todayStr) {
                  datePickedRef.current = true;
                  setSelectedDate(yesterdayCa4PendingBlock.date);
                }
                setActiveTab('BM13');
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase flex items-center gap-1"
            >
              Sang Tab 2 Nhận Bàn Giao <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* NỘI DUNG CHÍNH THEO TAB */}
      <main className="max-w-[1600px] w-full mx-auto p-4 flex-1">
        {/* ==================== TAB 1: WORKSPACE 3 CỘT (BM.04 & TỒN KHO CA) ==================== */}
        {activeTab === 'WORK' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* CỘT 1 (4/12): TIẾP NHẬN BỆNH NHÂN */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900">1. Tiếp Nhận Bệnh Nhân</h2>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Đang ghi nhận vào:{' '}
                    <span className={`px-2 py-0.5 rounded font-black ${activeShiftTheme.badgeBg} ${activeShiftTheme.badgeText}`}>
                      {SHIFT_INFO[viewShift].short} ({SHIFT_INFO[viewShift].timeRange})
                    </span>
                  </p>
                </div>
                {isLockedByOtherUser && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                    Chỉ xem
                  </span>
                )}
              </div>

              <form onSubmit={handleAddToQueue} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Họ và tên bệnh nhân *
                  </label>
                  <input
                    type="text"
                    value={hoTenBN}
                    onChange={e => setHoTenBN(e.target.value.toUpperCase())}
                    disabled={isWorkDisabled}
                    placeholder="NGUYỄN VĂN A"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  <div className="col-span-5">
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Giới tính</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      {(['Nam', 'Nu'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          disabled={isWorkDisabled}
                          onClick={() => setGioiTinh(g)}
                          className={`py-1.5 rounded-lg text-xs font-black transition disabled:opacity-60 ${
                            gioiTinh === g ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          {g === 'Nam' ? 'Nam' : 'Nữ'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ô NHẬP NĂM SINH KÈM DẤU TICK TUỔI (KHÔNG TỰ QUY ĐỔI CHÉO) */}
                  <div className="col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black uppercase text-slate-600">
                        {isAgeMode ? 'Tuổi *' : 'Năm sinh *'}
                      </label>
                      <label
                        className="inline-flex items-center gap-1 cursor-pointer select-none text-[10px] font-black text-sky-700 hover:text-sky-800"
                        title="Tích chọn để nhập số Tuổi thay vì Năm sinh (không tự động quy đổi)"
                      >
                        <input
                          type="checkbox"
                          checked={isAgeMode}
                          disabled={isWorkDisabled}
                          onChange={e => setIsAgeMode(e.target.checked)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Tuổi</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={namSinh}
                      onChange={e => setNamSinh(e.target.value)}
                      disabled={isWorkDisabled}
                      placeholder={isAgeMode ? 'VD: 35' : '1985'}
                      min={isAgeMode ? 1 : 1900}
                      max={isAgeMode ? 130 : getVnParts().year}
                      className={`w-full px-2 py-2 rounded-xl border text-sm font-black text-center text-slate-900 focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
                        isAgeMode
                          ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500'
                          : 'border-slate-300 focus:ring-sky-500'
                      }`}
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Barcode *</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      disabled={isWorkDisabled}
                      placeholder="21110772"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-600">
                      Chọn Xét Nghiệm ({selectedTestCodes.length} đã chọn) *
                    </label>
                    {selectedTestCodes.length > 0 && !isWorkDisabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedTestCodes([])}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Bỏ chọn hết
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto p-1">
                    {testsConfig.map(t => {
                      const active = selectedTestCodes.includes(t.code);
                      const isNoStock = !isStockTestCode(t.code) || t.noStock;
                      const stockEnd = currentDayComputed.shifts[viewShift]?.[t.code]?.tonCuoi ?? 0;
                      return (
                        <button
                          key={t.code}
                          type="button"
                          disabled={isWorkDisabled}
                          onClick={() => handleToggleTestCode(t.code)}
                          className={`p-2 rounded-xl border text-left transition flex flex-col justify-between disabled:opacity-60 ${
                            active
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                              : isNoStock
                              ? 'bg-purple-50/60 hover:bg-purple-100/70 text-slate-800 border-purple-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div className="text-xs font-black leading-tight truncate">{t.name}</div>
                          <div
                            className={`text-[10px] font-bold mt-1 ${
                              active
                                ? 'text-sky-100'
                                : isNoStock
                                ? 'text-purple-700'
                                : stockEnd <= 0
                                ? 'text-rose-600 font-black'
                                : 'text-slate-500'
                            }`}
                          >
                            {isNoStock ? '8 chân • BM.04' : `Tồn: ${stockEnd}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isWorkDisabled}
                  className={`w-full py-3 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${activeShiftTheme.badgeBg} hover:opacity-95`}
                >
                  <Plus className="w-4 h-4" />
                  Đẩy vào Hàng đợi ({SHIFT_INFO[viewShift].short})
                </button>
              </form>
            </div>

            {/* CỘT 2 (5/12): HÀNG ĐỢI CHỜ ĐỌC KẾT QUẢ (CÓ ĐỒNG HỒ ĐẾM NGƯỢC) & NHẬT KÝ BM.04 HÔM NAY */}
            <div className="lg:col-span-5 space-y-4">
              {/* Khung 2A: Hàng đợi chờ đọc kết quả */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h2 className="text-sm font-black uppercase text-slate-900">
                    2. Chờ Đọc Kết Quả ({visiblePending.length})
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500">
                    Nhấn ⏱ để hẹn 10&apos; / 15&apos; / 20&apos; (Báo 3 tiếng Tít khi hết giờ)
                  </span>
                </div>

                {visiblePending.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    Hàng đợi đang sạch. Chưa có xét nghiệm nào chờ đọc kết quả.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {visiblePending.map(item => {
                      const isMulti = Boolean(getSubTests(item.maTest));
                      const draft = drafts[item.id] || { docChung: item.docChung, ketQua: '' };
                      const itemShiftTheme = SHIFT_THEME[item.caTruc] || SHIFT_THEME[1];
                      const isFromPastDate = item.ngayBC !== selectedDate;

                      // Tính toán trạng thái Đồng hồ đếm ngược cho từng bệnh nhân
                      const tInfo = timers[item.id];
                      let remainMs = 0;
                      let remainRatio = 1;
                      let timerLevel: 'NONE' | 'SAFE' | 'WARN_50' | 'CRIT_5' = 'NONE';

                      if (tInfo && tInfo.durationMs > 0) {
                        const elapsed = Math.max(0, timerNowMs - tInfo.startAt);
                        remainMs = Math.max(0, tInfo.durationMs - elapsed);
                        remainRatio = remainMs / tInfo.durationMs;
                        if (remainRatio <= 0.05) {
                          timerLevel = 'CRIT_5'; // Còn <= 5% thời gian: Nhấp nháy đỏ khẩn cấp
                        } else if (remainRatio <= 0.5) {
                          timerLevel = 'WARN_50'; // Còn <= 50% thời gian: Chuyển nền vàng cảnh báo
                        } else {
                          timerLevel = 'SAFE';
                        }
                      }

                      const cardBgClass =
                        timerLevel === 'CRIT_5'
                          ? 'bg-rose-100 border-2 border-rose-500 shadow-md ring-2 ring-rose-300 animate-pulse'
                          : timerLevel === 'WARN_50'
                          ? 'bg-amber-100/90 border-2 border-amber-400 shadow-sm'
                          : isFromPastDate
                          ? 'bg-amber-50/70 border border-amber-300'
                          : 'bg-slate-50/70 border border-slate-200';

                      const rawBirthOrAge = item.namSinhNam || item.namSinhNu;
                      const isAgeValue = item.isAgeMode || (Number(rawBirthOrAge) > 0 && Number(rawBirthOrAge) <= 130);

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-3.5 space-y-2.5 transition-all ${cardBgClass}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-black ${itemShiftTheme.badgeBg} ${itemShiftTheme.badgeText}`}
                                >
                                  Ca {item.caTruc}
                                </span>
                                {isFromPastDate && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black">
                                    Tồn từ {formatDateDisplay(item.ngayBC)}
                                  </span>
                                )}
                                <span className="text-xs font-black text-amber-700 uppercase">
                                  [{item.tenXetNghiem}]
                                </span>
                                <span className="text-sm font-black text-slate-900 uppercase">
                                  {item.hoTenBN}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                                Barcode: <span className="font-bold text-slate-900">{item.barcode}</span> •{' '}
                                {isAgeValue ? 'Tuổi' : 'Năm sinh'}:{' '}
                                <span className="font-bold text-slate-800">
                                  {rawBirthOrAge} ({item.namSinhNam ? 'Nam' : 'Nữ'})
                                </span>{' '}
                                • TH: {item.nguoiThucHien}
                              </div>
                            </div>

                            {/* CỤM NÚT ĐỒNG HỒ ĐẾM NGƯỢC (10' / 15' / 20') & NÚT XÓA */}
                            <div className="flex items-center gap-1 shrink-0 relative">
                              <button
                                type="button"
                                disabled={isLockedByOtherUser}
                                onClick={() =>
                                  setOpenTimerMenuId(prev => (prev === item.id ? null : item.id))
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border transition disabled:opacity-50 ${
                                  timerLevel === 'CRIT_5'
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                                    : timerLevel === 'WARN_50'
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                                    : timerLevel === 'SAFE'
                                    ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                                    : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-300'
                                }`}
                                title="Bấm để chọn thời gian đếm ngược (10', 15', 20')"
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {tInfo ? (
                                  <span>
                                    {remainMs <= 0 ? 'ĐỌC KQ!' : formatCountdownMmSs(remainMs)} ({tInfo.presetMin}&apos;)
                                  </span>
                                ) : (
                                  <span>Hẹn giờ</span>
                                )}
                              </button>

                              {canUserModifyRecord(item) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePendingItem(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Hủy xét nghiệm chờ này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* MENU CHỌN MỐC ĐẾM NGƯỢC 10' / 15' / 20' */}
                          {openTimerMenuId === item.id && !isLockedByOtherUser && (
                            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white/95 p-2 rounded-xl border border-sky-300 shadow-sm">
                              <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-sky-600" /> Chọn thời gian ủ test:
                              </span>
                              <div className="flex items-center gap-1">
                                {([10, 15, 20] as TimerPresetMinutes[]).map(mins => {
                                  const isSelected = tInfo?.presetMin === mins;
                                  return (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => handleStartTimer(item.id, mins)}
                                      className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                                        isSelected
                                          ? 'bg-sky-600 text-white shadow-sm'
                                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                                      }`}
                                    >
                                      {mins}&apos;
                                    </button>
                                  );
                                })}
                                {tInfo && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelTimer(item.id)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-black"
                                  >
                                    Tắt
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* THANH TIẾN TRÌNH ĐẾM NGƯỢC TRỰC QUAN */}
                          {tInfo && (
                            <div className="space-y-1">
                              <div className="w-full h-1.5 rounded-full bg-white/80 overflow-hidden border border-slate-200/80">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    timerLevel === 'CRIT_5'
                                      ? 'bg-rose-600'
                                      : timerLevel === 'WARN_50'
                                      ? 'bg-amber-500'
                                      : 'bg-sky-600'
                                  }`}
                                  style={{ width: `${Math.max(2, Math.min(100, remainRatio * 100))}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                <span
                                  className={
                                    timerLevel === 'CRIT_5'
                                      ? 'text-rose-700'
                                      : timerLevel === 'WARN_50'
                                      ? 'text-amber-800'
                                      : 'text-sky-700'
                                  }
                                >
                                  {timerLevel === 'CRIT_5'
                                    ? remainMs <= 0
                                      ? '🚨 Đã hết thời gian ủ — Đọc kết quả ngay!'
                                      : '🚨 Còn ≤ 5% thời gian — Chuẩn bị đọc kết quả ngay!'
                                    : timerLevel === 'WARN_50'
                                    ? '⚠️ Còn ≤ 50% thời gian ủ test'
                                    : `⏱ Đang đếm ngược mốc ${tInfo.presetMin} phút`}
                                </span>
                                <span className="font-mono text-slate-700">
                                  Còn lại: {formatCountdownMmSs(remainMs)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Chọn kết quả: Đa chân hoặc Đơn chân */}
                          {isMulti ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900">
                                  Đọc chứng (C):
                                </span>
                                <div className="flex gap-1.5">
                                  {(['Dương tính', 'Âm Tính'] as DocChungValue[]).map(dc => {
                                    const active = draft.docChung === dc;
                                    const activeCls =
                                      dc === 'Dương tính'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200'
                                        : 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200';
                                    return (
                                      <button
                                        key={dc}
                                        type="button"
                                        disabled={isLockedByOtherUser}
                                        onClick={() => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, docChung: dc } }))}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition disabled:opacity-50 ${
                                          active ? activeCls : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {dc === 'Dương tính' ? '● Dương tính' : '○ Âm tính'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <MultiPanelResultInput
                                maTest={item.maTest}
                                value={draft.ketQua}
                                disabled={isLockedByOtherUser}
                                onChange={nextVal =>
                                  setDrafts(prev => ({
                                    ...prev,
                                    [item.id]: { ...draft, ketQua: nextVal }
                                  }))
                                }
                                onEnterSubmit={() => handleSaveResultFromQueue(item)}
                                compact
                              />
                              <button
                                type="button"
                                disabled={isLockedByOtherUser}
                                onClick={() => handleSaveResultFromQueue(item)}
                                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-4 h-4" /> Lưu kết quả {item.tenXetNghiem}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-2 border-t border-slate-200/70">
                              <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900">
                                  Đọc chứng (C):
                                </span>
                                <div className="flex gap-1.5">
                                  {(['Dương tính', 'Âm Tính'] as DocChungValue[]).map(dc => {
                                    const active = draft.docChung === dc;
                                    const activeCls =
                                      dc === 'Dương tính'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200'
                                        : 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200';
                                    return (
                                      <button
                                        key={dc}
                                        type="button"
                                        disabled={isLockedByOtherUser}
                                        onClick={() => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, docChung: dc } }))}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition disabled:opacity-50 ${
                                          active ? activeCls : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {dc === 'Dương tính' ? '● Dương tính' : '○ Âm tính'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() => handleSaveResultFromQueue(item, 'Âm tính')}
                                  className="py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-black uppercase shadow-md transition"
                                >
                                  ÂM TÍNH (LƯU)
                                </button>
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() => handleSaveResultFromQueue(item, 'Dương tính')}
                                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-black uppercase shadow-md transition"
                                >
                                  DƯƠNG TÍNH (LƯU)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Khung 2B: NHẬT KÝ BM.04 HÔM NAY */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">
                    NHẬT KÝ BM.04 HÔM NAY
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setJournalShiftFilter('ALL')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${
                          journalShiftFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Tất cả
                      </button>
                      {([1, 2, 3, 4] as ShiftNumber[]).map(ca => (
                        <button
                          key={ca}
                          type="button"
                          onClick={() => setJournalShiftFilter(ca)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${
                            journalShiftFilter === ca
                              ? `${SHIFT_THEME[ca].badgeBg} text-white shadow-sm`
                              : 'text-slate-600 hover:bg-white/60'
                          }`}
                        >
                          Ca {ca}
                        </button>
                      ))}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-black uppercase">
                      {todayBm04Logs.length} KẾT QUẢ
                    </span>
                  </div>
                </div>

                {todayBm04Logs.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    Chưa có kết quả BM.04 nào trong ngày {formatDateDisplay(selectedDate)}.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                    {todayBm04Logs.map(r => {
                      const shiftTheme = SHIFT_THEME[r.caTruc] || SHIFT_THEME[1];
                      const displayKq = getSubTests(r.maTest)
                        ? formatShortMultiSummary(r.maTest, r.ketQua || '')
                        : (r.ketQua || '').toUpperCase();
                      const isPositive =
                        displayKq.toLowerCase().includes('dương') || displayKq.includes('(D)');
                      const canModify = canUserModifyRecord(r);

                      return (
                        <div
                          key={r.id}
                          className={`rounded-2xl border p-3.5 transition hover:shadow-sm ${shiftTheme.border} bg-white`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${shiftTheme.badgeBg} ${shiftTheme.badgeText}`}
                                >
                                  Ca {r.caTruc}
                                </span>
                                <span className="text-xs font-black text-amber-700 uppercase">
                                  [{r.tenXetNghiem}]
                                </span>
                                <span className="text-sm font-black text-slate-900 uppercase">
                                  {r.hoTenBN}
                                </span>
                              </div>

                              <div className="text-xs font-semibold text-slate-600 flex flex-wrap items-center gap-1.5">
                                <span>
                                  Barcode: <strong className="text-slate-900">{r.barcode}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  KQ:{' '}
                                  <strong className={isPositive ? 'text-rose-600 font-black' : 'text-sky-800 font-black'}>
                                    {displayKq}
                                  </strong>
                                </span>
                                {r.lanSuaCuoi && (
                                  <span
                                    className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black"
                                    title={`Cập nhật lần cuối: ${r.lanSuaCuoi}`}
                                  >
                                    (Đã sửa)
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] font-semibold text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-500" />
                                  {r.thoiGianDocKQ}
                                </span>
                                <span>• TH: <strong className="text-slate-700">{r.nguoiThucHien}</strong></span>
                                <span>• KT: <strong className="text-emerald-700">{r.nguoiKiemTra}</strong></span>
                              </div>
                            </div>

                            {canModify && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingBm04Item(r)}
                                  className="p-1.5 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 border border-transparent hover:border-sky-200 transition"
                                  title="Cập nhật lại kết quả (Giữ nguyên giờ trả KQ lần đầu)"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBM04Item(r)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                                  title="Xóa bản ghi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CỘT 3 (3/12): TỒN KHO CA HIỆN TẠI (ẨN WIDAL) */}
            <div className="lg:col-span-3 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900">
                    TỒN KHO {SHIFT_INFO[viewShift].short.toUpperCase()}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Ngày {formatDateDisplay(selectedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isLockedByOtherUser}
                    onClick={() => setReplenishShiftModal(viewShift)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 text-[11px] font-black"
                  >
                    + Bồi hoàn
                  </button>
                  <button
                    type="button"
                    disabled={isLockedByOtherUser}
                    onClick={() => setClosingShiftModal(viewShift)}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[11px] font-black"
                  >
                    Chốt Ca {viewShift}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-1.5 text-left">Xét nghiệm</th>
                      <th className="py-1.5 text-center">Đầu</th>
                      <th className="py-1.5 text-center text-emerald-600">+Bù</th>
                      <th className="py-1.5 text-center text-rose-600">-Dùng</th>
                      <th className="py-1.5 text-right text-sky-700">Cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockTestsForUi.map(t => {
                      const prevEnd =
                        viewShift === 1
                          ? currentDayComputed.tonDau[t.code] ?? 0
                          : currentDayComputed.shifts[(viewShift - 1) as ShiftNumber]?.[t.code]?.tonCuoi ?? 0;
                      const cell = currentDayComputed.shifts[viewShift]?.[t.code] || {
                        boiHoan: 0,
                        suDungQC: 0,
                        suDung: 0,
                        tonCuoi: prevEnd
                      };
                      const totalUsed = cell.suDung + cell.suDungQC;
                      return (
                        <tr key={t.code} className="hover:bg-slate-50">
                          <td className="py-2 font-black text-slate-800 truncate max-w-[110px]" title={t.name}>
                            {t.name}
                          </td>
                          <td className="py-2 text-center font-semibold text-slate-600">{prevEnd}</td>
                          <td className="py-2 text-center font-bold text-emerald-600">
                            {cell.boiHoan > 0 ? `+${cell.boiHoan}` : '–'}
                          </td>
                          <td className="py-2 text-center font-black text-rose-600">
                            {totalUsed > 0 ? totalUsed : '–'}
                          </td>
                          <td
                            className={`py-2 text-right font-black ${
                              cell.tonCuoi <= 0 ? 'text-rose-600' : 'text-sky-700'
                            }`}
                          >
                            {cell.tonCuoi}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: KHO HÓA CHẤT & BÀN GIAO 4 CA (BM.13) ==================== */}
        {activeTab === 'BM13' && (
          <div className="space-y-4">
            {/* Thanh điều khiển 4 Ca trực trên đầu Tab 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {([1, 2, 3, 4] as ShiftNumber[]).map(ca => {
                const m = currentDayComputed.meta[ca];
                const theme = SHIFT_THEME[ca];
                const overdue = m.trangThai === 'OPEN' && isShiftOverdue(selectedDate, ca, nowTick);
                const pendingCnt = pendingQueue.filter(
                  p => p.ngayBC === selectedDate && Number(p.caTruc) === ca
                ).length;

                return (
                  <div
                    key={ca}
                    className={`rounded-3xl p-4 bg-white border-2 shadow-sm flex flex-col justify-between gap-3 ${theme.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black ${theme.badgeBg} ${theme.badgeText}`}>
                          {SHIFT_INFO[ca].label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            m.trangThai === 'HOAN_THANH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.trangThai === 'PENDING_RECEIVE'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : overdue
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.trangThai === 'HOAN_THANH'
                            ? 'Đã hoàn thành'
                            : m.trangThai === 'PENDING_RECEIVE'
                            ? 'Chờ nhận bàn giao'
                            : overdue
                            ? 'Quá giờ chưa chốt'
                            : 'Đang mở'}
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs space-y-1 text-slate-600">
                        <div>
                          Người giao: <strong className="text-slate-900">{m.nguoiGiao || '—'}</strong>
                          {m.gioGiao ? ` (${m.gioGiao})` : ''}
                        </div>
                        <div>
                          Người nhận: <strong className="text-emerald-700">{m.nguoiNhan || '—'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                      {m.trangThai === 'OPEN' && (
                        <>
                          <button
                            type="button"
                            disabled={isLockedByOtherUser}
                            onClick={() => setReplenishShiftModal(ca)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 text-xs font-black"
                          >
                            + Bồi hoàn
                          </button>
                          <button
                            type="button"
                            disabled={isLockedByOtherUser}
                            onClick={() => setClosingShiftModal(ca)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black uppercase"
                          >
                            Chốt Ca {ca} {pendingCnt > 0 ? `(${pendingCnt} chờ)` : ''}
                          </button>
                        </>
                      )}

                      {m.trangThai === 'PENDING_RECEIVE' && (
                        <button
                          type="button"
                          disabled={isLockedByOtherUser}
                          onClick={() => handleReceiveShiftHandover(selectedDate, ca)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black uppercase shadow-sm"
                        >
                          ✍️ Ký Nhận Bàn Giao Ca {ca}
                        </button>
                      )}

                      {m.trangThai !== 'OPEN' && isAdmin && !isLockedByOtherUser && (
                        <button
                          type="button"
                          onClick={() => handleAdminResetShift(ca)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Mở khóa (Admin)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bảng chi tiết tồn kho BM.13 theo từng Xét nghiệm (Loại bỏ WIDAL) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">
                    Bảng Điều Phối Tồn Kho BM.13 — Ngày {formatDateDisplay(selectedDate)}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Cột &quot;Sử dụng&quot; tự động đếm từ BM.04 + Hàng đợi theo đúng từng Ca 1, 2, 3, 4.
                  </p>
                </div>
                <div className="w-full sm:w-96">
                  <input
                    type="text"
                    disabled={isLockedByOtherUser}
                    value={currentDayComputed.ghiChu}
                    onChange={e => handleUpdateDayTonDauOrNote(undefined, e.target.value)}
                    placeholder="Ghi chú tồn kho trong ngày..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                    <th className="py-2.5 px-3 text-left rounded-tl-xl">Tên Xét Nghiệm</th>
                    <th className="py-2.5 px-2 text-center">Cơ số</th>
                    <th className="py-2.5 px-2 text-center bg-sky-900">Tồn Đầu Ngày</th>
                    {([1, 2, 3, 4] as ShiftNumber[]).map(ca => (
                      <th key={ca} colSpan={4} className="py-2.5 px-2 text-center border-l border-slate-700">
                        Ca {ca} ({SHIFT_INFO[ca].timeRange})
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                    <th className="py-1.5 px-3 text-left" />
                    <th className="py-1.5 px-2 text-center" />
                    <th className="py-1.5 px-2 text-center">{isAdmin ? '(Admin sửa)' : '(Tự động)'}</th>
                    {([1, 2, 3, 4] as ShiftNumber[]).map(ca => (
                      <React.Fragment key={ca}>
                        <th className="py-1.5 px-1.5 text-center border-l border-slate-200 text-emerald-700">+Bù</th>
                        <th className="py-1.5 px-1.5 text-center text-purple-700">-QC</th>
                        <th className="py-1.5 px-1.5 text-center text-rose-600">-Dùng</th>
                        <th className="py-1.5 px-1.5 text-center text-sky-800">=Cuối</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockTestsForUi.map(t => (
                    <tr key={t.code} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-black text-slate-900">{t.name}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-500">{t.quota}</td>
                      <td className="py-2 px-2 text-center bg-sky-50/50">
                        {isAdmin && !isLockedByOtherUser ? (
                          <input
                            type="number"
                            value={currentDayComputed.tonDau[t.code] ?? 0}
                            onChange={e => {
                              const nextMap = {
                                ...currentDayComputed.tonDau,
                                [t.code]: clampInt(e.target.value, -99999, 999999)
                              };
                              handleUpdateDayTonDauOrNote(nextMap, undefined);
                            }}
                            className="w-16 px-1.5 py-1 rounded-lg border border-sky-300 text-center font-black text-sky-900 bg-white"
                          />
                        ) : (
                          <span className="font-black text-sky-900">{currentDayComputed.tonDau[t.code] ?? 0}</span>
                        )}
                      </td>

                      {([1, 2, 3, 4] as ShiftNumber[]).map(ca => {
                        const cell = currentDayComputed.shifts[ca]?.[t.code] || {
                          boiHoan: 0,
                          suDungQC: 0,
                          suDung: 0,
                          tonCuoi: 0
                        };
                        const closed = (isShiftClosed(selectedDate, ca) && !isAdmin) || isLockedByOtherUser;
                        return (
                          <React.Fragment key={ca}>
                            <td className="py-1.5 px-1 text-center border-l border-slate-100">
                              <input
                                type="number"
                                min={0}
                                disabled={closed}
                                value={cell.boiHoan || ''}
                                placeholder="0"
                                onChange={e => handleUpdateShiftCell(ca, t.code, 'boiHoan', e.target.value)}
                                className="w-12 px-1 py-1 rounded border border-emerald-200 text-center font-bold text-emerald-700 disabled:bg-slate-100"
                              />
                            </td>
                            <td className="py-1.5 px-1 text-center">
                              <input
                                type="number"
                                min={0}
                                disabled={closed}
                                value={cell.suDungQC || ''}
                                placeholder="0"
                                onChange={e => handleUpdateShiftCell(ca, t.code, 'suDungQC', e.target.value)}
                                className="w-12 px-1 py-1 rounded border border-purple-200 text-center font-bold text-purple-700 disabled:bg-slate-100"
                              />
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-black text-rose-600">
                              {cell.suDung > 0 ? cell.suDung : '–'}
                            </td>
                            <td
                              className={`py-1.5 px-1.5 text-center font-black ${
                                cell.tonCuoi < 0 ? 'text-rose-600 bg-rose-50' : 'text-sky-800 bg-slate-50/70'
                              }`}
                            >
                              {cell.tonCuoi}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: IN SỔ BM.04 ==================== */}
        {activeTab === 'PRINT_BM04' && (
          <PrintBm04 selectedDate={selectedDate} logs={bm04Logs} testsConfig={testsConfig} />
        )}

        {/* ==================== TAB 4: IN SỔ BM.13 ==================== */}
        {activeTab === 'PRINT_BM13' && (
          <PrintBm13 selectedDate={selectedDate} computed={currentDayComputed} />
        )}

        {/* ==================== TAB 5: QUẢN TRỊ ADMIN ==================== */}
        {activeTab === 'ADMIN' && isAdmin && (
          <AdminPanel
            apiUrl={apiUrl}
            token={auth.token}
            currentUser={auth.user}
            testsConfig={testsConfig}
            activeSession={activeSession}
            outboxCount={outbox.length}
            onUpdateTestsConfig={nextTests => setTestsConfig(nextTests)}
            onForceUnlockSession={handleForceUnlockSession}
            onApiUrlChanged={nextUrl => {
              setApiUrl(nextUrl);
              setDataVersion('0');
              notify('Đã chuyển sang kết nối Google Sheets mới thành công!', 'success');
            }}
            notify={notify}
          />
        )}
      </main>

      {/* FOOTER BẢN QUYỀN */}
      <footer className="no-print bg-slate-950 text-center py-3 border-t border-slate-800">
        <span className="text-[11px] font-black tracking-[0.22em] uppercase bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
          AN INTELLECTUAL PRODUCT OF HANDSOME LONG • KHOA XÉT NGHIỆM BVĐK CÀ MAU
        </span>
      </footer>

      {/* CÁC MODAL HỆ THỐNG */}
      <ChangePasswordModal
        open={showChangePwModal || auth.mustChange}
        forced={auth.mustChange}
        apiUrl={apiUrl}
        token={auth.token}
        userName={auth.user.name}
        onClose={() => setShowChangePwModal(false)}
        onChanged={newToken => {
          setAuth(prev => (prev ? { ...prev, token: newToken, mustChange: false } : prev));
          setShowChangePwModal(false);
          notify('Đổi mật khẩu thành công! Đang tải dữ liệu hệ thống...', 'success');
        }}
        onLogout={handleLogout}
      />

      <CheckerVerifyModal
        open={showCheckerModal}
        apiUrl={apiUrl}
        token={auth.token}
        mainUser={auth.user}
        onClose={() => setShowCheckerModal(false)}
        onVerified={nextChecker => {
          setChecker(nextChecker);
          setShowCheckerModal(false);
          notify(`Đã xác thực Người kiểm tra: ${nextChecker.name}`, 'success');
        }}
      />

      <EditBM04Modal
        item={editingBm04Item}
        onClose={() => setEditingBm04Item(null)}
        onSave={handleUpdateBM04Result}
      />

      {replenishShiftModal && (
        <BulkReplenishModal
          open={true}
          shift={replenishShiftModal}
          dateStr={selectedDate}
          computed={currentDayComputed}
          onClose={() => setReplenishShiftModal(null)}
          onApply={map => handleApplyBulkReplenish(replenishShiftModal, map)}
        />
      )}

      {closingShiftModal && (
        <ClosingReviewModal
          open={true}
          shift={closingShiftModal}
          dateStr={selectedDate}
          computed={currentDayComputed}
          pendingCountOfShift={
            pendingQueue.filter(p => p.ngayBC === selectedDate && Number(p.caTruc) === closingShiftModal).length
          }
          isAdmin={isAdmin}
          loading={closingLoading}
          onClose={() => setClosingShiftModal(null)}
          onConfirmCloseShift={() => handleConfirmCloseShift(closingShiftModal)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MainApp />
    </AppErrorBoundary>
  );
}
