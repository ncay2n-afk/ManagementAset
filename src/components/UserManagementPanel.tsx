import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  UploadCloud
} from 'lucide-react';
import { AppUserAccount, AppUserRole } from '../types';
import { generateSaltHex, hashPassword } from '../services/passwordCrypto';

interface UserManagementPanelProps {
  users: AppUserAccount[];
  currentUser: AppUserAccount | null;
  onAddUser: (user: AppUserAccount) => void;
  onUpdateUser: (user: AppUserAccount) => void;
  onDeleteUser: (userId: string) => void;
  hasSpreadsheetToken: boolean;
  hasSpreadsheetId: boolean;
  isSyncingUsers?: boolean;
  onRefreshUsersFromSheet?: () => Promise<void>;
  onPushUsersToSheet?: () => void;
}

const ROLE_META: Record<AppUserRole, { label: string; badgeClass: string; desc: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Akses penuh semua fitur, manajemen akun & database Spreadsheet',
  },
  ADMIN: {
    label: 'Admin Aset',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Kelola aset, mutasi, opname, BAPA, & master data',
  },
  OPERATOR: {
    label: 'Operator / Staf GA',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Tambah aset, mutasi peminjaman, opname, servis, & cetak QR',
  },
  AUDITOR: {
    label: 'Auditor (Read-Only)',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Lihat inventaris, riwayat, laporan, & scan QR (tanpa ubah data)',
  },
};

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  hasSpreadsheetToken,
  hasSpreadsheetId,
  isSyncingUsers = false,
  onRefreshUsersFromSheet,
  onPushUsersToSheet,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Add Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppUserRole>('OPERATOR');
  const [department, setDepartment] = useState('General Affairs');
  const [initialPassword, setInitialPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<AppUserAccount | null>(null);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<AppUserAccount | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const activeSuperAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN' && u.isActive).length;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setFormError('Username minimal 3 karakter tanpa spasi.');
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "${cleanUsername}" sudah digunakan.`);
      return;
    }
    if (email.trim() && users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setFormError(`Email "${email.trim()}" sudah terdaftar pada akun lain.`);
      return;
    }
    if (initialPassword && initialPassword.length < 6) {
      setFormError('Jika diisi, kata sandi minimal 6 karakter (atau kosongkan agar pengguna membuat sendiri saat login pertama).');
      return;
    }
    if (role === 'SUPER_ADMIN' && !isSuperAdmin) {
      setFormError('Hanya Super Admin yang dapat membuat akun Super Admin baru.');
      return;
    }

    let passwordSalt = '';
    let passwordHash = '';
    if (initialPassword) {
      passwordSalt = generateSaltHex();
      passwordHash = await hashPassword(initialPassword, passwordSalt);
    }

    const newAcc: AppUserAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: cleanUsername,
      fullName: fullName.trim() || cleanUsername,
      email: email.trim(),
      role,
      department: department.trim() || 'Umum',
      isActive: true,
      passwordHash,
      passwordSalt,
      createdAt: new Date().toISOString(),
    };

    onAddUser(newAcc);
    setUsername('');
    setFullName('');
    setEmail('');
    setInitialPassword('');
    setFormSuccess(
      `Akun "${newAcc.username}" berhasil ditambahkan${hasSpreadsheetId && hasSpreadsheetToken ? ' & siap disinkronkan ke tab Master_Pengguna' : ''}.`
    );
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const original = users.find((u) => u.id === editingUser.id);
    if (
      original?.role === 'SUPER_ADMIN' &&
      (editingUser.role !== 'SUPER_ADMIN' || !editingUser.isActive) &&
      activeSuperAdminCount <= 1
    ) {
      alert('Minimal harus ada 1 akun Super Admin yang aktif.');
      return;
    }

    onUpdateUser({
      ...editingUser,
      username: editingUser.username.trim().toLowerCase(),
      fullName: editingUser.fullName.trim(),
      email: editingUser.email.trim(),
      department: editingUser.department.trim(),
    });
    setEditingUser(null);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);

    if (newResetPassword.length < 6) {
      setResetError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    const salt = generateSaltHex();
    const hash = await hashPassword(newResetPassword, salt);
    onUpdateUser({
      ...resetTarget,
      passwordSalt: salt,
      passwordHash: hash,
    });
    setResetTarget(null);
    setNewResetPassword('');
  };

  const handleRemoveUser = (target: AppUserAccount) => {
    if (currentUser?.id === target.id) {
      alert('Anda tidak dapat menghapus akun yang sedang digunakan untuk login saat ini.');
      return;
    }
    if (target.role === 'SUPER_ADMIN' && target.isActive && activeSuperAdminCount <= 1) {
      alert('Minimal harus tersisa 1 Super Admin aktif.');
      return;
    }
    if (target.role === 'SUPER_ADMIN' && !isSuperAdmin) {
      alert('Hanya Super Admin yang dapat menghapus akun Super Admin.');
      return;
    }
    if (confirm(`Yakin ingin menghapus akun "${target.fullName}" (${target.username})?`)) {
      onDeleteUser(target.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Spreadsheet Sync Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Manajemen Akun Pengguna (Tab <code>Master_Pengguna</code>)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Kelola pengguna yang berhak login ke aplikasi ini. Kata sandi dienkripsi dengan PBKDF2-SHA256 + salt acak sebelum disimpan ke Google Spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRefreshUsersFromSheet && (
            <button
              type="button"
              onClick={onRefreshUsersFromSheet}
              disabled={!hasSpreadsheetToken || !hasSpreadsheetId || isSyncingUsers}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingUsers ? 'animate-spin' : ''}`} />
              <span>Muat dari Sheet</span>
            </button>
          )}
          {onPushUsersToSheet && (
            <button
              type="button"
              onClick={onPushUsersToSheet}
              disabled={!hasSpreadsheetToken || isSyncingUsers}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Simpan ke Spreadsheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Add User Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleCreateUser}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 h-fit"
        >
          <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Tambah Akun Pengguna</span>
          </h5>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth: rian.ga"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="cth: Rian Pratama"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Google (Opsional — untuk 1-klik login Google)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rian@perusahaan.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran (Role) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AppUserRole)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                <option value="ADMIN">Admin Aset</option>
                <option value="OPERATOR">Operator / Staf GA</option>
                <option value="AUDITOR">Auditor (Read-Only)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="General Affairs"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Awal (min. 6 karakter)
            </label>
            <input
              type="password"
              value={initialPassword}
              onChange={(e) => setInitialPassword(e.target.value)}
              placeholder="Kosongkan jika user buat sendiri"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Pengguna</span>
          </button>
        </form>

        {/* Users List Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h5 className="text-sm font-bold text-slate-900">
              Daftar Akun Terdaftar ({users.length} Pengguna)
            </h5>
            <span className="text-[11px] text-slate-500">
              Sumber: <code>Master_Pengguna</code>
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Pengguna</th>
                  <th className="py-2.5 px-4">Peran &amp; Divisi</th>
                  <th className="py-2.5 px-4">Status &amp; Sandi</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const meta = ROLE_META[u.role];
                  const isSelf = currentUser?.id === u.id;
                  const canManageTarget = u.role !== 'SUPER_ADMIN' || isSuperAdmin;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">{u.username}</div>
                        {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{u.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>
                            {u.passwordHash ? 'Sandi Terpasang' : 'Menunggu Aktivasi'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageTarget ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              title="Edit Profil & Role"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(u);
                                setNewResetPassword('');
                                setResetError(null);
                              }}
                              title="Reset Kata Sandi"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(u)}
                                title="Hapus Akun"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Khusus Super Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            {(Object.keys(ROLE_META) as AppUserRole[]).map((r) => (
              <div key={r}>
                <strong className="text-slate-800">{ROLE_META[r].label}:</strong>{' '}
                {ROLE_META[r].desc}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>Edit Akun: {editingUser.username}</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as AppUserRole })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {(isSuperAdmin || editingUser.role === 'SUPER_ADMIN') && (
                      <option value="SUPER_ADMIN">Super Admin</option>
                    )}
                    <option value="ADMIN">Admin Aset</option>
                    <option value="OPERATOR">Operator / Staf GA</option>
                    <option value="AUDITOR">Auditor (Read-Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi</label>
                  <input
                    type="text"
                    value={editingUser.department}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span className="font-semibold text-slate-800">Status Akun Aktif (Boleh Login)</span>
              </label>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Reset Sandi: {resetTarget.username}</span>
              </h4>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmResetPassword} className="p-5 space-y-3.5 text-xs">
              {resetError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  {resetError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
