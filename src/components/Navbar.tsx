import React, { useState, useRef, useEffect } from 'react';
import {
  Boxes,
  History,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Scan,
  Wrench,
  BarChart3,
  LogOut,
  ClipboardCheck,
  Trash2,
  Layers,
  Upload,
  Settings,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { User } from 'firebase/auth';
import { MasterCompanySettings, AppUserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab =
  | 'assets'
  | 'transactions'
  | 'opname'
  | 'maintenance'
  | 'disposal'
  | 'reports'
  | 'settings'
  | 'workspace';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  onOpenTransactionModal: () => void;
  onOpenAddAssetModal: () => void;
  onOpenScanModal: () => void;
  onOpenBatchLabelModal: () => void;
  onOpenBatchImportModal: () => void;
  user: User | null;
  hasToken: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  appUser?: AppUserAccount | null;
  onAppLogout?: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  spreadsheetUrl: string | null;
  companySettings?: MasterCompanySettings;
}

const ROLE_SHORT: Record<AppUserAccount['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
  AUDITOR: 'Auditor',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenTransactionModal,
  onOpenAddAssetModal,
  onOpenScanModal,
  onOpenBatchLabelModal,
  onOpenBatchImportModal,
  user,
  hasToken,
  onSignIn,
  onSignOut,
  appUser,
  onAppLogout,
  isSyncing,
  onManualSync,
  companySettings,
}) => {
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canManageMaster = !appUser || appUser.role === 'SUPER_ADMIN' || appUser.role === 'ADMIN';
  const canMutateAssets = !appUser || appUser.role !== 'AUDITOR';

  const navItems: { tab: AppTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'assets', label: 'Inventaris', icon: <Boxes className="w-3.5 h-3.5" /> },
    { tab: 'transactions', label: 'Mutasi', icon: <History className="w-3.5 h-3.5" /> },
    { tab: 'opname', label: 'Opname', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
    { tab: 'maintenance', label: 'Servis', icon: <Wrench className="w-3.5 h-3.5" /> },
    ...(canManageMaster
      ? [{ tab: 'disposal' as AppTab, label: 'BAPA', icon: <Trash2 className="w-3.5 h-3.5" /> }]
      : []),
    { tab: 'reports', label: 'Laporan', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    ...(canManageMaster
      ? [{ tab: 'settings' as AppTab, label: 'Master', icon: <Settings className="w-3.5 h-3.5" /> }]
      : []),
    { tab: 'workspace', label: 'Workspace', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  ];

  const displayCompanyName = companySettings?.companyName
    ? companySettings.companyName.split(' ').slice(0, 2).join(' ')
    : 'AsetKantor';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setCurrentTab('assets')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            {companySettings?.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={displayCompanyName}
                className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-base text-white tracking-tight truncate max-w-[160px]">
              {displayCompanyName}
            </span>
          </button>

          {/* Zone 2: Single-Line Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setCurrentTab(item.tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA, Tools Dropdown & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="compact" />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                <span>Alat</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isToolsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isToolsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenScanModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer text-left"
                  >
                    <Scan className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-semibold">Scan Barcode / QR</p>
                      <p className="text-[11px] text-slate-400">Pindai kamera fisik aset</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenBatchLabelModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer text-left"
                  >
                    <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-semibold">Cetak Stiker Massal</p>
                      <p className="text-[11px] text-slate-400">Format A4 & Thermal roll</p>
                    </div>
                  </button>

                  {canMutateAssets && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          onOpenBatchImportModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer text-left"
                      >
                        <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold">Import Data CSV</p>
                          <p className="text-[11px] text-slate-400">Impor massal inventaris</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          onOpenTransactionModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer text-left"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="font-semibold">Catat Mutasi / Pinjam</p>
                          <p className="text-[11px] text-slate-400">Peminjaman & mutasi PIC</p>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {canMutateAssets && (
              <button
                type="button"
                onClick={onOpenAddAssetModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aset Baru</span>
              </button>
            )}

            {hasToken ? (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                title="Sinkronkan dengan Google Sheets"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                title="Hubungkan Google Spreadsheet"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Hubungkan Google
              </button>
            )}

            {appUser ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentTab(canManageMaster ? 'settings' : 'workspace')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1 transition cursor-pointer whitespace-nowrap"
                  title={`${appUser.fullName} (${ROLE_SHORT[appUser.role]})`}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {appUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:flex flex-col items-start leading-none text-left">
                    <span className="text-[11px] font-semibold text-white max-w-[100px] truncate">
                      {appUser.fullName}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-medium">
                      {ROLE_SHORT[appUser.role]}
                    </span>
                  </div>
                </button>
                {onAppLogout && (
                  <button
                    type="button"
                    onClick={onAppLogout}
                    title="Keluar Akun Aplikasi"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : user && hasToken ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentTab('workspace')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 transition cursor-pointer whitespace-nowrap"
                  title="Google Workspace"
                >
                  <span className="text-xs font-medium text-slate-200 max-w-[90px] truncate">
                    {user.displayName || 'Akun'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Putus Sesi Google"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
