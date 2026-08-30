import { useEffect, useRef, useState } from "react";
import { X, CameraOff } from "lucide-react";
import { decodeFromSource } from "@/lib/security/qr";

/**
 * Full-screen camera QR reader.
 *
 * Opens the rear camera, samples frames on requestAnimationFrame and returns
 * the first payload it decodes. Everything stays on the device — no frame is
 * uploaded anywhere, which is the whole point for a privacy product.
 */
export function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (value: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let done = false;

    const tick = async () => {
      const video = videoRef.current;
      if (!done && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const value = await decodeFromSource(video, video.videoWidth, video.videoHeight);
        if (value && !done) {
          done = true;
          onResult(value);
          return;
        }
      }
      if (!done) raf = requestAnimationFrame(() => void tick());
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (done) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        // iOS only plays inline when both attributes are set before play().
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();
        void tick();
      } catch {
        setError(
          "Não conseguimos acessar a câmera. Autorize o acesso ou envie uma foto do QR code.",
        );
      }
    })();

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-black">
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-[15px] font-bold text-white">Aponte para o QR code</p>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        {/* Framing guide */}
        {!error && (
          <span
            className="pointer-events-none absolute h-56 w-56 rounded-3xl"
            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)", border: "2px solid #6366F1" }}
          />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <CameraOff className="h-10 w-10 text-white/60" />
            <p className="text-[14px] leading-relaxed text-white/80">{error}</p>
          </div>
        )}
      </div>

      <p className="px-8 pb-8 pt-4 text-center text-[12px] leading-relaxed text-white/50">
        A leitura acontece no seu aparelho. Nenhuma imagem é enviada para a Priva.
      </p>
    </div>
  );
}
