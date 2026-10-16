"use client";
import { useState } from "react";
import { Users, Shield, UserCheck, UserX, Trash2, Search, Loader2, CheckCircle, AlertCircle, Ban, RefreshCw } from "lucide-react";
import { updateUserRoleAction, toggleUserBanAction, deleteUserAction, type UserRecord } from "@/lib/actions/auth";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  organization: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  supporter: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export function UserManagementList({ initialUsers, currentUserId }: { initialUsers: UserRecord[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const doAction = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setLoadingId(id); setMessage(null); setError(null);
    const res = await action();
    setLoadingId(null);
    if (!res.success) setError((res as any).error || "Action failed.");
    return res.success;
  };

  const handleRoleChange = async (userId: string, newRole: "supporter" | "organization" | "admin") => {
    const ok = await doAction(userId, () => updateUserRoleAction(userId, newRole));
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage("User role updated successfully.");
    }
  };

  const handleBanToggle = async (userId: string, currentlyBanned: boolean) => {
    const ok = await doAction(userId, () => toggleUserBanAction(userId, !currentlyBanned));
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentlyBanned } : u));
      setMessage(currentlyBanned ? "User unbanned." : "User has been banned.");
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
    const ok = await doAction(userId, () => deleteUserAction(userId));
    if (ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage("User deleted permanently.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "Total Users", val: users.length, icon: Users, color: "text-blue-600 bg-blue-500/10" },
          { label: "Organizations", val: users.filter(u => u.role === "organization").length, icon: Shield, color: "text-teal-600 bg-teal-500/10" },
          { label: "Supporters", val: users.filter(u => u.role === "supporter").length, icon: UserCheck, color: "text-amber-600 bg-amber-500/10" },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">{val}</p>
              <p className="text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-xs outline-none focus:border-primary" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs outline-none focus:border-primary">
          <option value="all">All Roles</option>
          <option value="supporter">Supporter</option>
          <option value="organization">Organization</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />{message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* User list */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-foreground">All Users ({filtered.length})</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No users found matching your filters.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(u => (
              <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 text-xs ${u.banned ? "bg-destructive/5" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{u.fullName}</span>
                      {u.banned && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">BANNED</span>}
                      {u.id === currentUserId && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700">YOU</span>}
                    </div>
                    <p className="text-muted-foreground truncate">{u.email}</p>
                    <p className="text-muted-foreground">{u.city || "—"} • Joined {u.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Role selector */}
                  {u.id !== currentUserId ? (
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value as any)}
                      disabled={loadingId === u.id}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none ${ROLE_COLORS[u.role] || ""} disabled:opacity-50`}>
                      <option value="supporter">Supporter</option>
                      <option value="organization">Organization</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${ROLE_COLORS[u.role] || ""}`}>{u.role}</span>
                  )}

                  {/* Ban/Unban */}
                  {u.id !== currentUserId && (
                    <button onClick={() => handleBanToggle(u.id, u.banned)} disabled={loadingId === u.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                        u.banned
                          ? "border-teal-500/30 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                      }`}>
                      {loadingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : u.banned ? <RefreshCw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                  )}

                  {/* Delete */}
                  {u.id !== currentUserId && (
                    <button onClick={() => handleDelete(u.id, u.fullName)} disabled={loadingId === u.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50">
                      {loadingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
