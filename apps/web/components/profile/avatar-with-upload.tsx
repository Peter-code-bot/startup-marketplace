"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarWithUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string;
  isOwnProfile: boolean;
}

export function AvatarWithUpload({
  userId,
  currentAvatarUrl,
  displayName,
  isOwnProfile,
}: AvatarWithUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({ foto: data.publicUrl })
        .eq("id", userId);

      setPreview(data.publicUrl);
      router.refresh();
    } catch {
      setPreview(currentAvatarUrl);
    }
    setUploading(false);
  }

  const initial = displayName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="relative group shrink-0">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border/40 bg-muted">
        {preview ? (
          <Image
            src={preview}
            alt={displayName}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
            {initial}
          </div>
        )}

        {/* Desktop hover overlay */}
        {isOwnProfile && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Mobile always-visible button */}
      {isOwnProfile && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="md:hidden absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-bone text-bone-contrast flex items-center justify-center border-2 border-background shadow-md"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {isOwnProfile && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      )}
    </div>
  );
}
