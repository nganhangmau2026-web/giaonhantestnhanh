import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, PackageCheck, Printer, Settings, LogOut, KeyRound,
  PlusCircle, Trash2, CheckSquare, Search, UserCheck,
  Calendar, Clock, FileSpreadsheet, Sparkles, Lock, Download, ShieldCheck, UserX, AlertTriangle
} from 'lucide-react';

// ============================================================================
// BẠN HÃY DÁN LINK GOOGLE APPS SCRIPT VÀO ĐÂY (Trong dấu nháy đơn)
const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx0jakdbvQoA9-trw7tF1vsbpdpmJQI4M4Jh0YhFSzEvLQxvO3xvSxLIs3zFj-0b2g/exec';
// ============================================================================

const DEFAULT_TESTS_CONFIG = [
  { code: 'HCV', name: 'HCV (TN)', unit: 'TEST', quota: 20 },
  { code: 'HBSAB', name: 'HBsAb (TN)', unit: 'TEST', quota: 5 },
  { code: 'HIV', name: 'HIV (TN)', unit: 'TEST', quota: 10 },
  { code: 'SYPHI', name: 'SYPHI', unit: 'TEST', quota: 5 },
  { code: 'KSTSR', name: 'KT KSTSR', unit: 'TEST', quota: 10 },
  { code: 'DENGUE', name: 'DENGUE', unit: 'TEST', quota: 10 },
  { code: 'NS1', name: 'NS1', unit: 'TEST', quota: 10 },
  {
    code: 'DRUG4',
    name: 'test gây nghiện 4 test thử',
    unit: 'TEST',
    quota: 10,
  },
  { code: 'MOP', name: 'MOP', unit: 'TEST', quota: 10 },
  { code: 'AMP', name: 'AMP', unit: 'TEST', quota: 10 },
  { code: 'MET', name: 'MET', unit: 'TEST', quota: 10 },
  { code: 'THC', name: 'THC', unit: 'TEST', quota: 10 },
  { code: 'HBEAB', name: 'HBeAb (TN)', unit: 'TEST', quota: 5 },
  { code: 'HBEAG', name: 'HBeAg (TN)', unit: 'TEST', quota: 5 },
  { code: 'HBCAB', name: 'HBcAb (TN)', unit: 'TEST', quota: 5 },
  { code: 'CODEIN', name: 'CODEIN', unit: 'TEST', quota: 10 },
];

const DEFAULT_USERS = [
  {
    id: 'thlong',
    name: 'Tô Hoàng Long',
    password: 'Longdeptrai',
    role: 'Admin',
  },
  {
    id: 'lhthinh',
    name: 'Lê Hữu Thịnh',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'nthien',
    name: 'Ninh Thị Hiến',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'dhtram',
    name: 'Đặng Huyền Trâm',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'lkhung',
    name: 'Lâm Khánh Hưng',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'tttrong',
    name: 'Trần Thu Trong',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'nqthien',
    name: 'Nguyễn Quang Thiện',
    password: 'Longdeptrai',
    role: 'User',
  },
  { id: 'hvlinh', name: 'Hồ Vũ Linh', password: 'Longdeptrai', role: 'User' },
  {
    id: 'pttuan',
    name: 'Phạm Thanh Tuấn',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'hqsang',
    name: 'Huỳnh Quang Sang',
    password: 'Longdeptrai',
    role: 'User',
  },
  { id: 'pmman', name: 'Phạm Minh Mẫn', password: 'Longdeptrai', role: 'User' },
  { id: 'dtvan', name: 'Đoàn Thị Vân', password: 'Longdeptrai', role: 'User' },
  {
    id: 'httong',
    name: 'Huỳnh Thanh Tòng',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'ttttin',
    name: 'Thái Trường Trọng Tín',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'htquyen',
    name: 'Huỳnh Tú Quyên',
    password: 'Longdeptrai',
    role: 'User',
  },
  { id: 'hnam', name: 'Huỳnh Nam', password: 'Longdeptrai', role: 'User' },
  { id: 'dnha', name: 'Danh Ngọc Hà', password: 'Longdeptrai', role: 'User' },
  {
    id: 'nmduy',
    name: 'Nguyễn Minh Duy',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'ttkan',
    name: 'Trần Thị Khánh An',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'tnanh',
    name: 'Trương Nhật Anh',
    password: 'Longdeptrai',
    role: 'User',
  },
  { id: 'tvthu', name: 'Trần Vĩnh Thứ', password: 'Longdeptrai', role: 'User' },
  { id: 'tlam', name: 'Trần Lâm', password: 'Longdeptrai', role: 'User' },
  {
    id: 'ttkhang',
    name: 'Trịnh Thị Kim Hằng',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'hltvy',
    name: 'Huỳnh Lê Tường Vy',
    password: 'Longdeptrai',
    role: 'User',
  },
  {
    id: 'ttnguyen',
    name: 'Tạ Trọng Nguyễn',
    password: 'Longdeptrai',
    role: 'User',
  },
];

const SHIFTS_INFO = [
  { id: 1, label: 'Lần 1 (07h00 - 11h00)' },
  { id: 2, label: 'Lần 2 (11h00 - 13h30)' },
  { id: 3, label: 'Lần 3 (13h30 - 17h00)' },
  { id: 4, label: 'Lần 4 (17h00 - 07h00)' },
];

function detectCurrentShift(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 7 * 60 && minutes < 11 * 60) return 1;
  if (minutes >= 11 * 60 && minutes < 13 * 60 + 30) return 2;
  if (minutes >= 13 * 60 + 30 && minutes < 17 * 60) return 3;
  return 4;
}

