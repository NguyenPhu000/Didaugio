import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  MapPin,
  Building2,
  Users,
  Compass,
  Sparkles,
  ClipboardCheck,
  BrainCircuit,
  Map,
  Wallet,
  Coins,
  FileText,
  FolderTree,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * Chuẩn hóa chuỗi tìm kiếm tiếng Việt (hỗ trợ gõ không dấu và có dấu)
 */
function normalizeSearchText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

/**
 * Mục đích tìm kiếm (Scopes)
 */
const SEARCH_SCOPES = [
  { id: "all", label: "Tất cả", icon: Sparkles, placeholder: "Tìm chức năng, địa điểm, đối tác..." },
  { id: "places", label: "Địa điểm", icon: MapPin, placeholder: "Tìm tên địa điểm hoặc quận huyện..." },
  { id: "businesses", label: "Doanh nghiệp", icon: Building2, placeholder: "Tìm tên cơ sở, đối tác..." },
  { id: "users", label: "Người dùng", icon: Users, placeholder: "Tìm họ tên, email, tài khoản..." },
  { id: "navigation", label: "Chức năng", icon: Compass, placeholder: "Tìm chức năng, trang..." },
];

/**
 * Danh sách Quick Navigation & Chức năng hệ thống
 */
const SYSTEM_ACTIONS = [
  {
    id: "nav-places-pending",
    title: "Duyệt địa điểm chờ",
    description: "Phê duyệt các địa điểm mới đăng ký",
    category: "Nội dung",
    icon: ClipboardCheck,
    route: ADMIN_ROUTES.PLACES_PENDING,
    keywords: ["duyet", "cho duyet", "phe duyet", "pending", "dia diem", "place"],
  },
  {
    id: "nav-places",
    title: "Quản lý địa điểm",
    description: "Xem và quản lý cơ sở du lịch",
    category: "Nội dung",
    icon: MapPin,
    route: ADMIN_ROUTES.PLACES,
    keywords: ["dia diem", "places", "danh sach", "quan ly dia diem"],
  },
  {
    id: "nav-business",
    title: "Quản lý doanh nghiệp",
    description: "Hồ sơ đối tác và giấy phép kinh doanh",
    category: "Kinh doanh",
    icon: Building2,
    route: ADMIN_ROUTES.BUSINESS_LIST,
    keywords: ["doanh nghiep", "business", "doi tac", "chu quan", "kyc"],
  },
  {
    id: "nav-users",
    title: "Quản lý người dùng",
    description: "Tài khoản khách du lịch và quản trị viên",
    category: "Người dùng",
    icon: Users,
    route: ADMIN_ROUTES.USERS,
    keywords: ["nguoi dung", "user", "tai khoan", "khach hang", "member"],
  },
  {
    id: "nav-ai",
    title: "Cấu hình AI Genie",
    description: "Prompt, model Groq / Gemini, log AI",
    category: "Hệ thống",
    icon: BrainCircuit,
    route: ADMIN_ROUTES.AI,
    keywords: ["ai", "genie", "cau hinh", "prompt", "model", "groq", "gemini"],
  },
  {
    id: "nav-map",
    title: "Bản đồ số GIS Cần Thơ",
    description: "Ranh giới 9 quận huyện và toạ độ GIS",
    category: "Bản đồ",
    icon: Map,
    route: ADMIN_ROUTES.MAP,
    keywords: ["ban do", "map", "gis", "postgis", "can tho", "quan huyen", "ranh gioi"],
  },
  {
    id: "nav-payouts",
    title: "Yêu cầu rút tiền & Doanh thu",
    description: "Chi trả ví đối tác và hoa hồng",
    category: "Tài chính",
    icon: Wallet,
    route: ADMIN_ROUTES.PAYOUTS,
    keywords: ["rut tien", "payout", "tai chinh", "doanh thu", "vi doi tac"],
  },
  {
    id: "nav-refunds",
    title: "Xử lý hoàn tiền",
    description: "Yêu cầu hủy đặt chỗ và hoàn tiền",
    category: "Tài chính",
    icon: Coins,
    route: ADMIN_ROUTES.REFUNDS,
    keywords: ["hoan tien", "refund", "tra tien", "huy ve", "booking"],
  },
  {
    id: "nav-categories",
    title: "Danh mục địa điểm",
    description: "Ẩm thực, lưu trú, vui chơi, di tích",
    category: "Nội dung",
    icon: FolderTree,
    route: ADMIN_ROUTES.CATEGORIES,
    keywords: ["danh muc", "category", "phan loai", "the loai"],
  },
  {
    id: "nav-audit-logs",
    title: "Nhật ký hệ thống (Audit Logs)",
    description: "Lịch sử đăng nhập và bảo mật",
    category: "Hệ thống",
    icon: FileText,
    route: ADMIN_ROUTES.AUDIT_LOGS,
    keywords: ["nhat ky", "audit log", "bao mat", "lich su", "hoat dong"],
  },
];

