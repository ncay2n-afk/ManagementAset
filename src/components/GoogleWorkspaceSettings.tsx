import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  HardDrive,
  Mail,
  ShieldCheck,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Send,
  Loader2,
  KeyRound,
  Download,
  HelpCircle,
  Search,
  Database,
  Clock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { WorkspaceConfig, OfficeAsset } from '../types';
import { sendGmailMessage } from '../services/gmailService';
import { SpreadsheetConfirmAction } from './SpreadsheetConfirmModal';
import {
  TAB_ASSETS,
  TAB_TRANSACTIONS,
  TAB_MAINTENANCE,
  TAB_OPNAME,
  TAB_DISPOSAL,
  TAB_LOCATIONS,
  TAB_VENDORS,
  TAB_DIVISIONS,
  TAB_SUB_KELOMPOKS,
  TAB_SETTINGS,
  TAB_USERS
} from '../services/sheetsService';

interface GoogleWorkspaceSettingsProps {
  user: User | null;
  token: string | null;
  onSignIn: () => void;
  workspaceConfig: WorkspaceConfig;
  onUpdateConfig: (newConfig: Partial<WorkspaceConfig>) => void;
  assets: OfficeAsset[];
  onSyncAll: () => Promise<void>;
  onPullFromSheet?: () => Promise<void>;
  onRequestSpreadsheetAction?: (action: SpreadsheetConfirmAction) => void;
  onFindExistingSpreadsheet?: () => Promise<void>;
  onDisableAutoSync?: () => void;
  onOpenAuthHelp?: () => void;
  isSyncing: boolean;
}

const SYNCED_TABS_LABELS = [
  TAB_ASSETS,
  TAB_TRANSACTIONS,
  TAB_MAINTENANCE,
  TAB_OPNAME,
  TAB_DISPOSAL,
  TAB_LOCATIONS,
  TAB_VENDORS,
  TAB_DIVISIONS,
  TAB_SUB_KELOMPOKS,
  TAB_SETTINGS,
  TAB_USERS,
];

