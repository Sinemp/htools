import type { Messages } from "./type";

export const en: Messages = {
  brand: "HTools",
  nav: {
    category: "Tools",
    articles: "Articles",
    about: "About Us",
    featured: "Featured",
    tools: "Tools",
    admin: "Admin"
  },
  hero: {
    eyebrow: "Tool directory",
    title: "Tools",
    description:
      "Discover curated tools and resources to accelerate your indie development journey."
  },
  home: {
    browseCategories: (count) => `Explore ${count} Featured Tool Categories`,
    titleTop: "Build Faster with",
    titleBottom: "Better Tools",
    description:
      "Discover useful tools that help indie developers ship, promote, and grow products faster.",
    exploreAll: "Explore All",
    latestTools: "Latest Tools",
    latestArticles: "Latest Articles",
    moreTools: "More Tools",
    moreArticles: "More Articles",
    footerDescription:
      "Explore curated tools and resources to accelerate your indie development journey.",
    footerProduct: "Product",
    footerSupport: "Support",
    footerOther: "Other",
    footerMore: "More",
    email: "Email",
    blog: "Blog",
    countdown: "Home",
    about: "About Us",
    privacy: "Privacy Policy",
    terms: "Terms",
    copyright: "© 2026 HTools. All rights reserved."
  },
  articlesPage: {
    title: "Articles",
    description: "Read tutorials, announcements, and resource roundups for practical ideas."
  },
  publicMeta: {
    aboutDescription:
      "Learn about this site's background, directory focus, and maintenance approach.",
    privacyDescription:
      "Learn how this site collects, uses, and protects information related to visits and features.",
    termsDescription:
      "Review the rules that apply when using this site's directory, articles, and submission features."
  },
  actions: {
    submitTool: "Submit Tool",
    toggleTheme: "Toggle theme",
    toggleLanguage: "Switch language",
    featured: "Featured",
    login: "Login",
    visit: "Visit",
    demo: "Demo",
    viewDetails: "View details",
    close: "Close",
    confirm: "Confirm",
    home: "Home",
    backHome: "Back Home",
    add: "Add",
    addTool: "Add Tool",
    sort: "Sort",
    submit: "Submit",
    saveSettings: "Save Settings",
    copy: "Copy",
    logout: "Logout",
    clearFilters: "Clear filters"
  },
  search: {
    trigger: "Search",
    placeholder: "Quick search..."
  },
  theme: {
    light: "Light",
    dark: "Dark",
    system: "System"
  },
  empty: {
    libraryTitle: "The tool library is empty",
    libraryDescription:
      "There are no tools yet. Go to Check / Import and import the default subscription source.",
    libraryAction: "Go to Check / Import",
    connectionTitle: "Site data connection issue",
    connectionDescription:
      "Check that your project is correctly bound to a database.",
    title: "No tools found",
    description: "Try another category or a shorter search term."
  },
  footer: {
    version: "HTools v1.0.15"
  },
  submit: {
    title: "Submit Tool",
    heading: "Submit a tool to HTools",
    description:
      "Fill in the project details, then continue to GitHub. Approved tools can be added to the directory."
  },
  submitPage: {
    title: "Submit Tool",
    heading: "Submit Tool",
    description:
      "Share the project name, URL, description, and category, then continue to GitHub to confirm the issue.",
    guideIntroTitle: "Help maintain a practical tool directory",
    guideIntroDescription:
      "HTools accepts tool recommendations through GitHub issues. A GitHub repository URL can load public details automatically, and you make the final submission on GitHub so discussion and review stay transparent.",
    guideTitle: "Submission notes",
    guideDescription:
      "Make sure the project URL is publicly reachable. GitHub projects can load repository details automatically, while other projects can be entered manually.",
    guideContentTitle: "Submission content",
    guideContentDescription:
      "Review the project name, URL, short description, tags, and closest category. Automatically loaded details can still be edited.",
    guideReviewTitle: "Review flow",
    guideReviewDescription:
      "HTools first checks whether the project is already listed. New projects continue to GitHub with prepared issue content for your confirmation.",
    guideAfterTitle: "Good to know",
    guideAfterDescription:
      "Automatic loading does not overwrite your manual edits. Prefer a stable official URL; maintainers can adjust the category during review.",
    namePlaceholder: "Enter tool name",
    descriptionPlaceholder: "Use 1-2 sentences to describe the tool's main features and purpose",
    urlPlaceholder: "e.g. https://github.com/shaoyouvip/htools or shaoyouvip/htools",
    categoryLabel: "Type",
    settingsUnavailable: "GitHub submissions are disabled or unavailable.",
    alreadyListed: "This project is already listed. No duplicate submission is needed.",
    checkFailed: "Unable to check whether this project is already listed. Try again later.",
    issueUrlFailed: "Unable to create the GitHub submission URL. Check the repository settings.",
    githubMetadataAction: "GitHub Info",
    githubMetadataSuccess: "GitHub repository information loaded.",
    githubMetadataNotFound: "No public GitHub repository was found.",
    githubMetadataRateLimited: "The GitHub public API rate limit was reached. Try again later.",
    githubMetadataFailed: "Unable to load GitHub repository information. Check the project URL.",
    submitHint: "You will continue to GitHub to review and create a public issue.",
    validationNameRequired: "Enter a tool name.",
    validationNameTooLong: "Keep the name under 100 characters.",
    validationUrlRequired: "Enter the project URL.",
    validationUrlInvalid: "Enter a valid HTTP or HTTPS URL.",
    validationDescriptionRequired: "Enter a description.",
    validationDescriptionTooLong: "Keep the description under 1,000 characters.",
    validationCategoryRequired: "Choose a category.",
    projectInfoTitle: "Project information",
    projectInfoDescription:
      "Add the public project details. GitHub repositories can load the name, description, and tags automatically.",
    categoryDescription: "Choose the single category that best matches the project."
  },
  tool: {
    featured: "Featured",
    previewAlt: (name) => `${name} website preview`
  },
  markdownEditor: {
    modeLabel: "Editing mode",
    modes: {
      edit: "Edit content",
      preview: "View content"
    },
    toolbarLabel: "Markdown formatting",
    preview: "Content preview",
    previewEmpty: "There is no content to preview.",
    actions: {
      heading: "Heading",
      bold: "Bold",
      italic: "Italic",
      quote: "Quote",
      list: "List",
      code: "Code",
      table: "Table",
      link: "Link"
    }
  },
  admin: {
    dashboard: "Dashboard",
    directoryService: "Console",
    platform: "Platform",
    toolLibrary: "Tool Library",
    settings: "Settings",
    rootUser: "Admin",
    refresh: "Refresh",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    searchPlaceholder: "Search tools...",
    manageTools: "Manage tools",
    sortLatest: "Latest first",
    sortOldest: "Oldest first",
    sortLatestShort: "New",
    sortOldestShort: "Old",
    emptyTitle: "No matching tools",
    emptyDescription: "Try another search term or refresh the tool list.",
    password: "Password",
    passwordRequired: "Enter the password",
    turnstileRequired: "Complete the verification first.",
    turnstileServerFailed: "The verification service is temporarily unavailable. Try again later.",
    tableTool: "Tool",
    editTool: "Edit Tool",
    deleteTool: "Delete Tool",
    editAction: "Edit",
    deleteAction: "Delete",
  },
  linkCheck: {
    eyebrow: "Link Health Check",
    title: "Link Check",
    description:
      "Check whether existing project URLs and demo sites are reachable. Results are display-only and do not modify the database.",
    timeout: "Timeout",
    timeoutHelp:
      "Wait up to 9 seconds per link; when proxy fallback is enabled in system settings, network errors will try the proxy.",
    batchSize: "Batch size",
    batchSizeHelp: "Check up to 10 links per batch.",
    start: "Start Check",
    stop: "Stop",
    reload: "Reload Links",
    clear: "Clear Results",
    exportCsv: "Export CSV",
    total: "Target Links",
    checked: "Checked",
    normal: "Normal",
    abnormal: "Abnormal",
    networkError: "Network Error",
    progressTitle: "Progress",
    progressText: (checked, total) => `Checked ${checked} / ${total} links`,
    progressStopped: "Check stopped. Current results are kept.",
    resultsTitle: "Results",
    resultsDescription:
      "Abnormal links are shown by default. Filter by status code or view all results.",
    tabsAbnormal: (count) => `Abnormal (${count})`,
    tabsStatus: (status, count) => `${status} (${count})`,
    tabsAll: (count) => `All (${count})`,
    tableTool: "Tool",
    tableType: "Type",
    tableUrl: "Target URL",
    tableStatusCode: "Status",
    tableResult: "Result",
    tableDuration: "Duration",
    tableError: "Error",
    tableAction: "Action",
    linkTypeOfficial: "Project URL",
    linkTypeDemo: "Demo site",
    resultNormal: "Normal",
    resultAbnormal: "Abnormal",
    resultNetworkError: "Network Error",
    durationMs: (duration) => `${duration} ms`,
    emptyNotStarted: "No check has started yet.",
    emptyNoBrokenLinks: "No abnormal links were found this time.",
    emptyNoMatchingResults: "No results match the current filter.",
    messages: {
      empty: "There are no links to check.",
      completed: "Link check completed.",
      stopped: "Link check stopped.",
      reloaded: "Link list reloaded."
    }
  },
  form: {
    name: "Name",
    url: "Project URL",
    demoUrl: "Demo site",
    demoUrlPlaceholder: "Optional deployed demo URL",
    image: "Preview image",
    imagePlaceholder: "Leave empty to generate from project URL",
    category: "Category",
    description: "Description",
    tags: "Tags",
    tagsPlaceholder: "Database, Auth, AI",
    githubMetadata: "GitHub Info",
    featuredTool: "Featured tool",
    regularTool: "Regular tool",
    saveTool: "Save Tool"
  },
  githubSettings: {
    title: "GitHub Submission Settings",
    description: "Configure the target GitHub repository for public tool suggestions.",
    enabled: "Enable",
    disabled: "Disable",
    statusEnabled: "Enabled",
    statusDisabled: "Disabled",
    owner: "Repository Owner",
    repo: "Repository Name",
    labels: "Issue Labels",
    labelsPlaceholder: "tool-submission, pending-review",
    saved: "GitHub submission settings saved.",
    saveFailed: "Failed to save GitHub submission settings.",
  },
  status: {
    loginFailed: "Login failed.",
    sessionExpired: "Your session has expired. Please log in again.",
    toolUpdated: "Tool updated.",
    toolCreated: "Tool created.",
    saveFailed: "Save failed.",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDescription:
      "This action cannot be undone. This will permanently delete the tool from the server.",
    deleteCancel: "Cancel",
    toolDeleted: "Tool deleted.",
    deleteFailed: "Delete failed.",
    featuredEnabled: "Marked as featured.",
    featuredDisabled: "Featured mark removed.",
    featuredConfirmTitle: (nextFeatured) =>
      nextFeatured ? "Mark this tool as featured?" : "Remove this tool from featured?",
    featuredConfirmDescription: (nextFeatured) =>
      nextFeatured
        ? "This tool will appear in the featured category."
        : "This tool will be removed from the featured category.",
    featuredDraftEnabled: "Marked as featured. Save the tool to apply it.",
    featuredDraftDisabled: "Featured mark removed. Save the tool to apply it.",
    publishedConfirmTitle: (nextPublished) =>
      nextPublished ? "Publish this article?" : "Move this article to draft?",
    publishedConfirmDescription: (nextPublished) =>
      nextPublished
        ? "Visitors will be able to view this article after it is published."
        : "This article will no longer be publicly visible as a draft.",
    githubMetadataApplied: "GitHub repository info loaded.",
  },
  errors: {
    requestFailed: "Request failed. Try again shortly.",
    timeout: "Request timed out. Try again shortly.",
    unauthorized: "Your session has expired. Sign in again.",
    forbidden: "You do not have permission to perform this action.",
    notFound: "The requested content does not exist or has been removed.",
    conflict: "This content has changed. Refresh and try again.",
    rateLimited: "Too many requests. Try again shortly.",
    serverError: "The server cannot process this request right now. Try again shortly.",
    invalidRequest: "The submitted content is invalid. Check it and try again."
  },
  categories: {
    All: "All",
    Backend: "Backend",
    Database: "Database",
    "Web Framework": "Web Framework",
    "UI Framework": "UI Framework",
    "API Tools": "API Tools",
    Productivity: "Productivity",
    "Short Link": "Short Link",
    Analytics: "Analytics",
    Blog: "Blog",
    "Image Hosting": "Image Hosting",
    "Browser Extension": "Browser Extension",
    Prototype: "Prototype",
    Authentication: "Authentication",
    Payment: "Payment",
    "Ideas Creativity": "Ideas Creativity",
    Ads: "Ads",
    I18N: "I18N",
    "Customer Support": "Customer Support",
    "Docs Tools": "Docs Tools",
    "Font Resources": "Font Resources",
    "Screen Recording": "Screen Recording",
    "Info Channel": "Info Channel",
    "Project Management": "Project Management",
    "Deploy Service": "Deploy Service",
    "Protocol Generator": "Protocol Generator",
    "Icon Resources": "Icon Resources",
    "Media Resources": "Media Resources",
    "Media Tools": "Media Tools",
    "SSL Certificate": "SSL Certificate",
    "Logo Design": "Logo Design",
    "Domain Service": "Domain Service",
    "Product Launch": "Product Launch",
    Tunnel: "Tunnel",
    Acceleration: "Acceleration",
    "Speed Test": "Speed Test",
    Monitoring: "Monitoring",
    "Other Tools": "Other Tools",
    Email: "Email",
    "File Sharing": "File Sharing",
    "Developer Tools": "Developer Tools",
    "AI Tools": "AI Tools",
    "SEO Opt": "SEO Opt"
  }
};
