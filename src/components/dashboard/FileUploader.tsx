import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function FileUploader({
  bucket,
  accept,
  maxSizeMB,
  currentPath,
  onUploaded,
  label,
  description,
}: {
  bucket: string;
  accept: string;
  maxSizeMB: number;
  currentPath: string | null;
  onUploaded: (path: string) => void;
  label: string;
  description?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File exceeds ${maxSizeMB}MB limit`);
        return;
      }
      setUploading(true);
      setProgress(20);

      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (!userId) {
        toast.error("You must be signed in to upload");
        setUploading(false);
        return;
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      setProgress(50);
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      setProgress(90);
      if (error) {
        toast.error(error.message);
        setUploading(false);
        return;
      }
      setProgress(100);
      onUploaded(path);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 400);
    },
    [bucket, maxSizeMB, onUploaded],
  );

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-brand bg-brand/5" : "border-border hover:border-muted-foreground"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <div>
            <div className="text-xs uppercase tracking-widest mb-3">Uploading… {progress}%</div>
            <div className="w-full h-1 bg-border overflow-hidden">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : currentPath ? (
          <div className="text-xs">
            <div className="text-white font-medium mb-1 truncate">{currentPath.split("/").pop()}</div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-widest">
              Click or drop to replace
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs uppercase tracking-widest text-white font-medium mb-1">
              Drop or click to upload
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {description || `Max ${maxSizeMB}MB`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
