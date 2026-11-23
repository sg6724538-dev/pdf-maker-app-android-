import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  Zap,
  ZapOff,
} from 'lucide-react';
import { loadImageElement } from '../filters/imageEngine';
import {
  captureCameraPhotoNative,
  isNativeAndroid,
} from '../platform/capacitorBridge';
import { DEFAULT_EDIT_STATE, type SelectedImage } from '../types/pdf';
import { generateId } from '../utils/format';

interface CameraViewProps {
  onCompleteCapture: (captured: SelectedImage[]) => void;
  onCancel: () => void;
}

export function CameraView({ onCompleteCapture, onCancel }: CameraViewProps) {
  const nativeAndroid = isNativeAndroid();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturingNative, setCapturingNative] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [captured, setCaptured] = useState<SelectedImage[]>([]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleNativeCapture = useCallback(async () => {
    setCameraError(null);
    setCapturingNative(true);
    try {
      const nextNum = captured.length + 1;
      const photo = await captureCameraPhotoNative(nextNum);
      if (photo) {
        setCaptured((prev) => [...prev, photo]);
      }
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Unable to open Android camera. Check camera permissions in Settings.'
      );
    } finally {
      setCapturingNative(false);
    }
  }, [captured.length]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setCameraReady(false);
      setCameraError(null);

      // On native Android, Capacitor Camera plugin handles hardware camera, flash & permissions reliably
      if (nativeAndroid) {
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Live camera preview is unavailable in this browser context. You can still capture photos using your device camera button below.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser settings or use the native photo capture option below.'
            : 'No live camera detected on this device. Use the native capture or photo upload option below to add document pages.';
        setCameraError(msg);
      }
    },
    [nativeAndroid, stopStream]
  );

  useEffect(() => {
    void startCamera(facingMode);
    return () => stopStream();
  }, [facingMode, startCamera, stopStream]);

  const toggleFlash = async () => {
    const next = !flashOn;
    setFlashOn(next);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        await track.applyConstraints({
          advanced: [{ torch: next } as MediaTrackConstraintSet],
        });
      } catch {
        // Torch hardware not available; screen flash fallback still works on capture
      }
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraReady || video.videoWidth === 0) return;

    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 180);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const pageNum = captured.length + 1;

    setCaptured((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Camera_Scan_${pageNum}.jpg`,
        originalUrl: dataUrl,
        mimeType: 'image/jpeg',
        naturalWidth: canvas.width,
        naturalHeight: canvas.height,
        source: 'camera',
        edit: {
          ...DEFAULT_EDIT_STATE,
          crop: { ...DEFAULT_EDIT_STATE.crop },
        },
      },
    ]);
  };

  const handleRetakeLast = () => {
    setCaptured((prev) => prev.slice(0, -1));
  };

  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: SelectedImage[] = [];

    for (const file of Array.from(files)) {
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImageElement(url);
        newItems.push({
          id: generateId(),
          name: file.name || `Camera_Scan_${captured.length + newItems.length + 1}.jpg`,
          originalUrl: url,
          mimeType: file.type || 'image/jpeg',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          source: 'camera',
          edit: {
            ...DEFAULT_EDIT_STATE,
            crop: { ...DEFAULT_EDIT_STATE.crop },
          },
        });
      } catch {
        // Ignore unreadable photo
      }
    }

    if (newItems.length > 0) {
      setCaptured((prev) => [...prev, ...newItems]);
    }
    e.target.value = '';
  };

  const handleDone = () => {
    stopStream();
    onCompleteCapture(captured);
  };

  return (
    <div className="space-y-5">
      {/* Top Camera Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopStream();
              onCancel();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-[#141C2E] dark:text-slate-200"
            aria-label="Close camera"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Camera to PDF
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Capture one or multiple document pages, then enhance in the editor.
            </p>
          </div>
        </div>

        {captured.length > 0 && (
          <button
            type="button"
            onClick={handleDone}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
          >
            <Check className="h-4 w-4" />
            <span>Edit {captured.length} {captured.length === 1 ? 'Page' : 'Pages'}</span>
          </button>
        )}
      </div>

      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFallbackFile}
        className="hidden"
      />

      {/* Camera Viewfinder Frame */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 dark:border-slate-800">
        <div className="relative aspect-[4/3] w-full max-h-[540px] bg-slate-950 sm:aspect-[16/10]">
          {nativeAndroid ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52535] text-white shadow-lg shadow-[#E52535]/30">
                <Camera className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">
                {captured.length === 0
                  ? 'Android Document Camera Ready'
                  : `${captured.length} ${captured.length === 1 ? 'Page' : 'Pages'} Captured`}
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-300">
                Tap Capture Photo to open your Android camera with hardware autofocus and flash, then add as many document pages as needed.
              </p>
              {cameraError && (
                <p className="mt-3 max-w-md rounded-xl bg-red-950/70 px-3.5 py-2 text-xs text-red-200">
                  {cameraError}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={capturingNative}
                  onClick={() => void handleNativeCapture()}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#536DFE] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE] disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  <span>
                    {capturingNative
                      ? 'Opening Camera...'
                      : captured.length === 0
                        ? 'Capture First Page'
                        : 'Capture Next Page'}
                  </span>
                </button>
              </div>
            </div>
          ) : !cameraError ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`h-full w-full object-cover ${
                  facingMode === 'user' ? '-scale-x-100' : ''
                }`}
              />

              {/* Subtle document framing guide */}
              <div className="pointer-events-none absolute inset-6 sm:inset-10">
                <div className="h-full w-full rounded-xl border border-white/30">
                  <div className="absolute top-0 left-0 h-6 w-6 rounded-tl-xl border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 h-6 w-6 rounded-tr-xl border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-white" />
                  <div className="absolute right-0 bottom-0 h-6 w-6 rounded-br-xl border-r-2 border-b-2 border-white" />
                </div>
              </div>

              {shutterFlash && (
                <div className="pointer-events-none absolute inset-0 bg-white/80 transition-opacity" />
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-red-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">
                Live camera unavailable
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-300">
                {cameraError}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#536DFE] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D5AFE]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Capture / Select Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => void startCamera(facingMode)}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            {!nativeAndroid && (
              <>
                <button
                  type="button"
                  onClick={() => void toggleFlash()}
                  className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    flashOn
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {flashOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                  <span>{flashOn ? 'Flash ON' : 'Flash OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
                  }
                  className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>
              </>
            )}
          </div>

          {/* Shutter button */}
          <button
            type="button"
            disabled={capturingNative}
            onClick={
              nativeAndroid
                ? () => void handleNativeCapture()
                : cameraReady
                  ? handleCapturePhoto
                  : () => fallbackInputRef.current?.click()
            }
            aria-label="Capture document photo"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#E52535] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            <Camera className="h-7 w-7" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={captured.length === 0}
              onClick={handleRetakeLast}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Captured Pages Filmstrip */}
      {captured.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#141C2E]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Captured Pages ({captured.length})
            </h2>
            <button
              type="button"
              onClick={handleDone}
              className="text-xs font-semibold text-[#536DFE] hover:text-[#3D5AFE]"
            >
              Continue to Editor →
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {captured.map((img, idx) => (
              <div
                key={img.id}
                className="relative h-28 w-22 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
              >
                <img
                  src={img.originalUrl}
                  alt={`Captured page ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 left-1 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCaptured((prev) => prev.filter((item) => item.id !== img.id))
                  }
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/75 text-white hover:bg-[#E52535]"
                  aria-label={`Delete captured page ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