export const GoogleWorkspaceSettings: React.FC<GoogleWorkspaceSettingsProps> = ({
  user,
  token,
  onSignIn,
  workspaceConfig,
  onUpdateConfig,
  assets,
  onSyncAll,
  onPullFromSheet,
  onRequestSpreadsheetAction,
  onFindExistingSpreadsheet,
  onDisableAutoSync,
  onOpenAuthHelp,
  isSyncing,
}) => {
  const [isSearchingDrive, setIsSearchingDrive] = useState(false);
  const [customSheetId, setCustomSheetId] = useState(workspaceConfig.spreadsheetId || '');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setCustomSheetId(workspaceConfig.spreadsheetId || '');
  }, [workspaceConfig.spreadsheetId]);

  const handleCreateNewSpreadsheetClick = () => {
    if (!token) {
      setFeedbackMsg({
        type: 'error',
        text: 'Silakan masuk dengan akun Google terlebih dahulu.',
      });
      return;
    }
    if (onRequestSpreadsheetAction) {
      onRequestSpreadsheetAction('create_db');
    } else {
      onSyncAll();
    }
  };

  const handleFindDriveClick = async () => {
    if (!token || !onFindExistingSpreadsheet) {
      setFeedbackMsg({
        type: 'error',
        text: 'Silakan masuk dengan akun Google terlebih dahulu.',
      });
      return;
    }
    setIsSearchingDrive(true);
    setFeedbackMsg(null);
    try {
      await onFindExistingSpreadsheet();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Gagal mencari file Spreadsheet di Google Drive.',
      });
    } finally {
      setIsSearchingDrive(false);
    }
  };

  const handleSaveCustomSheetId = () => {
    if (!customSheetId.trim()) return;
    const cleanId = customSheetId.includes('/d/')
      ? customSheetId.split('/d/')[1].split('/')[0]
      : customSheetId.trim();

    onUpdateConfig({
      spreadsheetId: cleanId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
    });

    setFeedbackMsg({
      type: 'success',
      text: 'ID Google Spreadsheet berhasil ditautkan. Anda dapat menekan "Muat Database" atau "Simpan Database".',
    });
  };

  const handleSendTestEmail = async () => {
    if (!token) {
      setTestEmailStatus('Silakan login dengan Google terlebih dahulu.');
      return;
    }
    const targetEmail = workspaceConfig.notificationEmail || user?.email;
    if (!targetEmail) {
      setTestEmailStatus('Alamat email tujuan belum diisi.');
      return;
    }

    setIsSendingTestEmail(true);
    setTestEmailStatus(null);

    try {
      await sendGmailMessage(token, {
        to: targetEmail,
        subject: '[AsetKantor] Uji Coba Integrasi Notifikasi Gmail',
        htmlBody: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">Integrasi Gmail AsetKantor Berhasil! 🎉</h2>
            <p style="color: #334155; font-size: 14px;">
              Email ini membuktikan bahwa aplikasi Sistem Manajemen Aset Kantor Anda berhasil terhubung dengan akun Gmail Anda.
            </p>
            <p style="color: #64748b; font-size: 13px;">
              Setiap kali terjadi mutasi penting, peminjaman barang oleh staf, atau laporan kerusakan, notifikasi email otomatis akan dikirim ke alamat ini.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            <p style="font-size: 11px; color: #94a3b8;">Waktu Uji Coba: ${new Date().toLocaleString('id-ID')}</p>
          </div>
        `,
      });

      setTestEmailStatus(`✓ Berhasil terkirim ke ${targetEmail}! Silakan periksa inbox Anda.`);
    } catch (err: any) {
      setTestEmailStatus(`Gagal mengirim: ${err.message || 'Pastikan izin Gmail API aktif.'}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const isAutoSyncActive = Boolean(
    token && workspaceConfig.spreadsheetId && workspaceConfig.autoSyncSpreadsheet
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Ekosistem Google Workspace
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Google Spreadsheet (Database Utama 10 Tab), Google Drive (Foto Bukti), &amp; Gmail (Notifikasi)
              </p>
            </div>
          </div>

          {!token ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Otorisasi Akun Google</span>
              </button>
              {onOpenAuthHelp && (
                <button
                  type="button"
                  onClick={onOpenAuthHelp}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Gagal Login di GitHub?</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Terhubung sebagai {user?.email}
              </span>
            </div>
          )}
        </div>

        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* 1. Google Sheets Full Database Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  1. Google Spreadsheet (Database Utama Aplikasi)
                </h4>
                {isAutoSyncActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <Database className="w-3 h-3" />
                    Auto-Sync Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Seluruh aset, mutasi, pemeliharaan, stock opname, BAPA, lokasi, vendor, pengaturan, &amp; akun pengguna disimpan dalam 11 tab Spreadsheet.
              </p>
            </div>
          </div>

          {workspaceConfig.spreadsheetUrl && (
            <a
              href={workspaceConfig.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 transition shrink-0"
            >
              <span>Buka Spreadsheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* 11 Tabs Overview */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">
              11 Tab Database Tersinkronisasi:
            </span>
            {workspaceConfig.lastSyncedAt && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Clock className="w-3 h-3" />
                Terakhir sinkron:{' '}
                {new Date(workspaceConfig.lastSyncedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SYNCED_TABS_LABELS.map((tabName) => (
              <span
                key={tabName}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-700"
              >
                {tabName}
              </span>
            ))}
          </div>
        </div>

        {/* Spreadsheet Connection & Actions */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ID atau URL Google Spreadsheet Database
              </label>
              <input
                type="text"
                placeholder="Tempel URL atau ID Spreadsheet, atau klik Cari / Buat Baru"
                value={customSheetId}
                onChange={(e) => setCustomSheetId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCustomSheetId}
              disabled={!customSheetId.trim()}
              className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Tautkan ID
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onFindExistingSpreadsheet && (
              <button
                type="button"
                onClick={handleFindDriveClick}
                disabled={isSearchingDrive || isSyncing || !token}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {isSearchingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Cari Spreadsheet Lama di Drive</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCreateNewSpreadsheetClick}
              disabled={isSyncing || !token}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Buat Database Spreadsheet Baru</span>
            </button>

            {workspaceConfig.spreadsheetId && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onRequestSpreadsheetAction
                      ? onRequestSpreadsheetAction('push_full_db')
                      : onSyncAll()
                  }
                  disabled={isSyncing || !token}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Simpan Full DB ke Sheets ({assets.length} Aset)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onRequestSpreadsheetAction
                      ? onRequestSpreadsheetAction('pull_full_db')
                      : onPullFromSheet?.()
                  }
                  disabled={isSyncing || !token}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Full DB dari Sheets</span>
                </button>
              </>
            )}
          </div>

          {/* Real-Time Auto-Sync Toggle */}
          <div className="pt-2 border-t border-slate-200/80">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                workspaceConfig.autoSyncSpreadsheet
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-white border-slate-200'
              } ${!token ? 'opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={Boolean(workspaceConfig.autoSyncSpreadsheet)}
                disabled={!token || isSyncing}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (onRequestSpreadsheetAction) {
                      onRequestSpreadsheetAction('enable_auto_sync');
                    } else {
                      onUpdateConfig({ autoSyncSpreadsheet: true });
                    }
                  } else {
                    onDisableAutoSync?.();
                  }
                }}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  Mode Database Real-Time (Auto-Sync Setiap Perubahan)
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Jika diaktifkan, setiap penambahan/edit/hapus aset, mutasi barang, servis, opname, penghapusan BAPA, maupun perubahan master data akan otomatis disimpan ke 10 tab Google Spreadsheet. Penyimpanan browser lokal tetap berjalan sebagai cache cadangan offline.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Google Drive Photo Storage Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              2. Google Drive (Penyimpanan Foto Bukti Kondisi)
            </h4>
            <p className="text-xs text-slate-500">
              Struktur folder otomatis dibuat per ID Aset dan tanggal mutasi.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span>Skema Penataan Folder Google Drive:</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
            <p className="text-indigo-600 font-bold">📁 AsetKantor_Dokumentasi_Foto</p>
            <p className="pl-4 text-slate-700">├── 📁 AST-IT-001 (Kode Aset)</p>
            <p className="pl-8 text-slate-600">├── 📁 2026-09-25 (Tanggal Transaksi)</p>
            <p className="pl-12 text-slate-500">└── 🖼️ KONDISI_AST-IT-001_2026-09-25_TRX-123456.jpg</p>
          </div>
          <p className="text-[11px] text-slate-500">
            Setiap file foto memiliki izin akses langsung yang dapat dibuka melalui tautan catatan aset di aplikasi.
          </p>
        </div>
      </div>

      {/* 3. Gmail Notification Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              3. Gmail API (Notifikasi Status Perubahan Signifikan)
            </h4>
            <p className="text-xs text-slate-500">
              Kirim email alert otomatis untuk peminjaman, kerusakan barang, dan peringatan stok kritis.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Penerima Notifikasi Utama (Default PIC / Manajer)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="manajer.aset@kantor.com"
                value={workspaceConfig.notificationEmail || user?.email || ''}
                onChange={(e) => onUpdateConfig({ notificationEmail: e.target.value })}
                className="w-full max-w-md px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail || !token}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {isSendingTestEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Kirim Tes Email</span>
              </button>
            </div>
            {testEmailStatus && (
              <p className="text-xs text-blue-700 mt-1 font-medium">{testEmailStatus}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={workspaceConfig.autoSendEmailOnLoan}
                onChange={(e) => onUpdateConfig({ autoSendEmailOnLoan: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Peminjaman Aset Baru</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={workspaceConfig.autoSendEmailOnDamage}
                onChange={(e) => onUpdateConfig({ autoSendEmailOnDamage: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Kerusakan / Servis</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={workspaceConfig.autoSendEmailOnLowStock}
                onChange={(e) => onUpdateConfig({ autoSendEmailOnLowStock: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Peringatan Stok Kritis</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