function getTodayStr(): string {
  const now = new Date();
  if (now.getHours() < 7) now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

export default function App() {
  // --- STATES CƠ BẢN ---
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('MD_USERS');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [testsConfig, setTestsConfig] = useState<any[]>(() => {
    const saved = localStorage.getItem('MD_TESTS_CONFIG');
    return saved ? JSON.parse(saved) : DEFAULT_TESTS_CONFIG;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('MD_CURRENT_USER');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginErr, setLoginErr] = useState('');

  const [activeTab, setActiveTab] = useState<
    'BM04' | 'BM13' | 'PRINT_BM04' | 'PRINT_BM13' | 'ADMIN'
  >('BM04');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedShift, setSelectedShift] = useState<number>(
    detectCurrentShift()
  );

  const isPast = selectedDate !== getTodayStr();
  const isAdmin = currentUser?.role === 'Admin';
  const isReadOnly = isPast && !isAdmin;

  // --- DỮ LIỆU ---
  const [bm04Logs, setBm04Logs] = useState<any[]>(() => {
    const saved = localStorage.getItem('MD_BM04_LOGS');
    return saved ? JSON.parse(saved) : [];
  });
  const [bm13Store, setBm13Store] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('MD_BM13_STORE');
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingQueue, setPendingQueue] = useState<any[]>(() => {
    const saved = localStorage.getItem('MD_PENDING');
    return saved ? JSON.parse(saved) : [];
  });

  // --- NGƯỜI KIỂM TRA LOGIC ---
  const [checkerUser, setCheckerUser] = useState<any>(null);
  const [showCheckerLogin, setShowCheckerLogin] = useState(false);
  const [checkerId, setCheckerId] = useState('');
  const [checkerPw, setCheckerPw] = useState('');
  useEffect(() => {
    setCheckerUser(null);
  }, [selectedDate, selectedShift]);

  // --- FORM BM.04 ---
  const [barcode, setBarcode] = useState('');
  const [hoTenBN, setHoTenBN] = useState('');
  const [namSinh, setNamSinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<'Nam' | 'Nữ'>('Nam');
  const [searchTest, setSearchTest] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customThucHien, setCustomThucHien] = useState('');
  useEffect(() => {
    if (currentUser) setCustomThucHien(currentUser.name);
  }, [currentUser]);

  // --- MODALS ---
  const [showPwModal, setShowPwModal] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverId, setHandoverId] = useState('');
  const [handoverPw, setHandoverPw] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Trạng thái Ca Trực (Locking logic)
  const currentStatus =
    bm13Store[selectedDate]?.meta?.[selectedShift]?.trangThai || 'OPEN';
  const isPendingReceive = currentStatus === 'PENDING_RECEIVE';
  const [isOverdue, setIsOverdue] = useState(false);

  // Interval kiểm tra lố giờ (10s/lần)
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        selectedDate !== getTodayStr() ||
        isPendingReceive ||
        currentStatus === 'HOAN_THANH'
      ) {
        setIsOverdue(false);
        return;
      }
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      let overdue = false;
      if (selectedShift === 1 && mins >= 11 * 60) overdue = true;
      if (selectedShift === 2 && mins >= 13 * 60 + 30) overdue = true;
      if (selectedShift === 3 && mins >= 17 * 60) overdue = true;
      if (selectedShift === 4 && now.getHours() >= 7 && mins >= 7 * 60)
        overdue = true;
      setIsOverdue(overdue);
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedDate, selectedShift, currentStatus, isPendingReceive]);

  // Ép buộc khóa giao diện nếu lố giờ hoặc chờ nhận ca (Admin miễn nhiễm)
  const isSystemLocked = (isPendingReceive || isOverdue) && !isAdmin;

  // LƯU STORAGE
  useEffect(() => {
    localStorage.setItem('MD_USERS', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('MD_TESTS_CONFIG', JSON.stringify(testsConfig));
  }, [testsConfig]);
  useEffect(() => {
    localStorage.setItem('MD_BM04_LOGS', JSON.stringify(bm04Logs));
  }, [bm04Logs]);
  useEffect(() => {
    localStorage.setItem('MD_BM13_STORE', JSON.stringify(bm13Store));
  }, [bm13Store]);
  useEffect(() => {
    localStorage.setItem('MD_PENDING', JSON.stringify(pendingQueue));
  }, [pendingQueue]);

  // CƠ CHẾ ĐẾM NGƯỢC 5S CHỐT CA
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      executeChotCa();
      setCountdown(null);
      handleLogout();
    } else {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const initiateChotCa = () => setCountdown(5);
  const cancelChotCa = () => setCountdown(null);
  const executeChotCa = () => {
    const now = new Date();
    updateShiftMeta(
      selectedShift,
      'gioGiao',
      `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`
    );
    updateShiftMeta(selectedShift, 'nguoiGiao', currentUser.name);
    updateShiftMeta(selectedShift, 'trangThai', 'PENDING_RECEIVE');
  };

  // --- XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(
      (u: any) =>
        u.id.toLowerCase() === loginId.trim().toLowerCase() &&
        u.password === loginPw
    );
    if (!found) return setLoginErr('Sai ID đăng nhập hoặc Mật khẩu!');
    setCurrentUser(found);
    localStorage.setItem('MD_CURRENT_USER', JSON.stringify(found));
    setLoginErr('');
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('MD_CURRENT_USER');
  };

  const handleCheckerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(
      (u: any) =>
        u.id.toLowerCase() === checkerId.trim().toLowerCase() &&
        u.password === checkerPw
    );
    if (!found) return alert('Sai ID hoặc Mật khẩu người kiểm tra!');
    if (found.name === customThucHien)
      return alert('Người kiểm tra không được trùng với Người thực hiện!');
    setCheckerUser(found);
    setShowCheckerLogin(false);
    setCheckerId('');
    setCheckerPw('');
  };

  const handleHandoverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(
      (u: any) =>
        u.id.toLowerCase() === handoverId.trim().toLowerCase() &&
        u.password === handoverPw
    );
    if (!found) return alert('Sai tài khoản nhận bàn giao!');
    updateShiftMeta(selectedShift, 'nguoiNhan', found.name);
    updateShiftMeta(selectedShift, 'trangThai', 'HOAN_THANH');
    setShowHandoverModal(false);
    setHandoverId('');
    setHandoverPw('');
    alert(`Đã nhận bàn giao thành công bởi ${found.name}!`);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const userRecord = users.find((u: any) => u.id === currentUser.id);
    if (!userRecord || userRecord.password !== oldPw)
      return alert('❌ Mật khẩu hiện tại không chính xác!');
    const updated = users.map((u: any) =>
      u.id === currentUser.id ? { ...u, password: newPw.trim() } : u
    );
    setUsers(updated);
    alert('✅ Đổi mật khẩu thành công!');
    setShowPwModal(false);
  };

  const handleAdminResetPw = (targetUserId: string) => {
    if (!isAdmin) return;
    setUsers(
      users.map((u: any) =>
        u.id === targetUserId ? { ...u, password: 'Longdeptrai' } : u
      )
    );
    alert(`Đã reset mật khẩu của ID [${targetUserId}] về: Longdeptrai`);
  };

  // --- QUẢN LÝ DANH MỤC TEST (ADMIN) ---
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestQuota, setNewTestQuota] = useState('');
  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (testsConfig.some((t) => t.code === newTestCode.toUpperCase()))
      return alert('Mã Test này đã tồn tại!');
    const newTest = {
      code: newTestCode.toUpperCase(),
      name: newTestName,
      unit: 'TEST',
      quota: Number(newTestQuota),
    };
    setTestsConfig([...testsConfig, newTest]);
    setNewTestCode('');
    setNewTestName('');
    setNewTestQuota('');
  };
  const handleDeleteTest = (code: string) => {
    if (!isAdmin) return;
    if (
      window.confirm(
        `Bạn có chắc muốn xóa vĩnh viễn test [${code}] khỏi hệ thống?`
      )
    ) {
      setTestsConfig(testsConfig.filter((t) => t.code !== code));
    }
  };

  // --- LOGIC BM.04 ---
  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || isSystemLocked) return;
    if (
      !barcode.trim() ||
      !hoTenBN.trim() ||
      !namSinh.trim() ||
      selectedTests.length === 0
    )
      return alert('Vui lòng nhập đủ thông tin và chọn ít nhất 1 xét nghiệm!');
    if (!checkerUser)
      return alert(
        'Bắt buộc phải Đăng nhập Ký duyệt (Người kiểm tra) trước khi xử lý!'
      );

    const newItems = selectedTests.map((code) => {
      const tConf = testsConfig.find((t) => t.code === code);
      return {
        id: `${Date.now()}_${code}`,
        ngayBC: selectedDate,
        caTruc: selectedShift,
        maTest: code,
        tenXetNghiem: tConf?.name,
        hoTenBN: hoTenBN.trim().toUpperCase(),
        namSinhNam: gioiTinh === 'Nam' ? namSinh.trim() : '',
        namSinhNu: gioiTinh === 'Nữ' ? namSinh.trim() : '',
        barcode: barcode.trim(),
        nguoiThucHien: customThucHien,
        nguoiKiemTra: checkerUser.name,
        docChung: 'Dương tính',
        ketQua: '',
        thoiGianDocKQ: `${String(new Date().getHours()).padStart(
          2,
          '0'
        )}h${String(new Date().getMinutes()).padStart(2, '0')} ${selectedDate
          .split('-')
          .reverse()
          .join('/')}`,
      };
    });
    setPendingQueue([...pendingQueue, ...newItems]);
    setBarcode('');
    setHoTenBN('');
    setNamSinh('');
    setSelectedTests([]);
    setSearchTest('');
  };

  const handleProcessQueueItem = (queueId: string) => {
    if (isSystemLocked) return;
    const item = pendingQueue.find((q) => q.id === queueId);
    if (!item) return;
    if (!item.ketQua.trim())
      return alert(
        'Vui lòng GÕ TAY Kết quả (VD: Âm tính, Dương tính...) trước khi lưu!'
      );

    item.thoiGianDocKQ = `${String(new Date().getHours()).padStart(
      2,
      '0'
    )}h${String(new Date().getMinutes()).padStart(2, '0')} ${selectedDate
      .split('-')
      .reverse()
      .join('/')}`;
    setBm04Logs([...bm04Logs, item]);
    setPendingQueue(pendingQueue.filter((q) => q.id !== queueId));

    if (GOOGLE_APPS_SCRIPT_URL) {
      fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addBM04', records: [item] }),
      }).catch(() => {});
    }
  };

  const handleDeleteBM04 = (id: string) => {
    if (isReadOnly || isSystemLocked) return;
    if (
      !window.confirm(
        'Xóa kết quả này sẽ giảm số lượng Sử dụng trên BM.13. Xác nhận xóa?'
      )
    )
      return;
    setBm04Logs((prev) => prev.filter((r) => r.id !== id));
  };

  // --- LOGIC BM.13 TÍNH TOÁN TỒN KHO ---
  const dayData = useMemo(() => {
    const prevDateObj = new Date(selectedDate);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];
    const currentRecord = bm13Store[selectedDate] || {};
    const prevRecord = bm13Store[prevDateStr] || null;

    const usageCount: Record<number, Record<string, number>> = {
      1: {},
      2: {},
      3: {},
      4: {},
    };
    testsConfig.forEach((t) => {
      [1, 2, 3, 4].forEach((s) => (usageCount[s][t.code] = 0));
    });
    bm04Logs.forEach((log) => {
      if (log.ngayBC === selectedDate && usageCount[log.caTruc])
        usageCount[log.caTruc][log.maTest] += 1;
    });

    const calculated: Record<string, any> = {};
    testsConfig.forEach((t) => {
      let defaultTonDau = t.quota;
      if (
        prevRecord &&
        prevRecord.lastTonCuoiCa4 &&
        prevRecord.lastTonCuoiCa4[t.code] !== undefined
      )
        defaultTonDau = Number(prevRecord.lastTonCuoiCa4[t.code]);
      const tonDau =
        currentRecord.tonDau?.[t.code] !== undefined
          ? Number(currentRecord.tonDau[t.code])
          : defaultTonDau;
      const shifts: Record<number, any> = {};
      let runningTon = tonDau;
      for (let s = 1; s <= 4; s++) {
        const boiHoan = Number(
          currentRecord.shifts?.[s]?.boiHoan?.[t.code] || 0
        );
        const qcCali = Number(currentRecord.shifts?.[s]?.qcCali?.[t.code] || 0);
        const suDung = usageCount[s][t.code] || 0;
        const tonCuoi = runningTon + boiHoan - (qcCali + suDung);
        shifts[s] = { tonDauCa: runningTon, boiHoan, qcCali, suDung, tonCuoi };
        runningTon = tonCuoi;
      }
      calculated[t.code] = { tonDau, shifts };
    });

    return {
      calculated,
      meta: currentRecord.meta || { 1: {}, 2: {}, 3: {}, 4: {} },
      ghiChu: currentRecord.ghiChu || '',
    };
  }, [bm13Store, bm04Logs, selectedDate, testsConfig]);

  useEffect(() => {
    const lastTonCuoiCa4: Record<string, number> = {};
    testsConfig.forEach(
      (t) =>
        (lastTonCuoiCa4[t.code] = dayData.calculated[t.code].shifts[4].tonCuoi)
    );
    setBm13Store((prev) => ({
      ...prev,
      [selectedDate]: { ...(prev[selectedDate] || {}), lastTonCuoiCa4 },
    }));
  }, [dayData.calculated, selectedDate, testsConfig]);

  const updateTonDau = (testCode: string, val: number) => {
    if (isReadOnly || isSystemLocked) return;
    setBm13Store((prev) => {
      const day = prev[selectedDate] || {};
      return {
        ...prev,
        [selectedDate]: {
          ...day,
          tonDau: { ...(day.tonDau || {}), [testCode]: val },
        },
      };
    });
  };
  const updateShiftValue = (
    shiftNo: number,
    field: 'boiHoan' | 'qcCali',
    testCode: string,
    val: number
  ) => {
    if (isReadOnly || isSystemLocked) return;
    setBm13Store((prev) => {
      const day = prev[selectedDate] || {};
      const shifts = day.shifts || {};
      const sData = shifts[shiftNo] || {};
      return {
        ...prev,
        [selectedDate]: {
          ...day,
          shifts: {
            ...shifts,
            [shiftNo]: {
              ...sData,
              [field]: { ...(sData[field] || {}), [testCode]: val },
            },
          },
        },
      };
    });
  };
  const handleAutoBoiHoanCoSo = (shiftNo: number) => {
    if (isReadOnly || isSystemLocked) return;
    setBm13Store((prev) => {
      const day = prev[selectedDate] || {};
      const shifts = day.shifts || {};
      const sData = shifts[shiftNo] || {};
      const newBoiHoan: Record<string, number> = {};
      testsConfig.forEach((t) => {
        const sCalc = dayData.calculated[t.code].shifts[shiftNo];
        const cur = sCalc.tonDauCa - (sCalc.qcCali + sCalc.suDung);
        newBoiHoan[t.code] = Math.max(0, t.quota - cur);
      });
      return {
        ...prev,
        [selectedDate]: {
          ...day,
          shifts: { ...shifts, [shiftNo]: { ...sData, boiHoan: newBoiHoan } },
        },
      };
    });
  };
  const updateShiftMeta = (shiftNo: number, key: string, val: string) => {
    if (isReadOnly || isSystemLocked) return;
    setBm13Store((prev) => {
      const day = prev[selectedDate] || {};
      const meta = day.meta || dayData.meta;
      return {
        ...prev,
        [selectedDate]: {
          ...day,
          meta: {
            ...meta,
            [shiftNo]: { ...(meta[shiftNo] || {}), [key]: val },
          },
        },
      };
    });
  };

  const handleExportExcelBM13 = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows: any[][] = [];
      rows.push([
        'BIÊN BẢN BÀN GIAO HÓA CHẤT HẰNG NGÀY',
        ...Array(testsConfig.length - 1).fill(''),
        'BM.13.XN.QTQL.23',
      ]);
      rows.push([
        'PHÒNG MIỄN DỊCH',
        ...Array(testsConfig.length - 2).fill(''),
        'NGÀY:',
        selectedDate.split('-').reverse().join('/'),
      ]);
      rows.push([
        '',
        ...testsConfig.map((t) => t.name),
        'Giờ giao',
        'Người giao',
        'Người nhận',
      ]);
      rows.push(['ĐVT', ...testsConfig.map((t) => t.unit), '', '', '']);
      rows.push(['CƠ SỐ', ...testsConfig.map((t) => t.quota), '', '', '']);
      rows.push([
        'TỒN ĐẦU',
        ...testsConfig.map((t) => dayData.calculated[t.code].tonDau),
        '',
        '',
        '',
      ]);
      [1, 2, 3, 4].forEach((s) => {
        rows.push([
          `BỒI HOÀN (Lần ${s})`,
          ...testsConfig.map(
            (t) => dayData.calculated[t.code].shifts[s].boiHoan || ''
          ),
          dayData.meta[s]?.gioGiao || '',
          dayData.meta[s]?.nguoiGiao || '',
          dayData.meta[s]?.nguoiNhan || '',
        ]);
        rows.push([
          'QC hoặc CALI',
          ...testsConfig.map(
            (t) => dayData.calculated[t.code].shifts[s].qcCali || ''
          ),
          '',
          '',
          '',
        ]);
        rows.push([
          'SỬ DỤNG',
          ...testsConfig.map(
            (t) => dayData.calculated[t.code].shifts[s].suDung || ''
          ),
          '',
          '',
          '',
        ]);
        rows.push([
          'TỒN CUỐI',
          ...testsConfig.map(
            (t) => dayData.calculated[t.code].shifts[s].tonCuoi
          ),
          '',
          '',
          '',
        ]);
      });
      rows.push(['Ghi chú:', dayData.ghiChu || '']);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BM.13');
      XLSX.writeFile(wb, `BM13_MienDich_${selectedDate}.xlsx`);
    } catch {
      alert('Lỗi tải thư viện Excel!');
    }
  };

  // --- MÀN HÌNH ĐĂNG NHẬP ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-sky-100">
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <ClipboardList className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wide">
              Khoa Xét Nghiệm - Miễn Dịch
            </h1>
            <p className="text-sky-100 text-xs mt-1">
              Hệ thống Quản lý Sổ KQXN Thủ công (BM.04) & Bàn giao Hóa chất
              (BM.13)
            </p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginErr && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium border border-red-200">
                {loginErr}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ID Đăng nhập
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Ví dụ: lhthinh"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" /> Đăng Nhập Hệ Thống
            </button>
          </form>
        </div>
      </div>
    );
  }

  const todayBM04Logs = bm04Logs.filter((r) => r.ngayBC === selectedDate);
  const currentPending = pendingQueue.filter(
    (r) => r.ngayBC === selectedDate && r.caTruc === selectedShift
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col relative">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          .print-landscape { @page { size: A4 landscape; margin: 8mm; } }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #ffffff !important; }
        }
      `}</style>

      {/* OVERLAYS KHÓA HỆ THỐNG */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-sky-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 text-white">
          <AlertTriangle className="w-20 h-20 text-amber-400 mb-6 animate-pulse" />
          <h2 className="text-3xl font-black uppercase mb-2 text-center">
            Đang Chốt Phiên Bàn Giao!
          </h2>
          <p className="text-lg font-medium text-sky-200 mb-8 text-center">
            Hệ thống sẽ tự động đăng xuất và chuyển sang trạng thái chờ nhận ca
            sau:
          </p>
          <div className="text-8xl font-black text-white mb-10 drop-shadow-2xl">
            {countdown}
          </div>
          <div className="flex gap-4">
            <button
              onClick={cancelChotCa}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg shadow-lg border border-slate-600 transition"
            >
              Chưa chốt / Hủy
            </button>
            <button
              onClick={() => setCountdown(0)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg transition"
            >
              Tiếp tục (Đăng xuất ngay)
            </button>
          </div>
        </div>
      )}

      {isSystemLocked && countdown === null && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-amber-400">
            <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 uppercase mb-2">
              {isPendingReceive
                ? 'Hệ thống Đang Khóa'
                : 'Đã Hết Phiên Làm Việc!'}
            </h2>
            <p className="text-sm font-semibold text-slate-600 mb-6">
              {isPendingReceive
                ? `Ca ${selectedShift} đã chốt. Yêu cầu ca tiếp theo đăng nhập để nhận bàn giao BM.13 trước khi làm việc tiếp.`
                : `Thời gian hiện tại đã vượt qua khung giờ của Ca ${selectedShift}. Đề nghị chốt sổ bàn giao ngay lập tức!`}
            </p>
            {isPendingReceive ? (
              <button
                onClick={() => setShowHandoverModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wide"
              >
                Đăng nhập Nhận Bàn Giao
              </button>
            ) : (
              <button
                onClick={initiateChotCa}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Chốt Bàn Giao Ca{' '}
                {selectedShift}
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEADER NGUYÊN BẢN (MÀU XANH TỪ CODE ĐẦU) */}
      <header className="bg-gradient-to-r from-sky-700 to-blue-800 text-white shadow-md print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight uppercase">
                PHÒNG MIỄN DỊCH - QUẢN LÝ TEST THỦ CÔNG
              </h1>
              <p className="text-xs text-sky-200">
                Liên thông tự động BM.04.XN.QTQL.37 & BM.13.XN.QTQL.23
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-blue-900/50 px-3 py-1.5 rounded-xl border border-sky-400/30">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-sky-400">|</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(Number(e.target.value))}
                className="bg-blue-950 text-amber-200 text-xs font-semibold px-2 py-1 rounded border border-sky-500/40 focus:outline-none"
              >
                {SHIFTS_INFO.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold">{currentUser.name}</div>
              <div className="text-[11px] text-sky-200">
                ID: {currentUser.id} ({currentUser.role})
              </div>
            </div>
            <button
              onClick={() => {
                setShowPwModal(true);
                setPwMsg('');
              }}
              className="bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"
            >
              <KeyRound className="w-4 h-4" /> Đổi MK
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"
            >
              <LogOut className="w-4 h-4" /> Thoát
            </button>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 flex flex-wrap gap-1 pt-1 border-t border-sky-600/40">
          <button
            onClick={() => setActiveTab('BM04')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 transition ${
              activeTab === 'BM04'
                ? 'bg-slate-100 text-sky-800'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> 1. Thực hiện Test (Nhập BM.04)
          </button>
          <button
            onClick={() => setActiveTab('BM13')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 transition ${
              activeTab === 'BM13'
                ? 'bg-slate-100 text-sky-800'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <PackageCheck className="w-4 h-4" /> 2. Bàn giao Hóa chất (BM.13)
          </button>
          <button
            onClick={() => setActiveTab('PRINT_BM04')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 transition ${
              activeTab === 'PRINT_BM04'
                ? 'bg-slate-100 text-sky-800'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <Printer className="w-4 h-4" /> 3. Xem & In Sổ BM.04
          </button>
          <button
            onClick={() => setActiveTab('PRINT_BM13')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 transition ${
              activeTab === 'PRINT_BM13'
                ? 'bg-slate-100 text-sky-800'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> 4. Xem & In Bảng BM.13
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-1.5 transition ${
                activeTab === 'ADMIN'
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-amber-200 hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4" /> 5. Quản trị Hệ Thống
            </button>
          )}
        </div>
      </header>

      {isReadOnly && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs font-extrabold text-center uppercase tracking-wide flex justify-center items-center gap-2">
          <Lock className="w-4 h-4" /> Chế độ Read-Only: Bạn đang xem dữ liệu
          quá khứ. Chỉ Admin mới có quyền chỉnh sửa.
        </div>
      )}

      <main
        className={`flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-4 transition-all duration-300 ${
          isSystemLocked ? 'blur-md pointer-events-none' : ''
        }`}
      >
        {/* ==================== TỔ HỢP 3 CỘT BM.04 ==================== */}
        {activeTab === 'BM04' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-170px)]">
            {/* CỘT 1: FORM HÀNH CHÍNH & CHỌN TEST (Col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-4 h-full">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-extrabold text-[11px] uppercase text-slate-700 mb-3 border-b pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Ký
                    duyệt BM.04
                  </span>
                  {checkerUser && (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px]">
                      Đã Active
                    </span>
                  )}
                </h3>
                {checkerUser ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
                    <div>
                      <div className="text-[9px] text-emerald-600 font-bold uppercase">
                        Người kiểm tra:
                      </div>
                      <div className="font-black text-emerald-900 text-xs">
                        {checkerUser.name}
                      </div>
                    </div>
                    <button
                      onClick={() => setCheckerUser(null)}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCheckerLogin(true)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-2xl text-[11px] transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Lock className="w-3.5 h-3.5" /> Đăng nhập Ký Duyệt
                  </button>
                )}
              </div>

              <div
                className={`bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col ${
                  !checkerUser ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <h2 className="font-black text-sm text-sky-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
                  1. Thêm Bệnh Nhân
                </h2>
                <form
                  onSubmit={handleAddToQueue}
                  className="flex-1 flex flex-col gap-3"
                >
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Quét mã..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                      Họ tên Bệnh Nhân *
                    </label>
                    <input
                      type="text"
                      value={hoTenBN}
                      onChange={(e) => setHoTenBN(e.target.value)}
                      placeholder="NGUYỄN VĂN A"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                        Năm sinh *
                      </label>
                      <input
                        type="number"
                        value={namSinh}
                        onChange={(e) => setNamSinh(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                        Giới tính
                      </label>
                      <select
                        value={gioiTinh}
                        onChange={(e) =>
                          setGioiTinh(e.target.value as 'Nam' | 'Nữ')
                        }
                        className="w-full px-2 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                      >
                        <option>Nam</option>
                        <option>Nữ</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                      Người thực hiện
                    </label>
                    {isAdmin ? (
                      <select
                        value={customThucHien}
                        onChange={(e) => setCustomThucHien(e.target.value)}
                        className="w-full px-3 py-2 border border-sky-300 bg-sky-50 rounded-xl text-xs font-bold text-sky-900"
                      >
                        {users.map((u: any) => (
                          <option key={u.id} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={customThucHien}
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl text-xs font-bold text-slate-500"
                      />
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex-1 flex flex-col">
                    <label className="flex items-center justify-between text-[10px] font-extrabold text-slate-700 uppercase mb-1.5">
                      <span>Chọn Xét Nghiệm:</span>
                      <span className="text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        {selectedTests.length} đã chọn
                      </span>
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm tên test (VD: DEN)..."
                        value={searchTest}
                        onChange={(e) => setSearchTest(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 space-y-1">
                      {testsConfig
                        .filter(
                          (t) =>
                            t.name
                              .toLowerCase()
                              .includes(searchTest.toLowerCase()) ||
                            t.code
                              .toLowerCase()
                              .includes(searchTest.toLowerCase())
                        )
                        .map((t) => {
                          const tonHienTai =
                            dayData.calculated[t.code]?.shifts[selectedShift]
                              ?.tonCuoi ?? t.quota;
                          const isChecked = selectedTests.includes(t.code);
                          return (
                            <label
                              key={t.code}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                                isChecked
                                  ? 'bg-sky-50 border-sky-400'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.target.checked
                                      ? setSelectedTests([
                                          ...selectedTests,
                                          t.code,
                                        ])
                                      : setSelectedTests(
                                          selectedTests.filter(
                                            (c) => c !== t.code
                                          )
                                        );
                                  }}
                                  className="w-3.5 h-3.5 text-sky-600 rounded"
                                />
                                <span className="text-xs font-extrabold text-slate-800">
                                  {t.name}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  tonHienTai <= 2
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Tồn: {tonHienTai}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isReadOnly}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl shadow-md transition text-[11px] uppercase tracking-wide flex justify-center items-center gap-1.5 disabled:opacity-50 mt-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Đẩy Vào Chờ (
                    {selectedTests.length})
                  </button>
                </form>
              </div>
            </div>

            {/* CỘT 2: DANH SÁCH ĐANG CHỜ KẾT QUẢ (Col-span-5) */}
            <div className="lg:col-span-5 bg-slate-200/50 rounded-3xl border border-slate-200 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                <h2 className="font-black text-sm text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 2. Đang Chờ KQ (
                  {currentPending.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {currentPending.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs border-2 border-dashed border-slate-300 rounded-2xl py-20">
                    Khu vực trống. Nhập bệnh nhân để thêm vào hàng đợi.
                  </div>
                ) : (
                  currentPending.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-sky-100 rounded-2xl p-3 shadow-sm relative hover:border-sky-300 transition"
                    >
                      <button
                        onClick={() =>
                          setPendingQueue(
                            pendingQueue.filter((q) => q.id !== item.id)
                          )
                        }
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="mb-2 pr-6">
                        <div className="text-[9px] font-black text-white bg-sky-600 inline-block px-1.5 py-0.5 rounded mb-1">
                          {item.tenXetNghiem}
                        </div>
                        <div className="font-black text-slate-900 text-sm uppercase leading-tight">
                          {item.hoTenBN}{' '}
                          <span className="text-slate-500 font-bold text-xs">
                            ({item.namSinhNam || item.namSinhNu})
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                          Barcode:{' '}
                          <strong className="text-slate-800">
                            {item.barcode || '---'}
                          </strong>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div>
                          <span className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">
                            Đọc chứng
                          </span>
                          <select
                            value={item.docChung}
                            onChange={(e) =>
                              setPendingQueue(
                                pendingQueue.map((q) =>
                                  q.id === item.id
                                    ? { ...q, docChung: e.target.value }
                                    : q
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none"
                          >
                            <option value="Dương tính">Dương tính</option>
                            <option value="Âm Tính">Âm Tính</option>
                          </select>
                        </div>
                        <div>
                          <span className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">
                            Kết quả (Gõ tay)
                          </span>
                          <input
                            type="text"
                            value={item.ketQua}
                            onChange={(e) =>
                              setPendingQueue(
                                pendingQueue.map((q) =>
                                  q.id === item.id
                                    ? { ...q, ketQua: e.target.value }
                                    : q
                                )
                              )
                            }
                            placeholder="VD: Âm tính..."
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-blue-800 focus:border-blue-500 focus:outline-none uppercase placeholder:font-normal placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleProcessQueueItem(item.id)}
                        disabled={isReadOnly}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wide flex justify-center items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Lưu Kết Quả &
                        Trừ Kho
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CỘT 3: TỒN KHO TỔNG & NHẬT KÝ ĐÃ XONG (Col-span-4) - CAO BẰNG CỘT 2 */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
              {/* Nửa trên: TỒN KHO LẦN X (Hiển thị lưới toàn bộ, không cuộn) */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col min-h-0">
                <h3 className="font-black text-xs uppercase text-slate-700 mb-2 border-b border-slate-100 pb-1.5 flex justify-between flex-shrink-0">
                  <span>
                    Tồn Kho (
                    {SHIFTS_INFO.find((s) => s.id === selectedShift)?.label})
                  </span>
                  <span className="text-sky-600">ĐVT: TEST</span>
                </h3>
                <div className="grid grid-cols-4 gap-1.5 content-start h-full">
                  {testsConfig.map((t) => {
                    const s = dayData.calculated[t.code].shifts[selectedShift];
                    return (
                      <div
                        key={t.code}
                        className="p-1.5 rounded-xl border border-slate-100 bg-slate-50/80 flex flex-col justify-center items-center text-center"
                      >
                        <div
                          className="text-[8px] font-extrabold text-slate-500 truncate w-full"
                          title={t.name}
                        >
                          {t.code}
                        </div>
                        <div className="text-sm font-black text-sky-700 leading-none mt-1">
                          {s.tonCuoi}{' '}
                          <span className="text-[8px] font-semibold text-slate-400">
                            /{t.quota}
                          </span>
                        </div>
                        <div className="text-[8px] text-emerald-600 font-bold mt-1">
                          Dùng: {s.suDung}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nửa dưới: NHẬT KÝ ĐÃ XONG */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col min-h-0">
                <h3 className="font-black text-xs uppercase text-slate-700 mb-2 border-b border-slate-100 pb-1.5 flex-shrink-0">
                  Nhật Ký BM.04 Đã Xong ({todayBM04Logs.length})
                </h3>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 h-full">
                  {todayBM04Logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                      Chưa có test nào hoàn thành.
                    </div>
                  ) : (
                    todayBM04Logs
                      .slice()
                      .reverse()
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                        >
                          <div className="overflow-hidden">
                            <div className="font-extrabold text-slate-800 text-xs truncate">
                              [{item.tenXetNghiem}] - {item.hoTenBN}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                              <strong className="text-slate-700">
                                {item.barcode || '---'}
                              </strong>{' '}
                              • C:{item.docChung} • K:{' '}
                              <strong className="text-sky-700">
                                {item.ketQua}
                              </strong>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBM04(item.id)}
                            disabled={isReadOnly}
                            className="text-red-400 hover:text-red-600 p-1 rounded-lg ml-2 disabled:opacity-50 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB BM.13 BÀN GIAO KHO ==================== */}
        {activeTab === 'BM13' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-black text-lg text-sky-900 uppercase tracking-wide">
                  Kho Bàn Giao Hóa Chất (BM.13)
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Tồn cuối = (Tồn đầu ca + Bồi hoàn) - (QC/Cali + Sử dụng tự
                  động từ BM.04)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleAutoBoiHoanCoSo(selectedShift)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> Bồi Hoàn Cơ Số (Ca{' '}
                  {selectedShift})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full border-collapse text-xs text-center">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="border border-slate-700 p-3 min-w-[140px] text-left">
                      DANH MỤC
                    </th>
                    {testsConfig.map((t) => (
                      <th
                        key={t.code}
                        className="border border-slate-700 p-2 min-w-[62px]"
                      >
                        {t.name}
                      </th>
                    ))}
                    <th className="border border-slate-700 p-3 min-w-[85px]">
                      Giờ giao
                    </th>
                    <th className="border border-slate-700 p-3 min-w-[130px]">
                      Người giao
                    </th>
                    <th className="border border-slate-700 p-3 min-w-[130px]">
                      Người nhận
                    </th>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <td className="border border-slate-200 p-2 text-left">
                      ĐVT
                    </td>
                    {testsConfig.map((t) => (
                      <td
                        key={t.code}
                        className="border border-slate-200 p-1.5"
                      >
                        {t.unit}
                      </td>
                    ))}
                    <td
                      colSpan={3}
                      className="border border-slate-200 bg-slate-50"
                    ></td>
                  </tr>
                  <tr className="bg-amber-50 font-extrabold text-amber-900">
                    <td className="border border-slate-200 p-2 text-left">
                      CƠ SỐ CHUẨN
                    </td>
                    {testsConfig.map((t) => (
                      <td
                        key={t.code}
                        className="border border-slate-200 p-1.5"
                      >
                        {t.quota}
                      </td>
                    ))}
                    <td
                      colSpan={3}
                      className="border border-slate-200 bg-slate-50"
                    ></td>
                  </tr>
                  <tr className="bg-blue-50 font-extrabold text-blue-900">
                    <td className="border border-slate-200 p-2 text-left">
                      TỒN ĐẦU (07h00)
                    </td>
                    {testsConfig.map((t) => (
                      <td key={t.code} className="border border-slate-200 p-1">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={dayData.calculated[t.code].tonDau}
                          onChange={(e) =>
                            updateTonDau(t.code, Number(e.target.value))
                          }
                          className="w-14 text-center bg-white border border-blue-300 rounded-lg py-1 font-extrabold text-blue-900 shadow-sm disabled:opacity-50"
                        />
                      </td>
                    ))}
                    <td
                      colSpan={3}
                      className="border border-slate-200 text-[11px] text-slate-500 italic"
                    >
                      Tự động nhận Tồn cuối Lần 4 hôm trước
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((shiftNo) => {
                    const isCurrent = shiftNo === selectedShift;
                    const shiftStatus = dayData.meta[shiftNo]?.trangThai;
                    return (
                      <React.Fragment key={shiftNo}>
                        <tr
                          className={
                            isCurrent
                              ? 'bg-sky-100/90 font-extrabold'
                              : 'bg-slate-200/80 font-bold'
                          }
                        >
                          <td
                            colSpan={20}
                            className="border border-slate-300 px-3 py-1.5 text-left text-slate-900"
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {SHIFTS_INFO[shiftNo - 1].label}{' '}
                                {shiftStatus === 'PENDING_RECEIVE' && (
                                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                                    Chờ nhận bàn giao
                                  </span>
                                )}{' '}
                                {shiftStatus === 'HOAN_THANH' && (
                                  <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                    Đã chốt xong
                                  </span>
                                )}
                              </span>
                              {isCurrent &&
                                !isReadOnly &&
                                shiftStatus !== 'HOAN_THANH' &&
                                (shiftStatus === 'PENDING_RECEIVE' ? (
                                  <button
                                    onClick={() => setShowHandoverModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition"
                                  >
                                    Xác Nhận Bàn Giao
                                  </button>
                                ) : (
                                  <button
                                    onClick={initiateChotCa}
                                    className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition"
                                  >
                                    Chốt Bàn Giao Ca {selectedShift}
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-emerald-50/20">
                          <td className="border border-slate-200 p-2 text-left font-extrabold text-emerald-800">
                            BỒI HOÀN
                          </td>
                          {testsConfig.map((t) => (
                            <td
                              key={t.code}
                              className="border border-slate-200 p-1"
                            >
                              <input
                                type="number"
                                min={0}
                                disabled={
                                  isReadOnly ||
                                  shiftStatus === 'PENDING_RECEIVE' ||
                                  shiftStatus === 'HOAN_THANH'
                                }
                                value={
                                  dayData.calculated[t.code].shifts[shiftNo]
                                    .boiHoan
                                }
                                onChange={(e) =>
                                  updateShiftValue(
                                    shiftNo,
                                    'boiHoan',
                                    t.code,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-14 text-center border border-emerald-300 rounded-lg py-1 font-bold text-emerald-900 bg-white shadow-sm disabled:bg-slate-100"
                              />
                            </td>
                          ))}
                          <td
                            rowSpan={4}
                            className="border border-slate-200 p-1.5 align-middle bg-slate-50 font-bold"
                          >
                            {dayData.meta[shiftNo]?.gioGiao}
                          </td>
                          <td
                            rowSpan={4}
                            className="border border-slate-200 p-1.5 align-middle bg-slate-50 font-bold"
                          >
                            {dayData.meta[shiftNo]?.nguoiGiao}
                          </td>
                          <td
                            rowSpan={4}
                            className="border border-slate-200 p-1.5 align-middle bg-slate-50 font-bold"
                          >
                            {dayData.meta[shiftNo]?.nguoiNhan}
                          </td>
                        </tr>
                        <tr className="bg-purple-50/20">
                          <td className="border border-slate-200 p-2 text-left font-extrabold text-purple-800">
                            QC HOẶC CALI
                          </td>
                          {testsConfig.map((t) => (
                            <td
                              key={t.code}
                              className="border border-slate-200 p-1"
                            >
                              <input
                                type="number"
                                min={0}
                                disabled={
                                  isReadOnly ||
                                  shiftStatus === 'PENDING_RECEIVE' ||
                                  shiftStatus === 'HOAN_THANH'
                                }
                                value={
                                  dayData.calculated[t.code].shifts[shiftNo]
                                    .qcCali
                                }
                                onChange={(e) =>
                                  updateShiftValue(
                                    shiftNo,
                                    'qcCali',
                                    t.code,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-14 text-center border border-purple-300 rounded-lg py-1 font-bold text-purple-900 bg-white shadow-sm disabled:bg-slate-100"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-amber-50/50">
                          <td className="border border-slate-200 p-2 text-left font-black text-amber-900">
                            SỬ DỤNG (BM.04)
                          </td>
                          {testsConfig.map((t) => {
                            const used =
                              dayData.calculated[t.code].shifts[shiftNo].suDung;
                            return (
                              <td
                                key={t.code}
                                className={`border border-slate-200 p-1 font-black ${
                                  used > 0
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-slate-400'
                                }`}
                              >
                                {used}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="bg-sky-50 font-black">
                          <td className="border border-slate-200 p-2 text-left text-sky-950">
                            TỒN CUỐI
                          </td>
                          {testsConfig.map((t) => {
                            const tc =
                              dayData.calculated[t.code].shifts[shiftNo]
                                .tonCuoi;
                            return (
                              <td
                                key={t.code}
                                className={`border border-slate-200 p-1 text-sm ${
                                  tc < 0
                                    ? 'bg-red-200 text-red-950'
                                    : 'text-sky-950'
                                }`}
                              >
                                {tc}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== PRINT BM.04 ==================== */}
        {activeTab === 'PRINT_BM04' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between print:hidden gap-3">
              <div>
                <h2 className="font-black text-sm text-slate-900 uppercase">
                  Sổ BM.04 (Bản In ISO - 14 test/trang)
                </h2>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> In Sổ BM.04
              </button>
            </div>
            <div className="bg-white px-2 py-0 mx-auto w-[210mm] text-black print:shadow-none print:w-full print:px-0">
              <div className="flex justify-between text-[11px] font-bold border-b-2 border-black pb-1 mb-2">
                <span>Sổ lưu kết quả xét nghiệm thực hiện thủ công</span>
                <span>BM.04.XN.QTQL.37</span>
              </div>
              <div className="grid grid-cols-2 gap-0 border-t-2 border-l-2 border-black">
                {(todayBM04Logs.length > 0
                  ? todayBM04Logs
                  : Array.from({ length: 14 }).map((_, i) => ({
                      empty: true,
                      id: i,
                    }))
                ).map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="border-b-2 border-r-2 border-black p-1 text-[9px] leading-tight"
                  >
                    <div className="font-bold border-b border-black pb-0.5 mb-0.5">
                      Tên xét nghiệm:{' '}
                      <span className="text-[10px] uppercase">
                        {item.empty ? '' : item.tenXetNghiem}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black pb-0.5 mb-0.5">
                      <div className="col-span-8">
                        Họ tên BN:{' '}
                        <div className="font-bold uppercase min-h-[14px] truncate">
                          {item.empty ? '' : item.hoTenBN}
                        </div>
                      </div>
                      <div className="col-span-4 border-l border-black pl-1 text-center">
                        <div className="border-b border-black font-semibold">
                          Năm sinh
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="border-r border-black">
                            Nam:{' '}
                            <strong>{item.empty ? '' : item.namSinhNam}</strong>
                          </div>
                          <div>
                            Nữ:{' '}
                            <strong>{item.empty ? '' : item.namSinhNu}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 border-b border-black pb-0.5 mb-0.5 text-center">
                      <div className="border-r border-black">
                        <div className="font-semibold">Barcode</div>
                        <div className="font-bold min-h-[14px]">
                          {item.empty ? '' : item.barcode}
                        </div>
                      </div>
                      <div className="border-r border-black">
                        <div className="font-semibold">Đọc chứng</div>
                        <div className="font-bold min-h-[14px]">
                          {item.empty ? '' : item.docChung}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">Kết quả</div>
                        <div className="font-bold uppercase min-h-[14px] truncate">
                          {item.empty ? '' : item.ketQua}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 text-center">
                      <div className="border-r border-black pr-1">
                        <div className="font-semibold">Thời gian đọc KQ</div>
                        <div className="min-h-[14px]">
                          {item.empty ? '' : item.thoiGianDocKQ}
                        </div>
                      </div>
                      <div className="border-r border-black px-1">
                        <div className="font-semibold">Người thực hiện</div>
                        <div className="font-bold min-h-[14px] truncate">
                          {item.empty ? '' : item.nguoiThucHien}
                        </div>
                      </div>
                      <div className="pl-1">
                        <div className="font-semibold">Người kiểm tra</div>
                        <div className="font-bold min-h-[14px] truncate">
                          {item.empty ? '' : item.nguoiKiemTra}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] mt-2 pt-1 border-t border-black font-medium">
                <span>Ngày ban hành: 01/07/2025</span>
                <span>Lần ban hành: 02</span>
                <span>Trang 1</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRINT BM.13 ==================== */}
        {activeTab === 'PRINT_BM13' && (
          <div className="space-y-4 print-landscape">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between print:hidden gap-3">
              <div>
                <h2 className="font-black text-sm text-slate-900 uppercase">
                  Biên Bản BM.13 (A4 Ngang)
                </h2>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleExportExcelBM13}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Xuất Excel
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> In BM.13
                </button>
              </div>
            </div>
            <div className="bg-white p-2 w-[297mm] mx-auto text-black print:shadow-none print:w-full print:p-0">
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span>Biên bản bàn giao hóa chất hằng ngày</span>
                <span>BM.13.XN.QTQL.23</span>
              </div>
              <div className="text-center font-black text-lg uppercase leading-none">
                BIÊN BẢN BÀN GIAO HÓA CHẤT HẰNG NGÀY
              </div>
              <div className="flex justify-between items-center font-extrabold text-sm uppercase mb-2">
                <span className="mx-auto">PHÒNG MIỄN DỊCH</span>
                <span>NGÀY: {selectedDate.split('-').reverse().join('/')}</span>
              </div>
              <table className="w-full border-collapse border-2 border-black text-[10px] text-center">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-24"></th>
                    {testsConfig.map((t) => (
                      <th
                        key={t.code}
                        className="border border-black p-1 font-bold"
                      >
                        {t.code}
                      </th>
                    ))}
                    <th rowSpan={3} className="border border-black p-1 w-12">
                      Giờ giao
                    </th>
                    <th rowSpan={3} className="border border-black p-1 w-20">
                      Người giao
                    </th>
                    <th rowSpan={3} className="border border-black p-1 w-20">
                      Người nhận
                    </th>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-bold">ĐVT</td>
                    {testsConfig.map((t) => (
                      <td
                        key={t.code}
                        className="border border-black p-1 font-bold"
                      >
                        {t.unit}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-bold">CƠ SỐ</td>
                    {testsConfig.map((t) => (
                      <td
                        key={t.code}
                        className="border border-black p-1 font-bold"
                      >
                        {t.quota}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 font-bold text-left">
                      TỒN ĐẦU
                    </td>
                    {testsConfig.map((t) => (
                      <td
                        key={t.code}
                        className="border border-black p-1 font-bold"
                      >
                        {dayData.calculated[t.code].tonDau}
                      </td>
                    ))}
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                  {[1, 2, 3, 4].map((s) => (
                    <React.Fragment key={s}>
                      <tr>
                        <td className="border border-black p-1 text-left font-semibold">
                          BỒI HOÀN
                        </td>
                        {testsConfig.map((t) => (
                          <td key={t.code} className="border border-black p-1">
                            {dayData.calculated[t.code].shifts[s].boiHoan || ''}
                          </td>
                        ))}
                        <td
                          rowSpan={4}
                          className="border border-black p-1 font-bold"
                        >
                          {dayData.meta[s]?.gioGiao}
                        </td>
                        <td
                          rowSpan={4}
                          className="border border-black p-1 font-bold"
                        >
                          {dayData.meta[s]?.nguoiGiao}
                        </td>
                        <td
                          rowSpan={4}
                          className="border border-black p-1 font-bold"
                        >
                          {dayData.meta[s]?.nguoiNhan}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-left font-semibold">
                          QC / CALI
                        </td>
                        {testsConfig.map((t) => (
                          <td key={t.code} className="border border-black p-1">
                            {dayData.calculated[t.code].shifts[s].qcCali || ''}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-left font-semibold">
                          SỬ DỤNG
                        </td>
                        {testsConfig.map((t) => (
                          <td
                            key={t.code}
                            className="border border-black p-1 font-bold"
                          >
                            {dayData.calculated[t.code].shifts[s].suDung || ''}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-left font-black bg-slate-100">
                          TỒN CUỐI
                        </td>
                        {testsConfig.map((t) => (
                          <td
                            key={t.code}
                            className="border border-black p-1 font-black bg-slate-100"
                          >
                            {dayData.calculated[t.code].shifts[s].tonCuoi}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr>
                    <td
                      colSpan={30}
                      className="border border-black p-1 text-left font-bold h-10 align-top"
                    >
                      Ghi chú:
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between text-[10px] mt-2 font-medium">
                <span>Ngày ban hành: 01/03/2023</span>
                <span>Lần ban hành: 01</span>
                <span>Trang 1</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB ADMIN: THÊM TÍNH NĂNG QUẢN LÝ TEST ĐỘNG ==================== */}
        {activeTab === 'ADMIN' && isAdmin && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* THÊM/XÓA DANH MỤC TEST ĐỘNG */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-black text-base text-sky-900 uppercase mb-4 flex items-center gap-2">
                <PackageCheck className="w-5 h-5" /> Quản Lý Danh Mục Test
              </h2>
              <form
                onSubmit={handleAddTest}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4"
              >
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                    Mã Test (VD: DENGUE)
                  </label>
                  <input
                    type="text"
                    value={newTestCode}
                    onChange={(e) => setNewTestCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                    Tên Hiển Thị (VD: Dengue Nhanh)
                  </label>
                  <input
                    type="text"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                    Cơ Số Chuẩn (Tồn)
                  </label>
                  <input
                    type="number"
                    value={newTestQuota}
                    onChange={(e) => setNewTestQuota(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> THÊM TEST MỚI
                  </button>
                </div>
              </form>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {testsConfig.map((t) => (
                  <div
                    key={t.code}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col relative group hover:border-sky-300"
                  >
                    <button
                      onClick={() => handleDeleteTest(t.code)}
                      className="absolute top-1 right-1 text-red-300 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] font-black text-sky-800">
                      {t.code}
                    </div>
                    <div
                      className="text-[9px] text-slate-500 font-semibold truncate"
                      title={t.name}
                    >
                      {t.name}
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 mt-1">
                      Cơ số: {t.quota}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUẢN LÝ TÀI KHOẢN (Đã loại trừ thlong khỏi danh sách Reset) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-black text-base text-slate-900 uppercase mb-1 flex items-center gap-2">
                <UserCheck className="w-5 h-5" /> Quản Lý Tài Khoản (Bảo mật
                cao)
              </h2>
              <p className="text-[11px] text-slate-500 mb-4">
                Danh sách nhân viên hiển thị bên dưới (Tài khoản Root Admin đã
                được làm ẩn).
              </p>
              <div className="overflow-x-auto max-h-[400px] rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="border border-slate-700 p-2.5">STT</th>
                      <th className="border border-slate-700 p-2.5 text-left">
                        Họ và tên
                      </th>
                      <th className="border border-slate-700 p-2.5">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u: any) => u.id !== 'thlong')
                      .map((u: any, idx: number) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="border border-slate-200 p-2.5 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-200 p-2.5 font-extrabold text-slate-900">
                            {u.name}
                          </td>
                          <td className="border border-slate-200 p-2.5 text-center">
                            <button
                              onClick={() => handleAdminResetPw(u.id)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold px-3 py-1.5 rounded-xl transition shadow-sm"
                            >
                              Reset Mật Khẩu
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CÁC POPUP ĐĂNG NHẬP / MẬT KHẨU (Giữ nguyên cấu trúc, chỉ ẩn khi hệ thống khóa băng) */}
      {showCheckerLogin && !isSystemLocked && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-emerald-200">
            <h3 className="font-black text-base text-emerald-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Ký Duyệt (BM.04)
            </h3>
            <form onSubmit={handleCheckerLogin} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  ID Đăng nhập
                </label>
                <input
                  type="text"
                  value={checkerId}
                  onChange={(e) => setCheckerId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={checkerPw}
                  onChange={(e) => setCheckerPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckerLogin(false)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-200 hover:bg-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  Đăng Nhập Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-sky-200">
            <h3 className="font-black text-base text-sky-900 mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Nhận Bàn Giao Ca {selectedShift}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 mb-4">
              Ca này đã được <strong>Chốt bàn giao</strong>. Yêu cầu đăng nhập
              để mở khóa phiên.
            </p>
            <form onSubmit={handleHandoverLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  ID Người Nhận
                </label>
                <input
                  type="text"
                  value={handoverId}
                  onChange={(e) => setHandoverId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={handoverPw}
                  onChange={(e) => setHandoverPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHandoverModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-200 hover:bg-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                >
                  Xác Nhận Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPwModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="font-black text-base text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" /> Đổi MK Cá Nhân
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
              {pwMsg && (
                <div className="text-xs font-bold p-3 rounded-xl bg-slate-100 text-slate-800">
                  {pwMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  MK hiện tại
                </label>
                <input
                  type="password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  MK mới
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPwModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-200 hover:bg-slate-300"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
