import React, { useState } from 'react';
import { X, ShieldAlert, Copy, Check, ExternalLink, Globe, KeyRound } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthDomainHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode: string;
  errorMessage: string;
  onRetrySignIn: () => void;
}

export const AuthDomainHelpModal: React.FC<AuthDomainHelpModalProps> = ({
  isOpen,
  onClose,
  errorCode,
  errorMessage,
  onRetrySignIn,
}) => {
  const [copiedField, setCopiedField] = useState<'host' | 'origin' | null>(null);

  if (!isOpen) return null;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'USERNAME.github.io';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://USERNAME.github.io';
  const isGitHubPages = hostname.endsWith('github.io');

  const copyValue = async (val: string, field: 'host' | 'origin') => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">
                Solusi Login Admin / Google di GitHub Pages
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Kode Error: <span className="font-mono text-amber-300">{errorCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
            {errorMessage}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Domain Aktif Saat Ini {isGitHubPages ? '(GitHub Pages Terdeteksi)' : ''}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Authorized Domain (Firebase Console)
                  </span>
                  <code className="font-mono font-bold text-slate-900 break-all">{hostname}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(hostname, 'host')}
                  className="shrink-0 min-h-[34px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'host' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    JavaScript Origin (Google Cloud OAuth)
                  </span>
                  <code className="font-mono font-bold text-slate-900 break-all">{origin}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(origin, 'origin')}
                  className="shrink-0 min-h-[34px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'origin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'origin' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3 Langkah Wajib Agar Login Berhasil di GitHub Pages:
            </h4>

            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <p className="font-bold text-slate-900">1. Daftarkan Domain di Firebase Authentication</p>
              <p className="text-slate-600 leading-relaxed">
                Buka Firebase Console project <code className="font-mono bg-slate-100 px-1 rounded">{firebaseConfig.projectId}</code> &rarr;{' '}
                <strong>Authentication</strong> &rarr; tab <strong>Settings</strong> &rarr; <strong>Authorized domains</strong> &rarr;{' '}
                <strong>Add domain</strong> &rarr; masukkan <code className="font-mono font-bold text-blue-700">{hostname}</code>.
              </p>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline pt-0.5"
              >
                <span>Buka Firebase Authorized Domains</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <p className="font-bold text-slate-900">2. Daftarkan Origin di Google Cloud OAuth Client</p>
              <p className="text-slate-600 leading-relaxed">
                Buka Google Cloud Console &rarr; <strong>APIs &amp; Services</strong> &rarr; <strong>Credentials</strong> &rarr; pilih OAuth 2.0 Client ID{' '}
                <code className="font-mono bg-slate-100 px-1 rounded break-all">{firebaseConfig.oAuthClientId}</code> &rarr; tambahkan{' '}
                <code className="font-mono font-bold text-blue-700">{origin}</code> di <strong>Authorized JavaScript origins</strong>.
              </p>
              <a
                href={`https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline pt-0.5"
              >
                <span>Buka Google Cloud Credentials</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
              <p className="font-bold text-slate-900">3. Cek Status OAuth Consent Screen &amp; Popup Browser</p>
              <p className="text-slate-600 leading-relaxed">
                Jika login dipakai akun Google lain, pastikan OAuth Consent Screen sudah <strong>Published</strong> atau email akun tersebut ditambahkan di{' '}
                <strong>Test users</strong>. Di HP, pastikan popup browser tidak diblokir.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
            <strong>Catatan:</strong> Tanpa login Google, seluruh fitur inventaris, cetak stiker QR, scan QR, stock opname, pemeliharaan, dan backup JSON/CSV tetap berjalan penuh secara lokal di perangkat Anda. Login Google hanya diperlukan untuk sinkronisasi cloud Google Sheets, Drive, dan Gmail.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRetrySignIn();
            }}
            className="min-h-[40px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Coba Login Lagi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
