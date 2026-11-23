import React from 'react';
import { FileSpreadsheet, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';

export type SpreadsheetConfirmAction =
  | 'create_db'
  | 'push_full_db'
  | 'pull_full_db'
  | 'enable_auto_sync';

interface SpreadsheetConfirmModalProps {
  isOpen: boolean;
  action: SpreadsheetConfirmAction | null;
  spreadsheetName: string;
  counts: {
    assets: number;
    transactions: number;
    maintenance: number;
    opname: number;
    disposal: number;
    locations: number;
    vendors: number;
    users?: number;
  };
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SpreadsheetConfirmModal: React.FC<SpreadsheetConfirmModalProps> = ({
  isOpen,
  action,
  spreadsheetName,
  counts,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !action) return null;

  const copy: Record<
    SpreadsheetConfirmAction,
    { title: string; desc: string; confirmLabel: string; warning?: string }
  > = {
    create_db: {
      title: 'Buat Database Google Spreadsheet Baru?',
      desc: `Aplikasi akan membuat file Google Spreadsheet baru bernama "${spreadsheetName}" dengan 11 tab database (Daftar Aset, Riwayat Mutasi, Servis, Stock Opname, BAPA, Master Lokasi, Vendor, Divisi, Sub Kelompok, Pengaturan, dan Akun Pengguna) lalu mengisinya dengan data saat ini.`,
      confirmLabel: 'Ya, Buat & Simpan Database',
    },
    push_full_db: {
      title: 'Simpan & Perbarui Seluruh Database di Spreadsheet?',
      desc: `Tindakan ini akan menulis ulang seluruh 11 tab di Google Spreadsheet "${spreadsheetName}" menggunakan data terbaru dari perangkat ini.`,
      warning: 'Baris data lama di dalam Google Spreadsheet tersebut akan diganti dengan data terbaru saat ini.',
      confirmLabel: 'Ya, Simpan ke Spreadsheet',
    },
    pull_full_db: {
      title: 'Muat Database dari Google Spreadsheet?',
      desc: `Data di perangkat ini akan digantikan oleh seluruh data terbaru yang tersimpan di Google Spreadsheet "${spreadsheetName}".`,
      warning: 'Perubahan lokal yang belum dikirim ke Spreadsheet akan ditimpa oleh isi Spreadsheet.',
      confirmLabel: 'Ya, Muat Data Spreadsheet',
    },
    enable_auto_sync: {
      title: 'Aktifkan Sinkronisasi Otomatis ke Spreadsheet?',
      desc: `Saat aktif, setiap kali Anda menambah, mengubah, meminjam, mengembalikan, atau menghapus aset, akun pengguna, dan master data, aplikasi akan otomatis memperbarui Google Spreadsheet "${spreadsheetName}".`,
      confirmLabel: 'Ya, Jadikan Spreadsheet Database Utama',
    },
  };

  const info = copy[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">{info.title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          <p className="leading-relaxed">{info.desc}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-1.5 text-[11px]">
            <div>Daftar Aset: <strong>{counts.assets}</strong></div>
            <div>Riwayat Mutasi: <strong>{counts.transactions}</strong></div>
            <div>Servis / Pemeliharaan: <strong>{counts.maintenance}</strong></div>
            <div>Sesi Stock Opname: <strong>{counts.opname}</strong></div>
            <div>Penghapusan BAPA: <strong>{counts.disposal}</strong></div>
            <div>Lokasi &amp; Vendor: <strong>{counts.locations + counts.vendors}</strong></div>
            {typeof counts.users === 'number' && (
              <div className="col-span-2">Akun Pengguna (Master_Pengguna): <strong>{counts.users}</strong></div>
            )}
          </div>

          {info.warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{info.warning}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="min-h-[40px] px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{info.confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
