import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Scan,
  Search,
  ArrowRightLeft,
  QrCode,
  AlertTriangle,
  MapPin,
  Camera,
  CameraOff,
  SwitchCamera,
  ImagePlus,
  Flashlight
} from 'lucide-react';
import jsQR from 'jsqr';
import { OfficeAsset } from '../types';
import { parseAssetCode } from '../data/assetCodeGenerator';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAssets: OfficeAsset[];
  onSelectAssetForTransaction: (asset: OfficeAsset) => void;
  onSelectAssetForLabel: (asset: OfficeAsset) => void;
  initialQuery?: string | null;
}

/**
 * Extract asset identifier from various QR payload formats:
 * 1. Direct URL containing ?asset=01.14.001.001.24
 * 2. JSON string containing { id: "01.14.001.001.24", sku: "..." }
 * 3. Plain asset ID or SKU text
 */
export function extractAssetLookupCode(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  // 1. Check URL ?asset= parameter
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?asset=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed.replace(/^\/+/, '')}`);
      const assetParam = url.searchParams.get('asset') || url.searchParams.get('id');
      if (assetParam) return assetParam.trim();
    } catch {
      const match = trimmed.match(/[?&](?:asset|id)=([^&#]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1]).trim();
    }
  }

  // 2. Check JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.sku) return String(parsed.sku).trim();
    } catch {
      // Fall through to plain text
    }
  }

  return trimmed;
}

async function decodeQrOrBarcodeFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<string | null> {
  // 1. Native hardware-accelerated BarcodeDetector (Android Chrome, Edge, Samsung Internet)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'],
      });
      const detected = await detector.detect(canvas);
      if (Array.isArray(detected) && detected.length > 0 && detected[0]?.rawValue) {
        return String(detected[0].rawValue);
      }
    } catch {
      // Fallback to jsQR
    }
  }

  // 2. Full-frame jsQR scan with attemptBoth inversion handling
  const width = canvas.width;
  const height = canvas.height;
  if (width > 0 && height > 0) {
    const fullImageData = ctx.getImageData(0, 0, width, height);
    const fullCode = jsQR(fullImageData.data, width, height, {
      inversionAttempts: 'attemptBoth',
    });
    if (fullCode?.data) {
      return fullCode.data;
    }

    // 3. Center ROI scan helps when QR sticker is small inside a wide mobile camera frame
    if (width >= 400 && height >= 400) {
      const roiSize = Math.floor(Math.min(width, height) * 0.65);
      const sx = Math.floor((width - roiSize) / 2);
      const sy = Math.floor((height - roiSize) / 2);
      const roiData = ctx.getImageData(sx, sy, roiSize, roiSize);
      const roiCode = jsQR(roiData.data, roiSize, roiSize, {
        inversionAttempts: 'attemptBoth',
      });
      if (roiCode?.data) {
        return roiCode.data;
      }
    }
  }

  return null;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  allAssets,
  onSelectAssetForTransaction,
  onSelectAssetForLabel,
  initialQuery = null,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [matchedAsset, setMatchedAsset] = useState<OfficeAsset | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isDecodingRef = useRef<boolean>(false);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isDecodingRef.current = false;
    setIsTorchOn(false);
    setHasTorch(false);
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  const handleSearch = useCallback(
    (rawInput: string) => {
      const extracted = extractAssetLookupCode(rawInput);
      const targetCode = extracted.toLowerCase();
      if (!targetCode) {
        setMatchedAsset(null);
        setHasSearched(false);
        return;
      }

      setHasSearched(true);
      const found =
        allAssets.find((a) => a.id.toLowerCase() === targetCode || a.sku.toLowerCase() === targetCode) ||
        allAssets.find(
          (a) =>
            a.id.toLowerCase().includes(targetCode) ||
            a.sku.toLowerCase().includes(targetCode) ||
            a.name.toLowerCase().includes(targetCode)
        );

      setMatchedAsset(found || null);
    },
    [allAssets]
  );

  // Pre-fill when opened from URL deep-link (?asset=...)
  useEffect(() => {
    if (isOpen && initialQuery) {
      setInputCode(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery, handleSearch]);

  // Stop camera cleanly whenever modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Attach MediaStream to <video> and run scanning loop ONLY after camera becomes active
  useEffect(() => {
    if (!isOpen || !isCameraActive) return;

    let cancelled = false;
    const video = videoRef.current;
    const stream = mediaStreamRef.current;

    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.playsInline = true;
      video.play().catch((err) => {
        console.warn('Video play warning:', err);
      });
    }

    const tick = async (timestamp: number) => {
      if (cancelled) return;

      const currentVideo = videoRef.current;
      const canvas = canvasRef.current;

      // Scan every ~120ms so mobile CPU stays responsive and autofocus works smoothly
      if (
        currentVideo &&
        canvas &&
        currentVideo.readyState >= currentVideo.HAVE_CURRENT_DATA &&
        currentVideo.videoWidth > 0 &&
        currentVideo.videoHeight > 0 &&
        !isDecodingRef.current &&
        timestamp - lastScanTimeRef.current >= 120
      ) {
        lastScanTimeRef.current = timestamp;
        isDecodingRef.current = true;

        try {
          const maxDim = 960;
          const scale = Math.min(1, maxDim / Math.max(currentVideo.videoWidth, currentVideo.videoHeight));
          const targetW = Math.max(1, Math.round(currentVideo.videoWidth * scale));
          const targetH = Math.max(1, Math.round(currentVideo.videoHeight * scale));

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(currentVideo, 0, 0, targetW, targetH);
            const decoded = await decodeQrOrBarcodeFromCanvas(canvas, ctx);
            if (decoded && !cancelled) {
              const lookupCode = extractAssetLookupCode(decoded);
              setInputCode(lookupCode || decoded);
              handleSearch(decoded);
              setScanNotice('QR Code berhasil dipindai!');
              stopCamera();
              return;
            }
          }
        } finally {
          isDecodingRef.current = false;
        }
      }

      if (!cancelled) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isOpen, isCameraActive, handleSearch, stopCamera]);

  const startCamera = useCallback(
    async (overrideFacing?: 'environment' | 'user') => {
      const targetFacing = overrideFacing ?? facingMode;
      setCameraError(null);
      setScanNotice(null);
      stopCamera();
      setIsStartingCamera(true);

      try {
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          throw new Error(
            'Kamera live membutuhkan koneksi HTTPS yang aman. Gunakan tombol "Foto / Upload QR" di bawah untuk scan langsung dari kamera HP.'
          );
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Browser ini tidak mendukung live kamera. Gunakan tombol "Foto / Upload QR" di bawah untuk memindai.'
          );
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          // Fallback for mobile devices or webviews with strict constraint checks
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: targetFacing === 'environment' ? { facingMode: 'environment' } : true,
          });
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
            if (
              Array.isArray(capabilities?.focusMode) &&
              capabilities.focusMode.includes('continuous')
            ) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' } as any],
              });
            }
            setHasTorch(Boolean(capabilities?.torch));
          } catch {
            // Optional mobile camera constraints not supported on all devices
          }
        }

        mediaStreamRef.current = stream;
        setIsStartingCamera(false);
        setIsCameraActive(true);
      } catch (err: any) {
        stopCamera();
        const errName = err?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraError(
            'Izin kamera ditolak atau diblokir oleh browser HP. Aktifkan izin Kamera di pengaturan situs browser, atau gunakan tombol "Foto / Upload QR".'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraError('Kamera tidak terdeteksi di perangkat ini. Gunakan tombol "Foto / Upload QR".');
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setCameraError('Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi.');
        } else {
          setCameraError(
            err?.message || 'Tidak dapat mengakses kamera live. Gunakan tombol "Foto / Upload QR".'
          );
        }
      }
    },
    [facingMode, stopCamera]
  );

  const handleToggleTorch = async () => {
    const track = mediaStreamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    const nextState = !isTorchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch {
      setCameraError('Lampu flash tidak didukung pada kamera ini.');
    }
  };

  const handleSwitchCamera = () => {
    const nextFacing: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Native Phone Camera Photo / Gallery QR Fallback (works even in restricted iframes or HTTP)
  const handleImageFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraError(null);
    setScanNotice(null);

    try {
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        try {
          const maxDim = 1400;
          const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));

          const offscreen = document.createElement('canvas');
          offscreen.width = w;
          offscreen.height = h;
          const ctx = offscreen.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            setCameraError('Gagal memproses gambar QR.');
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const decoded = await decodeQrOrBarcodeFromCanvas(offscreen, ctx);

          if (decoded) {
            const lookupCode = extractAssetLookupCode(decoded);
            setInputCode(lookupCode || decoded);
            handleSearch(decoded);
            setScanNotice('QR Code dari foto berhasil terbaca!');
          } else {
            setCameraError(
              'QR Code tidak terdeteksi pada foto tersebut. Coba foto lebih dekat, tegak lurus, dan pastikan cahaya cukup.'
            );
          }
        } finally {
          URL.revokeObjectURL(imgUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(imgUrl);
        setCameraError('Gagal membaca file gambar.');
      };
      img.src = imgUrl;
    } catch {
      setCameraError('Gagal memproses foto QR.');
    }
  };

  if (!isOpen) return null;

  const parsed = matchedAsset ? parseAssetCode(matchedAsset.id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 shrink-0">
              <Scan className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">Pindai QR &amp; Barcode Aset</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Kamera live HP, foto stiker, atau ketik kode aset
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Tutup Pemindai"
            className="text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Hidden file input for native mobile camera fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileScan}
            className="hidden"
          />

          {/* Live Camera Scanner Box */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
            {/* Always-mounted video & canvas so ref is guaranteed ready */}
            <div
              className={
                isCameraActive
                  ? 'relative aspect-[4/3] sm:aspect-video flex items-center justify-center bg-black'
                  : 'hidden'
              }
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Target Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-400/70 rounded-2xl relative shadow-lg">
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></div>
                </div>
                <span className="mt-2 px-2.5 py-0.5 rounded-full bg-slate-900/75 text-[11px] text-emerald-300 font-medium">
                  Arahkan QR tepat di dalam kotak hijau
                </span>
              </div>

              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-3">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl backdrop-blur-xs border inline-flex items-center gap-1.5 cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{isTorchOn ? 'Flash On' : 'Flash'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="min-h-[40px] px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl backdrop-blur-xs border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <span>Ganti Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="min-h-[40px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {!isCameraActive && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white">Scan QR Code dari Kamera HP</h5>
                    <p className="text-[11px] text-slate-400">
                      Gunakan kamera langsung atau ambil foto stiker jika kamera live dibatasi browser.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    disabled={isStartingCamera}
                    className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isStartingCamera ? 'Menyiapkan Kamera...' : 'Nyalakan Kamera Live'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4 text-emerald-400" />
                    <span>Foto / Upload QR</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {scanNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
              {scanNotice}
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[40px] px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Buka Kamera Foto HP / Pilih Gambar QR</span>
              </button>
            </div>
          )}

          {/* Scanner Manual Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Atau Ketik Kode Barang / SKU
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Contoh: 01.14.001.001.24 atau SKU..."
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full min-h-[44px] pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Sample Kode Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allAssets.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setInputCode(a.id);
                    handleSearch(a.id);
                  }}
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  {a.id}
                </button>
              ))}
            </div>
          </div>

          {/* Matched Asset Result Card */}
          {matchedAsset ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-xs font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded border border-amber-300 tracking-wider inline-block">
                    {matchedAsset.id}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1.5">
                    {matchedAsset.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{matchedAsset.location}</span>
                    <span>· SKU: {matchedAsset.sku}</span>
                  </p>

                  {parsed && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-emerald-200/80 space-y-0.5">
                      <div>Bidang: <strong>{parsed.bidangName}</strong></div>
                      <div>Divisi: <strong>{parsed.divisiName}</strong> · Sub: <strong>{parsed.subKelompokName}</strong></div>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-800 block tabular-nums">
                    {matchedAsset.availableStock} {matchedAsset.unit} Tersedia
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    Total: {matchedAsset.totalStock} {matchedAsset.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onSelectAssetForLabel(matchedAsset);
                    onClose();
                  }}
                  className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak Stiker QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onSelectAssetForTransaction(matchedAsset);
                    onClose();
                  }}
                  className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Mutasi / Pinjam</span>
                </button>
              </div>
            </div>
          ) : hasSearched && inputCode.trim() ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-700 space-y-1">
              <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
              <p className="font-semibold">Kode barang "{inputCode}" tidak ditemukan di database</p>
              <p className="text-slate-500 text-[11px]">
                Pastikan format sesuai resep penomoran [XX].[XX].[XXX].[XXX].[XX] atau nomor barcode SKU.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
