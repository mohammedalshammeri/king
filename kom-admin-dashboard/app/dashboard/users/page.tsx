"use client";

import { useEffect, useState } from "react";
import { approveUser, banUser, getUsers, rejectUser, unbanUser } from "../../../lib/services/admin";
import type { PaginatedResponse, UserProfile } from "../../../lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../components/ui/toast";
import { useAdminI18n } from "../../../context/i18n-context";

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const { pushToast } = useToast();
  const { language, t } = useAdminI18n();

  const roleLabels: Record<string, string> = {
    USER_INDIVIDUAL: t("users.roleIndividual"),
    USER_SHOWROOM: t("users.roleShowroom"),
  };

  const load = async (showFullLoader = false) => {
    if (showFullLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await getUsers();
      setData(response);
    } catch (error: any) {
      pushToast({ type: "error", message: t("users.loadFailed") });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const filteredUsers = (data?.data ?? []).filter((user) => {
    const userName = user.individualProfile?.fullName ?? user.showroomProfile?.showroomName ?? "";
    const location = user.individualProfile
      ? [user.individualProfile.governorate, user.individualProfile.city].filter(Boolean).join(" ")
      : [user.showroomProfile?.governorate, user.showroomProfile?.city].filter(Boolean).join(" ");

    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      userName.toLowerCase().includes(normalizedSearch) ||
      location.toLowerCase().includes(normalizedSearch) ||
      (user.phone ?? "").toLowerCase().includes(normalizedSearch);

    const status = user.isBanned ? "BANNED" : !user.isActive ? "PENDING" : "ACTIVE";
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingUsersCount = (data?.data ?? []).filter((user) => !user.isActive && !user.isBanned).length;
  const bannedUsersCount = (data?.data ?? []).filter((user) => user.isBanned).length;
  const activeUsersCount = (data?.data ?? []).filter((user) => user.isActive && !user.isBanned).length;

  const handleBan = async () => {
    if (!selectedUser) return;
    if (banReason.trim().length < 10) {
      pushToast({ type: "error", message: t("users.banReasonMin") });
      return;
    }
    try {
      setActionLoading(true);
      await banUser(selectedUser.id, banReason.trim());
      pushToast({ type: "success", message: t("users.banSuccess") });
      setBanOpen(false);
      setBanReason("");
      setSelectedUser(null);
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || t("users.banFailed");
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (user: UserProfile) => {
    if (!confirm(t("users.unbanConfirm"))) return;
    try {
      setActionLoading(true);
      await unbanUser(user.id);
      pushToast({ type: "success", message: t("users.unbanSuccess") });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || t("users.unbanFailed");
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (user: UserProfile) => {
    if (!confirm(t("users.approveConfirm", { email: user.email }))) return;

    try {
      setActionLoading(true);
      await approveUser(user.id);
      pushToast({ type: "success", message: t("users.approveSuccess") });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || t("users.approveFailed");
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    if (reviewReason.trim().length < 10) {
      pushToast({ type: "error", message: t("users.rejectReasonMin") });
      return;
    }

    try {
      setActionLoading(true);
      await rejectUser(selectedUser.id, reviewReason.trim());
      pushToast({ type: "success", message: t("users.rejectSuccess") });
      setReviewOpen(false);
      setReviewReason("");
      setSelectedUser(null);
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || t("users.rejectFailed");
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        {t("users.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t("users.totalUsers")}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{data?.total ?? data?.data.length ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t("users.active")}</div>
          <div className="mt-2 text-2xl font-semibold text-green-700">{activeUsersCount}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t("users.pending")}</div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">{pendingUsersCount}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t("users.banned")}</div>
          <div className="mt-2 text-2xl font-semibold text-red-700">{bannedUsersCount}</div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{t("users.managementTitle")}</div>
              <div className="mt-1 text-xs text-gray-500">{t("users.managementSubtitle")}</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("users.searchPlaceholder")}
                className="h-10 min-w-60"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
              >
                <option value="ALL">{t("users.allStatuses")}</option>
                <option value="ACTIVE">{t("users.active")}</option>
                <option value="PENDING">{t("users.pending")}</option>
                <option value="BANNED">{t("users.banned")}</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
              >
                <option value="ALL">{t("users.allTypes")}</option>
                <option value="USER_INDIVIDUAL">{t("users.roleIndividual")}</option>
                <option value="USER_SHOWROOM">{t("users.roleShowroom")}</option>
              </select>
              <Button variant="secondary" onClick={() => load()} disabled={refreshing || actionLoading}>
                {refreshing ? t("common.refreshing") : t("common.refresh")}
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
              <tr>
                <th className="p-3 text-right">{t("users.nameHeader")}</th>
                <th className="p-3 text-right">{t("users.typeHeader")}</th>
                <th className="p-3 text-right">{t("users.emailHeader")}</th>
                <th className="p-3 text-right">{t("users.phoneHeader")}</th>
                <th className="p-3 text-right">{t("users.locationHeader")}</th>
                <th className="p-3 text-right">{t("users.extraInfoHeader")}</th>
                <th className="p-3 text-right">{t("users.registrationDateHeader")}</th>
                <th className="p-3 text-right">{t("users.statusHeader")}</th>
                <th className="p-3 text-right">{t("users.actionHeader")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 text-sm">
                    {t("users.noResults")}
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => {
                const location = user.individualProfile 
                  ? [user.individualProfile.governorate, user.individualProfile.city].filter(Boolean).join(' / ') || t("users.emptyValue")
                  : user.showroomProfile
                  ? [user.showroomProfile.governorate, user.showroomProfile.city].filter(Boolean).join(' / ') || t("users.emptyValue")
                  : t("users.emptyValue");
                
                const additionalInfo = user.showroomProfile
                  ? (user.showroomProfile.crNumber ? `${t("users.crLabel")} ${user.showroomProfile.crNumber}` : t("users.emptyValue"))
                  : t("users.emptyValue");

                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <td className="p-3 font-medium">
                      {user.individualProfile?.fullName ?? user.showroomProfile?.showroomName ?? t("users.emptyValue")}
                    </td>
                    <td className="p-3">{roleLabels[user.role] ?? user.role}</td>
                    <td className="p-3 text-gray-600 text-xs">{user.email}</td>
                    <td className="p-3 text-gray-600">{user.phone ?? t("users.emptyValue")}</td>
                    <td className="p-3 text-gray-600 text-xs">{location}</td>
                    <td className="p-3 text-gray-600 text-xs">{additionalInfo}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString(language === "ar" ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3">
                      {user.isBanned ? (
                        <Badge variant="destructive">{t("users.banned")}</Badge>
                      ) : !user.isActive ? (
                        <Badge variant="warning">{t("users.pending")}</Badge>
                      ) : (
                        <Badge variant="success">{t("users.active")}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {user.isBanned ? (
                        <Button size="sm" variant="secondary" onClick={() => handleUnban(user)} disabled={actionLoading}>
                          {t("users.unban")}
                        </Button>
                      ) : !user.isActive ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleApprove(user)} disabled={actionLoading}>
                            {t("users.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setSelectedUser(user);
                              setReviewOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            {t("users.reject")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            {t("users.ban")}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setBanOpen(true);
                          }}
                          disabled={actionLoading}
                        >
                          {t("users.ban")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={banOpen} onClose={() => setBanOpen(false)} title={t("users.banReasonTitle")}>
        <div className="space-y-4">
          <Textarea
            placeholder={t("users.banReasonPlaceholder")}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBanOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={actionLoading}>
              {t("users.confirmBan")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={t("users.rejectReasonTitle")}>
        <div className="space-y-4">
          <Textarea
            placeholder={t("users.rejectReasonPlaceholder")}
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {t("users.confirmReject")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
