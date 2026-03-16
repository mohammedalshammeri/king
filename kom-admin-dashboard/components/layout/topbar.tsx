"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { Button } from "../ui/button";
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "../../lib/services/notifications";
import type { NotificationItem } from "../../lib/types";
import { useToast } from "../ui/toast";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const lastSeenKey = useMemo(() => "kom_admin_last_notification_at", []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [list, unread] = await Promise.all([
        getNotifications({ page: 1, limit: 10 }),
        getUnreadCount(),
      ]);
      setNotifications(list.data ?? []);
      setUnreadCount(unread.unreadCount ?? 0);

      const latest = list.data?.[0]?.createdAt;
      if (!latest) return;

      const lastSeen = typeof window !== "undefined" ? localStorage.getItem(lastSeenKey) : null;
      if (!lastSeen) {
        if (typeof window !== "undefined") {
          localStorage.setItem(lastSeenKey, latest);
        }
        return;
      }

      const lastSeenDate = new Date(lastSeen);
      const newItems = list.data.filter((item) => new Date(item.createdAt) > lastSeenDate);
      if (newItems.length) {
        newItems.reverse().forEach((item) => {
          pushToast({ type: "info", message: `${item.title}: ${item.body}` });
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(lastSeenKey, latest);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      pushToast({ type: "error", message: "تعذر تحديث الإشعارات" });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      pushToast({ type: "error", message: "تعذر تحديث الإشعار" });
    }
  };

  return (
    <header className="flex items-center justify-between bg-white px-4 md:px-8 py-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onMenuClick} 
          className="h-9 w-9 p-0 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <line x1="3" y1="12" x2="21" y2="12"></line>
             <line x1="3" y1="6" x2="21" y2="6"></line>
             <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </Button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">لوحة التحكم</h1>
          <p className="hidden md:block text-xs text-gray-500 mt-0.5">مرحباً بك في نظام إدارة ملك السوق</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((prev) => !prev)}
            className="relative h-9 w-9 p-0"
            aria-label="الإشعارات"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </Button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-100 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">الإشعارات</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllRead}
                  disabled={loading || notifications.length === 0}
                >
                  تعليم الكل كمقروء
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">لا توجد إشعارات</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`px-3 py-3 border-b border-gray-50 ${item.isRead ? "bg-white" : "bg-blue-50/60"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{item.body}</div>
                          <div className="text-[10px] text-gray-400 mt-2">
                            {new Date(item.createdAt).toLocaleString("ar-BH")}
                          </div>
                        </div>
                        {!item.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleMarkRead(item.id)}
                          >
                            تم
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold text-gray-800">{user?.email}</div>
          <div className="text-xs text-gray-500">
            {user?.role === "SUPER_ADMIN" ? "مدير النظام" : "مسؤول"}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="gap-2 text-xs h-9">
          تسجيل الخروج
        </Button>
      </div>
    </header>
  );
}

