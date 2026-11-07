/**
 * ============================================================================
 *  FRONTEND APP – QUẢN LÝ TEST NHANH MIỄN DỊCH (BM.04 / BM.13) - BẢN V2031-CORE
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
  "https://script.google.com/macros/s/AKfycbx0jakdbvQoA9-trw7tF1vsbpdpmJQI4M4Jh0YhFSzEvLQxvO3xvSxLIs3zFj-0b2g/exec";

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
  PENDING_QR_CLAIM: "MD_PENDING_QR_CLAIM_V2031",
});

/* ====== BỘ BẮT TÍN HIỆU QR ĐỒNG BỘ TRƯỚC KHI REACT RENDER (CHỐNG LỖI ZALO/CAMERA) ====== */

export interface PendingQrClaimPayload {
  qrToken: string;
  qrPin: string;
  capturedAt: number;
}

function captureInitialQrFromUrl(): PendingQrClaimPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const searchParams = new URLSearchParams(window.location.search || "");
    let qrToken = (searchParams.get("handover_qr") || "").trim();
    let qrPin = (searchParams.get("pin") || "").replace(/\D/g, "").slice(0, 4);

    if (!qrToken && !qrPin && window.location.hash) {
      const hashClean = window.location.hash.replace(/^#\/?\??/, "");
      const hashParams = new URLSearchParams(hashClean);
      qrToken = (hashParams.get("handover_qr") || "").trim();
      qrPin = (hashParams.get("pin") || "").replace(/\D/g, "").slice(0, 4);
    }

    if (qrToken || qrPin) {
      const payload: PendingQrClaimPayload = {
        qrToken,
        qrPin,
        capturedAt: Date.now(),
      };
      // Lưu đồng thời vào cả sessionStorage và localStorage (có TTL 10 phút) để chống Zalo WebView xóa mất session
      try {
        window.sessionStorage.setItem(
          STORAGE_KEYS.PENDING_QR_CLAIM,
          JSON.stringify(payload)
        );
      } catch {}
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.PENDING_QR_CLAIM,
          JSON.stringify(payload)
        );
        // XÓA NGAY TÀI KHOẢN CŨ ĐANG LƯU TRÊN ĐIỆN THOẠI ĐỂ BẮT BUỘC NGƯỜI NHẬN CA PHẢI ĐĂNG NHẬP
        // (Chặn đứng 100% lỗi quét QR tự nhảy vào bản kiểm với tên Người giao)
        window.localStorage.removeItem(STORAGE_KEYS.AUTH);
        window.localStorage.removeItem(STORAGE_KEYS.CHECKER);
      } catch {}

      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
      return payload;
    }

    // Kiểm tra xem có phiên QR nào vừa được bắt trong vòng 10 phút chưa xử lý không
    const rawSaved =
      window.sessionStorage.getItem(STORAGE_KEYS.PENDING_QR_CLAIM) ||
      window.localStorage.getItem(STORAGE_KEYS.PENDING_QR_CLAIM);
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved) as PendingQrClaimPayload;
      if (
        parsed &&
        (parsed.qrToken || parsed.qrPin) &&
        Date.now() - Number(parsed.capturedAt || 0) < 10 * 60 * 1000
      ) {
        return parsed;
      }
      clearPendingQrClaimStorage();
    }
  } catch {}
  return null;
}

export function readPendingQrClaimStorage(): PendingQrClaimPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEYS.PENDING_QR_CLAIM) ||
      window.localStorage.getItem(STORAGE_KEYS.PENDING_QR_CLAIM);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingQrClaimPayload;
    if (
      parsed &&
      (parsed.qrToken || parsed.qrPin) &&
      Date.now() - Number(parsed.capturedAt || 0) < 10 * 60 * 1000
    ) {
      return parsed;
    }
    clearPendingQrClaimStorage();
  } catch {}
  return null;
}

export function writePendingQrClaimStorage(payload: PendingQrClaimPayload) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEYS.PENDING_QR_CLAIM,
      JSON.stringify(payload)
    );
  } catch {}
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.PENDING_QR_CLAIM,
      JSON.stringify(payload)
    );
  } catch {}
}

export function clearPendingQrClaimStorage() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.PENDING_QR_CLAIM);
  } catch {}
  try {
    window.localStorage.removeItem(STORAGE_KEYS.PENDING_QR_CLAIM);
  } catch {}
}

// Chạy ngay lập tức trước khi React khởi tạo
const INITIAL_CAPTURED_QR = captureInitialQrFromUrl();

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

export interface ShiftSnapshotRow {
  code: string;
  name: string;
  unit: string;
  tonDau: number;
  boiHoan: number;
  suDungQC: number;
  suDung: number;
  tonCuoi: number;
}

export interface HandoverQrState {
  qrToken: string;
  qrPin: string;
  date: string;
  shift: ShiftNumber;
  senderId: string;
  senderName: string;
  gioGiao: string;
  shiftData?: Record<string, { boiHoan: number; suDungQC: number }>;
  shiftSnapshot?: ShiftSnapshotRow[];
  status: "WAITING_SCAN" | "VERIFYING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  verifierId?: string;
  verifierName?: string;
  rejectReason?: string;
  createdAt: number;
  expiresAt: number;
}

export interface CompliancePrintState {
  required: boolean;
  requiredForUserId: string;
  requiredForUserName: string;
  senderName?: string;
  date: string;
  shift: ShiftNumber;
  printedBm04: boolean;
  printedBm13: boolean;
  acceptedAt: number;
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

/* ====================== TIỆN ÍCH NGÀY GIỜ (GMT+7) & CHUẨN HÓA TUỔI 35T ====================== */

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

/**
 * Chuẩn hóa lưu trữ & hiển thị Năm sinh ("1985") / Tuổi ("35T")
 * Đảm bảo khi chọn chế độ Tuổi sẽ luôn lưu và in ra giấy A4 có chữ "T" (VD: 35T) để không nhầm với Năm sinh.
 */
export function formatBirthOrAgeStored(
  rawVal: string,
  isAgeMode?: boolean
): string {
  const clean = String(rawVal || "")
    .trim()
    .toUpperCase();
  if (!clean) return "";
  const numOnly = clean.replace(/T$/i, "").trim();
  const n = Number(numOnly);
  if (
    isAgeMode ||
    /T$/i.test(clean) ||
    (Number.isInteger(n) && n >= 1 && n <= 130)
  ) {
    return `${numOnly}T`;
  }
  return numOnly;
}

export function formatBirthOrAgeDisplay(
  rawVal: string,
  isAgeMode?: boolean
): { text: string; isAge: boolean } {
  const clean = String(rawVal || "")
    .trim()
    .toUpperCase();
  if (!clean) return { text: "", isAge: false };
  const numOnly = clean.replace(/T$/i, "").trim();
  const n = Number(numOnly);
  const isAge =
    Boolean(isAgeMode) ||
    /T$/i.test(clean) ||
    (Number.isInteger(n) && n >= 1 && n <= 130);
  return {
    text: isAge ? `${numOnly}T` : numOnly,
    isAge,
  };
}

/* ============= CHUẨN HÓA BỘ TEST ĐA CHÂN (DRUG4, DENGUE, KSTSR, WIDAL) ============= */

// Giữ nguyên cấu hình thực tế tại Khoa: DRUG4 (tên thầu "test gây nghiện 4 test thử") có 5 chân thực tế không có MET
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

  // Khử trùng lặp tuyệt đối theo RecordID để không bao giờ tính trùng giữa BM04 và PENDING
  const seenRecordIds = new Set<string>();

  const addUsage = (item: QueueItem | null | undefined) => {
    if (!item || String(item.ngayBC || "").trim() !== targetDate) return;
    const recId = String(item.id || "").trim();
    if (recId && seenRecordIds.has(recId)) return;
    const caNum = Number(item.caTruc);
    const ca: ShiftNumber =
      caNum === 1 || caNum === 2 || caNum === 3 || caNum === 4 ? caNum : 1;
    const code = String(item.maTest || "")
      .trim()
      .toUpperCase();
    if (!isStockTestCode(code)) return;
    if (recId) seenRecordIds.add(recId);
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
          Chọn từng chân ({subs.length} chân):
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

export interface LoginSuccessBundle {
  auth: AuthState;
  activeSession?: ActiveSession | null;
  handoverQr?: HandoverQrState | null;
  compliancePrint?: CompliancePrintState | null;
  stickyShift4Date?: string;
}

interface LoginScreenProps {
  apiUrl: string;
  hasPendingQr?: boolean;
  onSuccess: (bundle: LoginSuccessBundle) => void;
  onChangeApiUrl: (nextUrl: string) => void;
}

export function LoginScreen({
  apiUrl,
  hasPendingQr = false,
  onSuccess,
}: LoginScreenProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

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
        res.body.message || "Không thể kết nối máy chủ. Kiểm tra kết nối mạng."
      );
      return;
    }
    if (res.body.status !== "success") {
      setError(res.body.message || "Đăng nhập thất bại.");
      return;
    }
    onSuccess({
      auth: {
        token: res.body.token,
        user: res.body.user,
        mustChange: Boolean(res.body.mustChange),
      },
      activeSession: res.body.activeSession || null,
      handoverQr: (res.body.handoverQr as HandoverQrState | null) || null,
      compliancePrint:
        (res.body.compliancePrint as CompliancePrintState | null) || null,
      stickyShift4Date: String(res.body.stickyShift4Date || ""),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-6 text-center border-b border-amber-400/30">
          {!logoError ? (
            <img
              src="/Quản Lý Test Nhanh Miễn dịch.png"
              onError={() => setLogoError(true)}
              alt="Quản Lý Test Nhanh Miễn Dịch"
              className="w-24 h-24 rounded-3xl object-cover mx-auto mb-3 shadow-xl border-2 border-sky-400/50"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 mb-3">
              <ShieldCheck className="w-9 h-9" />
            </div>
          )}
          <h1 className="text-lg font-black uppercase tracking-wider text-white">
            BỆNH VIỆN ĐA KHOA CÀ MAU
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300 mt-0.5">
            KHOA XÉT NGHIỆM • QUẢN LÝ TEST NHANH MIỄN DỊCH
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {hasPendingQr ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs font-bold space-y-1 shadow-sm">
              <div className="uppercase font-black text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã kết nối Phiên Bàn Giao Ca!</span>
              </div>
              <p className="font-semibold text-[11px] leading-relaxed">
                Hệ thống đã tự động đăng xuất tài khoản cũ. Vui lòng đăng nhập
                bằng tài khoản của{" "}
                <strong className="underline text-emerald-950 font-black">
                  NGƯỜI NHẬN CA
                </strong>{" "}
                để mở ngay bảng Checklist kiểm đếm tủ hóa chất.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 text-[11px] font-semibold text-sky-900 text-center">
              💡 Nếu bạn đang cầm điện thoại nhận bàn giao ca mà không quét được
              QR, cứ đăng nhập tài khoản của bạn — Cổng nhập{" "}
              <strong className="font-black">Mã PIN 4 số dự phòng</strong> sẽ tự
              động hiện ra!
            </div>
          )}

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
            {loading
              ? "Đang xác thực..."
              : hasPendingQr
              ? "Đăng nhập & Mở Checklist Nhận Ca"
              : "Đăng nhập hệ thống"}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] font-black tracking-[0.18em] uppercase bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
              AN INTELLECTUAL PRODUCT OF HANDSOME LONG
            </span>
          </div>
        </form>
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
    if (docChung === "Âm Tính") {
      setErr(
        "Chuẩn ISO 15189: Không được phép lưu kết quả bệnh nhân khi Vạch chứng (C) là Âm tính!"
      );
      return;
    }
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
              Đọc chứng (Control C):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDocChung("Dương tính")}
                className="px-3.5 py-1 rounded-lg text-xs font-black border bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200"
              >
                ● Dương tính (Hợp lệ)
              </button>
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
            Sau khi chốt, hệ thống sẽ sinh Mã QR động (và Mã PIN 4 số) để người
            nhận ca dùng điện thoại kiểm đếm trực tiếp tại tủ hóa chất.
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
                <th className="py-2.5 px-3 text-center">QC/HỎNG</th>
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
              ? "Đang tạo mã QR bàn giao..."
              : `Xác nhận chốt Ca ${shift} & Tạo QR`}
          </button>
        </div>
      </div>
    </div>
  );
}
/* ============ BỘ KHÓA CHỐT CA TUẦN TỰ (1 -> 2 -> 3 -> 4) & QUYỀN ADMIN ============ */

/**
 * Kiểm tra điều kiện chốt ca tuần tự:
 * - Admin: Quyền tối thượng, luôn trả về "" (cho phép thao tác mọi ca).
 * - User: Phải hoàn tất (HOAN_THANH) Ca 1 mới được chốt Ca 2, xong Ca 2 mới được chốt Ca 3, xong Ca 3 mới được chốt Ca 4.
 *   Đồng thời nếu Ca 4 ngày hôm trước chưa hoàn tất bàn giao thì chưa cho phép chốt Ca 1 ngày hôm nay.
 */
export function getSequentialShiftBlockReason(
  targetShift: ShiftNumber,
  computed: DayComputed,
  isAdmin: boolean,
  yesterdayCa4Pending?: {
    date: string;
    shift: ShiftNumber;
    status: ShiftStatus;
    nguoiGiao: string;
  } | null,
  isTodaySelected = true
): string {
  if (isAdmin) return "";

  if (yesterdayCa4Pending && isTodaySelected) {
    return `Ca 4 ngày hôm qua (${formatDateDisplay(
      yesterdayCa4Pending.date
    )}) chưa hoàn tất bàn giao. Vui lòng hoàn tất Ca 4 hôm qua trước khi chốt Ca ${targetShift}!`;
  }

  for (let prev = 1; prev < targetShift; prev++) {
    const prevCa = prev as ShiftNumber;
    const prevMeta = computed.meta[prevCa];
    const prevStatus = prevMeta?.trangThai || "OPEN";
    if (prevStatus === "OPEN") {
      return `Chốt ca tuần tự (1 → 2 → 3 → 4): Bạn phải chốt và bàn giao xong Ca ${prevCa} trước khi chốt Ca ${targetShift}!`;
    }
    if (prevStatus === "PENDING_RECEIVE") {
      return `Chốt ca tuần tự: Ca ${prevCa} (giao bởi ${
        prevMeta?.nguoiGiao || "ca trước"
      }) đang chờ người nhận ký nhận bàn giao. Vui lòng hoàn tất nhận Ca ${prevCa} trước khi chốt Ca ${targetShift}!`;
    }
  }

  return "";
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
  forceAllFilters?: boolean;
}

