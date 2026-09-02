import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { getProfile, saveProfile } from "@/lib/profile";

/**
 * Profile photo.
 *
 * Stored as a downscaled data URL in the same local profile as the rest of the
 * identity fields — it never leaves the device. That is the right default here:
 * a photo is the most identifying thing a person can hand a privacy app, and
 * nothing in the product needs it on a server.
 *
 * 256px at 0.75 quality keeps a portrait around 20-40KB, which localStorage
 * holds comfortably; the original file is never kept.
 */
const MAX = 256;

export function readAvatar(): string {
  try {
    return getProfile().avatar || "";
  } catch {
    return "";
  }
}

/** Initials from a name, used whenever there is no photo. */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = MAX;
  canvas.height = MAX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  // Centre-crop to a square so the circular frame never distorts a face.
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    MAX,
    MAX,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.75);
}

export function AvatarPicker({
  name,
  size = 64,
  onChange,
}: {
  name: string;
  size?: number;
  onChange?: (dataUrl: string) => void;
}) {
  const [avatar, setAvatar] = useState<string>(() => readAvatar());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await downscale(file);
      saveProfile({ avatar: url });
      setAvatar(url);
      onChange?.(url);
    } catch {
      /* unreadable image — the previous photo (or the initials) stays */
    }
    setBusy(false);
  };

  const remove = () => {
    saveProfile({ avatar: "" });
    setAvatar("");
    onChange?.("");
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        className="relative shrink-0 rounded-full"
        aria-label={avatar ? "Trocar foto" : "Adicionar foto"}
        style={{ width: size, height: size }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-full w-full rounded-full object-cover"
            style={{ boxShadow: "0 0 0 3px rgba(79,70,229,0.14)" }}
          />
        ) : (
          <span
            className="grid h-full w-full place-items-center rounded-full font-bold"
            style={{
              backgroundColor: "rgba(79,70,229,0.10)",
              color: "#4F46E5",
              boxShadow: "0 0 0 3px rgba(79,70,229,0.14)",
              fontSize: size * 0.32,
            }}
          >
            {initialsOf(name)}
          </span>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-card"
          style={{ backgroundColor: "#4F46E5" }}
        >
          <Camera className="h-3 w-3 text-white" />
        </span>
      </button>

      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">
          {avatar ? "Sua foto" : "Adicionar foto"}
        </p>
        <p className="text-[11.5px] leading-tight text-muted-foreground">
          {busy ? "Processando..." : "Fica só neste aparelho, no seu Priva ID"}
        </p>
        {avatar && (
          <button
            onClick={remove}
            className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--color-danger)]"
          >
            <Trash2 className="h-3 w-3" /> Remover
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
}
