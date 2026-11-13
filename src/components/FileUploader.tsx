import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadMedia } from '../lib/hooks';

export function FileUploader({ kind, accept, maxSizeMB, currentPath, onUploaded, label, description }: {
  kind: string; accept: string; maxSizeMB: number; currentPath: string | null;
  onUploaded: (path: string) => void; label: string; description?: string;
}) {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) return toast.error(`File exceeds ${maxSizeMB}MB limit`);
    setProgress(0);
    try { onUploaded(await uploadMedia(file, kind, setProgress)); }
    catch (e: any) { toast.error(e?.message ?? 'Upload failed'); }
    finally { setProgress(null); }
  };

  return (
    <div>
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        onClick={() => input.current?.click()}
        className={`border border-dashed p-6 text-center cursor-pointer transition-colors ${drag ? 'border-brand bg-brand/5' : 'border-border hover:border-muted-foreground'}`}
      >
        <input ref={input} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
        {progress !== null ? (
          <div>
            <div className="text-xs uppercase tracking-widest mb-3">Uploading… {progress}%</div>
            <div className="w-full h-1 bg-border overflow-hidden"><div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        ) : currentPath ? (
          <div className="text-xs">
            <div className="text-white font-medium mb-1 truncate">{currentPath.split('/').pop()}</div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-widest">Click or drop to replace</div>
          </div>
        ) : (
          <div>
            <div className="text-xs uppercase tracking-widest text-white font-medium mb-1">Drop or click to upload</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{description || `Max ${maxSizeMB}MB`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
