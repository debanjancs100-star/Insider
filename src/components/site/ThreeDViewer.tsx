import { useEffect, useRef, useState } from "react";

// TypeScript stub for the model-viewer custom element.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        exposure?: string;
        ar?: boolean;
        style?: React.CSSProperties;
      };
    }
  }
}

export function ThreeDViewer({
  modelUrl,
  walkthroughUrl,
  title,
}: {
  modelUrl: string | null;
  walkthroughUrl: string | null;
  title: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    // ensure custom element is registered on client
  }, []);

  const requestFullscreen = () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={wrapRef} className="w-full aspect-video bg-card border border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Interactive 3D Preview
          </span>
          <button
            onClick={requestFullscreen}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
          >
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
        <div className="flex-1 relative overflow-hidden bg-surface">
          {modelUrl ? (
            /* @ts-expect-error - custom element */
            <model-viewer
              src={modelUrl}
              alt={`3D model of ${title}`}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              exposure="0.9"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Awaiting 3D model
              </span>
            </div>
          )}
        </div>
      </div>
      {walkthroughUrl && (
        <a
          href={walkthroughUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block w-full text-center py-4 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all"
        >
          Launch Unreal Engine Walkthrough
        </a>
      )}
    </div>
  );
}
