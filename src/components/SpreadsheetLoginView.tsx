import React, { useState, useEffect } from 'react';
import {
  Boxes,
  FileSpreadsheet,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  HelpCircle,
  Loader2,
  UserPlus,
  QrCode,
  Link2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppUserAccount, MasterCompanySettings, WorkspaceConfig } from '../types';
import { generateSaltHex, hashPassword, verifyPassword } from '../services/passwordCrypto';

interface SpreadsheetLoginViewProps {
  users: AppUserAccount[];
  companySettings: MasterCompanySettings;
  workspaceConfig: WorkspaceConfig;
  googleUser: User | null;
  token: string | null;
  isSyncingUsers: boolean;
  onGoogleConnectAndSync: () => Promise<void>;
  onRefreshUsersFromSheet: () => Promise<void>;
  onUpdateSheetId: (sheetIdInput: string) => void;
  onLoginSuccess: (account: AppUserAccount) => void;
  onActivateInvitedUser: (account: AppUserAccount) => void;
  onFirstSuperAdminCreated: (account: AppUserAccount) => void;
  onOpenAuthHelp: () => void;
  hasQrParam?: boolean;
  onOpenQrResult?: () => void;
}

const ROLE_LABELS: Record<AppUserAccount['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin Aset',
  OPERATOR: 'Operator / Staf GA',
  AUDITOR: 'Auditor (Read-Only)',
};

