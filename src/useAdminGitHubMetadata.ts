import { useCallback, useEffect, useRef, useState } from "react";
import { loadGitHubToolMetadata } from "./admin-api";
import type { AppliedGitHubMetadata } from "./admin-helpers";
import type { GitHubToolMetadata } from "./types";
import type { GitHubMetadataEditableFields } from "./admin-display";
import { getGitHubRepoPath, isGitHubRepoUrl, normalizeHttpUrlInput } from "./tool-helpers";

export function useAdminGitHubMetadata({
  active,
  autoApply,
  autoLoad,
  onError,
  onMetadata,
  onSuccess,
  getSnapshot,
  sourceUrl,
  token
}: {
  active: boolean;
  autoApply: boolean;
  autoLoad: boolean;
  onError: (error: unknown) => void;
  onMetadata: (
    metadata: GitHubToolMetadata,
    normalizedUrl: string,
    previousMetadata: GitHubToolMetadata | null,
    overwrite: boolean,
    requestSnapshot: GitHubMetadataEditableFields
  ) => void;
  onSuccess: () => void;
  sourceUrl: string;
  token: string;
  getSnapshot: () => GitHubMetadataEditableFields;
}) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [metadata, setMetadata] = useState<GitHubToolMetadata | null>(null);
  const lastUrlRef = useRef("");
  const lastAppliedRef = useRef<AppliedGitHubMetadata | null>(null);
  const requestIdRef = useRef(0);
  const onErrorRef = useRef(onError);
  const onMetadataRef = useRef(onMetadata);
  const onSuccessRef = useRef(onSuccess);
  const getSnapshotRef = useRef(getSnapshot);
  onErrorRef.current = onError;
  onMetadataRef.current = onMetadata;
  onSuccessRef.current = onSuccess;
  getSnapshotRef.current = getSnapshot;

  const reset = useCallback((nextUrl = "") => {
    requestIdRef.current += 1;
    lastUrlRef.current = "";
    lastAppliedRef.current = null;
    setLoading(false);
    setPreviewLoading(isGitHubRepoUrl(nextUrl));
    setFailed(false);
    setMetadata(null);
  }, []);

  const load = useCallback(async (
    value: string,
    options: {
      force?: boolean;
      notify?: boolean;
      overwrite?: boolean;
      apply?: boolean;
    } = {}
  ) => {
    const { apply = true, force = false, notify = true, overwrite = false } = options;
    const normalizedUrl = normalizeHttpUrlInput(value);
    const repoPath = getGitHubRepoPath(normalizedUrl);
    if (!repoPath) {
      setPreviewLoading(false);
      return false;
    }
    if (!force && lastUrlRef.current === repoPath) return false;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestSnapshot = getSnapshotRef.current();
    setLoading(true);
    setPreviewLoading(true);
    setFailed(false);

    try {
      const nextMetadata = await loadGitHubToolMetadata(normalizedUrl, token, {
        forceRefresh: force
      });
      if (requestIdRef.current !== requestId) return false;

      lastUrlRef.current = repoPath;
      if (apply) {
        onMetadataRef.current(
          nextMetadata,
          normalizedUrl,
          lastAppliedRef.current?.metadata ?? null,
          overwrite,
          requestSnapshot
        );
        lastAppliedRef.current = { metadata: nextMetadata, url: normalizedUrl };
      }
      setMetadata(nextMetadata);
      setFailed(false);
      if (notify) onSuccessRef.current();
      return true;
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setFailed(true);
        if (notify) onErrorRef.current(error);
      }
      return false;
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setPreviewLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    if (!active || !autoLoad) return;
    const normalizedUrl = normalizeHttpUrlInput(sourceUrl);
    if (!getGitHubRepoPath(normalizedUrl)) {
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    setFailed(false);
    const timer = window.setTimeout(() => {
      void load(normalizedUrl, { apply: autoApply, notify: false });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, autoApply, autoLoad, load, sourceUrl]);

  return {
    canLoad: isGitHubRepoUrl(sourceUrl),
    failed,
    load,
    loading,
    metadata,
    previewLoading,
    reset
  };
}
