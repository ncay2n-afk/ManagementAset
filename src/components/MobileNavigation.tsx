import React from 'react';
import {
  Boxes,
  History,
  Scan,
  ClipboardCheck,
  Menu,
  Wrench,
  Trash2,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Plus,
  ArrowRightLeft,
  Layers,
  Upload,
  RefreshCw,
  LogOut,
  X,
  Monitor,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppTab } from './Navbar';
import { MasterCompanySettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

const TAB_TITLES: Record<AppTab, string> = {
  assets: 'Inventaris Aset',
  transactions: 'Riwayat Mutasi',
  opname: 'Stock Opname',
  maintenance: 'Pemeliharaan & Servis',
  disposal: 'Penghapusan (BAPA)',
  reports: 'Laporan & Analitik',
  settings: 'Master & Pengaturan',
  workspace: 'Google Workspace',
};

interface MobileTopBarProps {
  currentTab: AppTab;
  companySettings?: MasterCompanySettings;
  onOpenAddAssetModal: () => void;
  onOpenScanModal: () => void;
  user: User | null;
  hasToken: boolean;
  onSignIn: () => void;
  onOpenMenu: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  currentTab,
  companySettings,
  onOpenAddAssetModal,
  onOpenScanModal,
  user,
  hasToken,
  onSignIn,
  onOpenMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 h-13 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-3 flex items-center justify-between gap-2 pt-safe no-print">
      <div className="flex items-center gap-2.5 min-w-0">
        {companySettings?.logoUrl ? (
          <img
            src={companySettings.logoUrl}
            alt={companySettings.companyName || 'Logo'}
            className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-white truncate leading-tight">
            {TAB_TITLES[currentTab]}
          </h1>
          <p className="text-[11px] text-slate-400 truncate leading-tight">
            {companySettings?.companyName || 'AsetKantor'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenScanModal}
          aria-label="Scan Barcode QR"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 transition cursor-pointer"
        >
          <Scan className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenAddAssetModal}
          className="min-h-[40px] px-3 flex items-center gap-1 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Aset</span>
        </button>

        {user && hasToken ? (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Profil dan Menu"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profil'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {user.displayName?.charAt(0) || 'U'}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="min-h-[40px] px-2.5 flex items-center justify-center rounded-xl bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Masuk
          </button>
        )}
      </div>
    </header>
  );
};

interface MobileBottomBarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  onOpenScanModal: () => void;
  onOpenMenu: () => void;
  isPreviewFrame?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanModal,
  onOpenMenu,
  isPreviewFrame = false,
}) => {
  const isMoreTabActive = ['maintenance', 'disposal', 'reports', 'settings', 'workspace'].includes(currentTab);

  return (
    <nav
      aria-label="Navigasi Mobile"
      className={`${
        isPreviewFrame ? 'sticky bottom-0' : 'fixed bottom-0 left-0 right-0'
      } z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe no-print`}
    >
      <div className="grid grid-cols-5 items-center h-15 px-1">
        <button
          type="button"
          onClick={() => setCurrentTab('assets')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
            currentTab === 'assets' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Aset</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('transactions')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
            currentTab === 'transactions' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Mutasi</span>
        </button>

        <button
          type="button"
          onClick={onOpenScanModal}
          className="min-h-[44px] flex flex-col items-center justify-center cursor-pointer"
        >
          <span className="w-10 h-10 -mt-3 rounded-2xl bg-slate-900 text-white shadow-md flex items-center justify-center border-2 border-white">
            <Scan className="w-5 h-5 text-cyan-400" />
          </span>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 mt-0.5">
            Scan QR
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('opname')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
            currentTab === 'opname' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Opname</span>
        </button>

        <button
          type="button"
          onClick={onOpenMenu}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
            isMoreTabActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  onOpenAddAssetModal: () => void;
  onOpenTransactionModal: () => void;
  onOpenBatchLabelModal: () => void;
  onOpenBatchImportModal: () => void;
  user: User | null;
  hasToken: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  onSwitchToWeb?: () => void;
  isPreviewFrame?: boolean;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  onOpenAddAssetModal,
  onOpenTransactionModal,
  onOpenBatchLabelModal,
  onOpenBatchImportModal,
  user,
  hasToken,
  onSignIn,
  onSignOut,
  isSyncing,
  onManualSync,
  onSwitchToWeb,
  isPreviewFrame = false,
}) => {
  if (!isOpen) return null;

  const secondaryModules: { tab: AppTab; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      tab: 'maintenance',
      label: 'Pemeliharaan & Servis',
      desc: 'Jadwal servis rutin & biaya vendor',
      icon: <Wrench className="w-4 h-4 text-amber-600" />,
    },
    {
      tab: 'disposal',
      label: 'Penghapusan Aset (BAPA)',
      desc: 'Afkir, lelang, & berita acara resmi',
      icon: <Trash2 className="w-4 h-4 text-rose-600" />,
    },
    {
      tab: 'reports',
      label: 'Laporan & Analitik',
      desc: 'Valuasi, mutasi bulanan, & ekspor',
      icon: <BarChart3 className="w-4 h-4 text-blue-600" />,
    },
    {
      tab: 'settings',
      label: 'Master Data & Pengaturan',
      desc: 'Gedung, lantai, divisi, logo, & backup',
      icon: <Settings className="w-4 h-4 text-slate-700" />,
    },
    {
      tab: 'workspace',
      label: 'Integrasi Google Workspace',
      desc: 'Google Sheets, Drive, & notifikasi Gmail',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
    },
  ];

  const navigateTo = (tab: AppTab) => {
    setCurrentTab(tab);
    onClose();
  };

  return (
    <div
      className={`${
        isPreviewFrame ? 'absolute' : 'fixed'
      } inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs no-print`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="pt-3 pb-2 px-5 border-b border-slate-100">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Menu & Alat Cepat</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Menu"
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto pb-safe">
          {/* Quick Actions Grid */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Aksi Lapangan
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddAssetModal();
                }}
                className="min-h-[48px] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">Aset Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransactionModal();
                }}
                className="min-h-[48px] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">Mutasi / Pinjam</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBatchLabelModal();
                }}
                className="min-h-[48px] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">Stiker Massal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBatchImportModal();
                }}
                className="min-h-[48px] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">Import CSV</span>
              </button>
            </div>
          </div>

          {/* All Modules List */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Modul Lainnya
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {secondaryModules.map((mod) => {
                const isActive = currentTab === mod.tab;
                return (
                  <button
                    key={mod.tab}
                    type="button"
                    onClick={() => navigateTo(mod.tab)}
                    className={`w-full min-h-[58px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                      isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {mod.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                          {mod.label}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{mod.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account, Install PWA & Mode Switch */}
          <div className="space-y-2 pt-1">
            <PWAInstallButton variant="full" />

            {user && hasToken ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Google Workspace Aktif</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer"
                    title="Sinkronkan Sheets"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-rose-600 cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignIn();
                }}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                <span>Hubungkan Akun Google Workspace</span>
              </button>
            )}

            {onSwitchToWeb && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToWeb();
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Kembali ke Tampilan Web Desktop</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
