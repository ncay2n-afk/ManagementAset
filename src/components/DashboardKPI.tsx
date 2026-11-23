import React from 'react';
import {
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  Wrench,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Link2
} from 'lucide-react';
import { OfficeAsset, AssetTransaction } from '../types';

interface DashboardKPIProps {
  assets: OfficeAsset[];
  transactions: AssetTransaction[];
  hasToken: boolean;
  spreadsheetUrl: string | null;
  isSpreadsheetDbActive?: boolean;
  onOpenWorkspace: () => void;
  onFilterStatus?: (status: string | null) => void;
  selectedStatusFilter: string | null;
  isMobileLayout?: boolean;
}

export const DashboardKPI: React.FC<DashboardKPIProps> = ({
  assets,
  transactions: _transactions,
  hasToken,
  spreadsheetUrl,
  isSpreadsheetDbActive = false,
  onOpenWorkspace,
  onFilterStatus,
  selectedStatusFilter,
  isMobileLayout = false,
}) => {
  const totalAssetsCount = assets.length;
  const totalUnits = assets.reduce((acc, curr) => acc + (curr.totalStock || 0), 0);
  const totalAvailable = assets.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
  const totalBorrowed = assets.reduce((acc, curr) => acc + (curr.borrowedStock || 0), 0);
  const totalDamaged = assets.reduce(
    (acc, curr) =>
      acc +
      (curr.damagedStock || 0) +
      (curr.condition === 'Perlu Perbaikan' || curr.condition === 'Rusak Berat' ? 1 : 0),
    0
  );

  const totalValuation = assets.reduce(
    (acc, curr) => acc + (curr.purchasePrice || 0) * (curr.totalStock || 1),
    0
  );

  const criticalStockItems = assets.filter(
    (a) => a.availableStock <= 1 && a.totalStock > 0
  );

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={isMobileLayout ? 'space-y-3' : 'space-y-4'}>
      {/* Workspace & Spreadsheet Database Banner */}
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl text-white ${
          isMobileLayout ? 'p-3.5' : 'p-4'
        }`}
      >
        <div
          className={`flex justify-between gap-3 ${
            isMobileLayout ? 'flex-col' : 'flex-col sm:flex-row sm:items-center'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Database Google Spreadsheet</h2>
                <span aria-hidden="true" className="text-slate-600 text-xs">·</span>
                {hasToken && isSpreadsheetDbActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif (10 Tab Tersinkron)</span>
                  </span>
                ) : hasToken ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-300">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Akun Terhubung — Siap Hubungkan Sheet</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Cache Lokal (Login untuk DB Spreadsheet)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {isMobileLayout
                  ? 'Database 10 tab di Google Sheets, foto Drive, & email Gmail.'
                  : 'Seluruh data inventaris, mutasi, servis, stock opname, BAPA, dan master data tersimpan di Google Spreadsheet.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl transition whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka Sheet</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] flex-1 sm:flex-initial"
            >
              <span>{hasToken ? 'Kelola Database Sheet' : 'Hubungkan Spreadsheet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        className={
          isMobileLayout
            ? 'grid grid-cols-2 gap-2.5'
            : 'grid grid-cols-2 lg:grid-cols-5 gap-3.5'
        }
      >
        {/* Total Nilai Aset */}
        <div
          className={`${
            isMobileLayout ? 'col-span-2 p-3.5' : 'col-span-2 lg:col-span-1 p-4'
          } bg-white rounded-2xl border border-slate-200 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Nilai Aset</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums">
              {formatIDR(totalValuation)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600 inline shrink-0" />
              <span>Kapitalisasi inventaris aktif</span>
            </p>
          </div>
        </div>

        {/* Total Unit & Item */}
        <button
          type="button"
          onClick={() => onFilterStatus && onFilterStatus(null)}
          className={`text-left bg-white ${
            isMobileLayout ? 'p-3.5' : 'p-4'
          } rounded-2xl border flex flex-col justify-between transition cursor-pointer min-h-[88px] ${
            selectedStatusFilter === null
              ? 'border-blue-600 ring-2 ring-blue-600/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-xs font-semibold">Total Barang</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {totalUnits}{' '}
              <span className="text-xs font-normal text-slate-500">
                unit · {totalAssetsCount} item
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              Tersedia: <span className="font-semibold text-emerald-700">{totalAvailable} unit</span>
            </p>
          </div>
        </button>

        {/* Sedang Dipinjam */}
        <button
          type="button"
          onClick={() => onFilterStatus && onFilterStatus('Sedang Dipinjam')}
          className={`text-left bg-white ${
            isMobileLayout ? 'p-3.5' : 'p-4'
          } rounded-2xl border flex flex-col justify-between transition cursor-pointer min-h-[88px] ${
            selectedStatusFilter === 'Sedang Dipinjam'
              ? 'border-indigo-600 ring-2 ring-indigo-600/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-xs font-semibold">Dipinjam</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-indigo-700 tabular-nums">
              {totalBorrowed}{' '}
              <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Dipakai staf kantor</p>
          </div>
        </button>

        {/* Butuh Perbaikan / Rusak */}
        <button
          type="button"
          onClick={() => onFilterStatus && onFilterStatus('Dalam Perbaikan')}
          className={`text-left bg-white ${
            isMobileLayout ? 'p-3.5' : 'p-4'
          } rounded-2xl border flex flex-col justify-between transition cursor-pointer min-h-[88px] ${
            selectedStatusFilter === 'Dalam Perbaikan'
              ? 'border-amber-600 ring-2 ring-amber-600/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-xs font-semibold">Butuh Servis</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-amber-700 tabular-nums">
              {totalDamaged}{' '}
              <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Perlu perawatan</p>
          </div>
        </button>

        {/* Stok Kritis */}
        <button
          type="button"
          onClick={() => onFilterStatus && onFilterStatus('Stok Kritis')}
          className={`text-left bg-white ${
            isMobileLayout ? 'p-3.5' : 'p-4'
          } rounded-2xl border flex flex-col justify-between transition cursor-pointer min-h-[88px] ${
            selectedStatusFilter === 'Stok Kritis'
              ? 'border-rose-600 ring-2 ring-rose-600/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 w-full">
            <span className="text-xs font-semibold">Stok Kritis</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-rose-700 tabular-nums">
              {criticalStockItems.length}{' '}
              <span className="text-xs font-normal text-slate-500">item</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sisa &le; 1 unit</p>
          </div>
        </button>
      </div>
    </div>
  );
};