export function PrintBm04({
  selectedDate,
  logs,
  testsConfig,
  forceAllFilters = false,
}: PrintBm04Props) {
  const [filterTest, setFilterTest] = useState<string>("ALL");
  const [filterShift, setFilterShift] = useState<string>("ALL");

  // Nếu đang trong chế độ Khóa cứng bắt buộc in 2 biểu mẫu Ca 4, tự động ép về ALL để in trọn vẹn cả 4 ca của ngày đó
  useEffect(() => {
    if (forceAllFilters) {
      setFilterTest("ALL");
      setFilterShift("ALL");
    }
  }, [forceAllFilters, selectedDate]);

  const effectiveFilterTest = forceAllFilters ? "ALL" : filterTest;
  const effectiveFilterShift = forceAllFilters ? "ALL" : filterShift;

  const dayLogs = useMemo(() => {
    const list = logs.filter((l) => {
      if (String(l.ngayBC || "").trim() !== selectedDate) return false;
      if (effectiveFilterTest !== "ALL" && l.maTest !== effectiveFilterTest)
        return false;
      if (
        effectiveFilterShift !== "ALL" &&
        Number(l.caTruc) !== Number(effectiveFilterShift)
      )
        return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(a.timestamp || "").localeCompare(String(b.timestamp || ""));
    });
  }, [logs, selectedDate, effectiveFilterTest, effectiveFilterShift]);

  const ROWS_PER_PAGE = 16;
  const totalPages = Math.max(1, Math.ceil(dayLogs.length / ROWS_PER_PAGE));

  const pages = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalPages; i++) {
      const chunk: (QueueItem | null)[] = dayLogs.slice(
        i * ROWS_PER_PAGE,
        (i + 1) * ROWS_PER_PAGE
      );
      while (chunk.length < ROWS_PER_PAGE) {
        chunk.push(null);
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
            value={effectiveFilterShift}
            disabled={forceAllFilters}
            onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 disabled:opacity-60"
          >
            <option value="ALL">Tất cả các Ca (Ca 1 → Ca 4)</option>
            <option value="1">Chỉ in Ca 1 (07h00 - 11h00)</option>
            <option value="2">Chỉ in Ca 2 (11h00 - 13h30)</option>
            <option value="3">Chỉ in Ca 3 (13h30 - 17h00)</option>
            <option value="4">Chỉ in Ca 4 (17h00 - 07h00)</option>
          </select>

          <select
            value={effectiveFilterTest}
            disabled={forceAllFilters}
            onChange={(e) => setFilterTest(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 disabled:opacity-60"
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

      {pages.map((pageRows, pageIndex) => (
        <div
          key={pageIndex}
          className="print-sheet bg-white px-2 py-1 text-black"
          style={{
            pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
          }}
        >
          <div className="flex items-end justify-between mb-2 border-b-2 border-black pb-1">
            <div className="text-xs font-bold">
              Sổ lưu kết quả xét nghiệm thực hiện thủ công (Ngày:{" "}
              {formatDateDisplay(selectedDate)})
            </div>
            <div className="text-xs font-bold">BM.04.XN.QTQL.37</div>
          </div>

          <table className="w-full border-collapse border border-black text-[10px] text-center table-fixed">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th rowSpan={2} className="border border-black p-1 w-[3%]">
                  STT
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[13%]">
                  TÊN XÉT NGHIỆM
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-left w-[15%]"
                >
                  HỌ VÀ TÊN BỆNH NHÂN
                </th>
                <th colSpan={2} className="border border-black p-1 w-[6%]">
                  NĂM SINH
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[8%]">
                  BARCODE
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[7%]">
                  ĐỌC CHỨNG
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[22%]">
                  KẾT QUẢ
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[8%]">
                  THỜI GIAN ĐỌC KQ
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[9%]">
                  NGƯỜI THỰC HIỆN
                </th>
                <th rowSpan={2} className="border border-black p-1 w-[9%]">
                  NGƯỜI KIỂM TRA
                </th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-[3%]">Nam</th>
                <th className="border border-black p-1 w-[3%]">Nữ</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => {
                const namDisplay = r
                  ? formatBirthOrAgeDisplay(r.namSinhNam, r.isAgeMode).text
                  : "";
                const nuDisplay = r
                  ? formatBirthOrAgeDisplay(r.namSinhNu, r.isAgeMode).text
                  : "";
                return (
                  <tr
                    key={r ? r.id : `empty_${pageIndex}_${idx}`}
                    className="h-[36px]"
                  >
                    <td className="border border-black px-1 py-0.5 font-semibold">
                      {r ? pageIndex * ROWS_PER_PAGE + idx + 1 : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 font-bold uppercase truncate">
                      {r ? r.tenXetNghiem : ""}
                    </td>
                    <td className="border border-black px-2 py-0.5 text-left font-bold uppercase truncate">
                      {r ? r.hoTenBN : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 font-semibold">
                      {namDisplay}
                    </td>
                    <td className="border border-black px-1 py-0.5 font-semibold">
                      {nuDisplay}
                    </td>
                    <td className="border border-black px-1 py-0.5 font-bold truncate">
                      {r ? r.barcode : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 font-semibold truncate">
                      {r ? r.docChung : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5">
                      {renderKetQuaBM04(r)}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold truncate">
                      {r ? r.thoiGianDocKQ : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold truncate">
                      {r ? r.nguoiThucHien : ""}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-[9.5px] font-semibold truncate">
                      {r ? r.nguoiKiemTra : ""}
                    </td>
                  </tr>
                );
              })}
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

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Danh mục
              Xét nghiệm & Cơ số Tồn kho
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Lưu ý: Mã WIDAL được cấu hình đặc biệt (8 chân, chỉ ghi nhận
              BM.04, miễn trừ tồn kho BM.13). DRUG4 giữ nguyên 5 chân thực tế.
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

/* ====================== ÂM BÁO ĐỘNG Y TẾ & CÁC MODAL QR / PIN / KHÓA IN ====================== */

export type TabKey = "WORK" | "BM13" | "PRINT_BM04" | "PRINT_BM13" | "ADMIN";

export interface ToastNotice {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

/**
 * Âm báo động Y tế công suất cực đại (High-Gain Penetrating Alarm):
 * Tối ưu hóa biên độ âm thanh và tần số sắc bén để cắt ngang tiếng ồn máy ly tâm/xét nghiệm.
 */
export function playTripleBeepAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Kích hoạt bộ khuếch đại nén tối đa (Max Compression & Gain) để âm thanh đạt độ lớn sắc nét nhất
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.knee.setValueAtTime(0, ctx.currentTime);
    compressor.ratio.setValueAtTime(20, ctx.currentTime);
    compressor.attack.setValueAtTime(0, ctx.currentTime);
    compressor.release.setValueAtTime(0.2, ctx.currentTime);
    compressor.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(2.0, ctx.currentTime); // Khuếch đại biên độ x2 lần
    masterGain.connect(compressor);

    // 3 hồi bíp dồn dập (Mỗi hồi 3 tiếng) đặc trưng của thiết bị y tế cấp cứu
    const beepOffsets = [0, 0.15, 0.3, 0.7, 0.85, 1.0, 1.4, 1.55, 1.7];

    beepOffsets.forEach((offsetSec) => {
      const startTime = ctx.currentTime + offsetSec;
      const stopTime = startTime + 0.12;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc1.type = "square";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(1046.5, startTime); // Nốt Do cao (C6) - cực kỳ chói tai, dễ nhận biết
      osc2.frequency.setValueAtTime(2093.0, startTime); // Nốt Do cao hơn (C7) - tạo độ ngân sắc bén

      noteGain.gain.setValueAtTime(0.01, startTime);
      noteGain.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
      noteGain.gain.setValueAtTime(1.0, startTime + 0.09);
      noteGain.gain.linearRampToValueAtTime(0.001, stopTime);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(masterGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
    });

    window.setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 2500);
  } catch {}
}

interface PcHandoverQrModalProps {
  qrState: HandoverQrState | null;
  nowMs: number;
  cancelLoading: boolean;
  onCancelAndUnlock: () => void;
}

export function PcHandoverQrModal({
  qrState,
  nowMs,
  cancelLoading,
  onCancelAndUnlock,
}: PcHandoverQrModalProps) {
  const [useFallbackQrImg, setUseFallbackQrImg] = useState(false);

  useEffect(() => {
    setUseFallbackQrImg(false);
  }, [qrState?.qrToken]);

  if (!qrState) return null;

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  const mobileVerifyUrl = `${baseUrl}?handover_qr=${encodeURIComponent(
    qrState.qrToken
  )}&pin=${encodeURIComponent(qrState.qrPin)}`;

  const primaryQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(
    mobileVerifyUrl
  )}`;
  const backupQrSrc = `https://quickchart.io/qr?size=280&margin=2&text=${encodeURIComponent(
    mobileVerifyUrl
  )}`;

  const remainMs = Math.max(0, Number(qrState.expiresAt || 0) - nowMs);
  const isVerifying = qrState.status === "VERIFYING";

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-sky-400 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase tracking-wider">
            <Clock className="w-4 h-4 text-sky-600 animate-spin" />
            <span>
              Chờ Đối Soát Di Động • Ca {qrState.shift} (
              {formatDateDisplay(qrState.date)})
            </span>
          </div>
          <h3 className="text-lg font-black uppercase text-slate-900">
            Quét Mã QR Hoặc Dùng Mã PIN 4 Số Dự Phòng
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            Người giao:{" "}
            <strong className="text-slate-900">{qrState.senderName}</strong> (
            {qrState.gioGiao})
          </p>
        </div>

        {isVerifying ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-1 animate-pulse">
            <div className="text-xs font-black uppercase text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã kết nối thiết bị di động của Người nhận!
            </div>
            <div className="text-xs font-semibold">
              Đồng nghiệp{" "}
              <strong className="font-black underline">
                {qrState.verifierName || "Người nhận"}
              </strong>{" "}
              đang cầm điện thoại tích Checklist ngoài tủ hóa chất...
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold leading-relaxed">
            Cách 1: Người nhận dùng Camera / Zalo quét mã QR bên dưới.
            <br />
            Cách 2 (Không cần QR): Người nhận tự mở link phần mềm trên điện
            thoại và đăng nhập — cửa sổ nhập{" "}
            <strong className="underline text-rose-700">
              Mã PIN 4 số dự phòng
            </strong>{" "}
            sẽ tự động bật lên!
          </div>
        )}

        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-3xl border-4 border-slate-900 shadow-lg inline-block">
            <img
              src={useFallbackQrImg ? backupQrSrc : primaryQrSrc}
              onError={() => setUseFallbackQrImg(true)}
              alt="QR Bàn Giao Ca"
              className="w-56 h-56 object-contain mx-auto"
            />
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1 shadow-inner">
          <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">
            Mã PIN Dự Phòng (Nhập trên điện thoại nếu không quét được QR)
          </div>
          <div className="text-3xl font-black tracking-[0.35em] text-amber-300 font-mono pl-3">
            {qrState.qrPin}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
          <span>Tự động mở khóa nếu không phản hồi sau:</span>
          <span className="font-mono text-sm font-black text-rose-600">
            {formatCountdownMmSs(remainMs)}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            disabled={cancelLoading}
            onClick={onCancelAndUnlock}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider transition"
          >
            {cancelLoading
              ? "Đang mở khóa lại ca trực..."
              : "↺ Hủy Chốt & Mở Khóa Ngay Để Sửa Lại Số Liệu Trên PC"}
          </button>
          <span className="text-[11px] font-semibold text-slate-400">
            Màn hình PC này sẽ tự động đăng xuất ngay khi người nhận bấm
            &quot;Xác nhận Nhận bàn giao&quot; trên điện thoại.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ====== GIAO DIỆN MOBILE CHECKLIST KIỂM ĐẾM TỦ HÓA CHẤT & BẮT BUỘC ĐĂNG XUẤT ====== */

const QUICK_REJECT_REASONS = [
  "Lệch số lượng tồn thực tế trong tủ hóa chất",
  "Chưa nhập hoặc nhập sai số lượng Bồi hoàn trong ca",
  "Chưa nhập số lượng Sử dụng QC / Hỏng",
  "Còn mẫu bệnh nhân thực tế chưa vào sổ BM.04",
];

interface MobileHandoverChecklistModalProps {
  qrState: HandoverQrState | null;
  fallbackRows: ShiftSnapshotRow[];
  verifierName: string;
  isOnline: boolean;
  submitting: boolean;
  acceptedMustLogout: boolean;
  onAcceptHandover: (verifierName: string) => void;
  onRejectHandover: (reason: string) => void;
  onMandatoryMobileLogout: () => void;
  onCloseWithoutAction: () => void;
}

export function MobileHandoverChecklistModal({
  qrState,
  fallbackRows,
  verifierName,
  isOnline,
  submitting,
  acceptedMustLogout,
  onAcceptHandover,
  onRejectHandover,
  onMandatoryMobileLogout,
  onCloseWithoutAction,
}: MobileHandoverChecklistModalProps) {
  const rows: ShiftSnapshotRow[] = useMemo(() => {
    if (qrState?.shiftSnapshot && qrState.shiftSnapshot.length > 0)
      return qrState.shiftSnapshot;
    return fallbackRows;
  }, [qrState?.shiftSnapshot, fallbackRows]);

  const storageKey = qrState?.qrToken ? `QLTN_QR_CHECK_${qrState.qrToken}` : "";

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [selectedQuickReason, setSelectedQuickReason] = useState<string>(
    QUICK_REJECT_REASONS[0]
  );
  const [customRejectDetail, setCustomRejectDetail] = useState<string>("");

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setCheckedMap(JSON.parse(saved) || {});
      else setCheckedMap({});
    } catch {
      setCheckedMap({});
    }
    setShowRejectBox(false);
    setCustomRejectDetail("");
  }, [storageKey]);

  const toggleCheckItem = (code: string) => {
    setCheckedMap((prev) => {
      const next = { ...prev, [code]: !prev[code] };
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  if (!qrState) return null;

  const totalCount = rows.length;
  const checkedCount = rows.filter((r) => Boolean(checkedMap[r.code])).length;
  const isAllChecked = totalCount > 0 && checkedCount === totalCount;
  const progressPct =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const displayVerifierName =
    verifierName || qrState.verifierName || "Người nhận";

  // MÀN HÌNH BẮT BUỘC ĐĂNG XUẤT TRÊN ĐIỆN THOẠI SAU KHI KÝ NHẬN THÀNH CÔNG (KHÓA CỨNG 100%)
  if (acceptedMustLogout) {
    return (
      <div className="no-print fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-emerald-500 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
              Hoàn tất đối soát 100%
            </span>
            <h3 className="text-lg font-black uppercase text-slate-900">
              Ký Nhận Bàn Giao Ca {qrState.shift} Thành Công!
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              Ngày {formatDateDisplay(qrState.date)} • Người nhận:{" "}
              <strong className="text-emerald-700">
                {displayVerifierName}
              </strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-left space-y-2">
            <div className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Bước tiếp theo (Bắt buộc):
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              1. Vui lòng bấm nút{" "}
              <strong className="text-rose-700 underline">
                Đăng xuất khỏi điện thoại
              </strong>{" "}
              ngay bên dưới để đóng phiên kiểm đếm di động.
            </p>
            <p className="text-xs font-semibold leading-relaxed">
              2. Mời bạn bước ra máy tính (PC) đăng nhập tài khoản{" "}
              <strong className="text-slate-900">{displayVerifierName}</strong>{" "}
              để làm việc chuyên môn
              {Number(qrState.shift) === 4
                ? ` (Khi đăng nhập vào PC, hệ thống sẽ tự động mở khóa cứng yêu cầu in đủ 2 sổ BM.04 & BM.13 của ngày ${formatDateDisplay(
                    qrState.date
                  )} trước khi sang ngày mới).`
                : "."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (storageKey) {
                try {
                  window.localStorage.removeItem(storageKey);
                } catch {}
              }
              onMandatoryMobileLogout();
            }}
            className="w-full py-4 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 animate-bounce"
          >
            <LogOut className="w-5 h-5" />
            Đăng Xuất Khỏi Điện Thoại Ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-700 shadow-md shrink-0">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[11px] font-black uppercase">
              Checklist Tủ Hóa Chất • Ca {qrState.shift} (
              {formatDateDisplay(qrState.date)})
            </span>
            {!isOnline && (
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                Ngoại tuyến (Đã lưu tạm)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Giao: <strong className="text-white">{qrState.senderName}</strong>
            </span>
            <span className="text-slate-300">
              Nhận:{" "}
              <strong className="text-emerald-300">
                {displayVerifierName}
              </strong>
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span
                className={isAllChecked ? "text-emerald-400" : "text-amber-300"}
              >
                {isAllChecked
                  ? "✅ Đã kiểm đếm đủ 100% danh mục test!"
                  : `👉 Vui lòng đếm và tích đủ từng hàng: ${checkedCount}/${totalCount} (${progressPct}%)`}
              </span>
              {checkedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCheckedMap({});
                    if (storageKey) {
                      try {
                        window.localStorage.removeItem(storageKey);
                      } catch {}
                    }
                  }}
                  className="text-[10px] font-bold text-slate-400 underline"
                >
                  Bỏ tích lại
                </button>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllChecked ? "bg-emerald-500" : "bg-sky-500"
                }`}
                style={{ width: `${Math.max(4, progressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="max-w-lg mx-auto space-y-2.5 pb-6">
          {rows.map((r, idx) => {
            const isChecked = Boolean(checkedMap[r.code]);
            const totalUsed =
              (Number(r.suDung) || 0) + (Number(r.suDungQC) || 0);
            return (
              <div
                key={r.code}
                onClick={() => toggleCheckItem(r.code)}
                className={`rounded-2xl p-3.5 border-2 transition cursor-pointer select-none flex items-center justify-between gap-3 shadow-sm ${
                  isChecked
                    ? "bg-emerald-50/95 border-emerald-500 text-slate-900"
                    : "bg-white border-slate-200 hover:border-sky-300 text-slate-800"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-black uppercase truncate text-slate-900">
                      {r.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-semibold">
                    <div className="bg-slate-100 rounded-lg px-2 py-1 text-center">
                      <span className="block text-[9px] uppercase text-slate-500 font-bold">
                        Tồn đầu
                      </span>
                      <span className="font-black text-slate-800">
                        {r.tonDau}
                      </span>
                    </div>
                    <div className="bg-emerald-100/70 rounded-lg px-2 py-1 text-center">
                      <span className="block text-[9px] uppercase text-emerald-700 font-bold">
                        +Bồi hoàn
                      </span>
                      <span className="font-black text-emerald-700">
                        {r.boiHoan > 0 ? `+${r.boiHoan}` : "0"}
                      </span>
                    </div>
                    <div className="bg-rose-100/70 rounded-lg px-2 py-1 text-center">
                      <span className="block text-[9px] uppercase text-rose-700 font-bold">
                        -Đã dùng
                      </span>
                      <span className="font-black text-rose-600">
                        {totalUsed > 0 ? `-${totalUsed}` : "0"}
                      </span>
                    </div>
                    <div className="bg-sky-100 rounded-lg px-2 py-1 text-center border border-sky-300">
                      <span className="block text-[9px] uppercase text-sky-800 font-black">
                        Tồn cuối
                      </span>
                      <span className="text-sm font-black text-sky-900">
                        {r.tonCuoi}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition ${
                    isChecked
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md scale-105"
                      : "bg-slate-50 border-slate-300 text-transparent"
                  }`}
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border-t-2 border-slate-200 p-3.5 shadow-2xl shrink-0">
        <div className="max-w-lg mx-auto space-y-2.5">
          {showRejectBox ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2.5">
              <div className="text-xs font-black uppercase text-rose-900 flex items-center justify-between">
                <span>
                  Chọn lý do không nhận bàn giao (Để mở khóa cho PC sửa):
                </span>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="text-[11px] font-bold text-slate-500 underline"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-1.5">
                {QUICK_REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedQuickReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedQuickReason === reason
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customRejectDetail}
                onChange={(e) => setCustomRejectDetail(e.target.value)}
                placeholder="Ghi chú thêm tên test lệch (VD: NS1 thực đếm còn 18)..."
                className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-bold bg-white focus:outline-none"
              />

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const finalReason = customRejectDetail.trim()
                    ? `${selectedQuickReason} (${customRejectDetail.trim()})`
                    : selectedQuickReason;
                  if (
                    window.confirm(
                      `Xác nhận TỪ CHỐI NHẬN BÀN GIAO và mở khóa Ca ${qrState.shift} để người giao điều chỉnh lại số liệu trên PC?`
                    )
                  ) {
                    if (storageKey) {
                      try {
                        window.localStorage.removeItem(storageKey);
                      } catch {}
                    }
                    onRejectHandover(finalReason);
                  }
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-md"
              >
                {submitting
                  ? "Đang mở khóa ca trực..."
                  : "🔓 Xác Nhận Từ Chối & Mở Khóa Cho PC Sửa Lại"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {isAllChecked ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                    <span className="block text-[11px] font-black uppercase text-emerald-800 mb-0.5">
                      Xác nhận nhận bàn giao với tên:
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {displayVerifierName}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onAcceptHandover(displayVerifierName)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {submitting
                      ? "Đang ký nhận bàn giao..."
                      : `Xác Nhận Nhận Bàn Giao Ca ${qrState.shift} (100%)`}
                  </button>
                </div>
              ) : (
                <div className="w-full py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-center text-[11px] font-bold text-slate-500">
                  🔒 Nút &quot;Xác nhận Nhận bàn giao&quot; sẽ hiện ra khi bạn
                  tích kiểm đếm đủ {totalCount}/{totalCount} hàng test.
                </div>
              )}

              <div className="grid grid-cols-12 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowRejectBox(true)}
                  className="col-span-8 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black uppercase"
                >
                  ❌ Không Nhận Bàn Giao (Mở khóa sửa)
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onCloseWithoutAction}
                  className="col-span-4 py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                >
                  Đổi TK / Thoát
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====== CỔNG CHẶN NHẬP MÃ PIN 4 SỐ DỰ PHÒNG TRÊN ĐIỆN THOẠI (CHẶN BAY THẲNG VÀO APP) ====== */

interface ManualPinClaimModalProps {
  open: boolean;
  loading: boolean;
  interceptMode?: boolean;
  pendingQrInfo?: HandoverQrState | null;
  currentUserName?: string;
  onClose: () => void;
  onLogout?: () => void;
  onSubmitPin: (pin: string) => void;
}

export function ManualPinClaimModal({
  open,
  loading,
  interceptMode = false,
  pendingQrInfo = null,
  currentUserName = "",
  onClose,
  onLogout,
  onSubmitPin,
}: ManualPinClaimModalProps) {
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    if (open) setPinInput("");
  }, [open]);

  if (!open) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4 || loading) return;
    onSubmitPin(pinInput);
  };

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <form
        onSubmit={handleConfirm}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase">
            {pendingQrInfo
              ? `Đang Chờ Nhận Bàn Giao Ca ${
                  pendingQrInfo.shift
                } (${formatDateDisplay(pendingQrInfo.date)})`
              : "Cổng Xác Thực Mã PIN Bàn Giao Ca"}
          </span>
          <h3 className="text-base font-black uppercase text-slate-900 leading-snug pt-1">
            Rất tiếc bạn đã không sử dụng được QRcode, vui lòng nhập mã PIN dự
            phòng
          </h3>
          {pendingQrInfo && (
            <p className="text-xs font-semibold text-slate-600">
              Người giao:{" "}
              <strong className="text-slate-900">
                {pendingQrInfo.senderName}
              </strong>{" "}
              • Người nhận:{" "}
              <strong className="text-emerald-700">{currentUserName}</strong>
            </p>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs font-semibold leading-relaxed">
          Vui lòng nhìn lên màn hình máy tính (PC) và nhập{" "}
          <strong className="font-black text-rose-600">
            4 chữ số Mã PIN Dự Phòng
          </strong>{" "}
          bên dưới để mở ngay{" "}
          <strong className="underline">Bảng Checklist Kiểm Đếm</strong> (Hệ
          thống khóa cổng không cho vào giao diện chính cho đến khi hoàn tất
          kiểm đếm nhận ca).
        </div>

        <input
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={4}
          value={pinInput}
          onChange={(e) =>
            setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="••••"
          className="w-full py-3.5 rounded-2xl border-2 border-sky-500 text-center text-3xl font-black tracking-[0.4em] text-slate-900 font-mono focus:outline-none focus:ring-4 focus:ring-sky-500/20"
        />

        <div className="flex items-center gap-2 pt-1">
          {interceptMode ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase"
            >
              Đăng xuất / Đổi TK
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase"
            >
              Đóng
            </button>
          )}
          <button
            type="submit"
            disabled={pinInput.length < 4 || loading}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase shadow-lg transition"
          >
            {loading ? "Đang mở Checklist..." : "Mở Bản Checklist →"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ====== KHÓA CỨNG TUÂN THỦ ISO 15189: BẮT BUỘC IN ĐỦ 2 BIỂU MẪU (CHỈ ÁP DỤNG CA 4) ====== */

interface CompliancePrintLockModalProps {
  state: CompliancePrintState | null;
  activeTab: TabKey;
  printingForm: "BM04" | "BM13" | null;
  onTriggerPrintForm: (form: "BM04" | "BM13") => void;
}

export function CompliancePrintLockModal({
  state,
  activeTab,
  printingForm,
  onTriggerPrintForm,
}: CompliancePrintLockModalProps) {
  const [minimizedOnPrintTab, setMinimizedOnPrintTab] = useState(false);

  // CHỈ KÍCH HOẠT KHÓA CỨNG IN ẤN NẾU ĐÚNG LÀ CA 4
  if (!state || !state.required || Number(state.shift) !== 4) return null;

  const isOnPrintPreview =
    activeTab === "PRINT_BM04" || activeTab === "PRINT_BM13";

  if (isOnPrintPreview && minimizedOnPrintTab) {
    return (
      <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[95%] bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold">
          <span className="text-amber-300 font-black uppercase">
            ⚠️ Khóa cứng bắt buộc in 2 biểu mẫu (Ca {state.shift} - Ngày{" "}
            {formatDateDisplay(state.date)}):
          </span>{" "}
          BM.04 [{state.printedBm04 ? "✅ Đã in" : "⏳ Chưa in"}] • BM.13 [
          {state.printedBm13 ? "✅ Đã in" : "⏳ Chưa in"}]
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTriggerPrintForm("BM04")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
              state.printedBm04
                ? "bg-emerald-700 text-white"
                : "bg-amber-500 text-slate-950"
            }`}
          >
            🖨️ In BM.04 ({formatDateDisplay(state.date)})
          </button>
          <button
            type="button"
            onClick={() => onTriggerPrintForm("BM13")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
              state.printedBm13
                ? "bg-emerald-700 text-white"
                : "bg-amber-500 text-slate-950"
            }`}
          >
            🖨️ In BM.13 ({formatDateDisplay(state.date)})
          </button>
          <button
            type="button"
            onClick={() => setMinimizedOnPrintTab(false)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-700 text-[11px] font-bold"
          >
            Mở rộng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-amber-500 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Printer className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase">
            Khóa Cứng Tuân Thủ ISO 15189 • Chốt Ca 4 Cuối Ngày
          </span>
          <h3 className="text-lg font-black uppercase text-slate-900 leading-snug">
            Bạn Phải In Cả 2 Biểu Mẫu Của Ngày {formatDateDisplay(state.date)}{" "}
            Mới Có Thể Bắt Đầu Phiên Làm Việc Mới!
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            Ca trực vừa nhận bàn giao:{" "}
            <strong className="text-slate-900">
              Ca {state.shift} (Ngày làm việc: {formatDateDisplay(state.date)})
            </strong>{" "}
            • Người nhận:{" "}
            <strong className="text-emerald-700">
              {state.requiredForUserName}
            </strong>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold text-left leading-relaxed">
          Hệ thống đã{" "}
          <strong className="text-sky-800 underline">
            neo cứng dữ liệu ở ngày {formatDateDisplay(state.date)}
          </strong>{" "}
          (trọn vẹn 4 ca: Ca 1, Ca 2, Ca 3, Ca 4 của ngày{" "}
          {formatDateDisplay(state.date)}, tuyệt đối không bị nhảy nhầm sang
          trang trắng ngày mới). Ngay sau khi bạn bấm in đủ 2 biểu mẫu bên dưới,
          hệ thống sẽ tự động mở khóa và chuyển sang Ca 1 của ngày mới!
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={printingForm !== null}
            onClick={() => onTriggerPrintForm("BM04")}
            className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 shadow-sm ${
              state.printedBm04
                ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                : "bg-sky-600 hover:bg-sky-500 border-sky-600 text-white shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase opacity-90">
                Biểu mẫu 1
              </span>
              {state.printedBm04 ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                  ✓ Đã in xong
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Bắt buộc in
                </span>
              )}
            </div>
            <div className="text-sm font-black uppercase flex items-center gap-1.5">
              <Printer className="w-4 h-4 shrink-0" />
              <span>
                {printingForm === "BM04"
                  ? "Đang mở lệnh in..."
                  : "1. In Sổ BM.04"}
              </span>
            </div>
            <div className="text-[11px] font-semibold opacity-85">
              Trọn bộ 4 ca ngày {formatDateDisplay(state.date)}
            </div>
          </button>

          <button
            type="button"
            disabled={printingForm !== null}
            onClick={() => onTriggerPrintForm("BM13")}
            className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 shadow-sm ${
              state.printedBm13
                ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                : "bg-indigo-600 hover:bg-indigo-500 border-indigo-600 text-white shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase opacity-90">
                Biểu mẫu 2
              </span>
              {state.printedBm13 ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                  ✓ Đã in xong
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Bắt buộc in
                </span>
              )}
            </div>
            <div className="text-sm font-black uppercase flex items-center gap-1.5">
              <Printer className="w-4 h-4 shrink-0" />
              <span>
                {printingForm === "BM13"
                  ? "Đang mở lệnh in..."
                  : "2. In Sổ BM.13"}
              </span>
            </div>
            <div className="text-[11px] font-semibold opacity-85">
              Tồn kho 4 ca ngày {formatDateDisplay(state.date)}
            </div>
          </button>
        </div>

        {isOnPrintPreview && (
          <button
            type="button"
            onClick={() => setMinimizedOnPrintTab(true)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
          >
            👁️ Thu gọn bảng này xuống đáy màn hình để xem trước biểu mẫu
          </button>
        )}
      </div>
    </div>
  );
}
/* ====================== LÕI ĐIỀU PHỐI TRUNG TÂM (MAIN APP - PHẦN 4.1) ====================== */

export function MainApp() {
  const [apiUrl, setApiUrl] = usePersistentState<string>(
    STORAGE_KEYS.API_URL,
    DEFAULT_API_URL,
    (v) => typeof v === "string" && v.length > 5
  );

  const [auth, setAuth] = usePersistentState<AuthState | null>(
    STORAGE_KEYS.AUTH,
    null,
    (v) =>
      v === null ||
      (typeof v === "object" &&
        typeof v.token === "string" &&
        v.user &&
        typeof v.user.id === "string")
  );

  const [checker, setChecker] = usePersistentState<CheckerState | null>(
    STORAGE_KEYS.CHECKER,
    null,
    (v) =>
      v === null ||
      (typeof v === "object" &&
        typeof v.id === "string" &&
        typeof v.proof === "string")
  );

  const [testsConfig, setTestsConfig] = usePersistentState<TestConfig[]>(
    STORAGE_KEYS.TESTS,
    DEFAULT_TESTS,
    (v) => Array.isArray(v) && v.length > 0
  );

  const [bm04Logs, setBm04Logs] = usePersistentState<QueueItem[]>(
    STORAGE_KEYS.BM04,
    [],
    (v) => Array.isArray(v)
  );

  const [pendingQueue, setPendingQueue] = usePersistentState<QueueItem[]>(
    STORAGE_KEYS.PENDING,
    [],
    (v) => Array.isArray(v)
  );

  const [bm13Raw, setBm13Raw] = usePersistentState<RawBM13Row[]>(
    STORAGE_KEYS.BM13_RAW,
    [],
    (v) => Array.isArray(v)
  );

  const [dirtyBm13, setDirtyBm13] = usePersistentState<Record<string, any>>(
    STORAGE_KEYS.BM13_DIRTY,
    {},
    (v) => Boolean(v && typeof v === "object" && !Array.isArray(v))
  );

  const [drafts, setDrafts] = usePersistentState<Record<string, DraftResult>>(
    STORAGE_KEYS.DRAFTS,
    {},
    (v) => Boolean(v && typeof v === "object" && !Array.isArray(v))
  );

  const [timers, setTimers] = usePersistentState<Record<string, PatientTimer>>(
    STORAGE_KEYS.TIMERS,
    {},
    (v) => Boolean(v && typeof v === "object" && !Array.isArray(v))
  );

  const [outbox, setOutbox] = usePersistentState<OutboxItem[]>(
    STORAGE_KEYS.OUTBOX,
    [],
    (v) => Array.isArray(v)
  );

  const [dataVersion, setDataVersion] = usePersistentState<string>(
    STORAGE_KEYS.DATA_VERSION,
    "0",
    (v) => typeof v === "string"
  );

  // Đảm bảo danh mục luôn có WIDAL (miễn trừ tồn kho)
  useEffect(() => {
    if (
      !testsConfig.some((t) => String(t.code || "").toUpperCase() === "WIDAL")
    ) {
      setTestsConfig((prev) => [
        ...prev,
        { code: "WIDAL", name: "WIDAL", unit: "TEST", quota: 0, noStock: true },
      ]);
    }
  }, [testsConfig, setTestsConfig]);

  // Nếu đổi tài khoản chính thì xóa chữ ký Người kiểm tra của phiên trước
  useEffect(() => {
    if (
      auth &&
      checker &&
      checker.verifiedForUserId.toLowerCase() !== auth.user.id.toLowerCase()
    ) {
      setChecker(null);
    }
  }, [auth, checker, setChecker]);

  const [activeTab, setActiveTab] = useState<TabKey>("WORK");
  const [nowTick, setNowTick] = useState<Date>(() => getTrustedNow());
  const todayStr = useMemo(() => businessDate(nowTick), [nowTick]);
  const realShift = useMemo(() => shiftOfDay(nowTick), [nowTick]);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    businessDate()
  );
  const [stickyShift4Date, setStickyShift4Date] = useState<string>("");
  const [adminShiftOverride, setAdminShiftOverride] =
    useState<ShiftNumber | null>(null);
  const datePickedRef = useRef<boolean>(false);
  const loadedCloudDateRef = useRef<string>("");

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [sessionEpoch, setSessionEpoch] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [headerLogoErr, setHeaderLogoErr] = useState<boolean>(false);

  // State cho Form thêm Bệnh nhân (Cột 1 - Tab 1)
  const [hoTenBN, setHoTenBN] = useState("");
  const [gioiTinh, setGioiTinh] = useState<"Nam" | "Nu">("Nam");
  const [namSinh, setNamSinh] = useState("");
  const [isAgeMode, setIsAgeMode] = useState<boolean>(false);
  const [barcode, setBarcode] = useState("");
  const [docChungDefault] = useState<DocChungValue>("Dương tính");
  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>([]);
  const [journalShiftFilter, setJournalShiftFilter] = useState<
    "ALL" | ShiftNumber
  >("ALL");

  // State điều khiển Đồng hồ đếm ngược Hàng đợi (Cột 2A)
  const [openTimerMenuId, setOpenTimerMenuId] = useState<string | null>(null);
  const [timerNowMs, setTimerNowMs] = useState<number>(() => Date.now());
  const beepedTimerMarksRef = useRef<Record<string, number>>({});

  // State cho các Modal
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [showCheckerModal, setShowCheckerModal] = useState(false);
  const [editingBm04Item, setEditingBm04Item] = useState<QueueItem | null>(
    null
  );
  const [replenishShiftModal, setReplenishShiftModal] =
    useState<ShiftNumber | null>(null);
  const [closingShiftModal, setClosingShiftModal] =
    useState<ShiftNumber | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);

  // State điều phối QR Bàn giao ca & Khóa cứng in ấn tuân thủ ISO 15189
  const [handoverQrState, setHandoverQrState] =
    useState<HandoverQrState | null>(null);
  const [qrNowMs, setQrNowMs] = useState<number>(() => Date.now());
  const [cancelQrLoading, setCancelQrLoading] = useState<boolean>(false);
  const [compliancePrintState, setCompliancePrintState] =
    useState<CompliancePrintState | null>(null);

  // State cho Mobile Checklist & Cổng chặn PIN dự phòng
  const [mobileQrSession, setMobileQrSession] =
    useState<HandoverQrState | null>(null);
  const [mobileSubmitting, setMobileSubmitting] = useState<boolean>(false);
  const [mobileAcceptedMustLogout, setMobileAcceptedMustLogout] =
    useState<boolean>(false);
  const [showManualPinModal, setShowManualPinModal] = useState<boolean>(false);
  const [printingFormLock, setPrintingFormLock] = useState<
    "BM04" | "BM13" | null
  >(null);
  const [hasPendingQrClaim, setHasPendingQrClaim] = useState<boolean>(() =>
    Boolean(INITIAL_CAPTURED_QR || readPendingQrClaimStorage())
  );
  const claimingQrRef = useRef<boolean>(false);
  const bm13DebounceRef = useRef<number | null>(null);

  const notify = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  // Nhịp đồng hồ hệ thống mỗi 15 giây
  useEffect(() => {
    const t = window.setInterval(() => {
      setNowTick(getTrustedNow());
    }, 15000);
    return () => window.clearInterval(t);
  }, []);

  // Vòng lặp 1 giây duy nhất cho toàn bộ Đồng hồ đếm ngược
  const hasActiveTimers = useMemo(
    () => Object.keys(timers).length > 0,
    [timers]
  );
  useEffect(() => {
    if (!hasActiveTimers) return;
    setTimerNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setTimerNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [hasActiveTimers]);

  // Phát âm báo động to rõ khi đồng hồ chạm mốc 00:00
  useEffect(() => {
    if (!hasActiveTimers) return;
    let shouldBeep = false;
    Object.keys(timers).forEach((itemId) => {
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
    const validIds = new Set(pendingQueue.map((p) => p.id));
    setTimers((prev) => {
      const keys = Object.keys(prev);
      if (keys.every((k) => validIds.has(k))) return prev;
      const next: Record<string, PatientTimer> = {};
      keys.forEach((k) => {
        if (validIds.has(k)) next[k] = prev[k];
      });
      return next;
    });
  }, [pendingQueue, setTimers]);

  const isAdmin = Boolean(auth?.user.role === "Admin");

  /* ==================== TÍNH TOÁN TỒN KHO NGÀY HIỆN TẠI & HÔM TRƯỚC ==================== */

  const prevDateStr = useMemo(() => addDays(selectedDate, -1), [selectedDate]);

  const prevDayComputed = useMemo(
    () =>
      computeDaySingle(
        prevDateStr,
        testsConfig,
        bm04Logs,
        pendingQueue,
        bm13Raw,
        dirtyBm13,
        null
      ),
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
    [
      selectedDate,
      testsConfig,
      bm04Logs,
      pendingQueue,
      bm13Raw,
      dirtyBm13,
      prevDayComputed.tonCuoiNgay,
    ]
  );

  const yesterdayCa4PendingBlock = useMemo(() => {
    const realYesterday = addDays(todayStr, -1);
    const hasPrevActivity =
      bm13Raw.some((r) => r.ngayBC === realYesterday) ||
      bm04Logs.some((l) => l.ngayBC === realYesterday) ||
      pendingQueue.some((p) => p.ngayBC === realYesterday);
    if (!hasPrevActivity) return null;
    const realYesterdayComp =
      realYesterday === selectedDate
        ? currentDayComputed
        : realYesterday === prevDateStr
        ? prevDayComputed
        : computeDaySingle(
            realYesterday,
            testsConfig,
            bm04Logs,
            pendingQueue,
            bm13Raw,
            dirtyBm13,
            null
          );
    const ca4Meta = realYesterdayComp.meta[4];
    if (ca4Meta && ca4Meta.trangThai !== "HOAN_THANH") {
      return {
        date: realYesterday,
        shift: 4 as ShiftNumber,
        status: ca4Meta.trangThai,
        nguoiGiao: ca4Meta.nguoiGiao,
      };
    }
    return null;
  }, [
    todayStr,
    selectedDate,
    prevDateStr,
    currentDayComputed,
    prevDayComputed,
    testsConfig,
    bm13Raw,
    bm04Logs,
    pendingQueue,
    dirtyBm13,
  ]);

  // NEO NGÀY LÀM VIỆC CA 4 (STICKY SHIFT-4 DATE):
  // Nếu đang bị khóa bắt buộc in 2 biểu mẫu Ca 4 hoặc Ca 4 hôm qua đang chờ nhận bàn giao,
  // neo cứng selectedDate ở ngày của Ca 4 đó (VD: 06/11/2026) để không bao giờ bị nhảy sang ngày 07/11 trống trơn!
  const anchoredBusinessDate = useMemo(() => {
    if (
      compliancePrintState?.required &&
      Number(compliancePrintState.shift) === 4 &&
      isDateStr(compliancePrintState.date)
    ) {
      return compliancePrintState.date;
    }
    if (isDateStr(stickyShift4Date)) {
      return stickyShift4Date;
    }
    if (
      yesterdayCa4PendingBlock &&
      yesterdayCa4PendingBlock.status === "PENDING_RECEIVE"
    ) {
      return yesterdayCa4PendingBlock.date;
    }
    return todayStr;
  }, [
    compliancePrintState,
    stickyShift4Date,
    yesterdayCa4PendingBlock,
    todayStr,
  ]);

  useEffect(() => {
    if (
      compliancePrintState?.required &&
      Number(compliancePrintState.shift) === 4 &&
      isDateStr(compliancePrintState.date)
    ) {
      if (selectedDate !== compliancePrintState.date) {
        setSelectedDate(compliancePrintState.date);
        setAdminShiftOverride(null);
      }
      return;
    }
    if (!datePickedRef.current && selectedDate !== anchoredBusinessDate) {
      setSelectedDate(anchoredBusinessDate);
      setAdminShiftOverride(null);
    }
  }, [compliancePrintState, anchoredBusinessDate, selectedDate]);

  // Ngày thực tế dùng cho 2 biểu mẫu in BM.04 & BM.13 (đảm bảo 100% khi khóa in Ca 4 luôn lấy đúng ngày Ca 4)
  const effectivePrintDate = useMemo(() => {
    if (
      compliancePrintState?.required &&
      Number(compliancePrintState.shift) === 4 &&
      isDateStr(compliancePrintState.date)
    ) {
      return compliancePrintState.date;
    }
    return selectedDate;
  }, [compliancePrintState, selectedDate]);

  const effectivePrintDayComputed = useMemo(() => {
    if (effectivePrintDate === selectedDate) return currentDayComputed;
    if (effectivePrintDate === prevDateStr) return prevDayComputed;
    const prevOfPrint = computeDaySingle(
      addDays(effectivePrintDate, -1),
      testsConfig,
      bm04Logs,
      pendingQueue,
      bm13Raw,
      dirtyBm13,
      null
    );
    return computeDaySingle(
      effectivePrintDate,
      testsConfig,
      bm04Logs,
      pendingQueue,
      bm13Raw,
      dirtyBm13,
      prevOfPrint.tonCuoiNgay
    );
  }, [
    effectivePrintDate,
    selectedDate,
    prevDateStr,
    currentDayComputed,
    prevDayComputed,
    testsConfig,
    bm04Logs,
    pendingQueue,
    bm13Raw,
    dirtyBm13,
  ]);

  const effectiveShift: ShiftNumber = useMemo(() => {
    for (const ca of [1, 2, 3, 4] as ShiftNumber[]) {
      const st = currentDayComputed.meta[ca]?.trangThai || "OPEN";
      if (st !== "HOAN_THANH") {
        return ca;
      }
    }
    return realShift;
  }, [currentDayComputed.meta, realShift]);

  const viewShift: ShiftNumber = useMemo(() => {
    if (isAdmin && adminShiftOverride) return adminShiftOverride;
    return effectiveShift;
  }, [isAdmin, adminShiftOverride, effectiveShift]);

  const currentShiftHandoverBlock = useMemo(() => {
    for (const ca of [1, 2, 3, 4] as ShiftNumber[]) {
      const m = currentDayComputed.meta[ca];
      if (m?.trangThai === "PENDING_RECEIVE") {
        return {
          date: selectedDate,
          shift: ca,
          status: m.trangThai,
          nguoiGiao: m.nguoiGiao,
        };
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
          : computeDaySingle(
              dateStr,
              testsConfig,
              bm04Logs,
              pendingQueue,
              bm13Raw,
              dirtyBm13,
              null
            );
      const st = targetComp.meta[shift]?.trangThai || "OPEN";
      return st === "PENDING_RECEIVE" || st === "HOAN_THANH";
    },
    [
      selectedDate,
      prevDateStr,
      currentDayComputed,
      prevDayComputed,
      testsConfig,
      bm04Logs,
      pendingQueue,
      bm13Raw,
      dirtyBm13,
    ]
  );

  const isSessionHeldByOther = useMemo(() => {
    if (!auth || !activeSession) return false;
    const ownerId = String(activeSession.mainUserId || "").toLowerCase();
    if (ownerId) return ownerId !== auth.user.id.toLowerCase();
    return activeSession.mainUser !== auth.user.name;
  }, [auth, activeSession]);

  const isLockedByOtherUser = isSessionHeldByOther && !isAdmin;

  const canUserModifyRecord = useCallback(
    (item: QueueItem): boolean => {
      if (!auth) return false;
      if (isAdmin) return true;
      if (isLockedByOtherUser) return false;
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
      const nextPayload: Record<string, any> = {
        ...payload,
        sessionEpoch: sessionEpoch || undefined,
      };
      const item: OutboxItem = {
        qid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        action,
        payload: nextPayload,
        createdAt: Date.now(),
        attempts: 0,
        paused: false,
      };
      setOutbox((prev) => {
        if (action === "saveBM13Data") {
          const firstActiveIdx = flushingRef.current
            ? prev.findIndex((x) => !x.paused)
            : -1;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (i === firstActiveIdx) continue;
            const ob = prev[i];
            if (
              ob.action === "saveBM13Data" &&
              ob.payload.ngayBC === nextPayload.ngayBC &&
              Number(ob.payload.caTruc) === Number(nextPayload.caTruc)
            ) {
              const next = [...prev];
              next[i] = {
                ...ob,
                payload: nextPayload,
                paused: false,
                attempts: 0,
                lastError: undefined,
              };
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
      if (flushingRef.current || claimingQrRef.current) return;

      const reqDate = targetDateOverride || selectedDate;
      setIsSyncing(true);
      const res = await rpcCall(
        apiUrl,
        "getInitData",
        {
          knownVersion: forceFull ? "" : dataVersion,
          targetDate: reqDate,
          loadedDate: loadedCloudDateRef.current,
        },
        auth.token
      );
      setIsSyncing(false);

      if (!res.net) {
        setIsOnline(false);
        return;
      }
      setIsOnline(true);

      if (res.body.status !== "success") {
        if (res.body.code === "AUTH") {
          notify(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (dữ liệu chưa đồng bộ vẫn được giữ an toàn).",
            "error"
          );
          setAuth(null);
        }
        return;
      }

      if (res.body.activeSession !== undefined) {
        setActiveSession(res.body.activeSession || null);
      }
      if (typeof res.body.stickyShift4Date === "string") {
        setStickyShift4Date(res.body.stickyShift4Date);
      }

      // Đồng bộ trạng thái QR & Khóa cứng in ấn Ca 4 ngay trong getInitData (chống mất QR khi F5 trên PC)
      if (res.body.handoverQr !== undefined) {
        const remoteQr = res.body.handoverQr as HandoverQrState | null;
        if (
          remoteQr &&
          (remoteQr.status === "WAITING_SCAN" ||
            remoteQr.status === "VERIFYING")
        ) {
          setHandoverQrState(remoteQr);
        } else if (!remoteQr) {
          setHandoverQrState(null);
        }
      }

      if (res.body.compliancePrint !== undefined) {
        const remoteComp =
          (res.body.compliancePrint as CompliancePrintState | null) || null;
        // Chỉ hiển thị bảng khóa in Ca 4 nếu PC không phải đang đứng ở màn hình chờ QR của Người giao
        setCompliancePrintState(remoteComp);
      }

      if (res.body.mustChange) {
        setAuth((prev) => (prev ? { ...prev, mustChange: true } : prev));
        return;
      }
      if (res.body.unchanged) {
        return;
      }

      if (flushingRef.current) return;
      loadedCloudDateRef.current = reqDate;

      if (
        Array.isArray(res.body.testsConfig) &&
        res.body.testsConfig.length > 0
      ) {
        setTestsConfig(res.body.testsConfig);
      }

      const pendingAddIds = new Set<string>();
      const processedIds = new Set<string>();
      const deletedBm04Ids = new Set<string>();
      const deletedPendingIds = new Set<string>();
      const updatedBm04Map = new Map<
        string,
        { docChung?: DocChungValue; ketQua?: string }
      >();

      outboxRef.current.forEach((ob) => {
        if (ob.action === "addPending" && Array.isArray(ob.payload.items)) {
          ob.payload.items.forEach((x: any) => {
            if (x?.id) pendingAddIds.add(x.id);
          });
        } else if (ob.action === "processPending" && ob.payload.data?.id) {
          processedIds.add(ob.payload.data.id);
          deletedPendingIds.add(ob.payload.data.id);
        } else if (ob.action === "deleteBM04" && ob.payload.id) {
          deletedBm04Ids.add(ob.payload.id);
        } else if (ob.action === "deletePending" && ob.payload.id) {
          deletedPendingIds.add(ob.payload.id);
        } else if (ob.action === "updateBM04" && ob.payload.id) {
          updatedBm04Map.set(ob.payload.id, {
            docChung: ob.payload.docChung,
            ketQua: ob.payload.ketQua,
          });
        }
      });

      if (Array.isArray(res.body.bm04)) {
        setBm04Logs((prev) => {
          const serverList: QueueItem[] = (res.body.bm04 as QueueItem[])
            .filter((x) => !deletedBm04Ids.has(x.id))
            .map((x) => {
              const up = updatedBm04Map.get(x.id);
              return up
                ? {
                    ...x,
                    docChung: up.docChung || x.docChung,
                    ketQua: up.ketQua ?? x.ketQua,
                  }
                : x;
            });
          const serverIds = new Set(serverList.map((x) => x.id));
          const localUnsynced = prev.filter(
            (x) =>
              processedIds.has(x.id) &&
              !serverIds.has(x.id) &&
              !deletedBm04Ids.has(x.id)
          );
          return [...localUnsynced, ...serverList];
        });
      }

      if (Array.isArray(res.body.pendingQueue)) {
        setPendingQueue((prev) => {
          const serverList: QueueItem[] = (
            res.body.pendingQueue as QueueItem[]
          ).filter((x) => !deletedPendingIds.has(x.id));
          const serverIds = new Set(serverList.map((x) => x.id));
          const localUnsynced = prev.filter(
            (x) =>
              pendingAddIds.has(x.id) &&
              !serverIds.has(x.id) &&
              !deletedPendingIds.has(x.id)
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
      setDataVersion,
    ]
  );

  const flushOutbox = useCallback(
    async (unpauseAll = false) => {
      if (
        !auth ||
        auth.mustChange ||
        isLockedByOtherUser ||
        flushingRef.current ||
        claimingQrRef.current
      )
        return;
      if (unpauseAll) {
        const unpaused = outboxRef.current.map((item) => ({
          ...item,
          paused: false,
          attempts: 0,
          lastError: undefined,
        }));
        setOutbox(unpaused);
        outboxRef.current = unpaused;
      }

      if (!outboxRef.current.some((x) => !x.paused)) return;

      flushingRef.current = true;
      let changedVersion = false;

      try {
        while (true) {
          const item = outboxRef.current.find((x) => !x.paused);
          if (!item) break;

          const payloadWithEpoch = {
            ...item.payload,
            sessionEpoch: sessionEpoch || item.payload.sessionEpoch,
          };
          const res = await rpcCall(
            apiUrl,
            item.action,
            payloadWithEpoch,
            auth.token
          );

          if (!res.net) {
            setIsOnline(false);
            const nextAttempts = (item.attempts || 0) + 1;
            const shouldPause = nextAttempts >= 8;
            setOutbox((prev) => {
              const next = prev.map((x) =>
                x.qid === item.qid
                  ? {
                      ...x,
                      attempts: nextAttempts,
                      paused: shouldPause,
                      lastError: shouldPause
                        ? "Tạm dừng sau 8 lần mất mạng. Bấm nút Đồng bộ trên Header để gửi lại."
                        : "Đang chờ mạng ổn định...",
                    }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            break;
          }

          setIsOnline(true);

          if (res.body.status === "success") {
            if (res.body.version) {
              changedVersion = true;
              setDataVersion(String(res.body.version));
            }
            setOutbox((prev) => {
              const next = prev.filter((x) => x.qid !== item.qid);
              outboxRef.current = next;
              return next;
            });
            continue;
          }

          if (res.body.activeSession) {
            setActiveSession(res.body.activeSession);
          }

          const code = String(res.body.code || "");
          if (
            code === "AUTH" ||
            code === "MUST_CHANGE" ||
            code === "SESSION_LOCKED" ||
            code === "SESSION_SUPERSEDED"
          ) {
            setOutbox((prev) => {
              const next = prev.map((x) =>
                x.qid === item.qid
                  ? {
                      ...x,
                      paused: true,
                      lastError:
                        res.body.message ||
                        "Phiên bị khóa hoặc cần đăng nhập lại.",
                    }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            if (code === "AUTH") {
              notify(
                "Phiên đăng nhập hết hạn. Dữ liệu vừa nhập vẫn được giữ trong Hàng đợi, vui lòng đăng nhập lại!",
                "error"
              );
              setAuth(null);
            } else {
              notify(
                res.body.message ||
                  "Bạn đang ở chế độ Chỉ xem, không thể ghi dữ liệu.",
                "error"
              );
            }
            break;
          }

          if (res.body.retry || code === "BUSY" || code === "SERVER") {
            const nextAttempts = (item.attempts || 0) + 1;
            setOutbox((prev) => {
              const next = prev.map((x) =>
                x.qid === item.qid
                  ? {
                      ...x,
                      attempts: nextAttempts,
                      paused: nextAttempts >= 8,
                      lastError:
                        res.body.message || "Máy chủ đang bận, chờ thử lại...",
                    }
                  : x
              );
              outboxRef.current = next;
              return next;
            });
            break;
          }

          notify(
            res.body.message ||
              `Thao tác [${item.action}] bị từ chối bởi máy chủ.`,
            "error"
          );
          setOutbox((prev) => {
            const next = prev.map((x) =>
              x.qid === item.qid
                ? {
                    ...x,
                    paused: true,
                    lastError: res.body.message || "Máy chủ từ chối thao tác.",
                  }
                : x
            );
            outboxRef.current = next;
            return next;
          });
        }
      } finally {
        flushingRef.current = false;
      }

      if (changedVersion && !outboxRef.current.some((x) => !x.paused)) {
        syncFromCloud(true);
      }
    },
    [
      auth,
      isLockedByOtherUser,
      apiUrl,
      sessionEpoch,
      notify,
      setAuth,
      setOutbox,
      setDataVersion,
      syncFromCloud,
    ]
  );

  useEffect(() => {
    if (
      !auth ||
      auth.mustChange ||
      isLockedByOtherUser ||
      hasPendingQrClaim ||
      Boolean(mobileQrSession)
    )
      return;
    flushOutbox(false);
    const timer = window.setInterval(() => {
      flushOutbox(false);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [
    auth,
    isLockedByOtherUser,
    hasPendingQrClaim,
    mobileQrSession,
    outbox,
    flushOutbox,
  ]);

  useEffect(() => {
    if (
      !auth ||
      auth.mustChange ||
      hasPendingQrClaim ||
      Boolean(mobileQrSession)
    )
      return;
    syncFromCloud(true, selectedDate);
    const timer = window.setInterval(() => {
      syncFromCloud(false, selectedDate);
    }, 18000);
    return () => window.clearInterval(timer);
  }, [
    auth?.token,
    auth?.mustChange,
    hasPendingQrClaim,
    mobileQrSession,
    selectedDate,
    syncFromCloud,
  ]);

  /* ==================== KHÓA PHIÊN (HEARTBEAT PING SESSION) ==================== */

  // Kiểm tra xem có phiên QR đang mở mà tài khoản hiện tại KHÔNG phải người giao hay không
  // Nếu có -> Hệ thống đang chặn ở cổng PIN / Checklist của Người nhận, tuyệt đối không gọi pingSession tranh quyền PC!
  const isReceiverInActiveHandoverFlow = useMemo(() => {
    if (!auth) return false;
    if (hasPendingQrClaim || mobileQrSession) return true;
    if (
      handoverQrState &&
      (handoverQrState.status === "WAITING_SCAN" ||
        handoverQrState.status === "VERIFYING")
    ) {
      const isSender =
        (handoverQrState.senderId &&
          handoverQrState.senderId.trim().toLowerCase() ===
            auth.user.id.trim().toLowerCase()) ||
        handoverQrState.senderName.trim().toLowerCase() ===
          auth.user.name.trim().toLowerCase();
      if (!isSender) return true;
    }
    return false;
  }, [auth, hasPendingQrClaim, mobileQrSession, handoverQrState]);

  const pingCurrentSession = useCallback(
    async (forceTakeover = false) => {
      if (
        !auth ||
        auth.mustChange ||
        claimingQrRef.current ||
        isReceiverInActiveHandoverFlow
      )
        return;
      const res = await rpcCall(
        apiUrl,
        "pingSession",
        {
          date: selectedDate,
          shift: viewShift,
          checkerUser: checker?.name || "",
          force: forceTakeover,
        },
        auth.token
      );
      if (res.net && res.body.status === "success" && res.body.activeSession) {
        setActiveSession(res.body.activeSession);
        if (res.body.activeSession.epoch) {
          setSessionEpoch(String(res.body.activeSession.epoch));
        }
        if (forceTakeover) {
          notify(
            "Đã tiếp quản phiên làm việc thành công! Bạn đang giữ phiên chính thức.",
            "success"
          );
        }
      } else if (res.net && res.body.activeSession) {
        setActiveSession(res.body.activeSession);
        if (forceTakeover) {
          notify(
            res.body.message || "Chưa thể tiếp quản phiên làm việc.",
            "error"
          );
        }
      }
    },
    [
      auth,
      isReceiverInActiveHandoverFlow,
      apiUrl,
      selectedDate,
      viewShift,
      checker?.name,
      notify,
    ]
  );

  useEffect(() => {
    if (
      !auth ||
      auth.mustChange ||
      isSessionHeldByOther ||
      isReceiverInActiveHandoverFlow
    )
      return;
    pingCurrentSession(false);
    const t = window.setInterval(() => {
      pingCurrentSession(false);
    }, 28000);
    return () => window.clearInterval(t);
  }, [
    auth?.token,
    auth?.mustChange,
    isSessionHeldByOther,
    isReceiverInActiveHandoverFlow,
    selectedDate,
    viewShift,
    checker?.name,
    pingCurrentSession,
  ]);

  /* ==================== CÁC HÀM THAO TÁC ĐỒNG HỒ ĐẾM NGƯỢC ==================== */

  const handleStartTimer = (itemId: string, minutes: TimerPresetMinutes) => {
    const now = Date.now();
    delete beepedTimerMarksRef.current[itemId];
    setTimers((prev) => ({
      ...prev,
      [itemId]: {
        startAt: now,
        durationMs: minutes * 60 * 1000,
        presetMin: minutes,
      },
    }));
    setTimerNowMs(now);
    setOpenTimerMenuId(null);
    notify(`Đã bật đồng hồ đếm ngược ${minutes} phút.`, "info");
  };

  const handleCancelTimer = (itemId: string) => {
    delete beepedTimerMarksRef.current[itemId];
    setTimers((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setOpenTimerMenuId(null);
  };

  /* ==================== CÁC HÀM THAO TÁC NGHIỆP VỤ BM.04 ==================== */

  const handoverLockReason = useMemo(() => {
    if (isAdmin) return "";
    if (yesterdayCa4PendingBlock && selectedDate === todayStr) {
      return `Ca 4 ngày hôm qua (${formatDateDisplay(
        yesterdayCa4PendingBlock.date
      )}) chưa hoàn tất bàn giao. Vui lòng sang Tab 2 "Kho Hóa Chất (BM.13)" để Chốt/Nhận bàn giao trước khi thao tác ngày mới!`;
    }
    if (currentShiftHandoverBlock) {
      return `Ca ${currentShiftHandoverBlock.shift} ngày ${formatDateDisplay(
        currentShiftHandoverBlock.date
      )} đã chốt giao bởi [${
        currentShiftHandoverBlock.nguoiGiao
      }] và đang chờ kiểm đếm nhận ca. Vui lòng hoàn tất nhận bàn giao trước khi làm việc tiếp!`;
    }
    return "";
  }, [
    isAdmin,
    yesterdayCa4PendingBlock,
    selectedDate,
    todayStr,
    currentShiftHandoverBlock,
  ]);

  const handleToggleTestCode = (code: string) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên. Bấm "Tiếp quản phiên" nếu muốn thao tác.`,
        "error"
      );
      return;
    }
    setSelectedTestCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (isLockedByOtherUser) {
      notify(
        `Hệ thống đang được giữ phiên bởi ${activeSession?.mainUser}. Bạn đang ở chế độ Chỉ xem!`,
        "error"
      );
      return;
    }
    if (handoverLockReason) {
      notify(handoverLockReason, "error");
      setActiveTab("BM13");
      return;
    }
    if (isShiftClosed(selectedDate, viewShift) && !isAdmin) {
      notify(
        `Ca ${viewShift} ngày ${formatDateDisplay(
          selectedDate
        )} đã chốt bàn giao, không thể thêm bệnh nhân mới.`,
        "error"
      );
      return;
    }
    if (
      !checker ||
      checker.verifiedForUserId.toLowerCase() !== auth.user.id.toLowerCase()
    ) {
      notify(
        "Vui lòng xác thực Người kiểm tra trước khi đẩy bệnh nhân vào hàng đợi!",
        "error"
      );
      setShowCheckerModal(true);
      return;
    }

    const cleanName = hoTenBN.trim().toUpperCase();
    const cleanBc = barcode.trim();
    const cleanYearRaw = namSinh.trim().replace(/T$/i, "").trim();
    const currentYear = getVnParts().year;
    const yearNum = Number(cleanYearRaw);

    if (!cleanName) {
      notify("Vui lòng nhập Họ và tên bệnh nhân.", "error");
      return;
    }
    if (isAgeMode) {
      if (
        !cleanYearRaw ||
        !Number.isInteger(yearNum) ||
        yearNum < 1 ||
        yearNum > 130
      ) {
        notify(
          "Tuổi không hợp lệ (Vui lòng nhập số nguyên từ 1 đến 130).",
          "error"
        );
        return;
      }
    } else {
      if (
        !cleanYearRaw ||
        !Number.isInteger(yearNum) ||
        yearNum < 1900 ||
        yearNum > currentYear
      ) {
        notify(
          `Năm sinh không hợp lệ (1900 - ${currentYear}). Nếu muốn nhập tuổi, hãy tích vào ô "Tuổi".`,
          "error"
        );
        return;
      }
    }
    if (!cleanBc) {
      notify("Vui lòng nhập Barcode bệnh nhân.", "error");
      return;
    }
    if (selectedTestCodes.length === 0) {
      notify("Vui lòng tích chọn ít nhất 1 xét nghiệm.", "error");
      return;
    }

    // Chuẩn hóa lưu "35T" nếu chọn chế độ Tuổi
    const storedBirthOrAge = formatBirthOrAgeStored(cleanYearRaw, isAgeMode);

    const catalogMap: Record<string, string> = {};
    testsConfig.forEach((t) => {
      catalogMap[t.code] = t.name;
    });

    const nowIso = getTrustedNow().toISOString();
    const newItems: QueueItem[] = selectedTestCodes.map((code, idx) => {
      const upperCode = code.trim().toUpperCase();
      return {
        id: `REC_${Date.now()}_${idx}_${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        ngayBC: selectedDate,
        caTruc: viewShift,
        tenXetNghiem: catalogMap[upperCode] || upperCode,
        maTest: upperCode,
        hoTenBN: cleanName,
        namSinhNam: gioiTinh === "Nam" ? storedBirthOrAge : "",
        namSinhNu: gioiTinh === "Nu" ? storedBirthOrAge : "",
        isAgeMode,
        barcode: cleanBc,
        docChung: docChungDefault,
        nguoiThucHien: auth.user.name,
        nguoiKiemTra: checker.name,
        timestamp: nowIso,
      };
    });

    setPendingQueue((prev) => [...prev, ...newItems]);
    setDrafts((prev) => {
      const next = { ...prev };
      newItems.forEach((it) => {
        next[it.id] = { docChung: it.docChung, ketQua: "" };
      });
      return next;
    });

    enqueueOutbox("addPending", {
      items: newItems,
      checkerProof: checker.proof,
    });

    setHoTenBN("");
    setNamSinh("");
    setIsAgeMode(false);
    setBarcode("");
    setSelectedTestCodes([]);
    notify(
      `Đã đẩy ${newItems.length} xét nghiệm vào Hàng đợi (${SHIFT_INFO[viewShift].short}).`,
      "success"
    );
  };

  /**
   * Nghiệp vụ V2031: Xử lý khi Vạch chứng (C) = Âm tính (Que thử hỏng / không lên vạch C)
   * - Cộng +1 vào cột suDungQC (QC / Hỏng) của Ca trực tương ứng trên BM.13
   * - Reset Đọc chứng của bệnh nhân về "Dương tính" và làm mới đồng hồ ủ để chạy que thử mới
   */
  const handleReportInvalidKit = (item: QueueItem) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (isShiftClosed(item.ngayBC, item.caTruc) && !isAdmin) {
      notify(
        `Ca ${item.caTruc} đã chốt, không thể ghi nhận hao hụt que lỗi.`,
        "error"
      );
      return;
    }
    if (
      !window.confirm(
        `Xác nhận que thử [${item.tenXetNghiem}] của BN ${item.hoTenBN} bị lỗi Vạch chứng (C = Âm tính)?\n\nHệ thống sẽ:\n1. Tự động cộng +1 vào cột "Sử dụng QC/Hỏng" của Ca ${item.caTruc}.\n2. Giữ bệnh nhân lại Hàng đợi và đặt lại trạng thái để bạn ủ que thử mới.`
      )
    ) {
      return;
    }

    const code = String(item.maTest || "")
      .trim()
      .toUpperCase();
    if (isStockTestCode(code)) {
      const key = `${item.ngayBC}_CA${item.caTruc}`;
      const targetComp =
        item.ngayBC === selectedDate
          ? currentDayComputed
          : item.ngayBC === prevDateStr
          ? prevDayComputed
          : computeDaySingle(
              item.ngayBC,
              testsConfig,
              bm04Logs,
              pendingQueue,
              bm13Raw,
              dirtyBm13,
              null
            );
      const existingShiftCells = targetComp.shifts[item.caTruc] || {};
      const nextCellsPayload: Record<
        string,
        { boiHoan: number; suDungQC: number }
      > = {};

      targetComp.tests.forEach((t) => {
        if (!isStockTestCode(t.code)) return;
        const cur = existingShiftCells[t.code] || {
          boiHoan: 0,
          suDungQC: 0,
          suDung: 0,
          tonCuoi: 0,
        };
        nextCellsPayload[t.code] = {
          boiHoan: cur.boiHoan,
          suDungQC: t.code === code ? cur.suDungQC + 1 : cur.suDungQC,
        };
      });

      setDirtyBm13((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          cells: nextCellsPayload,
        },
      }));
    }

    const freshIso = getTrustedNow().toISOString();
    setPendingQueue((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? { ...p, docChung: "Dương tính", timestamp: freshIso }
          : p
      )
    );
    setDrafts((prev) => ({
      ...prev,
      [item.id]: { docChung: "Dương tính", ketQua: "" },
    }));
    delete beepedTimerMarksRef.current[item.id];
    setTimers((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    enqueueOutbox("reportInvalidKit", {
      id: item.id,
      ngayBC: item.ngayBC,
      caTruc: item.caTruc,
      maTest: code,
      hoTenBN: item.hoTenBN,
    });

    notify(
      `Đã cộng +1 que lỗi [${item.tenXetNghiem}] vào cột QC/Hỏng Ca ${item.caTruc}. Mời bạn ủ que thử mới cho BN ${item.hoTenBN}!`,
      "info"
    );
  };

  const handleSaveResultFromQueue = (
    item: QueueItem,
    rawKetQuaOverride?: string,
    docChungOverride?: DocChungValue
  ) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (isShiftClosed(item.ngayBC, item.caTruc) && !isAdmin) {
      notify(
        `Ca ${item.caTruc} ngày ${formatDateDisplay(
          item.ngayBC
        )} đã chốt, không thể lưu kết quả mới.`,
        "error"
      );
      return;
    }

    const draft = drafts[item.id] || { docChung: item.docChung, ketQua: "" };
    const rawKq =
      rawKetQuaOverride !== undefined ? rawKetQuaOverride : draft.ketQua;
    const finalDocChung =
      docChungOverride !== undefined ? docChungOverride : draft.docChung;

    // Khóa bảo vệ chuyên môn ISO 15189: Chặn tuyệt đối lưu kết quả bệnh nhân khi Vạch chứng (C) Âm tính
    if (finalDocChung === "Âm Tính") {
      notify(
        "Vạch chứng (C) đang là Âm tính (Que thử lỗi)! Vui lòng bấm nút 'Hủy que lỗi (+1 QC/Hỏng)' chứ không được trả kết quả bệnh nhân.",
        "error"
      );
      return;
    }

    const check = validateAndNormalizeMulti(item.maTest, rawKq);
    if (!check.ok) {
      notify(check.error, "error");
      return;
    }

    // Cảnh báo đọc kết quả Âm tính non khi đồng hồ ủ test vẫn còn thời gian (Smart Incubation Guard)
    const activeTimer = timers[item.id];
    if (activeTimer && activeTimer.durationMs > 0) {
      const remainMs =
        activeTimer.durationMs - (Date.now() - activeTimer.startAt);
      const isNegativeResult =
        !check.normalized.toLowerCase().includes("dương") &&
        !check.normalized.includes("(D)");
      if (remainMs > 15000 && isNegativeResult) {
        if (
          !window.confirm(
            `⚠️ CẢNH BÁO THỜI GIAN Ủ TEST (ISO 15189):\n\nXét nghiệm [${
              item.tenXetNghiem
            }] của BN ${item.hoTenBN} vẫn còn ${formatCountdownMmSs(
              remainMs
            )} trên đồng hồ đếm ngược (${
              activeTimer.presetMin
            } phút).\n\nBạn có chắc chắn muốn trả kết quả ÂM TÍNH sớm ngay bây giờ không?`
          )
        ) {
          return;
        }
      }
    }

    const completedRecord: QueueItem = {
      ...item,
      docChung: finalDocChung,
      ketQua: check.normalized,
      thoiGianDocKQ: formatVnTimeNow(),
      lanSuaCuoi: "",
    };

    delete beepedTimerMarksRef.current[item.id];
    setPendingQueue((prev) => prev.filter((p) => p.id !== item.id));
    setBm04Logs((prev) => [
      completedRecord,
      ...prev.filter((x) => x.id !== item.id),
    ]);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setTimers((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    enqueueOutbox("processPending", {
      data: completedRecord,
      checkerProof: checker?.proof || "",
    });

    notify(
      `Đã lưu kết quả [${item.tenXetNghiem}] cho BN ${item.hoTenBN}.`,
      "success"
    );
  };

  const handleUpdateBM04Result = async (
    id: string,
    nextDocChung: DocChungValue,
    nextKetQua: string
  ) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      throw new Error(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`
      );
    }
    if (nextDocChung === "Âm Tính") {
      throw new Error(
        "Chuẩn ISO 15189: Không được phép cập nhật Vạch chứng (C) thành Âm tính cho kết quả bệnh nhân!"
      );
    }
    const target = bm04Logs.find((x) => x.id === id);
    if (!target) return;

    if (!canUserModifyRecord(target)) {
      throw new Error(
        "Ca trực đã chốt hoặc bạn không có quyền sửa bản ghi này (Chỉ Admin mới sửa được sau khi chốt ca)."
      );
    }

    const stamp = `${formatVnTimeNow()} (${auth.user.name})`;

    setBm04Logs((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              docChung: nextDocChung,
              ketQua: nextKetQua,
              lanSuaCuoi: stamp,
            }
          : x
      )
    );

    const res = await rpcCall(
      apiUrl,
      "updateBM04",
      {
        id,
        docChung: nextDocChung,
        ketQua: nextKetQua,
        sessionEpoch: sessionEpoch || undefined,
      },
      auth.token
    );

    if (!res.net) {
      enqueueOutbox("updateBM04", {
        id,
        docChung: nextDocChung,
        ketQua: nextKetQua,
      });
      notify(
        "Đã cập nhật kết quả trên máy (sẽ tự đồng bộ lên Cloud khi có mạng).",
        "info"
      );
      return;
    }

    if (res.body.status !== "success") {
      if (res.body.activeSession) setActiveSession(res.body.activeSession);
      setBm04Logs((prev) => prev.map((x) => (x.id === id ? target : x)));
      throw new Error(res.body.message || "Máy chủ từ chối cập nhật kết quả.");
    }

    if (res.body.version) setDataVersion(String(res.body.version));
    notify(
      `Đã cập nhật kết quả [${target.tenXetNghiem}] (Giữ nguyên giờ trả KQ: ${target.thoiGianDocKQ}).`,
      "success"
    );
  };

  const handleDeletePendingItem = (item: QueueItem) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (!canUserModifyRecord(item)) {
      notify(
        "Bạn chỉ được xóa xét nghiệm chờ do chính mình tạo trong ca đang mở.",
        "error"
      );
      return;
    }
    if (
      !window.confirm(
        `Hủy xét nghiệm chờ [${item.tenXetNghiem}] của BN ${item.hoTenBN} (Ca ${
          item.caTruc
        } - ${formatDateDisplay(item.ngayBC)})?`
      )
    ) {
      return;
    }
    delete beepedTimerMarksRef.current[item.id];
    setPendingQueue((prev) => prev.filter((x) => x.id !== item.id));
    setTimers((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    enqueueOutbox("deletePending", { id: item.id });
    notify(`Đã xóa xét nghiệm chờ [${item.tenXetNghiem}].`, "info");
  };

  const handleDeleteBM04Item = (item: QueueItem) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (!canUserModifyRecord(item)) {
      notify(
        "Ca trực đã chốt hoặc bạn không có quyền xóa kết quả này.",
        "error"
      );
      return;
    }
    if (
      !window.confirm(
        `Xóa kết quả [${item.tenXetNghiem}] của BN ${item.hoTenBN} khỏi Sổ BM.04? (Thao tác sẽ được ghi vào Sổ kiểm toán AUDIT_LOGS)`
      )
    ) {
      return;
    }
    setBm04Logs((prev) => prev.filter((x) => x.id !== item.id));
    enqueueOutbox("deleteBM04", { id: item.id });
    notify(
      `Đã xóa kết quả [${item.tenXetNghiem}] của BN ${item.hoTenBN}.`,
      "info"
    );
  };

  /* ==================== CÁC HÀM THAO TÁC TỒN KHO & BÀN GIAO BM.13 (CÓ DEBOUNCE) ==================== */

  const handleUpdateShiftCell = (
    shift: ShiftNumber,
    code: string,
    field: "boiHoan" | "suDungQC",
    rawVal: any
  ) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (!isStockTestCode(code)) return;
    if (isShiftClosed(selectedDate, shift) && !isAdmin) {
      notify(`Ca ${shift} đã chốt bàn giao, không thể sửa số liệu.`, "error");
      return;
    }
    const val = clampInt(rawVal, 0, 99999);
    const key = `${selectedDate}_CA${shift}`;
    const existingShiftCells = currentDayComputed.shifts[shift] || {};
    const nextCellsPayload: Record<
      string,
      { boiHoan: number; suDungQC: number }
    > = {};

    currentDayComputed.tests.forEach((t) => {
      if (!isStockTestCode(t.code)) return;
      const cur = existingShiftCells[t.code] || {
        boiHoan: 0,
        suDungQC: 0,
        suDung: 0,
        tonCuoi: 0,
      };
      nextCellsPayload[t.code] = {
        boiHoan: t.code === code && field === "boiHoan" ? val : cur.boiHoan,
        suDungQC: t.code === code && field === "suDungQC" ? val : cur.suDungQC,
      };
    });

    setDirtyBm13((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        cells: nextCellsPayload,
      },
    }));

    // Debounce 600ms để gõ số nhiều chữ số mượt mà mà không gây bão RPC
    if (bm13DebounceRef.current) {
      window.clearTimeout(bm13DebounceRef.current);
    }
    const targetDateSnap = selectedDate;
    const jsonSnap = JSON.stringify(nextCellsPayload);
    bm13DebounceRef.current = window.setTimeout(() => {
      enqueueOutbox("saveBM13Data", {
        ngayBC: targetDateSnap,
        caTruc: shift,
        dataJson: jsonSnap,
      });
    }, 600);
  };

  const handleApplyBulkReplenish = (
    shift: ShiftNumber,
    map: Record<string, number>
  ) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    if (isShiftClosed(selectedDate, shift) && !isAdmin) {
      notify(`Ca ${shift} đã chốt bàn giao.`, "error");
      return;
    }
    const key = `${selectedDate}_CA${shift}`;
    const existingShiftCells = currentDayComputed.shifts[shift] || {};
    const nextCellsPayload: Record<
      string,
      { boiHoan: number; suDungQC: number }
    > = {};

    currentDayComputed.tests.forEach((t) => {
      if (!isStockTestCode(t.code)) return;
      const cur = existingShiftCells[t.code] || {
        boiHoan: 0,
        suDungQC: 0,
        suDung: 0,
        tonCuoi: 0,
      };
      nextCellsPayload[t.code] = {
        boiHoan:
          map[t.code] !== undefined
            ? clampInt(map[t.code], 0, 99999)
            : cur.boiHoan,
        suDungQC: cur.suDungQC,
      };
    });

    setDirtyBm13((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        cells: nextCellsPayload,
      },
    }));

    enqueueOutbox("saveBM13Data", {
      ngayBC: selectedDate,
      caTruc: shift,
      dataJson: JSON.stringify(nextCellsPayload),
    });

    notify(`Đã cập nhật Bồi hoàn cho Ca ${shift}.`, "success");
  };

  const handleUpdateDayTonDauOrNote = (
    newTonDauMap?: Record<string, number>,
    newNote?: string
  ) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    const key = `${selectedDate}_DAY`;
    const nextTonDau =
      newTonDauMap !== undefined ? newTonDauMap : currentDayComputed.tonDau;
    const nextNote =
      newNote !== undefined ? newNote : currentDayComputed.ghiChu;

    setDirtyBm13((prev) => ({
      ...prev,
      [key]: {
        tonDau: nextTonDau,
        ghiChu: nextNote,
      },
    }));

    if (bm13DebounceRef.current) {
      window.clearTimeout(bm13DebounceRef.current);
    }
    const targetDateSnap = selectedDate;
    bm13DebounceRef.current = window.setTimeout(() => {
      enqueueOutbox("saveBM13Data", {
        ngayBC: targetDateSnap,
        caTruc: 0,
        ghiChu: nextNote,
        dataJson: JSON.stringify({ tonDau: nextTonDau }),
      });
    }, 600);
  };

  /**
   * Kiểm tra khóa chốt ca tuần tự (1 -> 2 -> 3 -> 4) trước khi mở Modal Chốt Ca
   */
  const handleRequestOpenClosingModal = (shift: ShiftNumber) => {
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    const seqBlock = getSequentialShiftBlockReason(
      shift,
      currentDayComputed,
      isAdmin,
      yesterdayCa4PendingBlock,
      selectedDate === todayStr
    );
    if (seqBlock) {
      notify(seqBlock, "error");
      return;
    }
    setClosingShiftModal(shift);
  };

  const handleConfirmCloseShift = async (shift: ShiftNumber) => {
    if (!auth) return;
    if (isLockedByOtherUser) {
      notify(
        `Bạn đang ở chế độ Chỉ xem do [${activeSession?.mainUser}] đang giữ phiên.`,
        "error"
      );
      return;
    }
    const seqBlock = getSequentialShiftBlockReason(
      shift,
      currentDayComputed,
      isAdmin,
      yesterdayCa4PendingBlock,
      selectedDate === todayStr
    );
    if (seqBlock) {
      notify(seqBlock, "error");
      return;
    }

    const pendingOfThisShift = pendingQueue.filter(
      (p) => p.ngayBC === selectedDate && Number(p.caTruc) === Number(shift)
    ).length;

    if (pendingOfThisShift > 0 && !isAdmin) {
      notify(
        `Còn ${pendingOfThisShift} xét nghiệm chờ đọc kết quả ở Ca ${shift}. Vui lòng xử lý hết trước khi chốt ca!`,
        "error"
      );
      return;
    }

    if (bm13DebounceRef.current) {
      window.clearTimeout(bm13DebounceRef.current);
      bm13DebounceRef.current = null;
    }

    const shiftCellsPayload: Record<
      string,
      { boiHoan: number; suDungQC: number }
    > = {};
    const shiftSnapshot: ShiftSnapshotRow[] = [];

    currentDayComputed.tests.forEach((t) => {
      if (!isStockTestCode(t.code) || t.noStock) return;
      const prevEnd =
        shift === 1
          ? currentDayComputed.tonDau[t.code] ?? 0
          : currentDayComputed.shifts[(shift - 1) as ShiftNumber]?.[t.code]
              ?.tonCuoi ?? 0;
      const c = currentDayComputed.shifts[shift]?.[t.code] || {
        boiHoan: 0,
        suDungQC: 0,
        suDung: 0,
        tonCuoi: prevEnd,
      };
      shiftCellsPayload[t.code] = { boiHoan: c.boiHoan, suDungQC: c.suDungQC };
      shiftSnapshot.push({
        code: t.code,
        name: t.name,
        unit: t.unit,
        tonDau: prevEnd,
        boiHoan: c.boiHoan,
        suDungQC: c.suDungQC,
        suDung: c.suDung,
        tonCuoi: c.tonCuoi,
      });
    });

    const gioGiao = formatVnTimeNow();
    setClosingLoading(true);

    await flushOutbox(false);

    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      {
        ngayBC: selectedDate,
        caTruc: shift,
        op: "close",
        gioGiao,
        shiftData: shiftCellsPayload,
        shiftSnapshot,
        sessionEpoch: sessionEpoch || undefined,
      },
      auth.token
    );
    setClosingLoading(false);

    if (!res.net || res.body.status !== "success") {
      if (res.body.activeSession) setActiveSession(res.body.activeSession);
      notify(
        res.body.message ||
          "Chưa thể chốt ca (Kiểm tra kết nối mạng hoặc xử lý hết hàng đợi).",
        "error"
      );
      return;
    }

    setClosingShiftModal(null);
    if (typeof res.body.stickyShift4Date === "string") {
      setStickyShift4Date(res.body.stickyShift4Date);
    }

    if (res.body.handoverQr) {
      setQrNowMs(Date.now());
      setHandoverQrState(res.body.handoverQr as HandoverQrState);
      notify(
        `Đã khởi tạo Mã QR bàn giao Ca ${shift} (Mã PIN dự phòng: ${res.body.handoverQr.qrPin}).`,
        "info"
      );
    } else {
      await syncFromCloud(true, selectedDate);
    }
  };

  const handleCancelQrFromPc = useCallback(async () => {
    if (!auth || !handoverQrState) return;
    if (
      !window.confirm(
        "Bạn muốn hủy mã QR đang chờ và mở khóa lại ca trực để chỉnh sửa số liệu trên PC?"
      )
    ) {
      return;
    }
    setCancelQrLoading(true);
    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      {
        ngayBC: handoverQrState.date,
        caTruc: handoverQrState.shift,
        op: "reject",
        rejectReason:
          "Người giao chủ động hủy màn hình chờ QR trên PC để điều chỉnh lại số liệu",
      },
      auth.token
    );
    setCancelQrLoading(false);
    if (!res.net || res.body.status !== "success") {
      notify(
        res.body.message || "Không thể hủy chốt ca lúc này. Vui lòng thử lại.",
        "error"
      );
      return;
    }
    setHandoverQrState(null);
    if (typeof res.body.stickyShift4Date === "string") {
      setStickyShift4Date(res.body.stickyShift4Date);
    }
    await syncFromCloud(true, selectedDate);
    notify(
      `Đã hủy chốt và mở khóa lại Ca ${handoverQrState.shift} để bạn điều chỉnh số liệu.`,
      "info"
    );
  }, [auth, handoverQrState, apiUrl, selectedDate, notify, syncFromCloud]);

  // Kiểm tra xem tài khoản hiện tại trên máy có phải chính là Người giao ca của phiên QR đang mở hay không
  const isCurrentUserSenderOfActiveQr = useMemo(() => {
    if (!auth || !handoverQrState) return false;
    return (
      (Boolean(handoverQrState.senderId) &&
        handoverQrState.senderId.trim().toLowerCase() ===
          auth.user.id.trim().toLowerCase()) ||
      handoverQrState.senderName.trim().toLowerCase() ===
        auth.user.name.trim().toLowerCase()
    );
  }, [auth, handoverQrState]);

  // Bộ đếm thời gian 1 giây & Polling 3.2 giây khi màn hình PC của Người giao đang mở bảng QR chờ đối soát
  useEffect(() => {
    if (!auth || !handoverQrState || !isCurrentUserSenderOfActiveQr) return;
    if (
      handoverQrState.status !== "WAITING_SCAN" &&
      handoverQrState.status !== "VERIFYING"
    )
      return;

    const secTimer = window.setInterval(() => {
      setQrNowMs(Date.now());
    }, 1000);

    const pollTimer = window.setInterval(async () => {
      const res = await rpcCall(
        apiUrl,
        "shiftOp",
        { op: "qr_status" },
        auth.token
      );
      if (!res.net || res.body.status !== "success") return;

      const remoteQr = res.body.handoverQr as HandoverQrState | null;
      if (!remoteQr) {
        setHandoverQrState(null);
        syncFromCloud(true, selectedDate);
        return;
      }

      if (remoteQr.status === "ACCEPTED") {
        // Khi người nhận ký nhận xong trên điện thoại -> PC của Người giao ĐĂNG XUẤT 100% NGAY LẬP TỨC,
        // tuyệt đối không bật bảng khóa in đè lên phiên của Người giao!
        setHandoverQrState(null);
        setCompliancePrintState(null);
        setChecker(null);
        setAuth(null);
        notify(
          `Đồng nghiệp [${
            remoteQr.verifierName || "Người nhận"
          }] đã ký nhận bàn giao Ca ${
            remoteQr.shift
          } thành công! Màn hình PC của người giao đã tự động đăng xuất.`,
          "success"
        );
        return;
      }

      if (remoteQr.status === "REJECTED") {
        setHandoverQrState(null);
        await syncFromCloud(true, selectedDate);
        notify(
          `⚠️ [${
            remoteQr.verifierName || "Người nhận"
          }] KHÔNG NHẬN BÀN GIAO Ca ${remoteQr.shift}. Lý do: "${
            remoteQr.rejectReason || "Lệch số liệu"
          }". Ca trực đã tự động mở khóa để bạn sửa lại!`,
          "error"
        );
        return;
      }

      if (remoteQr.status === "EXPIRED") {
        setHandoverQrState(null);
        await syncFromCloud(true, selectedDate);
        notify(
          `⏰ Mã QR đối soát Ca ${remoteQr.shift} đã quá hạn 10 phút không phản hồi. Hệ thống đã tự động mở khóa lại ca trực!`,
          "error"
        );
        return;
      }

      setHandoverQrState(remoteQr);
    }, 3200);

    return () => {
      window.clearInterval(secTimer);
      window.clearInterval(pollTimer);
    };
  }, [
    auth,
    handoverQrState,
    isCurrentUserSenderOfActiveQr,
    apiUrl,
    selectedDate,
    notify,
    setChecker,
    setAuth,
    syncFromCloud,
  ]);

  const handleAdminDirectReceiveShift = async (
    targetDate: string,
    shift: ShiftNumber
  ) => {
    if (!auth || !isAdmin) return;
    if (
      !window.confirm(
        `[QUYỀN TỐI THƯỢNG ADMIN]\nXác nhận ký nhận trực tiếp Ca ${shift} ngày ${formatDateDisplay(
          targetDate
        )} mà không cần qua điện thoại?`
      )
    ) {
      return;
    }
    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      {
        ngayBC: targetDate,
        caTruc: shift,
        op: "receive",
        adminDirectReceive: true,
        allowAdminSelfReceive: true,
        checklistVerified: true,
        sessionEpoch: sessionEpoch || undefined,
      },
      auth.token
    );

    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể ký nhận bàn giao ca.", "error");
      return;
    }

    setHandoverQrState(null);
    if (res.body.compliancePrint) {
      setCompliancePrintState(res.body.compliancePrint as CompliancePrintState);
    }
    if (typeof res.body.stickyShift4Date === "string") {
      setStickyShift4Date(res.body.stickyShift4Date);
    }
    setAdminShiftOverride(null);
    await syncFromCloud(true, targetDate);
    notify(
      `Admin đã ký nhận bàn giao Ca ${shift} ngày ${formatDateDisplay(
        targetDate
      )} thành công!`,
      "success"
    );
  };

  const handleAdminResetShift = async (shift: ShiftNumber) => {
    if (!auth || !isAdmin) return;
    if (
      !window.confirm(
        `Mở khóa lại Ca ${shift} ngày ${formatDateDisplay(
          selectedDate
        )}? (Thao tác được ghi vào AUDIT_LOGS)`
      )
    ) {
      return;
    }
    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      { ngayBC: selectedDate, caTruc: shift, op: "reset" },
      auth.token
    );
    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể mở khóa ca.", "error");
      return;
    }
    setHandoverQrState((res.body.handoverQr as HandoverQrState | null) || null);
    setCompliancePrintState(
      (res.body.compliancePrint as CompliancePrintState | null) || null
    );
    if (typeof res.body.stickyShift4Date === "string") {
      setStickyShift4Date(res.body.stickyShift4Date);
    }
    await syncFromCloud(true, selectedDate);
    notify(`Đã mở khóa lại Ca ${shift}.`, "info");
  };

  const handleForceUnlockSession = async () => {
    if (!auth || !isAdmin) return;
    const res = await rpcCall(
      apiUrl,
      "clearSession",
      { force: true },
      auth.token
    );
    if (!res.net || res.body.status !== "success") {
      notify(
        res.body.message || "Không thể giải phóng phiên trên máy chủ.",
        "error"
      );
      return;
    }
    setActiveSession(null);
    notify("Đã cưỡng chế giải phóng khóa phiên thành công!", "success");
  };

  const handleLogout = async () => {
    if (outbox.length > 0 && !isLockedByOtherUser) {
      await flushOutbox(false);
      if (outboxRef.current.length > 0) {
        if (
          !window.confirm(
            `Còn ${outboxRef.current.length} thao tác chưa đồng bộ lên máy chủ. Bạn vẫn muốn đăng xuất? (Dữ liệu hàng đợi vẫn được bảo toàn trên trình duyệt)`
          )
        ) {
          return;
        }
      }
    }
    if (auth && !isSessionHeldByOther && !isReceiverInActiveHandoverFlow) {
      await rpcCall(apiUrl, "clearSession", {}, auth.token);
    }
    clearPendingQrClaimStorage();
    setHasPendingQrClaim(false);
    setMobileQrSession(null);
    setMobileAcceptedMustLogout(false);
    setHandoverQrState(null);
    setChecker(null);
    setAuth(null);
  };

  /* ==================== DỮ LIỆU HIỂN THỊ TRONG NGÀY (TAB 1 & TAB 2) ==================== */

  const visiblePending = useMemo(() => {
    const list = pendingQueue.filter(
      (p) => p.ngayBC === selectedDate || p.ngayBC < selectedDate
    );
    return [...list].sort((a, b) => {
      if (a.ngayBC !== b.ngayBC) return a.ngayBC.localeCompare(b.ngayBC);
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(a.timestamp || "").localeCompare(String(b.timestamp || ""));
    });
  }, [pendingQueue, selectedDate]);

  const todayBm04Logs = useMemo(() => {
    const list = bm04Logs.filter((l) => {
      if (String(l.ngayBC || "").trim() !== selectedDate) return false;
      if (
        journalShiftFilter !== "ALL" &&
        Number(l.caTruc) !== Number(journalShiftFilter)
      )
        return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const caDiff = (Number(a.caTruc) || 1) - (Number(b.caTruc) || 1);
      if (caDiff !== 0) return caDiff;
      return String(b.timestamp || "").localeCompare(String(a.timestamp || ""));
    });
  }, [bm04Logs, selectedDate, journalShiftFilter]);

  const stockTestsForUi = useMemo(
    () =>
      currentDayComputed.tests.filter(
        (t) => isStockTestCode(t.code) && !t.noStock
      ),
    [currentDayComputed.tests]
  );

  const pausedOutboxCount = useMemo(
    () => outbox.filter((x) => x.paused).length,
    [outbox]
  );

  /* ==================== ĐIỀU PHỐI QR MOBILE, CỔNG CHẶN PIN & KHÓA IN CA 4 ==================== */

  const claimQrHandoverSession = useCallback(
    async (qrToken: string, qrPin: string) => {
      if (!auth) {
        notify(
          "Vui lòng đăng nhập tài khoản của NGƯỜI NHẬN CA để mở Checklist đối soát!",
          "error"
        );
        return;
      }
      if (claimingQrRef.current) return;
      claimingQrRef.current = true;
      setMobileSubmitting(true);

      const res = await rpcCall(
        apiUrl,
        "shiftOp",
        { op: "claim_qr", qrToken, qrPin },
        auth.token
      );

      claimingQrRef.current = false;
      setMobileSubmitting(false);

      if (!res.net) {
        notify("Mất kết nối mạng khi mở Checklist. Vui lòng thử lại!", "error");
        return;
      }

      if (res.body.code === "SELF_HANDOVER_FORBIDDEN") {
        // Nếu phát hiện trình duyệt đang đăng nhập tài khoản của Người giao ca -> Giữ lại mã QR và đăng xuất ngay để Người nhận đăng nhập!
        if (qrToken || qrPin) {
          writePendingQrClaimStorage({
            qrToken: qrToken || "",
            qrPin: qrPin || "",
            capturedAt: Date.now(),
          });
          setHasPendingQrClaim(true);
        }
        setChecker(null);
        setAuth(null);
        notify(
          res.body.message ||
            "Thiết bị đang đăng nhập tài khoản Người giao. Vui lòng đăng nhập bằng tài khoản của NGƯỜI NHẬN CA!",
          "error"
        );
        return;
      }

      if (res.body.status !== "success" || !res.body.handoverQr) {
        if (
          res.body.code === "QR_NOT_FOUND" ||
          res.body.code === "QR_EXPIRED" ||
          res.body.code === "QR_CLOSED"
        ) {
          clearPendingQrClaimStorage();
          setHasPendingQrClaim(false);
          setHandoverQrState(null);
        }
        // Nếu link QR bị Zalo cắt hỏng hoặc hết hạn token, mở ngay Cổng Nhập Mã PIN 4 số dự phòng!
        setShowManualPinModal(true);
        notify(
          res.body.message ||
            "Rất tiếc bạn đã không sử dụng được QRcode, vui lòng nhập mã PIN 4 số dự phòng!",
          "error"
        );
        return;
      }

      const qrData = res.body.handoverQr as HandoverQrState;

      // Chỉ xóa thông tin QR tạm sau khi Server đã trả về handoverQr thành công 100%
      clearPendingQrClaimStorage();
      setHasPendingQrClaim(false);
      setShowManualPinModal(false);
      setMobileAcceptedMustLogout(false);
      setMobileQrSession(qrData);
      notify(
        `Đã mở Checklist kiểm đếm Ca ${qrData.shift} (${formatDateDisplay(
          qrData.date
        )}). Vui lòng đếm và tích đủ 100%!`,
        "success"
      );
    },
    [auth, apiUrl, notify, setAuth, setChecker]
  );

  // Tự động kích hoạt claimQrHandoverSession ngay khi Người nhận đăng nhập xong mà có mã QR đã quét
  useEffect(() => {
    if (!auth || auth.mustChange || mobileQrSession || claimingQrRef.current)
      return;
    const savedClaim = readPendingQrClaimStorage();
    if (savedClaim && (savedClaim.qrToken || savedClaim.qrPin)) {
      claimQrHandoverSession(
        String(savedClaim.qrToken || ""),
        String(savedClaim.qrPin || "")
      );
    }
  }, [auth, mobileQrSession, claimQrHandoverSession]);

  // Kiểm tra định kỳ trạng thái QR & Khóa cứng in ấn Ca 4 (chỉ chạy khi PC không phải đang mở bảng QR của Người giao)
  useEffect(() => {
    if (
      !auth ||
      auth.mustChange ||
      mobileQrSession ||
      isCurrentUserSenderOfActiveQr
    )
      return;

    let cancelled = false;
    const fetchHandoverAndComplianceStatus = async () => {
      if (claimingQrRef.current) return;
      const res = await rpcCall(
        apiUrl,
        "shiftOp",
        { op: "qr_status" },
        auth.token
      );
      if (cancelled || !res.net || res.body.status !== "success") return;

      const remoteQr = (res.body.handoverQr as HandoverQrState | null) || null;
      const comp =
        (res.body.compliancePrint as CompliancePrintState | null) || null;
      const stickyDate = String(res.body.stickyShift4Date || "");

      setHandoverQrState(remoteQr);
      setCompliancePrintState(comp);
      setStickyShift4Date(stickyDate);
    };

    fetchHandoverAndComplianceStatus();
    const timer = window.setInterval(fetchHandoverAndComplianceStatus, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [auth, apiUrl, mobileQrSession, isCurrentUserSenderOfActiveQr]);

  // CỔNG CHẶN PIN DỰ PHÒNG TỰ ĐỘNG (INTERCEPT GATE - ĐÃ VÁ LỖI CHỚP THÔNG BÁO 0.5S):
  // Khi hệ thống đang có Ca trực chờ nhận bàn giao (WAITING_SCAN / VERIFYING) và người vừa đăng nhập
  // KHÔNG phải là Người giao ca, đồng thời điện thoại không trong trạng thái đang submit gọi API claim_qr -> Bật Modal PIN!
  const mustInterceptWithPinModal = useMemo(() => {
    if (!auth || auth.mustChange || mobileQrSession || mobileSubmitting)
      return false;
    if (
      handoverQrState &&
      (handoverQrState.status === "WAITING_SCAN" ||
        handoverQrState.status === "VERIFYING") &&
      !isCurrentUserSenderOfActiveQr
    ) {
      return true;
    }
    return false;
  }, [
    auth,
    mobileQrSession,
    mobileSubmitting,
    handoverQrState,
    isCurrentUserSenderOfActiveQr,
  ]);

  const handleMobileAcceptHandover = async (verifierName: string) => {
    if (!mobileQrSession || !auth) return;
    setMobileSubmitting(true);
    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      {
        ngayBC: mobileQrSession.date,
        caTruc: mobileQrSession.shift,
        op: "receive",
        fromQrMobile: true,
        checklistVerified: true,
        overrideVerifierName: verifierName.trim(),
        overrideVerifierId: auth.user.id,
      },
      auth.token
    );
    setMobileSubmitting(false);

    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể ký nhận bàn giao ca.", "error");
      return;
    }

    // Khóa cứng màn hình điện thoại vào trạng thái BẮT BUỘC ĐĂNG XUẤT NGAY LẬP TỨC
    clearPendingQrClaimStorage();
    setHasPendingQrClaim(false);
    setMobileAcceptedMustLogout(true);
    notify(
      `Ký nhận bàn giao Ca ${mobileQrSession.shift} thành công! Vui lòng bấm Đăng xuất khỏi điện thoại.`,
      "success"
    );
  };

  const handleMobileRejectHandover = async (reason: string) => {
    if (!mobileQrSession || !auth) return;
    setMobileSubmitting(true);
    const res = await rpcCall(
      apiUrl,
      "shiftOp",
      {
        ngayBC: mobileQrSession.date,
        caTruc: mobileQrSession.shift,
        op: "reject",
        rejectReason: reason,
      },
      auth.token
    );
    setMobileSubmitting(false);

    if (!res.net || res.body.status !== "success") {
      notify(res.body.message || "Không thể gửi yêu cầu từ chối.", "error");
      return;
    }

    const rejectedShift = mobileQrSession.shift;

    // ĐÃ VÁ: Xóa sạch trạng thái QR và ép đăng xuất ngay lập tức trên điện thoại,
    // đưa nhân viên về thẳng màn hình Login sạch sẽ (không cho bay vào giao diện app nữa)
    clearPendingQrClaimStorage();
    setHasPendingQrClaim(false);
    setMobileQrSession(null);
    setMobileAcceptedMustLogout(false);
    setHandoverQrState(null);
    setCompliancePrintState(null);
    setChecker(null);
    setAuth(null); // <--- Ép đăng xuất 100% tại đây!

    notify(
      `Đã từ chối nhận bàn giao Ca ${rejectedShift} và mở khóa ca trực. Phiên trên điện thoại đã được đăng xuất an toàn!`,
      "success"
    );
  };

  const handleMandatoryMobileLogout = async () => {
    clearPendingQrClaimStorage();
    setHasPendingQrClaim(false);
    setMobileQrSession(null);
    setMobileAcceptedMustLogout(false);
    setHandoverQrState(null);
    setCompliancePrintState(null);
    setChecker(null);
    setAuth(null);
  };

  /**
   * Thực thi in bắt buộc 2 biểu mẫu (BM.04 & BM.13) khi chốt Ca 4:
   * - Đảm bảo 100% tải đúng dữ liệu của ngày Ca 4 (compliancePrintState.date, VD: 06/11/2026) trước khi gọi window.print()
   * - Sau khi hộp thoại máy in đóng lại, xác nhận đã in hoàn tất rồi mới mở khóa
   */
  const handleTriggerCompliancePrint = async (form: "BM04" | "BM13") => {
    if (!auth || !compliancePrintState) return;
    setPrintingFormLock(form);

    const targetPrintDate = compliancePrintState.date || selectedDate;
    if (isDateStr(targetPrintDate) && targetPrintDate !== selectedDate) {
      datePickedRef.current = true;
      setSelectedDate(targetPrintDate);
    }

    // Đảm bảo dữ liệu của ngày Ca 4 đã được tải đầy đủ từ Cloud trước khi mở trang in
    if (loadedCloudDateRef.current !== targetPrintDate) {
      await syncFromCloud(true, targetPrintDate);
    }

    setActiveTab(form === "BM04" ? "PRINT_BM04" : "PRINT_BM13");

    window.setTimeout(async () => {
      try {
        window.print();
      } catch {}

      const formLabel =
        form === "BM04"
          ? `Sổ Kết Quả BM.04 (Trọn bộ 4 ca ngày ${formatDateDisplay(
              targetPrintDate
            )})`
          : `Sổ Bàn Giao Hóa Chất BM.13 (Trọn bộ 4 ca ngày ${formatDateDisplay(
              targetPrintDate
            )})`;

      const confirmed = window.confirm(
        `Xác nhận bạn đã thực hiện lệnh in [${formLabel}] ra máy in thành công?`
      );
      if (!confirmed) {
        setPrintingFormLock(null);
        notify(
          `Chưa xác nhận in ${form}. Vui lòng bấm in lại khi máy in đã sẵn sàng!`,
          "info"
        );
        return;
      }

      const res = await rpcCall(
        apiUrl,
        "shiftOp",
        { op: "mark_printed", form },
        auth.token
      );
      setPrintingFormLock(null);

      if (res.net && res.body.status === "success") {
        const nextComp =
          (res.body.compliancePrint as CompliancePrintState | null) || null;
        const nextSticky = String(res.body.stickyShift4Date || "");
        setCompliancePrintState(nextComp);
        setStickyShift4Date(nextSticky);

        if (!nextComp || !nextComp.required) {
          // Sau khi đã in xong cả 2 biểu mẫu của ngày hôm qua -> Tự động lật sang Ca 1 của ngày hôm nay!
          datePickedRef.current = false;
          const freshToday = businessDate();
          setSelectedDate(freshToday);
          setAdminShiftOverride(null);
          setActiveTab("WORK");
          await syncFromCloud(true, freshToday);
          notify(
            `Đã hoàn tất in đủ 2 biểu mẫu BM.04 & BM.13 của ngày ${formatDateDisplay(
              targetPrintDate
            )}! Hệ thống đã chuyển sang Ca 1 ngày mới (${formatDateDisplay(
              freshToday
            )}).`,
            "success"
          );
        } else {
          notify(
            `Đã ghi nhận in ${
              form === "BM04" ? "Sổ BM.04" : "Sổ BM.13"
            }. Vui lòng bấm in tiếp biểu mẫu còn lại để mở khóa phiên làm việc mới!`,
            "info"
          );
        }
      }
    }, 650);
  };

  const fallbackMobileSnapshotRows: ShiftSnapshotRow[] = useMemo(() => {
    const targetShift = (mobileQrSession?.shift || viewShift) as ShiftNumber;
    const rows: ShiftSnapshotRow[] = [];
    currentDayComputed.tests.forEach((t) => {
      if (!isStockTestCode(t.code) || t.noStock) return;
      const prevEnd =
        targetShift === 1
          ? currentDayComputed.tonDau[t.code] ?? 0
          : currentDayComputed.shifts[(targetShift - 1) as ShiftNumber]?.[
              t.code
            ]?.tonCuoi ?? 0;
      const c = currentDayComputed.shifts[targetShift]?.[t.code] || {
        boiHoan: 0,
        suDungQC: 0,
        suDung: 0,
        tonCuoi: prevEnd,
      };
      rows.push({
        code: t.code,
        name: t.name,
        unit: t.unit,
        tonDau: prevEnd,
        boiHoan: c.boiHoan,
        suDungQC: c.suDungQC,
        suDung: c.suDung,
        tonCuoi: c.tonCuoi,
      });
    });
    return rows;
  }, [mobileQrSession?.shift, viewShift, currentDayComputed]);
  /* ==================== TẤM KHIÊN CÁCH LY 1: MOBILE CHECKLIST ==================== */
  if (mobileQrSession) {
    return (
      <MobileHandoverChecklistModal
        qrState={mobileQrSession}
        fallbackRows={fallbackMobileSnapshotRows}
        verifierName={auth?.user?.name || ""}
        isOnline={isOnline}
        submitting={mobileSubmitting}
        acceptedMustLogout={mobileAcceptedMustLogout}
        onAcceptHandover={handleMobileAcceptHandover}
        onRejectHandover={handleMobileRejectHandover}
        onMandatoryMobileLogout={handleMandatoryMobileLogout}
        onCloseWithoutAction={handleMandatoryMobileLogout}
      />
    );
  }

  /* ==================== TẤM KHIÊN CÁCH LY 2: MÀN HÌNH ĐĂNG NHẬP ==================== */
  if (!auth) {
    return (
      <LoginScreen
        apiUrl={apiUrl}
        hasPendingQr={hasPendingQrClaim}
        onSuccess={(bundle) => {
          const nextAuth = bundle.auth;
          setAuth(nextAuth);

          // Nạp tức thì trạng thái QR, Khóa cứng in 2 biểu mẫu Ca 4 & Ngày Neo Ca 4 ngay từ giây 0.00
          if (bundle.handoverQr !== undefined) {
            setHandoverQrState(bundle.handoverQr || null);
          }
          if (bundle.compliancePrint !== undefined) {
            setCompliancePrintState(bundle.compliancePrint || null);
          }
          if (bundle.stickyShift4Date) {
            setStickyShift4Date(bundle.stickyShift4Date);
            if (isDateStr(bundle.stickyShift4Date)) {
              setSelectedDate(bundle.stickyShift4Date);
            }
          }

          const initialSession = bundle.activeSession;
          if (initialSession !== undefined) {
            setActiveSession(initialSession || null);
            const ownerId = String(
              initialSession?.mainUserId || ""
            ).toLowerCase();
            const isOther =
              Boolean(initialSession) &&
              (ownerId
                ? ownerId !== nextAuth.user.id.toLowerCase()
                : initialSession!.mainUser !== nextAuth.user.name);
            const hasActiveQrHandover =
              bundle.handoverQr &&
              (bundle.handoverQr.status === "WAITING_SCAN" ||
                bundle.handoverQr.status === "VERIFYING");

            if (
              isOther &&
              initialSession &&
              !hasPendingQrClaim &&
              !hasActiveQrHandover
            ) {
              if (nextAuth.user.role === "Admin") {
                notify(
                  `Phiên đang được giữ bởi ${initialSession.mainUser} (Ca ${initialSession.shift}). Quyền Tối Thượng Admin đã kích hoạt!`,
                  "info"
                );
              } else {
                notify(
                  `Cảnh báo: Phiên làm việc đang được giữ bởi ${initialSession.mainUser} (Ca ${initialSession.shift}). Bạn đang ở chế độ CHỈ XEM!`,
                  "info"
                );
              }
            }
          }
          if (nextAuth.mustChange) {
            setShowChangePwModal(true);
          }
        }}
        onChangeApiUrl={(nextUrl) => {
          setApiUrl(nextUrl);
          notify("Đã lưu cấu hình URL API mới!", "success");
        }}
      />
    );
  }

  /* ==================== TẤM KHIÊN CÁCH LY 3: CỔNG CHẶN MÃ PIN DỰ PHÒNG ==================== */
  // Đảm bảo 100%: Khi đang có ca chờ bàn giao và Người nhận tự đăng nhập vào điện thoại (không quét được QR),
  // hệ thống chặn ngay ở cửa sổ nhập PIN dự phòng, tuyệt đối không cho bay thẳng vào giao diện chính!
  if (mustInterceptWithPinModal) {
    return (
      <>
        <div className="no-print fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
                t.type === "success"
                  ? "bg-emerald-900/95 text-white border-emerald-400/40"
                  : t.type === "error"
                  ? "bg-rose-900/95 text-white border-rose-400/40"
                  : "bg-slate-900/95 text-white border-slate-600"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="leading-snug">{t.message}</span>
            </div>
          ))}
        </div>
        <ManualPinClaimModal
          open={true}
          loading={mobileSubmitting}
          interceptMode={true}
          pendingQrInfo={handoverQrState}
          currentUserName={auth.user.name}
          onClose={() => {}}
          onLogout={handleLogout}
          onSubmitPin={(pin) => claimQrHandoverSession("", pin)}
        />
      </>
    );
  }

  // Chỉ bật Khóa cứng bắt buộc in 2 biểu mẫu Ca 4 khi PC không còn ở màn hình chờ QR của Người giao
  const isWaitingQrOnSenderPc =
    isCurrentUserSenderOfActiveQr &&
    (handoverQrState?.status === "WAITING_SCAN" ||
      handoverQrState?.status === "VERIFYING");

  const isLockedByCompliancePrint = Boolean(
    !isWaitingQrOnSenderPc &&
      compliancePrintState?.required &&
      Number(compliancePrintState?.shift) === 4
  );

  const activeShiftTheme = SHIFT_THEME[viewShift] || SHIFT_THEME[1];
  const isWorkDisabled =
    Boolean(handoverLockReason) ||
    isLockedByOtherUser ||
    isLockedByCompliancePrint;

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
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
              t.type === "success"
                ? "bg-emerald-900/95 text-white border-emerald-400/40"
                : t.type === "error"
                ? "bg-rose-900/95 text-white border-rose-400/40"
                : "bg-slate-900/95 text-white border-slate-600"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : t.type === "error" ? (
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
          <div className="flex items-center gap-3">
            {!headerLogoErr ? (
              <img
                src="/Quản Lý Test Nhanh Miễn dịch.png"
                onError={() => setHeaderLogoErr(true)}
                alt="Logo Quản Lý Test Nhanh Miễn Dịch"
                className="w-12 h-12 rounded-2xl object-cover border border-sky-400/50 shadow-md shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
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
                Hệ thống Quản lý Test Nhanh Miễn Dịch (BM.04 & BM.13 • V2031)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5">
              <input
                type="date"
                value={selectedDate}
                disabled={isLockedByCompliancePrint}
                max={isAdmin ? undefined : todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isDateStr(val)) {
                    datePickedRef.current = val !== anchoredBusinessDate;
                    setSelectedDate(val);
                    setAdminShiftOverride(null);
                  }
                }}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer disabled:opacity-60 [color-scheme:dark]"
              />
              {selectedDate !== anchoredBusinessDate &&
                !isLockedByCompliancePrint && (
                  <button
                    type="button"
                    onClick={() => {
                      datePickedRef.current = false;
                      setSelectedDate(anchoredBusinessDate);
                      setAdminShiftOverride(null);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase"
                  >
                    Về ca hiện tại
                  </button>
                )}
            </div>

            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border shadow-sm transition ${activeShiftTheme.headerSelectBg}`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <select
                value={viewShift}
                disabled={!isAdmin || isLockedByOtherUser}
                onChange={(e) => {
                  const nextCa = Number(e.target.value) as ShiftNumber;
                  setAdminShiftOverride(
                    nextCa === effectiveShift ? null : nextCa
                  );
                }}
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer disabled:cursor-default"
              >
                {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => (
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

            <button
              type="button"
              disabled={isLockedByOtherUser}
              onClick={() => setShowCheckerModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition disabled:opacity-50 ${
                checker
                  ? "bg-emerald-600/90 border-emerald-400/50 text-white"
                  : "bg-amber-500/90 border-amber-300 text-slate-950 animate-pulse"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {checker ? `KT: ${checker.name}` : "Chọn Người Kiểm Tra"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isLockedByOtherUser) flushOutbox(true);
                syncFromCloud(true, selectedDate);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition ${
                !isOnline || pausedOutboxCount > 0
                  ? "bg-rose-600 border-rose-400 text-white"
                  : outbox.length > 0
                  ? "bg-amber-500 border-amber-300 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
              }`}
              title={
                pausedOutboxCount > 0
                  ? `Có ${pausedOutboxCount} thao tác đang tạm dừng. Bấm để gửi lại ngay!`
                  : "Đồng bộ dữ liệu với Google Sheets"
              }
            >
              {isOnline ? (
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span>
                {outbox.length > 0
                  ? pausedOutboxCount > 0
                    ? `Gửi lại (${outbox.length})`
                    : `Đang lưu (${outbox.length})`
                  : isOnline
                  ? "Đã đồng bộ"
                  : "Offline"}
              </span>
            </button>

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
            onClick={() => setActiveTab("WORK")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === "WORK"
                ? "bg-slate-100 text-sky-900 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
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
            onClick={() => setActiveTab("BM13")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === "BM13"
                ? "bg-slate-100 text-sky-900 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
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
            onClick={() => setActiveTab("PRINT_BM04")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === "PRINT_BM04"
                ? "bg-slate-100 text-sky-900 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Printer className="w-4 h-4" /> 3. In Sổ BM.04 (
            {todayBm04Logs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PRINT_BM13")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === "PRINT_BM13"
                ? "bg-slate-100 text-sky-900 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Printer className="w-4 h-4" /> 4. In Sổ BM.13
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("ADMIN")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
                activeTab === "ADMIN"
                  ? "bg-slate-100 text-amber-700 shadow-sm"
                  : "text-amber-300 hover:text-amber-200 hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4" /> 5. Quản Trị Hệ Thống
            </button>
          )}
        </div>
      </header>

      {/* CÁC BANNER CẢNH BÁO KHÓA PHIÊN & GIAO NHẬN CA */}
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
                  Phiên làm việc hiện đang được giữ bởi đồng nghiệp{" "}
                  <strong className="underline font-black text-slate-900">
                    {activeSession?.mainUser}
                  </strong>{" "}
                  (Ca {activeSession?.shift} • Ngày{" "}
                  {formatDateDisplay(activeSession?.date || selectedDate)}). Mọi
                  thao tác chỉnh sửa đã tạm khóa để bảo vệ dữ liệu.
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
                  Phiên làm việc hiện đang được giữ bởi đồng nghiệp{" "}
                  <strong className="underline font-black text-slate-900">
                    {activeSession?.mainUser}
                  </strong>{" "}
                  (Ca {activeSession?.shift} • Ngày{" "}
                  {formatDateDisplay(activeSession?.date || selectedDate)}). Bạn
                  là Admin nên có toàn quyền thao tác xuyên phiên mà không làm
                  văng phiên của đồng nghiệp.
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowManualPinModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase"
              >
                Nhập PIN 4 Số Nhận Ca
              </button>
              <button
                type="button"
                onClick={() => {
                  if (yesterdayCa4PendingBlock && selectedDate === todayStr) {
                    datePickedRef.current = true;
                    setSelectedDate(yesterdayCa4PendingBlock.date);
                  }
                  setActiveTab("BM13");
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase flex items-center gap-1"
              >
                Sang Tab 2 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NỘI DUNG CHÍNH THEO TAB */}
      <main className="max-w-[1600px] w-full mx-auto p-4 flex-1">
        {/* ==================== TAB 1: WORKSPACE 3 CỘT (BM.04 & TỒN KHO CA) ==================== */}
        {activeTab === "WORK" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* CỘT 1 (4/12): TIẾP NHẬN BỆNH NHÂN */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900">
                    1. Tiếp Nhận Bệnh Nhân
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Đang ghi nhận vào:{" "}
                    <span
                      className={`px-2 py-0.5 rounded font-black ${activeShiftTheme.badgeBg} ${activeShiftTheme.badgeText}`}
                    >
                      {SHIFT_INFO[viewShift].short} (
                      {SHIFT_INFO[viewShift].timeRange})
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
                    onChange={(e) => setHoTenBN(e.target.value.toUpperCase())}
                    disabled={isWorkDisabled}
                    placeholder="NGUYỄN VĂN A"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  <div className="col-span-5">
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Giới tính
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      {(["Nam", "Nu"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          disabled={isWorkDisabled}
                          onClick={() => setGioiTinh(g)}
                          className={`py-1.5 rounded-lg text-xs font-black transition disabled:opacity-60 ${
                            gioiTinh === g
                              ? "bg-white text-sky-700 shadow-sm"
                              : "text-slate-600"
                          }`}
                        >
                          {g === "Nam" ? "Nam" : "Nữ"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black uppercase text-slate-600">
                        {isAgeMode ? "Tuổi *" : "Năm sinh *"}
                      </label>
                      <label
                        className="inline-flex items-center gap-1 cursor-pointer select-none text-[10px] font-black text-sky-700 hover:text-sky-800"
                        title="Tích chọn để nhập số Tuổi (Sẽ in ra 35T trên sổ BM.04 để phân biệt với Năm sinh)"
                      >
                        <input
                          type="checkbox"
                          checked={isAgeMode}
                          disabled={isWorkDisabled}
                          onChange={(e) => setIsAgeMode(e.target.checked)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Tuổi</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={namSinh}
                      onChange={(e) => setNamSinh(e.target.value)}
                      disabled={isWorkDisabled}
                      placeholder={isAgeMode ? "VD: 35" : "1985"}
                      min={isAgeMode ? 1 : 1900}
                      max={isAgeMode ? 130 : getVnParts().year}
                      className={`w-full px-2 py-2 rounded-xl border text-sm font-black text-center text-slate-900 focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
                        isAgeMode
                          ? "border-amber-400 bg-amber-50/40 focus:ring-amber-500"
                          : "border-slate-300 focus:ring-sky-500"
                      }`}
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Barcode *
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
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
                    {testsConfig.map((t) => {
                      const active = selectedTestCodes.includes(t.code);
                      const isNoStock = !isStockTestCode(t.code) || t.noStock;
                      const stockEnd =
                        currentDayComputed.shifts[viewShift]?.[t.code]
                          ?.tonCuoi ?? 0;
                      return (
                        <button
                          key={t.code}
                          type="button"
                          disabled={isWorkDisabled}
                          onClick={() => handleToggleTestCode(t.code)}
                          className={`p-2 rounded-xl border text-left transition flex flex-col justify-between disabled:opacity-60 ${
                            active
                              ? "bg-sky-600 text-white border-sky-600 shadow-md"
                              : isNoStock
                              ? "bg-purple-50/60 hover:bg-purple-100/70 text-slate-800 border-purple-200"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          <div className="text-xs font-black leading-tight truncate">
                            {t.name}
                          </div>
                          <div
                            className={`text-[10px] font-bold mt-1 ${
                              active
                                ? "text-sky-100"
                                : isNoStock
                                ? "text-purple-700"
                                : stockEnd <= 0
                                ? "text-rose-600 font-black"
                                : "text-slate-500"
                            }`}
                          >
                            {isNoStock ? "8 chân • BM.04" : `Tồn: ${stockEnd}`}
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

            {/* CỘT 2 (5/12): HÀNG ĐỢI CHỜ ĐỌC KẾT QUẢ & NHẬT KÝ BM.04 HÔM NAY */}
            <div className="lg:col-span-5 space-y-4">
              {/* Khung 2A: Hàng đợi chờ đọc kết quả */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h2 className="text-sm font-black uppercase text-slate-900">
                    2. Chờ Đọc Kết Quả ({visiblePending.length})
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500">
                    Nhấn ⏱ để hẹn 10&apos; / 15&apos; / 20&apos; (Báo chuông lớn
                    khi hết giờ)
                  </span>
                </div>

                {visiblePending.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    Hàng đợi đang sạch. Chưa có xét nghiệm nào chờ đọc kết quả.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {visiblePending.map((item) => {
                      const isMulti = Boolean(getSubTests(item.maTest));
                      const draft = drafts[item.id] || {
                        docChung: item.docChung,
                        ketQua: "",
                      };
                      const itemShiftTheme =
                        SHIFT_THEME[item.caTruc] || SHIFT_THEME[1];
                      const isFromPastDate = item.ngayBC !== selectedDate;
                      const isControlInvalid = draft.docChung === "Âm Tính";

                      const tInfo = timers[item.id];
                      let remainMs = 0;
                      let remainRatio = 1;
                      let timerLevel: "NONE" | "SAFE" | "WARN_50" | "CRIT_5" =
                        "NONE";

                      if (tInfo && tInfo.durationMs > 0) {
                        const elapsed = Math.max(0, timerNowMs - tInfo.startAt);
                        remainMs = Math.max(0, tInfo.durationMs - elapsed);
                        remainRatio = remainMs / tInfo.durationMs;
                        if (remainRatio <= 0.05) {
                          timerLevel = "CRIT_5";
                        } else if (remainRatio <= 0.5) {
                          timerLevel = "WARN_50";
                        } else {
                          timerLevel = "SAFE";
                        }
                      }

                      const cardBgClass =
                        timerLevel === "CRIT_5"
                          ? "bg-rose-100 border-2 border-rose-500 shadow-md ring-2 ring-rose-300 animate-pulse"
                          : timerLevel === "WARN_50"
                          ? "bg-amber-100/90 border-2 border-amber-400 shadow-sm"
                          : isFromPastDate
                          ? "bg-amber-50/70 border border-amber-300"
                          : "bg-slate-50/70 border border-slate-200";

                      const rawBirthOrAge = item.namSinhNam || item.namSinhNu;
                      const birthDisplay = formatBirthOrAgeDisplay(
                        rawBirthOrAge,
                        item.isAgeMode
                      );

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
                                Barcode:{" "}
                                <span className="font-bold text-slate-900">
                                  {item.barcode}
                                </span>{" "}
                                • {birthDisplay.isAge ? "Tuổi" : "Năm sinh"}:{" "}
                                <span className="font-bold text-slate-800">
                                  {birthDisplay.text} (
                                  {item.namSinhNam ? "Nam" : "Nữ"})
                                </span>{" "}
                                • TH: {item.nguoiThucHien}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 relative">
                              <button
                                type="button"
                                disabled={isLockedByOtherUser}
                                onClick={() =>
                                  setOpenTimerMenuId((prev) =>
                                    prev === item.id ? null : item.id
                                  )
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border transition disabled:opacity-50 ${
                                  timerLevel === "CRIT_5"
                                    ? "bg-rose-600 text-white border-rose-700 shadow-sm"
                                    : timerLevel === "WARN_50"
                                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                                    : timerLevel === "SAFE"
                                    ? "bg-sky-600 text-white border-sky-700 shadow-sm"
                                    : "bg-white hover:bg-sky-50 text-slate-700 border-slate-300"
                                }`}
                                title="Bấm để chọn thời gian đếm ngược (10', 15', 20')"
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {tInfo ? (
                                  <span>
                                    {remainMs <= 0
                                      ? "ĐỌC KQ!"
                                      : formatCountdownMmSs(remainMs)}{" "}
                                    ({tInfo.presetMin}&apos;)
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

                          {openTimerMenuId === item.id &&
                            !isLockedByOtherUser && (
                              <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white/95 p-2 rounded-xl border border-sky-300 shadow-sm">
                                <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-sky-600" />{" "}
                                  Chọn thời gian ủ test:
                                </span>
                                <div className="flex items-center gap-1">
                                  {([10, 15, 20] as TimerPresetMinutes[]).map(
                                    (mins) => {
                                      const isSelected =
                                        tInfo?.presetMin === mins;
                                      return (
                                        <button
                                          key={mins}
                                          type="button"
                                          onClick={() =>
                                            handleStartTimer(item.id, mins)
                                          }
                                          className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                                            isSelected
                                              ? "bg-sky-600 text-white shadow-sm"
                                              : "bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200"
                                          }`}
                                        >
                                          {mins}&apos;
                                        </button>
                                      );
                                    }
                                  )}
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

                          {tInfo && (
                            <div className="space-y-1">
                              <div className="w-full h-1.5 rounded-full bg-white/80 overflow-hidden border border-slate-200/80">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    timerLevel === "CRIT_5"
                                      ? "bg-rose-600"
                                      : timerLevel === "WARN_50"
                                      ? "bg-amber-500"
                                      : "bg-sky-600"
                                  }`}
                                  style={{
                                    width: `${Math.max(
                                      2,
                                      Math.min(100, remainRatio * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                <span
                                  className={
                                    timerLevel === "CRIT_5"
                                      ? "text-rose-700"
                                      : timerLevel === "WARN_50"
                                      ? "text-amber-800"
                                      : "text-sky-700"
                                  }
                                >
                                  {timerLevel === "CRIT_5"
                                    ? remainMs <= 0
                                      ? "🚨 Đã hết thời gian ủ — Đọc kết quả ngay!"
                                      : "🚨 Còn ≤ 5% thời gian — Chuẩn bị đọc kết quả ngay!"
                                    : timerLevel === "WARN_50"
                                    ? "⚠️ Còn ≤ 50% thời gian ủ test"
                                    : `⏱ Đang đếm ngược mốc ${tInfo.presetMin} phút`}
                                </span>
                                <span className="font-mono text-slate-700">
                                  Còn lại: {formatCountdownMmSs(remainMs)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Thanh chọn Vạch chứng (Control C) kèm Khóa bảo vệ ISO 15189 */}
                          <div className="space-y-2 pt-2 border-t border-slate-200/70">
                            <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900">
                                Đọc chứng (C):
                              </span>
                              <div className="flex gap-1.5">
                                {(
                                  ["Dương tính", "Âm Tính"] as DocChungValue[]
                                ).map((dc) => {
                                  const active = draft.docChung === dc;
                                  const activeCls =
                                    dc === "Dương tính"
                                      ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200"
                                      : "bg-rose-700 text-white border-rose-700 shadow-sm ring-2 ring-rose-200";
                                  return (
                                    <button
                                      key={dc}
                                      type="button"
                                      disabled={isLockedByOtherUser}
                                      onClick={() =>
                                        setDrafts((prev) => ({
                                          ...prev,
                                          [item.id]: {
                                            ...draft,
                                            docChung: dc,
                                          },
                                        }))
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition disabled:opacity-50 ${
                                        active
                                          ? activeCls
                                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {dc === "Dương tính"
                                        ? "● Dương tính (Hợp lệ)"
                                        : "○ Âm tính (Que lỗi)"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {isControlInvalid ? (
                              <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2 text-center">
                                <div className="text-[11px] font-bold text-rose-900">
                                  ⚠️ Vạch chứng (C) Âm tính: Que thử không hợp
                                  lệ (Invalid Test). Theo chuẩn ISO 15189, hệ
                                  thống đã khóa nút trả kết quả bệnh nhân trên
                                  que này.
                                </div>
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() => handleReportInvalidKit(item)}
                                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-md transition"
                                >
                                  ♻️ Hủy Que Lỗi (+1 Vào Cột QC/Hỏng) & Làm Lại
                                  Que Mới
                                </button>
                              </div>
                            ) : isMulti ? (
                              <>
                                <MultiPanelResultInput
                                  maTest={item.maTest}
                                  value={draft.ketQua}
                                  disabled={isLockedByOtherUser}
                                  onChange={(nextVal) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: { ...draft, ketQua: nextVal },
                                    }))
                                  }
                                  onEnterSubmit={() =>
                                    handleSaveResultFromQueue(item)
                                  }
                                  compact
                                />
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() =>
                                    handleSaveResultFromQueue(item)
                                  }
                                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Check className="w-4 h-4" /> Lưu kết quả{" "}
                                  {item.tenXetNghiem}
                                </button>
                              </>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() =>
                                    handleSaveResultFromQueue(item, "Âm tính")
                                  }
                                  className="py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-black uppercase shadow-md transition"
                                >
                                  ÂM TÍNH (LƯU)
                                </button>
                                <button
                                  type="button"
                                  disabled={isLockedByOtherUser}
                                  onClick={() =>
                                    handleSaveResultFromQueue(
                                      item,
                                      "Dương tính"
                                    )
                                  }
                                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-black uppercase shadow-md transition"
                                >
                                  DƯƠNG TÍNH (LƯU)
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

              {/* Khung 2B: NHẬT KÝ BM.04 HÔM NAY */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">
                    NHẬT KÝ BM.04 ({formatDateDisplay(selectedDate)})
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setJournalShiftFilter("ALL")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${
                          journalShiftFilter === "ALL"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Tất cả
                      </button>
                      {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => (
                        <button
                          key={ca}
                          type="button"
                          onClick={() => setJournalShiftFilter(ca)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${
                            journalShiftFilter === ca
                              ? `${SHIFT_THEME[ca].badgeBg} text-white shadow-sm`
                              : "text-slate-600 hover:bg-white/60"
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
                    Chưa có kết quả BM.04 nào trong ngày{" "}
                    {formatDateDisplay(selectedDate)}.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                    {todayBm04Logs.map((r) => {
                      const shiftTheme =
                        SHIFT_THEME[r.caTruc] || SHIFT_THEME[1];
                      const displayKq = getSubTests(r.maTest)
                        ? formatShortMultiSummary(r.maTest, r.ketQua || "")
                        : (r.ketQua || "").toUpperCase();
                      const isPositive =
                        displayKq.toLowerCase().includes("dương") ||
                        displayKq.includes("(D)");
                      const canModify = canUserModifyRecord(r);
                      const birthOrAge = formatBirthOrAgeDisplay(
                        r.namSinhNam || r.namSinhNu,
                        r.isAgeMode
                      );

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
                                <span className="text-xs font-bold text-slate-500">
                                  ({birthOrAge.text} •{" "}
                                  {r.namSinhNam ? "Nam" : "Nữ"})
                                </span>
                              </div>

                              <div className="text-xs font-semibold text-slate-600 flex flex-wrap items-center gap-1.5">
                                <span>
                                  Barcode:{" "}
                                  <strong className="text-slate-900">
                                    {r.barcode}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  KQ:{" "}
                                  <strong
                                    className={
                                      isPositive
                                        ? "text-rose-600 font-black"
                                        : "text-sky-800 font-black"
                                    }
                                  >
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
                                <span>
                                  • TH:{" "}
                                  <strong className="text-slate-700">
                                    {r.nguoiThucHien}
                                  </strong>
                                </span>
                                <span>
                                  • KT:{" "}
                                  <strong className="text-emerald-700">
                                    {r.nguoiKiemTra}
                                  </strong>
                                </span>
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
                    onClick={() => handleRequestOpenClosingModal(viewShift)}
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
                      <th className="py-1.5 text-center text-emerald-600">
                        +Bù
                      </th>
                      <th className="py-1.5 text-center text-rose-600">
                        -Dùng
                      </th>
                      <th className="py-1.5 text-right text-sky-700">Cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockTestsForUi.map((t) => {
                      const prevEnd =
                        viewShift === 1
                          ? currentDayComputed.tonDau[t.code] ?? 0
                          : currentDayComputed.shifts[
                              (viewShift - 1) as ShiftNumber
                            ]?.[t.code]?.tonCuoi ?? 0;
                      const cell = currentDayComputed.shifts[viewShift]?.[
                        t.code
                      ] || {
                        boiHoan: 0,
                        suDungQC: 0,
                        suDung: 0,
                        tonCuoi: prevEnd,
                      };
                      const totalUsed = cell.suDung + cell.suDungQC;
                      return (
                        <tr key={t.code} className="hover:bg-slate-50">
                          <td
                            className="py-2 font-black text-slate-800 truncate max-w-[110px]"
                            title={t.name}
                          >
                            {t.name}
                          </td>
                          <td className="py-2 text-center font-semibold text-slate-600">
                            {prevEnd}
                          </td>
                          <td className="py-2 text-center font-bold text-emerald-600">
                            {cell.boiHoan > 0 ? `+${cell.boiHoan}` : "–"}
                          </td>
                          <td className="py-2 text-center font-black text-rose-600">
                            {totalUsed > 0 ? totalUsed : "–"}
                          </td>
                          <td
                            className={`py-2 text-right font-black ${
                              cell.tonCuoi <= 0
                                ? "text-rose-600"
                                : "text-sky-700"
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
        {activeTab === "BM13" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => {
                const m = currentDayComputed.meta[ca];
                const theme = SHIFT_THEME[ca];
                const overdue =
                  m.trangThai === "OPEN" &&
                  isShiftOverdue(selectedDate, ca, nowTick);
                const pendingCnt = pendingQueue.filter(
                  (p) => p.ngayBC === selectedDate && Number(p.caTruc) === ca
                ).length;

                const seqLockReason = getSequentialShiftBlockReason(
                  ca,
                  currentDayComputed,
                  isAdmin,
                  yesterdayCa4PendingBlock,
                  selectedDate === todayStr
                );
                const isSeqLockedForUser = Boolean(seqLockReason) && !isAdmin;

                return (
                  <div
                    key={ca}
                    className={`rounded-3xl p-4 bg-white border-2 shadow-sm flex flex-col justify-between gap-3 ${theme.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {SHIFT_INFO[ca].label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            m.trangThai === "HOAN_THANH"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.trangThai === "PENDING_RECEIVE"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : overdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {m.trangThai === "HOAN_THANH"
                            ? "Đã hoàn thành"
                            : m.trangThai === "PENDING_RECEIVE"
                            ? "Chờ nhận bàn giao"
                            : overdue
                            ? "Quá giờ chưa chốt"
                            : "Đang mở"}
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs space-y-1 text-slate-600">
                        <div>
                          Người giao:{" "}
                          <strong className="text-slate-900">
                            {m.nguoiGiao || "—"}
                          </strong>
                          {m.gioGiao ? ` (${m.gioGiao})` : ""}
                        </div>
                        <div>
                          Người nhận:{" "}
                          <strong className="text-emerald-700">
                            {m.nguoiNhan || "—"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                      {m.trangThai === "OPEN" && (
                        <>
                          <button
                            type="button"
                            disabled={isLockedByOtherUser || isSeqLockedForUser}
                            onClick={() => setReplenishShiftModal(ca)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 text-xs font-black"
                          >
                            + Bồi hoàn
                          </button>
                          <button
                            type="button"
                            disabled={isLockedByOtherUser}
                            onClick={() => handleRequestOpenClosingModal(ca)}
                            title={seqLockReason || `Chốt bàn giao Ca ${ca}`}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black uppercase transition ${
                              isSeqLockedForUser
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-sky-600 hover:bg-sky-500 text-white"
                            }`}
                          >
                            {isSeqLockedForUser
                              ? `🔒 Chờ xong Ca ${ca - 1}`
                              : `Chốt Ca ${ca}${
                                  pendingCnt > 0 ? ` (${pendingCnt} chờ)` : ""
                                }`}
                          </button>
                        </>
                      )}

                      {m.trangThai === "PENDING_RECEIVE" && (
                        <div className="w-full space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setShowManualPinModal(true)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase shadow-sm"
                          >
                            📲 Nhập PIN 4 Số Mở Checklist Nhận Ca {ca}
                          </button>
                          {isAdmin && !isLockedByOtherUser && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAdminDirectReceiveShift(selectedDate, ca)
                              }
                              className="w-full py-1.5 px-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-black uppercase"
                            >
                              ⚡ [Admin] Ký Nhận Đặc Cách Ca {ca}
                            </button>
                          )}
                        </div>
                      )}

                      {m.trangThai !== "OPEN" &&
                        isAdmin &&
                        !isLockedByOtherUser && (
                          <button
                            type="button"
                            onClick={() => handleAdminResetShift(ca)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Mở khóa
                            (Admin)
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">
                    Bảng Điều Phối Tồn Kho BM.13 — Ngày{" "}
                    {formatDateDisplay(selectedDate)}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Cột &quot;Sử dụng&quot; tự động đếm từ BM.04 + Hàng đợi (Khử
                    trùng ID 100%). Chốt ca tuần tự từ Ca 1 → Ca 2 → Ca 3 → Ca
                    4.
                  </p>
                </div>
                <div className="w-full sm:w-96">
                  <input
                    type="text"
                    disabled={isLockedByOtherUser}
                    value={currentDayComputed.ghiChu}
                    onChange={(e) =>
                      handleUpdateDayTonDauOrNote(undefined, e.target.value)
                    }
                    placeholder="Ghi chú tồn kho trong ngày..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                    <th className="py-2.5 px-3 text-left rounded-tl-xl">
                      Tên Xét Nghiệm
                    </th>
                    <th className="py-2.5 px-2 text-center">Cơ số</th>
                    <th className="py-2.5 px-2 text-center bg-sky-900">
                      Tồn Đầu Ngày
                    </th>
                    {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => (
                      <th
                        key={ca}
                        colSpan={4}
                        className="py-2.5 px-2 text-center border-l border-slate-700"
                      >
                        Ca {ca} ({SHIFT_INFO[ca].timeRange})
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                    <th className="py-1.5 px-3 text-left" />
                    <th className="py-1.5 px-2 text-center" />
                    <th className="py-1.5 px-2 text-center">
                      {isAdmin ? "(Admin sửa)" : "(Tự động)"}
                    </th>
                    {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => (
                      <React.Fragment key={ca}>
                        <th className="py-1.5 px-1.5 text-center border-l border-slate-200 text-emerald-700">
                          +Bù
                        </th>
                        <th className="py-1.5 px-1.5 text-center text-purple-700">
                          -QC/Hỏng
                        </th>
                        <th className="py-1.5 px-1.5 text-center text-rose-600">
                          -Dùng
                        </th>
                        <th className="py-1.5 px-1.5 text-center text-sky-800">
                          =Cuối
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockTestsForUi.map((t) => (
                    <tr key={t.code} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-black text-slate-900">
                        {t.name}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-500">
                        {t.quota}
                      </td>
                      <td className="py-2 px-2 text-center bg-sky-50/50">
                        {isAdmin && !isLockedByOtherUser ? (
                          <input
                            type="number"
                            value={currentDayComputed.tonDau[t.code] ?? 0}
                            onChange={(e) => {
                              const nextMap = {
                                ...currentDayComputed.tonDau,
                                [t.code]: clampInt(
                                  e.target.value,
                                  -99999,
                                  999999
                                ),
                              };
                              handleUpdateDayTonDauOrNote(nextMap, undefined);
                            }}
                            className="w-16 px-1.5 py-1 rounded-lg border border-sky-300 text-center font-black text-sky-900 bg-white"
                          />
                        ) : (
                          <span className="font-black text-sky-900">
                            {currentDayComputed.tonDau[t.code] ?? 0}
                          </span>
                        )}
                      </td>

                      {([1, 2, 3, 4] as ShiftNumber[]).map((ca) => {
                        const cell = currentDayComputed.shifts[ca]?.[
                          t.code
                        ] || {
                          boiHoan: 0,
                          suDungQC: 0,
                          suDung: 0,
                          tonCuoi: 0,
                        };
                        const closed =
                          (isShiftClosed(selectedDate, ca) && !isAdmin) ||
                          isLockedByOtherUser;
                        return (
                          <React.Fragment key={ca}>
                            <td className="py-1.5 px-1 text-center border-l border-slate-100">
                              <input
                                type="number"
                                min={0}
                                disabled={closed}
                                value={cell.boiHoan || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  handleUpdateShiftCell(
                                    ca,
                                    t.code,
                                    "boiHoan",
                                    e.target.value
                                  )
                                }
                                className="w-12 px-1 py-1 rounded border border-emerald-200 text-center font-bold text-emerald-700 disabled:bg-slate-100"
                              />
                            </td>
                            <td className="py-1.5 px-1 text-center">
                              <input
                                type="number"
                                min={0}
                                disabled={closed}
                                value={cell.suDungQC || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  handleUpdateShiftCell(
                                    ca,
                                    t.code,
                                    "suDungQC",
                                    e.target.value
                                  )
                                }
                                className="w-12 px-1 py-1 rounded border border-purple-200 text-center font-bold text-purple-700 disabled:bg-slate-100"
                              />
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-black text-rose-600">
                              {cell.suDung > 0 ? cell.suDung : "–"}
                            </td>
                            <td
                              className={`py-1.5 px-1.5 text-center font-black ${
                                cell.tonCuoi < 0
                                  ? "text-rose-600 bg-rose-50"
                                  : "text-sky-800 bg-slate-50/70"
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

        {/* ==================== TAB 3: IN SỔ BM.04 (TỰ ĐỘNG NEO ĐÚNG NGÀY CA 4) ==================== */}
        {activeTab === "PRINT_BM04" && (
          <PrintBm04
            selectedDate={effectivePrintDate}
            logs={bm04Logs}
            testsConfig={testsConfig}
            forceAllFilters={isLockedByCompliancePrint}
          />
        )}

        {/* ==================== TAB 4: IN SỔ BM.13 (TỰ ĐỘNG NEO ĐÚNG NGÀY CA 4) ==================== */}
        {activeTab === "PRINT_BM13" && (
          <PrintBm13
            selectedDate={effectivePrintDate}
            computed={effectivePrintDayComputed}
          />
        )}

        {/* ==================== TAB 5: QUẢN TRỊ ADMIN ==================== */}
        {activeTab === "ADMIN" && isAdmin && (
          <AdminPanel
            apiUrl={apiUrl}
            token={auth.token}
            currentUser={auth.user}
            testsConfig={testsConfig}
            activeSession={activeSession}
            outboxCount={outbox.length}
            onUpdateTestsConfig={(nextTests) => setTestsConfig(nextTests)}
            onForceUnlockSession={handleForceUnlockSession}
            onApiUrlChanged={(nextUrl) => {
              setApiUrl(nextUrl);
              setDataVersion("0");
              notify(
                "Đã chuyển sang kết nối Google Sheets mới thành công!",
                "success"
              );
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
        onChanged={(newToken) => {
          setAuth((prev) =>
            prev ? { ...prev, token: newToken, mustChange: false } : prev
          );
          setShowChangePwModal(false);
          notify(
            "Đổi mật khẩu thành công! Đang tải dữ liệu hệ thống...",
            "success"
          );
        }}
        onLogout={handleLogout}
      />

      <CheckerVerifyModal
        open={showCheckerModal}
        apiUrl={apiUrl}
        token={auth.token}
        mainUser={auth.user}
        onClose={() => setShowCheckerModal(false)}
        onVerified={(nextChecker) => {
          setChecker(nextChecker);
          setShowCheckerModal(false);
          notify(`Đã xác thực Người kiểm tra: ${nextChecker.name}`, "success");
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
          onApply={(map) => handleApplyBulkReplenish(replenishShiftModal, map)}
        />
      )}

      {closingShiftModal && (
        <ClosingReviewModal
          open={true}
          shift={closingShiftModal}
          dateStr={selectedDate}
          computed={currentDayComputed}
          pendingCountOfShift={
            pendingQueue.filter(
              (p) =>
                p.ngayBC === selectedDate &&
                Number(p.caTruc) === closingShiftModal
            ).length
          }
          isAdmin={isAdmin}
          loading={closingLoading}
          onClose={() => setClosingShiftModal(null)}
          onConfirmCloseShift={() => handleConfirmCloseShift(closingShiftModal)}
        />
      )}

      {isWaitingQrOnSenderPc && (
        <PcHandoverQrModal
          qrState={handoverQrState}
          nowMs={qrNowMs}
          cancelLoading={cancelQrLoading}
          onCancelAndUnlock={handleCancelQrFromPc}
        />
      )}

      <ManualPinClaimModal
        open={showManualPinModal}
        loading={mobileSubmitting}
        interceptMode={false}
        pendingQrInfo={handoverQrState}
        currentUserName={auth.user.name}
        onClose={() => setShowManualPinModal(false)}
        onLogout={handleLogout}
        onSubmitPin={(pin) => claimQrHandoverSession("", pin)}
      />

      {!isWaitingQrOnSenderPc && (
        <CompliancePrintLockModal
          state={compliancePrintState}
          activeTab={activeTab}
          printingForm={printingFormLock}
          onTriggerPrintForm={handleTriggerCompliancePrint}
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
