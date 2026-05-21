import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  MapPin,
  Menu,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Home,
  Calendar,
  Stethoscope,
  LogOut,
  User,
} from "lucide-react";
import { resolveApiAssetUrl, type ApiAuthUser } from "../api/client";
import { formatDoctorName } from "../utils/formatDoctorName";
import { isAdminUser, isDoctorUser } from "../utils/dashboardRbac";

interface HeaderProps {
  onNavigate: (view: string) => void;
  /** Tìm bác sĩ + từ khóa (?q=) */
  onNavigateToSearch?: (query?: string) => void;
  user: ApiAuthUser | null;
  /** Mở modal: đăng nhập, đăng ký hoặc quên mật khẩu */
  onOpenAuth: (tab: "login" | "register" | "forgot") => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onNavigateToSearch,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [headerSearchInput, setHeaderSearchInput] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const userAvatarSrc = user ? resolveApiAssetUrl(user.avatarUrl) : undefined;
  const userDisplayName = user
    ? user.role === "doctor"
      ? formatDoctorName(user.fullName)
      : user.fullName
    : "";
  const staffPortal = isDoctorUser(user) || isAdminUser(user);
  const homeTarget = isDoctorUser(user)
    ? "dashboard-doctor"
    : isAdminUser(user)
      ? "dashboard-admin"
      : "home";

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6 sm:gap-8">
              <div
                className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                onClick={() => onNavigate(homeTarget)}
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent animate-spin-slow"></div>
                </div>
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight hidden sm:inline">
                  SmartHospital
                </span>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                {isDoctorUser(user) ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("dashboard-doctor")}
                    className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                  >
                    Dashboard bác sĩ
                  </button>
                ) : isAdminUser(user) ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("dashboard-admin")}
                    className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                  >
                    Dashboard quản trị
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate("home")}
                      className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                    >
                      Trang chủ
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate("search")}
                      className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                    >
                      Tìm bác sĩ
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate("departments")}
                      className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                    >
                      Khoa khám
                    </button>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {!staffPortal && (
                <div className="hidden lg:flex items-center min-w-0 w-64 xl:w-72 shrink">
                  <div className="flex items-center rounded-full px-4 py-2 w-full border border-slate-200/80 bg-slate-50 transition-colors focus-within:border-primary/25 focus-within:bg-white">
                    <input
                      type="text"
                      enterKeyHint="search"
                      placeholder="Tên bác sĩ, khoa…"
                      value={headerSearchInput}
                      onChange={(e) => setHeaderSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const q = headerSearchInput.trim();
                          if (onNavigateToSearch) {
                            onNavigateToSearch(q || undefined);
                          } else {
                            onNavigate("search");
                          }
                        }
                      }}
                      autoComplete="off"
                      className="w-full min-w-0 appearance-none border-0 bg-transparent text-sm shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {user ? (
                  <motion.div
                    key="header-user"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="relative hidden sm:block"
                  >
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-2 pl-4 border-l border-slate-200 min-h-[44px] rounded-r-lg transition-colors hover:bg-slate-50/80"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full overflow-hidden flex items-center justify-center text-primary font-bold shrink-0 ring-2 ring-white shadow-sm">
                        {userAvatarSrc ? (
                          <img
                            src={userAvatarSrc}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                        {userDisplayName}
                      </span>
                    </button>
                    {userMenuOpen && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden
                      />
                    )}
                    <AnimatePresence>
                      {userMenuOpen ? (
                        <motion.div
                          key="user-menu-panel"
                          className="absolute right-0 top-full mt-1 py-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 origin-top-right"
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        >
                          {user.role === "doctor" && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserMenuOpen(false);
                                onNavigate("dashboard-doctor");
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Dashboard bác sĩ
                            </button>
                          )}
                          {user.role === "admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserMenuOpen(false);
                                onNavigate("dashboard-admin");
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Dashboard quản trị
                            </button>
                          )}
                          {(user.role === "user" || !user.role) && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserMenuOpen(false);
                                onNavigate("dashboard");
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Lịch của tôi
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                          </button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="header-guest"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenAuth("login")}
                      className="px-4 py-2 text-sm font-bold text-primary border border-primary rounded-xl hover:bg-primary/5 transition-colors duration-200"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAuth("register")}
                      className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors duration-200"
                    >
                      Đăng ký
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="md:hidden p-3 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom navigation - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-pb md:hidden">
        {isDoctorUser(user) ? (
          <div className="grid grid-cols-2 h-16 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => onNavigate("dashboard-doctor")}
              className="flex flex-col items-center justify-center gap-0.5 text-primary min-h-[48px]"
            >
              <Stethoscope className="w-6 h-6" />
              <span className="text-[10px] font-bold">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileAccountOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-bold">Tài khoản</span>
            </button>
          </div>
        ) : isAdminUser(user) ? (
          <div className="grid grid-cols-2 h-16 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => onNavigate("dashboard-admin")}
              className="flex flex-col items-center justify-center gap-0.5 text-primary min-h-[48px]"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-[10px] font-bold">Quản trị</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileAccountOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-bold">Tài khoản</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 h-16 max-w-lg mx-auto relative">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
            >
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold">Trang chủ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("search")}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
            >
              <Search className="w-6 h-6" />
              <span className="text-[10px] font-bold">Tìm bác sĩ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("search")}
              className="flex flex-col items-center justify-center gap-0.5 bg-primary text-white rounded-xl m-2 -mt-4 min-h-[56px] shadow-lg shadow-primary/30"
            >
              <Stethoscope className="w-6 h-6" />
              <span className="text-[10px] font-bold">Đặt lịch</span>
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => setMobileAccountOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
              >
                <User className="w-6 h-6" />
                <span className="text-[10px] font-bold">Tài khoản</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-colors min-h-[48px]"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-[10px] font-bold">Lịch của tôi</span>
              </button>
            )}
          </div>
        )}
        <AnimatePresence>
          {mobileAccountOpen && user ? (
            <>
              <motion.div
                key="mobile-account-backdrop"
                className="fixed inset-0 z-[60] bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileAccountOpen(false)}
              />
              <motion.div
                key="mobile-account-sheet"
                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl border border-slate-200 shadow-xl max-w-lg mx-auto"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-900 truncate pr-2">
                    {userDisplayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileAccountOpen(false)}
                    className="text-sm text-slate-500 font-medium px-2 py-1 rounded-lg hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                </div>
                <div className="p-2 pb-6">
                  {user.role === "doctor" && (
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl"
                      onClick={() => {
                        setMobileAccountOpen(false);
                        onNavigate("dashboard-doctor");
                      }}
                    >
                      Dashboard bác sĩ
                    </button>
                  )}
                  {user.role === "admin" && (
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl"
                      onClick={() => {
                        setMobileAccountOpen(false);
                        onNavigate("dashboard-admin");
                      }}
                    >
                      Dashboard quản trị
                    </button>
                  )}
                  {(user.role === "user" || !user.role) && (
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl"
                      onClick={() => {
                        setMobileAccountOpen(false);
                        onNavigate("dashboard");
                      }}
                    >
                      Lịch của tôi
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 mt-1"
                    onClick={() => {
                      setMobileAccountOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </nav>
    </>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent"></div>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                SmartHospital
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Đặt lịch khám nhanh, giảm chờ đợi. Chọn bác sĩ, chọn giờ, đặt cọc
              giữ chỗ — thanh toán phần còn lại sau khám.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Liên kết</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="http://localhost:5431/?view=search"
                  className="hover:text-primary transition-colors"
                >
                  Tìm bác sĩ
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5431/?view=departments"
                  className="hover:text-primary transition-colors"
                >
                  Các khoa
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tư vấn online
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Gói khám
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Hỗ trợ</h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Điều khoản
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">
              Thông tin bệnh viện / Liên hệ
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>123 Medical Plaza, Health City, HC 56789</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+1 (555) 000-1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>support@smarthospital.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2026 SmartHospital. Bảo lưu mọi quyền.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Bảo mật
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Điều khoản
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
