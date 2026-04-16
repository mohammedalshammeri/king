"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminLanguage = "ar" | "en";

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

type TranslationValue = string | TranslationDictionary;

const dictionaries: Record<AdminLanguage, TranslationDictionary> = {
  ar: {
    common: {
      refresh: "تحديث",
      refreshing: "جاري التحديث...",
      cancel: "إلغاء",
      language: "اللغة",
    },
    auth: {
      loginSuccess: "تم تسجيل الدخول بنجاح",
      logoutSuccess: "تم تسجيل الخروج",
    },
    topbar: {
      title: "لوحة التحكم",
      subtitle: "مرحباً بك في نظام إدارة ملك السوق",
      notifications: "الإشعارات",
      markAllRead: "تعليم الكل كمقروء",
      noNotifications: "لا توجد إشعارات",
      markReadDone: "تم",
      systemAdmin: "مدير النظام",
      admin: "مسؤول",
      logout: "تسجيل الخروج",
      notificationsUpdateFailed: "تعذر تحديث الإشعارات",
      notificationUpdateFailed: "تعذر تحديث الإشعار",
      toggleLanguage: "English",
      notificationAriaLabel: "الإشعارات",
    },
    users: {
      roleIndividual: "فرد",
      roleShowroom: "معرض",
      loadFailed: "تعذر تحميل المستخدمين",
      loading: "جاري تحميل المستخدمين...",
      banReasonMin: "سبب الحظر يجب أن يكون 10 أحرف على الأقل",
      banSuccess: "تم حظر المستخدم",
      banFailed: "فشل حظر المستخدم",
      unbanConfirm: "هل أنت متأكد من فك الحظر؟",
      unbanSuccess: "تم فك حظر المستخدم",
      unbanFailed: "فشل فك الحظر",
      approveConfirm: "اعتماد المستخدم {{email}}؟",
      approveSuccess: "تم اعتماد المستخدم",
      approveFailed: "فشل اعتماد المستخدم",
      rejectReasonMin: "سبب الرفض يجب أن يكون 10 أحرف على الأقل",
      rejectSuccess: "تم رفض المستخدم وحفظ السبب",
      rejectFailed: "فشل رفض المستخدم",
      totalUsers: "إجمالي المستخدمين",
      active: "نشط",
      pending: "قيد المراجعة",
      banned: "محظور",
      managementTitle: "إدارة المستخدمين",
      managementSubtitle: "اعتماد المراجعات، الحظر، والبحث السريع حسب الاسم أو البريد أو الموقع.",
      searchPlaceholder: "ابحث بالاسم أو البريد أو الهاتف",
      allStatuses: "كل الحالات",
      allTypes: "كل الأنواع",
      nameHeader: "الاسم",
      typeHeader: "النوع",
      emailHeader: "البريد",
      phoneHeader: "الهاتف",
      locationHeader: "المحافظة / المدينة",
      extraInfoHeader: "معلومات إضافية",
      registrationDateHeader: "تاريخ التسجيل",
      statusHeader: "الحالة",
      actionHeader: "إجراء",
      noResults: "لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية",
      unban: "فك الحظر",
      approve: "اعتماد",
      reject: "رفض",
      ban: "حظر",
      banReasonTitle: "سبب الحظر",
      banReasonPlaceholder: "اكتب سبب الحظر",
      confirmBan: "تأكيد الحظر",
      rejectReasonTitle: "سبب رفض المراجعة",
      rejectReasonPlaceholder: "اكتب سبب رفض اعتماد المستخدم",
      confirmReject: "تأكيد الرفض",
      crLabel: "س.ت:",
      emptyValue: "—",
    },
  },
  en: {
    common: {
      refresh: "Refresh",
      refreshing: "Refreshing...",
      cancel: "Cancel",
      language: "Language",
    },
    auth: {
      loginSuccess: "Signed in successfully",
      logoutSuccess: "Signed out successfully",
    },
    topbar: {
      title: "Dashboard",
      subtitle: "Welcome to the KOM management system",
      notifications: "Notifications",
      markAllRead: "Mark all as read",
      noNotifications: "No notifications",
      markReadDone: "Done",
      systemAdmin: "System admin",
      admin: "Admin",
      logout: "Log out",
      notificationsUpdateFailed: "Unable to update notifications",
      notificationUpdateFailed: "Unable to update the notification",
      toggleLanguage: "العربية",
      notificationAriaLabel: "Notifications",
    },
    users: {
      roleIndividual: "Individual",
      roleShowroom: "Showroom",
      loadFailed: "Unable to load users",
      loading: "Loading users...",
      banReasonMin: "Ban reason must be at least 10 characters",
      banSuccess: "User was banned",
      banFailed: "Failed to ban user",
      unbanConfirm: "Are you sure you want to remove the ban?",
      unbanSuccess: "User ban was removed",
      unbanFailed: "Failed to remove ban",
      approveConfirm: "Approve user {{email}}?",
      approveSuccess: "User approved",
      approveFailed: "Failed to approve user",
      rejectReasonMin: "Rejection reason must be at least 10 characters",
      rejectSuccess: "User was rejected and the reason was saved",
      rejectFailed: "Failed to reject user",
      totalUsers: "Total users",
      active: "Active",
      pending: "Pending review",
      banned: "Banned",
      managementTitle: "User management",
      managementSubtitle: "Approve reviews, ban users, and search quickly by name, email, or location.",
      searchPlaceholder: "Search by name, email, or phone",
      allStatuses: "All statuses",
      allTypes: "All types",
      nameHeader: "Name",
      typeHeader: "Type",
      emailHeader: "Email",
      phoneHeader: "Phone",
      locationHeader: "Governorate / City",
      extraInfoHeader: "Additional info",
      registrationDateHeader: "Registration date",
      statusHeader: "Status",
      actionHeader: "Action",
      noResults: "No results match the current search or filters",
      unban: "Unban",
      approve: "Approve",
      reject: "Reject",
      ban: "Ban",
      banReasonTitle: "Ban reason",
      banReasonPlaceholder: "Write the ban reason",
      confirmBan: "Confirm ban",
      rejectReasonTitle: "Review rejection reason",
      rejectReasonPlaceholder: "Write the reason for rejecting this user",
      confirmReject: "Confirm rejection",
      crLabel: "CR:",
      emptyValue: "—",
    },
  },
};

function resolveTranslation(language: AdminLanguage, key: string): string | undefined {
  const parts = key.split(".");
  let current: TranslationValue | undefined = dictionaries[language];

  for (const part of parts) {
    if (!current || typeof current === "string") {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(message: string, values?: Record<string, string | number>) {
  if (!values) return message;
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    message
  );
}

interface AdminI18nContextValue {
  language: AdminLanguage;
  isRTL: boolean;
  setLanguage: (language: AdminLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const AdminI18nContext = createContext<AdminI18nContextValue | undefined>(undefined);

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("ar");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("kom_admin_language") : null;
    if (saved === "ar" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kom_admin_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<AdminI18nContextValue>(() => ({
    language,
    isRTL: language === "ar",
    setLanguage: setLanguageState,
    toggleLanguage: () => setLanguageState((prev) => (prev === "ar" ? "en" : "ar")),
    t: (key, values) => interpolate(resolveTranslation(language, key) || key, values),
  }), [language]);

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n() {
  const context = useContext(AdminI18nContext);
  if (!context) {
    throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  }
  return context;
}