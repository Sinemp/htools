import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ToastInput } from "./admin-helpers";
import {
  BrowserGitHubMetadataError,
  loadBrowserGitHubMetadata
} from "./github-metadata";
import type { Locale, Messages } from "./i18n";
import { PublicGlowAction } from "./shared-ui";
import {
  buildGitHubIssueUrl,
  checkSubmissionUrl,
  loadSubmissionSettings,
  type SubmissionSettings
} from "./submit-api";
import { getGitHubRepoPath } from "./tool-helpers";
import type { SubmissionInput } from "./types";

const LEGACY_SUBMISSION_DRAFT_KEY = "htools-submission-draft-v1";
const GITHUB_REPOSITORY_SHORTHAND = /^([a-z\d](?:[a-z\d-]{0,38}))\/([a-z\d._-]+)\/?$/i;

type SubmitPageProps = {
  categories: Array<{ label: string; value: string }>;
  locale: Locale;
  normalizeUrl: (value: string) => string;
  notify: (toast: ToastInput) => void;
  parseTags: (value: string) => string[];
  t: Messages;
};

type AppliedMetadata = {
  description: string;
  name: string;
  tagText: string;
  url: string;
};

export default function SubmitPage({
  categories,
  locale,
  normalizeUrl,
  notify,
  parseTags,
  t
}: SubmitPageProps) {
  const [form, setForm] = useState<SubmissionInput>({
    name: "",
    description: "",
    url: "",
    category: categories[0]?.value ?? "Other Tools",
    tags: []
  });
  const [tagText, setTagText] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<SubmissionSettings | null>(null);
  const [settingsUnavailable, setSettingsUnavailable] = useState(false);
  const [isGitHubMetadataLoading, setIsGitHubMetadataLoading] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [duplicateBlocksSubmit, setDuplicateBlocksSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formUrlRef = useRef("");
  const lastAppliedMetadataRef = useRef<AppliedMetadata | null>(null);
  const metadataRequestRef = useRef(0);
  const duplicateRequestRef = useRef(0);
  const settingsRequestRef = useRef(0);
  const submittingRef = useRef(false);
  const automaticLookupTimerRef = useRef<number | null>(null);
  const automaticLookupPendingRef = useRef<{
    promise: Promise<void>;
    url: string;
  } | null>(null);
  const normalizeProjectUrl = useCallback((value: string) => {
    const shorthand = GITHUB_REPOSITORY_SHORTHAND.exec(value.trim());
    if (shorthand) {
      return `https://github.com/${shorthand[1]}/${shorthand[2].replace(/\.git$/i, "")}`;
    }
    return normalizeUrl(value);
  }, [normalizeUrl]);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    const name = form.name.trim();
    const description = form.description.trim();
    const url = form.url.trim();

    if (!name) errors.name = t.submitPage.validationNameRequired;
    else if (name.length > 100) errors.name = t.submitPage.validationNameTooLong;
    if (!url) errors.url = t.submitPage.validationUrlRequired;
    else {
      try {
        const parsed = new URL(normalizeProjectUrl(url));
        if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      } catch {
        errors.url = t.submitPage.validationUrlInvalid;
      }
    }
    if (!description) errors.description = t.submitPage.validationDescriptionRequired;
    else if (description.length > 1000) {
      errors.description = t.submitPage.validationDescriptionTooLong;
    }
    if (!form.category) errors.category = t.submitPage.validationCategoryRequired;
    return errors;
  }, [form, normalizeProjectUrl, t.submitPage]);
  const isFormValid = Object.keys(validation).length === 0;
  const normalizedProjectUrl = normalizeProjectUrl(form.url);
  const githubRepoPath = getGitHubRepoPath(normalizedProjectUrl);

  useEffect(() => {
    formUrlRef.current = form.url;
  }, [form.url]);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_SUBMISSION_DRAFT_KEY);
    return () => {
      if (automaticLookupTimerRef.current !== null) {
        window.clearTimeout(automaticLookupTimerRef.current);
      }
    };
  }, []);

  const refreshSubmissionSettings = useCallback(async (silent = false) => {
    const requestId = settingsRequestRef.current + 1;
    settingsRequestRef.current = requestId;
    try {
      const nextSettings = await loadSubmissionSettings();
      if (settingsRequestRef.current !== requestId) return nextSettings;
      setSettings(nextSettings);
      setSettingsUnavailable(false);
      return nextSettings;
    } catch {
      if (settingsRequestRef.current === requestId) {
        setSettings(null);
        setSettingsUnavailable(true);
        if (!silent) {
          notify({ message: t.submitPage.settingsUnavailable, tone: "error" });
        }
      }
      return null;
    }
  }, [notify, t.submitPage.settingsUnavailable]);

  useEffect(() => {
    void refreshSubmissionSettings();
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") {
        void refreshSubmissionSettings(true);
      }
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [refreshSubmissionSettings]);

  async function checkDuplicate(url: string, showNotice: boolean) {
    const requestId = duplicateRequestRef.current + 1;
    duplicateRequestRef.current = requestId;
    setIsCheckingUrl(true);
    try {
      const exists = await checkSubmissionUrl(url);
      if (duplicateRequestRef.current !== requestId) return null;
      setDuplicateBlocksSubmit(exists);
      if (exists && showNotice) {
        notify({ message: t.submitPage.alreadyListed, tone: "info" });
      }
      return exists;
    } catch {
      if (duplicateRequestRef.current === requestId) {
        setDuplicateBlocksSubmit(false);
        if (showNotice) {
          notify({ message: t.submitPage.checkFailed, tone: "error" });
        }
      }
      return null;
    } finally {
      if (duplicateRequestRef.current === requestId) setIsCheckingUrl(false);
    }
  }

  function clearAutomaticLookupTimer() {
    if (automaticLookupTimerRef.current === null) return;
    window.clearTimeout(automaticLookupTimerRef.current);
    automaticLookupTimerRef.current = null;
  }

  function scheduleAutomaticProjectLookup(sourceUrl: string) {
    clearAutomaticLookupTimer();
    const normalizedUrl = normalizeProjectUrl(sourceUrl);
    if (!getGitHubRepoPath(normalizedUrl)) return;

    automaticLookupTimerRef.current = window.setTimeout(() => {
      automaticLookupTimerRef.current = null;
      void runAutomaticProjectLookup(sourceUrl);
    }, 800);
  }

  async function runAutomaticProjectLookup(
    sourceUrl: string,
    normalizeField = false
  ) {
    const normalizedUrl = normalizeProjectUrl(sourceUrl);
    if (normalizeField) {
      formUrlRef.current = normalizedUrl;
      setForm((current) => ({ ...current, url: normalizedUrl }));
    }
    if (!normalizedUrl) return;

    try {
      const parsed = new URL(normalizedUrl);
      if (!/^https?:$/.test(parsed.protocol)) return;
    } catch {
      return;
    }

    const pendingLookup = automaticLookupPendingRef.current;
    if (pendingLookup?.url === normalizedUrl) {
      await pendingLookup.promise;
      return;
    }

    const promise = (async () => {
      const duplicateResult = await checkDuplicate(normalizedUrl, true);
      if (duplicateResult !== false) return;
      if (!getGitHubRepoPath(normalizedUrl)) return;

      await readGitHubMetadata(normalizedUrl, {
        forceRefresh: false,
        overwriteExisting: false,
        showNotice: false
      });
    })();
    automaticLookupPendingRef.current = { promise, url: normalizedUrl };

    try {
      await promise;
    } finally {
      if (automaticLookupPendingRef.current?.promise === promise) {
        automaticLookupPendingRef.current = null;
      }
    }
  }

  async function handleProjectUrlBlur() {
    setTouched((current) => ({ ...current, url: true }));
    clearAutomaticLookupTimer();
    await runAutomaticProjectLookup(form.url, true);
  }

  async function readGitHubMetadata(
    sourceUrl: string,
    options: {
      forceRefresh: boolean;
      overwriteExisting: boolean;
      showNotice: boolean;
    }
  ) {
    const { forceRefresh, overwriteExisting, showNotice } = options;
    const requestedRepoPath = getGitHubRepoPath(sourceUrl).toLowerCase();
    if (!requestedRepoPath) return false;
    const formSnapshot = form;
    const tagTextSnapshot = tagText;
    const requestId = metadataRequestRef.current + 1;
    metadataRequestRef.current = requestId;
    setIsGitHubMetadataLoading(true);
    try {
      const metadata = await loadBrowserGitHubMetadata(sourceUrl, { forceRefresh });
      if (
        metadataRequestRef.current !== requestId ||
        getGitHubRepoPath(normalizeProjectUrl(formUrlRef.current)).toLowerCase() !== requestedRepoPath
      ) {
        return false;
      }
      const previous = lastAppliedMetadataRef.current;
      const metadataTags = metadata.topics.slice(0, 8).join(", ");
      setForm((current) => ({
        ...current,
        name: shouldApplyGitHubMetadataValue(
          current.name,
          formSnapshot.name,
          previous?.name,
          overwriteExisting
        )
          ? metadata.name
          : current.name,
        description: shouldApplyGitHubMetadataValue(
          current.description,
          formSnapshot.description,
          previous?.description,
          overwriteExisting
        )
          ? metadata.description
          : current.description,
        url: shouldUseGitHubMetadataValue(current.url, previous?.url)
          || getGitHubRepoPath(normalizeProjectUrl(current.url)).toLowerCase() === requestedRepoPath
          ? metadata.url
          : current.url
      }));
      setTagText((current) =>
        shouldApplyGitHubMetadataValue(
          current,
          tagTextSnapshot,
          previous?.tagText,
          overwriteExisting
        )
          ? metadataTags
          : current
      );
      lastAppliedMetadataRef.current = {
        name: metadata.name,
        description: metadata.description,
        tagText: metadataTags,
        url: metadata.url
      };
      if (showNotice) {
        notify({ message: t.submitPage.githubMetadataSuccess, tone: "success" });
      }
      return true;
    } catch (error) {
      if (showNotice && metadataRequestRef.current === requestId) {
        notify({
          message: getGitHubMetadataErrorMessage(error, t),
          tone: "error"
        });
      }
      return false;
    } finally {
      if (metadataRequestRef.current === requestId) {
        setIsGitHubMetadataLoading(false);
      }
    }
  }

  async function handleGitHubMetadata() {
    if (isGitHubMetadataLoading) return;
    if (!githubRepoPath) {
      setTouched((current) => ({ ...current, url: true }));
      notify({ message: t.submitPage.githubMetadataFailed, tone: "error" });
      return;
    }
    await readGitHubMetadata(normalizedProjectUrl, {
      forceRefresh: true,
      overwriteExisting: true,
      showNotice: true
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setTouched({ name: true, url: true, description: true, category: true });
    if (!isFormValid) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const latestSettings = await refreshSubmissionSettings(true);
      if (!latestSettings?.enabled) {
        notify({ message: t.submitPage.settingsUnavailable, tone: "error" });
        return;
      }

      const normalizedUrl = normalizeProjectUrl(form.url);
      const duplicateResult = await checkDuplicate(normalizedUrl, true);
      if (duplicateResult !== false) return;

      const issueUrl = buildGitHubIssueUrl(latestSettings, {
        ...form,
        locale,
        url: normalizedUrl,
        tags: parseTags(tagText).slice(0, 8)
      });
      if (!issueUrl) {
        notify({ message: t.submitPage.issueUrlFailed, tone: "error" });
        return;
      }
      window.location.assign(issueUrl);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="category-page public-page public-submit-page">
      <section className="category-page-hero">
        <div>
          <h1>{t.submitPage.heading}</h1>
          <p>{t.submitPage.description}</p>
        </div>
        <div className="submit-page-auth-action">
          <PublicGlowAction
            disabled={isGitHubMetadataLoading}
            onClick={() => void handleGitHubMetadata()}
          >
            {t.submitPage.githubMetadataAction}
          </PublicGlowAction>
        </div>
      </section>

      <div className="public-page-body public-page-body-form">
        <form className="public-submit-form" onSubmit={handleSubmit}>
          <fieldset className="submit-form-fieldset" disabled={isSubmitting}>
            <section className="submit-form-section">
              <header className="submit-section-heading">
                <h2>{t.submitPage.projectInfoTitle}</h2>
                <p>{t.submitPage.projectInfoDescription}</p>
              </header>
              <FormRow error={touched.name ? validation.name : ""} label={t.form.name}>
                <input
                  aria-invalid={Boolean(touched.name && validation.name)}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                  maxLength={100}
                  placeholder={t.submitPage.namePlaceholder}
                  required
                />
              </FormRow>
              <FormRow error={touched.url ? validation.url : ""} label={t.form.url}>
                <input
                  aria-invalid={Boolean(touched.url && validation.url)}
                  value={form.url}
                  onChange={(event) => {
                    formUrlRef.current = event.target.value;
                    metadataRequestRef.current += 1;
                    duplicateRequestRef.current += 1;
                    setDuplicateBlocksSubmit(false);
                    setForm({ ...form, url: event.target.value });
                    scheduleAutomaticProjectLookup(event.target.value);
                  }}
                  onBlur={() => void handleProjectUrlBlur()}
                  placeholder={t.submitPage.urlPlaceholder}
                  inputMode="url"
                  required
                />
              </FormRow>
              <FormRow
                error={touched.description ? validation.description : ""}
                label={t.form.description}
              >
                <textarea
                  aria-invalid={Boolean(touched.description && validation.description)}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  onBlur={() => setTouched((current) => ({ ...current, description: true }))}
                  maxLength={1000}
                  placeholder={t.submitPage.descriptionPlaceholder}
                  rows={5}
                  required
                />
              </FormRow>
              <FormRow label={t.form.tags}>
                <input
                  value={tagText}
                  onChange={(event) => setTagText(event.target.value)}
                  onBlur={(event) => setTagText(parseTags(event.currentTarget.value).join(", "))}
                  placeholder={t.form.tagsPlaceholder}
                />
              </FormRow>
            </section>

            <section className="submit-form-section submit-category-section">
              <header className="submit-section-heading">
                <h2>{t.submitPage.categoryLabel}</h2>
                <p>{t.submitPage.categoryDescription}</p>
              </header>
              <div className="category-radio-grid">
                {categories.map((category) => (
                  <label className="radio-item" key={category.value}>
                    <input
                      checked={form.category === category.value}
                      name="category"
                      onChange={() => {
                        setTouched((current) => ({ ...current, category: true }));
                        setForm({ ...form, category: category.value });
                      }}
                      type="radio"
                    />
                    <span>{category.label}</span>
                  </label>
                ))}
              </div>
              {touched.category && validation.category ? (
                <span className="submit-field-error">{validation.category}</span>
              ) : null}
            </section>
          </fieldset>

          <div className="submit-form-actions">
            <div className="submit-verification-actions">
              <button
                className="primary-button submit-submit-button"
                disabled={
                  isCheckingUrl || isGitHubMetadataLoading ||
                  isSubmitting || duplicateBlocksSubmit || settingsUnavailable ||
                  !settings?.enabled || !isFormValid
                }
                type="submit"
              >
                {t.actions.submit}
              </button>
              <p>{t.submitPage.submitHint}</p>
            </div>
          </div>
        </form>

        <section className="submit-guide-section">
          <div className="submit-guide-intro">
            <h2>{t.submitPage.guideIntroTitle}</h2>
            <p>{t.submitPage.guideIntroDescription}</p>
          </div>
          <div className="submit-guide-grid">
            <InfoPanel title={t.submitPage.guideTitle} description={t.submitPage.guideDescription} />
            <InfoPanel title={t.submitPage.guideContentTitle} description={t.submitPage.guideContentDescription} />
            <InfoPanel title={t.submitPage.guideReviewTitle} description={t.submitPage.guideReviewDescription} />
            <InfoPanel title={t.submitPage.guideAfterTitle} description={t.submitPage.guideAfterDescription} />
          </div>
        </section>
      </div>
    </main>
  );
}

function shouldUseGitHubMetadataValue(current: string, previous = "") {
  const normalizedCurrent = current.trim();
  return !normalizedCurrent || Boolean(previous && normalizedCurrent === previous.trim());
}

function shouldApplyGitHubMetadataValue(
  current: string,
  requestSnapshot: string,
  previous: string | undefined,
  overwriteExisting: boolean
) {
  if (current !== requestSnapshot) return false;
  return overwriteExisting || shouldUseGitHubMetadataValue(current, previous);
}

function getGitHubMetadataErrorMessage(error: unknown, t: Messages) {
  if (error instanceof BrowserGitHubMetadataError) {
    if (error.code === "GITHUB_REPOSITORY_NOT_FOUND") {
      return t.submitPage.githubMetadataNotFound;
    }
    if (error.code === "GITHUB_RATE_LIMITED") {
      return t.submitPage.githubMetadataRateLimited;
    }
    if (error.code === "GITHUB_METADATA_TIMEOUT") {
      return t.submitPage.githubMetadataTimeout;
    }
  }
  return t.submitPage.githubMetadataFailed;
}

function FormRow({
  children,
  error,
  label
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="submit-form-row">
      <span>{label}</span>
      <span className="submit-form-control">
        {children}
        {error ? <span className="submit-field-error">{error}</span> : null}
      </span>
    </label>
  );
}

function InfoPanel({ description, title }: { description: string; title: string }) {
  return (
    <article className="info-panel has-no-icon">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