export const SpreadsheetLoginView: React.FC<SpreadsheetLoginViewProps> = ({
  users,
  companySettings,
  workspaceConfig,
  googleUser,
  token,
  isSyncingUsers,
  onGoogleConnectAndSync,
  onRefreshUsersFromSheet,
  onUpdateSheetId,
  onLoginSuccess,
  onActivateInvitedUser,
  onFirstSuperAdminCreated,
  onOpenAuthHelp,
  hasQrParam = false,
  onOpenQrResult,
}) => {
  // Login credentials state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First-run Super Admin setup OR Invited user password claim state
  const [setupUsername, setSetupUsername] = useState('superadmin');
  const [setupFullName, setSetupFullName] = useState(googleUser?.displayName || 'Super Admin');
  const [setupEmail, setSetupEmail] = useState(googleUser?.email || '');
  const [setupDept, setSetupDept] = useState('IT & General Affairs');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  // Pending claim for a user row added directly in Google Sheets with empty passwordHash
  const [pendingClaimUser, setPendingClaimUser] = useState<AppUserAccount | null>(null);

  // Sheet ID helper state
  const [showSheetLinkInput, setShowSheetLinkInput] = useState(false);
  const [sheetIdInput, setSheetIdInput] = useState(workspaceConfig.spreadsheetId || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSheetIdInput(workspaceConfig.spreadsheetId || '');
  }, [workspaceConfig.spreadsheetId]);

  useEffect(() => {
    if (googleUser?.email && !setupEmail) {
      setSetupEmail(googleUser.email);
    }
    if (googleUser?.displayName && setupFullName === 'Super Admin') {
      setSetupFullName(googleUser.displayName);
    }
  }, [googleUser, setupEmail, setupFullName]);

  const googleMatchedUser =
    token && googleUser?.email
      ? users.find(
          (u) =>
            u.isActive &&
            u.email.trim().toLowerCase() === googleUser.email!.trim().toLowerCase()
        )
      : undefined;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      setErrorMsg('Masukkan username atau email terdaftar.');
      return;
    }

    const matched = users.find(
      (u) =>
        u.username.trim().toLowerCase() === normalized ||
        (u.email && u.email.trim().toLowerCase() === normalized)
    );

    if (!matched) {
      setErrorMsg(
        'Akun tidak ditemukan di daftar pengguna (tab Master_Pengguna). Periksa kembali atau klik Refresh User dari Spreadsheet.'
      );
      return;
    }

    if (!matched.isActive) {
      setErrorMsg('Akun ini sedang berstatus Nonaktif di tab Master_Pengguna Spreadsheet.');
      return;
    }

    // If admin added the row directly in Google Sheets without setting a password hash yet
    if (!matched.passwordHash || !matched.passwordSalt) {
      setPendingClaimUser(matched);
      setSetupPassword('');
      setSetupConfirm('');
      return;
    }

    if (!password) {
      setErrorMsg('Masukkan kata sandi akun Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await verifyPassword(password, matched.passwordSalt, matched.passwordHash);
      if (!ok) {
        setErrorMsg('Kata sandi salah. Periksa kembali password Anda.');
        return;
      }
      onLoginSuccess({
        ...matched,
        lastLoginAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memverifikasi password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingClaimUser) return;
    setErrorMsg(null);

    if (setupPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const salt = generateSaltHex();
      const hash = await hashPassword(setupPassword, salt);
      const updated: AppUserAccount = {
        ...pendingClaimUser,
        passwordHash: hash,
        passwordSalt: salt,
        lastLoginAt: new Date().toISOString(),
      };
      setPendingClaimUser(null);
      onActivateInvitedUser(updated);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengatur kata sandi awal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstSuperAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = setupUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username minimal 3 karakter tanpa spasi.');
      return;
    }
    if (!setupFullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (setupPassword.length < 6) {
      setErrorMsg('Kata sandi Super Admin minimal 6 karakter.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const salt = generateSaltHex();
      const hash = await hashPassword(setupPassword, salt);
      const now = new Date().toISOString();
      const superAdmin: AppUserAccount = {
        id: 'USR-001',
        username: cleanUsername,
        fullName: setupFullName.trim(),
        email: setupEmail.trim(),
        role: 'SUPER_ADMIN',
        department: setupDept.trim() || 'IT & General Affairs',
        isActive: true,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: now,
        lastLoginAt: now,
      };
      onFirstSuperAdminCreated(superAdmin);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat akun Super Admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSheetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetIdInput.trim()) return;
    onUpdateSheetId(sheetIdInput.trim());
    setShowSheetLinkInput(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center">
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName}
                className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-slate-200 object-contain shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Boxes className="w-7 h-7 text-blue-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {companySettings.companyName || 'AsetKantor Enterprise'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Login Akun Pengguna · Database Google Spreadsheet (<code>Master_Pengguna</code>)
            </p>
          </div>
        </div>

        {/* QR Scan Banner if launched from QR URL */}
        {hasQrParam && onOpenQrResult && (
          <button
            type="button"
            onClick={onOpenQrResult}
            className="w-full p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-cyan-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-cyan-950">Kode QR Aset Terdeteksi di URL</p>
                <p className="text-[11px] text-cyan-800">Ketuk untuk melihat detail label aset yang dipindai</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-cyan-700 px-2.5 py-1 bg-white rounded-lg border border-cyan-200">
              Lihat Detail
            </span>
          </button>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Google Spreadsheet Connection Bar */}
          <div className="bg-slate-900 text-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {token
                    ? `Google Terhubung (${googleUser?.email})`
                    : 'Sinkronisasi User Spreadsheet'}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 shrink-0">
                {users.length} Akun
              </span>
            </div>

            {!token ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onGoogleConnectAndSync}
                  disabled={isSyncingUsers}
                  className="w-full min-h-[42px] bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm transition cursor-pointer"
                >
                  {isSyncingUsers ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>Hubungkan Google &amp; Muat User Spreadsheet</span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowSheetLinkInput((v) => !v)}
                    className="hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>{workspaceConfig.spreadsheetId ? 'Ubah ID Spreadsheet' : 'Tempel ID Spreadsheet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAuthHelp}
                    className="hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Kendala Login GitHub?</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-300 truncate max-w-[210px]">
                  {workspaceConfig.spreadsheetId
                    ? `Sheet: ${workspaceConfig.spreadsheetName}`
                    : 'Spreadsheet belum ditautkan'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSheetLinkInput((v) => !v)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 cursor-pointer"
                  >
                    ID Sheet
                  </button>
                  <button
                    type="button"
                    onClick={onRefreshUsersFromSheet}
                    disabled={isSyncingUsers}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingUsers ? 'animate-spin' : ''}`} />
                    <span>Refresh User</span>
                  </button>
                </div>
              </div>
            )}

            {showSheetLinkInput && (
              <form onSubmit={handleSaveSheetLink} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Tempel URL atau ID Google Spreadsheet..."
                  value={sheetIdInput}
                  onChange={(e) => setSheetIdInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-[11px] font-mono placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Simpan
                </button>
              </form>
            )}
          </div>

          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Case A: Pending Password Activation for Invited Sheet Row */}
            {pendingClaimUser ? (
              <form onSubmit={handleClaimPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>Aktivasi Akun Baru ({pendingClaimUser.username})</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Akun <strong>{pendingClaimUser.fullName}</strong> ({ROLE_LABELS[pendingClaimUser.role]}) terdaftar di Spreadsheet tetapi belum memiliki kata sandi. Buat kata sandi Anda untuk mengaktifkan akun ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru (min. 6 karakter)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ulangi Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingClaimUser(null)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Aktifkan &amp; Masuk</span>
                  </button>
                </div>
              </form>
            ) : users.length === 0 ? (
              /* Case B: First-Run Super Admin Registration */
              <form onSubmit={handleFirstSuperAdminSubmit} className="space-y-3.5">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-amber-700" />
                    <span>Setup Akun Super Admin Pertama</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Belum ada daftar pengguna di tab <code>Master_Pengguna</code>. Jika sudah punya Spreadsheet dari perangkat lain, klik tombol <strong>Hubungkan Google</strong> di atas terlebih dahulu. Jika baru memulai, buat akun Super Admin pertama Anda di bawah ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupUsername}
                      onChange={(e) => setSetupUsername(e.target.value)}
                      placeholder="superadmin"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Divisi / Jabatan
                    </label>
                    <input
                      type="text"
                      value={setupDept}
                      onChange={(e) => setSetupDept(e.target.value)}
                      placeholder="IT & General Affairs"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={setupFullName}
                    onChange={(e) => setSetupFullName(e.target.value)}
                    placeholder="Nama Pengelola Utama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Opsional — untuk login cepat via Google)
                  </label>
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="admin@perusahaan.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ulangi Sandi *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={setupConfirm}
                      onChange={(e) => setSetupConfirm(e.target.value)}
                      placeholder="Konfirmasi sandi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Buat Akun Super Admin &amp; Masuk</span>
                </button>
              </form>
            ) : (
              /* Case C: Standard Spreadsheet User Login */
              <div className="space-y-4">
                {googleMatchedUser && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-950">
                        <p className="font-bold">
                          Akun Google Anda Terdaftar di Spreadsheet!
                        </p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          {googleMatchedUser.fullName} (<code>{googleMatchedUser.username}</code>) ·{' '}
                          <strong>{ROLE_LABELS[googleMatchedUser.role]}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onLoginSuccess({
                          ...googleMatchedUser,
                          lastLoginAt: new Date().toISOString(),
                        })
                      }
                      className="w-full min-h-[40px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Masuk Langsung sebagai {googleMatchedUser.fullName}
                    </button>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username atau Email (dari Spreadsheet)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="contoh: superadmin atau nama@kantor.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password akun..."
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Tampilkan atau sembunyikan password"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Jika akun baru ditambahkan langsung di tab <code>Master_Pengguna</code> tanpa password, kosongkan sandi lalu klik Masuk untuk membuat password baru.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                    )}
                    <span>Masuk dengan Akun Spreadsheet</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Daftar pengguna &amp; peran (Super Admin, Admin, Operator, Auditor) dikelola di tab{' '}
          <code>Master_Pengguna</code> Google Spreadsheet.
        </p>
      </div>
    </div>
  );
};
