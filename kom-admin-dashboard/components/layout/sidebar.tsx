"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/auth-context";
import { Loader } from "../ui/loader";

// Simple Inline Icons to match Clean Line Style
const Icons = {
  Home: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  List: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Check: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Users: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Flag: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  Settings: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Activity: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Business: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M13 11h4"/><path d="M13 15h4"/><path d="M13 19h4"/><path d="M5 11h4"/><path d="M5 15h4"/><path d="M5 19h4"/></svg>,
  Story: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
  Video: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Package: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3"/><line x1="10" x2="14" y1="12" y2="12"/></svg>,
  Ad: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" x2="12" y1="12" y2="16"/><line x1="10" x2="14" y1="14" y2="14"/></svg>,
  CreditCard: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="22" height="16" x="1" y="4" rx="2" ry="2"/><line x1="1" x2="23" y1="10" y2="10"/></svg>,
  Notification: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Star: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Luck: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
};
const MENU_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: Icons.Home, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/stories", label: "القصص", icon: Icons.Story, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/advertisements", label: "الإعلانات البانر", icon: Icons.Ad, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/admin-videos", label: "فيديوهات المسؤول", icon: Icons.Video, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/listings", label: "الإعلانات (مراجعة)", icon: Icons.List, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/accepted-listings", label: "الإعلانات المقبولة", icon: Icons.Check, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/showroom-requests", label: "طلبات التجار", icon: Icons.Business, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/packages", label: "باقات التجار", icon: Icons.Package, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/individual-packages", label: "باقات الأفراد", icon: Icons.CreditCard, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/featured-packages", label: "باقات التمييز", icon: Icons.Star, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/payments", label: "المدفوعات", icon: Icons.CreditCard, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/users", label: "المستخدمين", icon: Icons.Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/admin-users", label: "مدراء النظام", icon: Icons.Shield, roles: ["SUPER_ADMIN"] },
  { href: "/dashboard/reports", label: "البلاغات", icon: Icons.Flag, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/notifications", label: "إشعارات الإذاعة", icon: Icons.Notification, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/luck", label: "نظام الحظ 🎰", icon: Icons.Luck, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Icons.Settings, roles: ["SUPER_ADMIN"] },
  { href: "/dashboard/audit-logs", label: "سجل العمليات", icon: Icons.Activity, roles: ["SUPER_ADMIN", "ADMIN"] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Handle closing on mobile when path changes
  if (onClose && isOpen) {
     // We could add an effect here, but better to let the parent handle it or the Link click
  }

  // Show loader while checking auth
  if (loading) {
    return (
      <aside className="sticky top-0 hidden h-screen w-64 flex-col bg-[#111827] text-white p-5 md:flex items-center justify-center">
        <Loader className="h-6 w-6 text-white/20" />
      </aside>
    );
  }

  // If no user, sidebar might be empty or hidden (Layout usually redirects)
  if (!user) return null;

  const userRole = user.role || "ADMIN";
  const items = MENU_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "bg-[#111827] text-gray-400 p-4 shadow-xl z-50 flex-col",
          "h-screen w-64 transition-transform duration-300 ease-in-out",
          // Desktop: sticky, visible
          "hidden md:flex md:sticky md:top-0",
          // Mobile: fixed, transform based on state
          isOpen ? "flex fixed top-0 right-0 animate-in slide-in-from-right" : "hidden"
        )}
      >
        <div className="mb-8 px-2 pt-2 flex justify-between items-center">
          <div>
            <div className="h-12 w-12">
              <Image
                src="/logo.png"
                alt="KOM"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium opacity-80">لوحة الإدارة الرئيسية</p>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose} 
            className="md:hidden text-gray-400 hover:text-white p-2"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
          </button>
        </div>
      
        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {items.map((item) => {
            const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose} // Auto close on mobile click
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-white" : "text-gray-500 group-hover:text-white")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/5">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-white" title={user.email}>{user.email}</span>
              <span className="truncate text-xs text-gray-500 capitalize">{userRole.replace('_', ' ').toLowerCase()}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