export default function DashboardSearch({ places = [] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Phím tắt toàn cục Ctrl+K / Cmd+K để focus ô tìm kiếm
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Đóng khi click ngoài container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setScopeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeScopeObj = useMemo(
    () => SEARCH_SCOPES.find((s) => s.id === selectedScope) || SEARCH_SCOPES[0],
    [selectedScope]
  );

  // Lọc kết quả chức năng hệ thống
  const filteredActions = useMemo(() => {
    if (selectedScope === "places" || selectedScope === "businesses" || selectedScope === "users") {
      return [];
    }
    const cleanQuery = normalizeSearchText(searchQuery);
    if (!cleanQuery) {
      return SYSTEM_ACTIONS.slice(0, 5);
    }
    return SYSTEM_ACTIONS.filter((action) => {
      const matchTitle = normalizeSearchText(action.title).includes(cleanQuery);
      const matchDesc = normalizeSearchText(action.description).includes(cleanQuery);
      const matchKeywords = action.keywords?.some((kw) =>
        normalizeSearchText(kw).includes(cleanQuery)
      );
      return matchTitle || matchDesc || matchKeywords;
    }).slice(0, 5);
  }, [searchQuery, selectedScope]);

  // Lọc kết quả địa điểm hiện có
  const filteredPlaces = useMemo(() => {
    if (selectedScope === "businesses" || selectedScope === "users" || selectedScope === "navigation") {
      return [];
    }
    const cleanQuery = normalizeSearchText(searchQuery);
    if (!cleanQuery) return [];

    return places
      .filter((place) => {
        const nameMatch = normalizeSearchText(place.name).includes(cleanQuery);
        const districtMatch = normalizeSearchText(place.district?.name || "").includes(cleanQuery);
        const categoryMatch = normalizeSearchText(place.category?.name || "").includes(cleanQuery);
        return nameMatch || districtMatch || categoryMatch;
      })
      .slice(0, 4);
  }, [searchQuery, selectedScope, places]);

  // Danh sách hành động tìm kiếm sâu theo mục tiêu (Deep search entries)
  const deepSearchItems = useMemo(() => {
    const queryTrimmed = searchQuery.trim();
    if (!queryTrimmed) return [];

    const items = [];

    if (selectedScope === "all" || selectedScope === "places") {
      items.push({
        id: "deep-places",
        type: "deep",
        title: `Tìm địa điểm: "${queryTrimmed}"`,
        subtitle: "Xem danh sách và bộ lọc đầy đủ",
        icon: MapPin,
        badge: "Địa điểm",
        onClick: () => {
          navigate(`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(queryTrimmed)}`);
          setIsOpen(false);
        },
      });
    }

    if (selectedScope === "all" || selectedScope === "businesses") {
      items.push({
        id: "deep-businesses",
        type: "deep",
        title: `Tìm doanh nghiệp: "${queryTrimmed}"`,
        subtitle: "Tra cứu hồ sơ cơ sở kinh doanh, đối tác",
        icon: Building2,
        badge: "Doanh nghiệp",
        onClick: () => {
          navigate(`${ADMIN_ROUTES.BUSINESS_LIST}?search=${encodeURIComponent(queryTrimmed)}`);
          setIsOpen(false);
        },
      });
    }

    if (selectedScope === "all" || selectedScope === "users") {
      items.push({
        id: "deep-users",
        type: "deep",
        title: `Tìm người dùng: "${queryTrimmed}"`,
        subtitle: "Tìm tài khoản theo tên, email, số điện thoại",
        icon: Users,
        badge: "Người dùng",
        onClick: () => {
          navigate(`${ADMIN_ROUTES.USERS}?search=${encodeURIComponent(queryTrimmed)}`);
          setIsOpen(false);
        },
      });
    }

    return items;
  }, [searchQuery, selectedScope, navigate]);

  // Tập hợp danh sách các item có thể focus bàn phím
  const flatSelectableItems = useMemo(() => {
    const list = [];

    filteredActions.forEach((act) => {
      list.push({
        id: act.id,
        onSelect: () => {
          navigate(act.route);
          setIsOpen(false);
        },
      });
    });

    filteredPlaces.forEach((p) => {
      list.push({
        id: `place-${p.id}`,
        onSelect: () => {
          navigate(`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(p.name)}`);
          setIsOpen(false);
        },
      });
    });

    deepSearchItems.forEach((item) => {
      list.push({
        id: item.id,
        onSelect: item.onClick,
      });
    });

    return list;
  }, [filteredActions, filteredPlaces, deepSearchItems, navigate]);

  // Xử lý phím Enter / Escape / Mũi tên
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setScopeDropdownOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((prev) => (prev < flatSelectableItems.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatSelectableItems.length - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatSelectableItems[activeIndex]) {
        flatSelectableItems[activeIndex].onSelect();
        return;
      }

      const queryTrimmed = searchQuery.trim();
      if (!queryTrimmed) return;

      if (selectedScope === "businesses") {
        navigate(`${ADMIN_ROUTES.BUSINESS_LIST}?search=${encodeURIComponent(queryTrimmed)}`);
      } else if (selectedScope === "users") {
        navigate(`${ADMIN_ROUTES.USERS}?search=${encodeURIComponent(queryTrimmed)}`);
      } else if (selectedScope === "places") {
        navigate(`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(queryTrimmed)}`);
      } else if (selectedScope === "navigation" && filteredActions.length > 0) {
        navigate(filteredActions[0].route);
      } else {
        if (
          filteredActions.length === 1 &&
          normalizeSearchText(filteredActions[0].title) === normalizeSearchText(queryTrimmed)
        ) {
          navigate(filteredActions[0].route);
        } else {
          navigate(`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(queryTrimmed)}`);
        }
      }
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
    setActiveIndex(-1);
  };

  const ScopeIcon = activeScopeObj.icon;

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-80 md:w-96 lg:w-[420px] text-left shrink-0"
    >
      {/* Search Input Bar */}
      <div
        className={cn(
          "flex items-center h-10 w-full rounded-full bg-white transition-all border shadow-sm",
          isOpen
            ? "border-slate-400 ring-2 ring-slate-100 shadow-md"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        {/* Scope Selector Trigger */}
        <div className="relative shrink-0 pl-1.5">
          <button
            type="button"
            onClick={() => setScopeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 h-7 px-2 sm:px-2.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-[11px] font-semibold transition-colors focus:outline-none"
            title="Chọn mục đích tìm kiếm"
            aria-label="Chọn mục đích tìm kiếm"
          >
            <ScopeIcon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            <span className="hidden xs:inline-block max-w-[70px] sm:max-w-[80px] truncate">
              {activeScopeObj.label}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {/* Scope Dropdown Menu */}
          {scopeDropdownOpen && (
            <div className="absolute left-0 top-9 sm:top-10 z-50 w-44 rounded-xl bg-white p-1 shadow-xl border border-slate-200 text-xs font-medium animate-in fade-in-50 zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Mục đích tìm kiếm
              </div>
              {SEARCH_SCOPES.map((scope) => {
                const ItemIcon = scope.icon;
                const isSelected = scope.id === selectedScope;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => {
                      setSelectedScope(scope.id);
                      setScopeDropdownOpen(false);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors",
                      isSelected
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <ItemIcon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-white" : "text-slate-500")} />
                    <span className="truncate">{scope.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Text */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={activeScopeObj.placeholder}
          className="flex-1 min-w-0 h-full bg-transparent px-2.5 sm:px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Action icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 pr-1.5 sm:pr-2 shrink-0">
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Xóa từ khóa"
              aria-label="Xóa từ khóa"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded font-semibold">
              Ctrl K
            </kbd>
          )}

          <button
            type="button"
            onClick={() => {
              if (isOpen && searchQuery.trim()) {
                const syntheticEvent = { key: "Enter", preventDefault: () => {} };
                handleKeyDown(syntheticEvent);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            title="Tìm kiếm"
            aria-label="Tìm kiếm"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Interactive Command & Search Results Panel - Responsive for all screens */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 sm:left-auto sm:right-0 top-11 sm:top-12 z-50 w-full sm:w-[440px] md:w-[480px] max-w-[calc(100vw-1.5rem)] sm:max-w-[480px] max-h-[70vh] sm:max-h-[480px] overflow-y-auto rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 sm:p-2.5 animate-in fade-in-50 zoom-in-95"
        >
          {/* Filter Scope Pills - Horizontal scrollable */}
          <div className="flex items-center gap-1 sm:gap-1.5 pb-2 mb-2 border-b border-slate-100 overflow-x-auto no-scrollbar scroll-smooth">
            {SEARCH_SCOPES.map((scope) => {
              const isSelected = scope.id === selectedScope;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => {
                    setSelectedScope(scope.id);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all shrink-0",
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  )}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          {/* Section: Chức năng & Điều hướng nhanh */}
          {filteredActions.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {searchQuery ? "Chức năng hệ thống phù hợp" : "Truy cập nhanh"}
              </div>
              <div className="space-y-0.5">
                {filteredActions.map((act) => {
                  const itemIndex = flatSelectableItems.findIndex((it) => it.id === act.id);
                  const isHighlighted = itemIndex === activeIndex;
                  const ActionIcon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        navigate(act.route);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl cursor-pointer transition-colors",
                        isHighlighted ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{act.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{act.description}</p>
                        </div>
                      </div>
                      <span className="hidden xs:inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                        {act.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Địa điểm phù hợp trong Dashboard */}
          {filteredPlaces.length > 0 && (
            <div className="mb-2 border-t border-slate-100 pt-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Địa điểm liên quan
              </div>
              <div className="space-y-0.5">
                {filteredPlaces.map((p) => {
                  const itemIndex = flatSelectableItems.findIndex((it) => it.id === `place-${p.id}`);
                  const isHighlighted = itemIndex === activeIndex;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate(`${ADMIN_ROUTES.PLACES}?search=${encodeURIComponent(p.name)}`);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl cursor-pointer transition-colors",
                        isHighlighted ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {p.district?.name || "Cần Thơ"} • {p.category?.name || "Địa điểm"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Hành động tìm kiếm sâu theo mục tiêu */}
          {deepSearchItems.length > 0 && (
            <div className="border-t border-slate-100 pt-2 mb-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tìm kiếm sâu theo mục đích
              </div>
              <div className="space-y-0.5">
                {deepSearchItems.map((item) => {
                  const itemIndex = flatSelectableItems.findIndex((it) => it.id === item.id);
                  const isHighlighted = itemIndex === activeIndex;
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={item.onClick}
                      className={cn(
                        "flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl cursor-pointer transition-colors",
                        isHighlighted ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-blue-700 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 shrink-0">
                        <span className="hidden xs:inline">Lọc ngay</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trạng thái không có kết quả */}
          {searchQuery &&
            filteredActions.length === 0 &&
            filteredPlaces.length === 0 &&
            deepSearchItems.length === 0 && (
              <div className="py-6 text-center text-slate-400 space-y-1">
                <p className="text-xs font-semibold">Không tìm thấy mục tiêu phù hợp</p>
                <p className="text-[11px]">Thử đổi từ khóa hoặc chuyển sang phạm vi "Tất cả"</p>
              </div>
            )}

          {/* Footer chỉ dẫn phím tắt & trạng thái */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            <div className="hidden sm:flex items-center gap-3">
              <span>↑↓ Di chuyển</span>
              <span>↵ Chọn</span>
              <span>Esc Đóng</span>
            </div>
            <div className="flex sm:hidden items-center text-[10px] text-slate-400 font-sans">
              <span>Chạm để chọn</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Mục tiêu:</span>
              <span className="font-bold text-slate-600">{activeScopeObj.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
