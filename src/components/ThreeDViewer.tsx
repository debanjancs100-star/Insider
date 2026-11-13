import { createElement, useEffect, useRef, useState } from 'react';
import { useMediaUrl } from '../lib/hooks';

export function ThreeDViewer({ modelPath, walkthroughUrl, title }: { modelPath: string | null; walkthroughUrl: string | null; title: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);
  const src = useMediaUrl(modelPath);

  useEffect(() => { if (modelPath) import('@google/model-viewer'); }, [modelPath]);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.());

  return (
    <div className="space-y-4">
      <div ref={wrap} className="w-full aspect-video bg-card border border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Interactive 3D Preview</span>
          <button onClick={toggle} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
            {fs ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        </div>
        <div className="flex-1 relative overflow-hidden bg-surface">
          {src ? (
            createElement('model-viewer', {
              src, alt: `3D model of ${title}`, 'camera-controls': true, 'auto-rotate': true,
              'shadow-intensity': '1', exposure: '0.9', style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
            })
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Awaiting 3D model</span>
            </div>
          )}
        </div>
      </div>
      {walkthroughUrl && (
        <a href={walkthroughUrl} target="_blank" rel="noopener noreferrer nofollow"
          className="block w-full text-center py-4 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">
          Launch Unreal Engine Walkthrough
        </a>
      )}
    </div>
  );
}
