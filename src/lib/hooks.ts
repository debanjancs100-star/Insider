import { useCallback, useEffect, useRef, useState } from 'react';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | undefined; error: Error | null; loading: boolean }>({ data: undefined, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fnRef.current().then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error) => live && setState({ data: undefined, error, loading: false }),
    );
    return () => { live = false; };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);
  return { ...state, reload: run };
}

/** Short-lived S3 URL for a path under media/. External URLs are deliberately not supported. */
export function useMediaUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!path || !path.startsWith('media/')) { setUrl(null); return; }
    getUrl({ path, options: { expiresIn: 3600 } }).then(
      (r) => live && setUrl(r.url.toString()),
      () => live && setUrl(null),
    );
    return () => { live = false; };
  }, [path]);
  return url;
}

export async function uploadMedia(file: File, kind: string, onProgress?: (pct: number) => void) {
  const { identityId } = await fetchAuthSession();
  if (!identityId) throw new Error('You must be signed in to upload.');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `media/${identityId}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await uploadData({
    path, data: file, options: {
      contentType: file.type || undefined,
      onProgress: ({ transferredBytes, totalBytes }) => totalBytes && onProgress?.(Math.round((transferredBytes / totalBytes) * 100)),
    },
  }).result;
  return path;
}
