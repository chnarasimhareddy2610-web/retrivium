import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/browse", label: "Browse", icon: "explore" },
  { to: "/reports", label: "Reports", icon: "description" },
  { to: "/claims", label: "Claims", icon: "verified" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/profile", label: "Profile", icon: "person" },
];

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors ${
          isActive
            ? "bg-primary-container text-on-primary font-medium"
            : "text-on-surface-variant hover:bg-surface-container"
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors min-w-[56px] ${
          isActive ? "text-primary font-semibold" : "text-on-surface-variant"
        }`
      }
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const displayRole = profile?.role || "Student / Staff";
  const avatarUrl = profile?.avatar_url || null;

  const roleKind = String(profile?.role || user?.role || user?.user_metadata?.role || "").toLowerCase().trim();
  const isSecurity = roleKind === "security" || roleKind === "security desk" || roleKind === "admin";

  const userInitials = (() => {
    const parts = displayName.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  })();

  const renderAvatar = (sizeClass = "w-8 h-8 text-xs") => {
    if (avatarUrl) {
      return <img src={avatarUrl} alt="" className={`${sizeClass} rounded-full object-cover bg-surface-container`} />;
    }
    return (
      <div className={`${sizeClass} rounded-full bg-primary text-on-primary font-semibold flex items-center justify-center`}>
        {userInitials}
      </div>
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] border-r border-outline-variant/30 bg-surface-container-lowest fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-outline-variant/20">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-on-primary font-semibold text-[14px]">R</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Retrivium</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
          {isSecurity && (
            <SidebarLink to="/security" label="Security Desk" icon="security" />
          )}
        </nav>

        {/* Report Action */}
        <div className="px-3 pb-3 relative">
          <button
            onClick={() => setReportMenuOpen(!reportMenuOpen)}
            className="w-full h-10 bg-primary text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Report
          </button>
          {reportMenuOpen && (
            <div className="absolute bottom-14 left-3 right-3 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden z-50">
              <button onClick={() => { navigate("/reports/lost"); setReportMenuOpen(false); }} className="w-full px-4 py-3 text-left text-body-md text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-error">search_off</span>
                Report Lost Item
              </button>
              <div className="h-px bg-outline-variant/15"></div>
              <button onClick={() => { navigate("/reports/found"); setReportMenuOpen(false); }} className="w-full px-4 py-3 text-left text-body-md text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-tertiary">where_to_vote</span>
                Report Found Item
              </button>
            </div>
          )}
        </div>

        {/* User */}
        <div className="px-3 pb-4 pt-2 border-t border-outline-variant/20 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            {renderAvatar("w-8 h-8 text-xs")}
            <div className="flex-1 min-w-0">
              <p className="text-body-md text-on-surface font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-on-surface-variant truncate capitalize">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-body-sm text-error hover:bg-error-container/20 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/20 h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-on-primary font-semibold text-[12px]">R</span>
            </div>
            <span className="font-headline-sm text-[16px] text-on-surface">Retrivium</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/notifications" className="w-9 h-9 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-surface-container">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </NavLink>
            <NavLink to="/profile" className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {renderAvatar("w-8 h-8 text-xs")}
            </NavLink>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 flex items-center justify-center text-error rounded-full hover:bg-error-container/20"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-around px-1 py-1 pb-safe">
          <MobileNavLink to="/dashboard" label="Home" icon="dashboard" />
          <MobileNavLink to="/browse" label="Browse" icon="explore" />
          {isSecurity && <MobileNavLink to="/security" label="Security" icon="security" />}
          <button
            onClick={() => setReportMenuOpen(!reportMenuOpen)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px]"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px] text-on-primary">add</span>
            </div>
          </button>
          <MobileNavLink to="/reports" label="Reports" icon="description" />
          <MobileNavLink to="/claims" label="Claims" icon="verified" />
        </nav>

        {/* Mobile Report Menu Overlay */}
        {reportMenuOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-inverse-surface/30 z-[55]" onClick={() => setReportMenuOpen(false)} />
            <div className="md:hidden fixed bottom-20 left-4 right-4 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 z-[60] overflow-hidden">
              <button onClick={() => { navigate("/reports/lost"); setReportMenuOpen(false); }} className="w-full px-4 py-4 text-left text-body-md text-on-surface hover:bg-surface-container flex items-center gap-3 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-error">search_off</span>
                Report Lost Item
              </button>
              <div className="h-px bg-outline-variant/15"></div>
              <button onClick={() => { navigate("/reports/found"); setReportMenuOpen(false); }} className="w-full px-4 py-4 text-left text-body-md text-on-surface hover:bg-surface-container flex items-center gap-3 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-tertiary">where_to_vote</span>
                Report Found Item
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
