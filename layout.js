/* ==========================================================================
   DAILY-KURAL: CENTRAL SHARED LAYOUT + SUPABASE PUBLIC AUTH & SYNC (layout.js)
   - Global Sticky Top Header Bar (Hamburger, Home, Language, Theme, Search, User Sign-In)
   - Slide-Out Left Side Panel (Navigation, Public Account, Settings, Info)
   - Public Google OAuth & Email Magic Link Sign-In Modal
   - Automatic Cloud Favorites Sync + Admin Portal Link Reveal
   ========================================================================== */
(function() {
  "use strict";

  // ==========================================================================
  // 1. SUPABASE & ROLLOUT CONFIGURATION (REPLACE WITH YOUR PROJECT CREDENTIALS)
  // ==========================================================================
  const SUPABASE_URL = "https://lgsfbhiscvjjlyzpzwuv.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_HGWE1gz2FNuj-rdcosAxDQ_lpN8lzkz";

  // Set to true for 100% public launch; false for 5% canary rollout
  const ENABLE_FOR_ALL_USERS = true;
  const CANARY_PERCENTAGE = 5;
   // ==========================================================================
  // ENTRY GATE: REDIRECT FIRST-TIME VISITORS TO login.html (UNLESS GUEST/SIGNED IN)
  // ==========================================================================
  const REQUIRE_LOGIN_GATE = true;

  (function enforceEntryGate() {
    if (!REQUIRE_LOGIN_GATE) return;
    const path = window.location.pathname.toLowerCase();
    // Never redirect on login.html or admin.html
    if (path.endsWith("login.html") || path.endsWith("admin.html")) return;

    const isGuest = sessionStorage.getItem("dk_guest_mode") === "true" || localStorage.getItem("dk_guest_mode") === "true";
    const hasSupabaseSession = Object.keys(localStorage).some(k => k.startsWith("sb-") && k.endsWith("-auth-token"));

    if (!isGuest && !hasSupabaseSession) {
      const currentFile = window.location.pathname.split("/").pop() || "index.html";
      const nextTarget = encodeURIComponent(currentFile + window.location.search + window.location.hash);
      window.location.replace(`login.html?next=${nextTarget}`);
    }
  })();

  function isUserInAuthRollout() {
    if (ENABLE_FOR_ALL_USERS) return true;
    try {
      let bucket = localStorage.getItem("dk_canary_bucket");
      if (bucket === null) {
        bucket = String(Math.floor(Math.random() * 100));
        localStorage.setItem("dk_canary_bucket", bucket);
      }
      return Number(bucket) < CANARY_PERCENTAGE;
    } catch (e) {
      return false;
    }
  }

  // ==========================================================================
  // 2. IMMEDIATE THEME & LANGUAGE LOADER (PREVENTS FLASH)
  // ==========================================================================
  function initSavedPreferences() {
    try {
      const savedTheme = localStorage.getItem("daily_kural_theme") || localStorage.getItem("dailyKuralTheme");
      if (savedTheme === "dark" || (!savedTheme && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark-mode");
        if (document.body) document.body.classList.add("dark-mode");
      }
      const savedLang = localStorage.getItem("daily_kural_lang") || "ta";
      document.documentElement.setAttribute("data-lang", savedLang);
    } catch (e) {}
  }
  initSavedPreferences();

  // ==========================================================================
  // 3. INJECT SHARED GLOBAL CSS
  // ==========================================================================
  const sharedCSS = `
    :root {
      --dk-bg: #faf6ee;
      --dk-card: #fffdf7;
      --dk-header: #fff8eb;
      --dk-text: #332619;
      --dk-muted: #59636a;
      --dk-accent: #c26100;
      --dk-border: #dfcba5;
      --dk-border-light: #ebd9b5;
      --dk-shadow: rgba(217, 119, 6, 0.08);
    }
    html.dark-mode, body.dark-mode {
      --dk-bg: #12161a !important;
      --dk-card: #1c2228 !important;
      --dk-header: #242c34 !important;
      --dk-text: #e6edf3 !important;
      --dk-muted: #9ba7b4 !important;
      --dk-accent: #e58e26 !important;
      --dk-border: #3b4654 !important;
      --dk-border-light: #2d3742 !important;
      --dk-shadow: rgba(0, 0, 0, 0.45) !important;
      background-color: #12161a !important;
      color: #e6edf3 !important;
    }
    html.dark-mode .kural-list-item,
    html.dark-mode .modal-content,
    html.dark-mode .choice-modal-content,
    html.dark-mode .kural-word-table {
      background-color: #1c2228 !important;
      color: #e6edf3 !important;
      border-color: #3b4654 !important;
    }
    html.dark-mode .kural-line-1,
    html.dark-mode .kural-line-2,
    html.dark-mode .scholar-desc,
    html.dark-mode .kural-word-table td,
    html.dark-mode .kural-word-table td.col-word {
      color: #e6edf3 !important;
    }
    html.dark-mode .kural-word-table tr:nth-child(even) {
      background-color: #242c34 !important;
    }
    html.dark-mode .kural-word-table tr:nth-child(odd) {
      background-color: #1c2228 !important;
    }
    html.dark-mode .modal-kural-header-box,
    html.dark-mode .modal-share-bar,
    html.dark-mode .chapter-dropdown,
    html.dark-mode .kural-word-table th {
      background-color: #242c34 !important;
      border-color: #3b4654 !important;
    }
    html.dark-mode .modal-footer-nav {
      background: linear-gradient(to top, rgba(28, 34, 40, 1) 75%, rgba(28, 34, 40, 0)) !important;
    }

    /* Hide duplicate standalone utility bars on subpages when global header is active */
    .github-utility-bar,
    #githubLangToggleBtn {
      display: none !important;
    }

    /* TOP STICKY HEADER BAR */
    .dk-global-topbar {
      position: sticky;
      top: 0;
      z-index: 9000;
      width: 100%;
      background: var(--dk-header);
      border-bottom: 1.5px solid var(--dk-border);
      box-shadow: 0 2px 10px var(--dk-shadow);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'Vijaya', 'Noto Serif Tamil', Georgia, serif;
    }
    .dk-hamburger-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--dk-card);
      color: var(--dk-accent);
      border: 1.5px solid var(--dk-border);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s ease;
    }
    .dk-hamburger-btn:hover {
      border-color: var(--dk-accent);
    }
    .dk-topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dk-top-btn {
      height: 38px;
      min-width: 38px;
      padding: 0 10px;
      border-radius: 20px;
      background: var(--dk-card);
      color: var(--dk-text);
      border: 1.5px solid var(--dk-border);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.15s ease, border-color 0.2s ease;
    }
    .dk-top-btn:hover {
      transform: translateY(-1px);
      border-color: var(--dk-accent);
      color: var(--dk-accent);
    }
    .dk-top-btn.icon-only {
      width: 38px;
      padding: 0;
      border-radius: 50%;
    }
    .dk-top-btn.signed-in-badge {
      border-color: #2e7d32;
    }

    /* SIDE DRAWER */
    .dk-drawer-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 99990;
    }
    .dk-drawer-backdrop.active {
      display: block;
    }
    .dk-side-drawer {
      position: fixed;
      top: 0;
      left: -320px;
      width: 295px;
      max-width: 85vw;
      height: 100vh;
      background: var(--dk-card);
      border-right: 1.5px solid var(--dk-border);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
      z-index: 99995;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Vijaya', 'Noto Serif Tamil', Georgia, serif;
    }
    .dk-side-drawer.open {
      left: 0;
    }
    .dk-drawer-header {
      background: var(--dk-header);
      padding: 18px;
      border-bottom: 1.5px solid var(--dk-border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dk-drawer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 21px;
      font-weight: bold;
      color: var(--dk-accent);
      text-decoration: none;
    }
    .dk-drawer-close {
      background: transparent;
      border: none;
      color: var(--dk-accent);
      font-size: 26px;
      font-weight: bold;
      cursor: pointer;
      line-height: 1;
    }
    .dk-drawer-section {
      padding: 14px 18px;
      border-bottom: 1px dashed var(--dk-border);
    }
    .dk-drawer-section:last-child {
      border-bottom: none;
    }
    .dk-drawer-sec-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--dk-muted);
      margin-bottom: 10px;
    }
    .dk-drawer-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 8px;
      border-radius: 10px;
      text-decoration: none;
      font-size: 16px;
      font-weight: bold;
      color: var(--dk-accent);
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .dk-drawer-link:hover {
      background: var(--dk-header);
      transform: translateX(3px);
    }
    .dk-drawer-link.info-link {
      color: var(--dk-text);
    }
    .dk-drawer-link.admin-link {
      background: var(--dk-header);
      border: 1px solid var(--dk-accent);
      margin-top: 6px;
    }
    .dk-drawer-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 4px;
      gap: 8px;
    }
    .dk-drawer-setting-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: bold;
      color: var(--dk-text);
    }
    .dk-drawer-pill {
      background: var(--dk-header);
      color: var(--dk-accent);
      border: 1.5px solid var(--dk-border);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      white-space: nowrap;
    }
    .dk-drawer-pill:hover {
      background: var(--dk-accent);
      color: #ffffff;
    }
    .dk-user-profile-chip {
      background: var(--dk-header);
      border: 1px solid var(--dk-border-light);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dk-user-email-text {
      font-size: 13px;
      font-weight: bold;
      color: var(--dk-text);
      word-break: break-all;
    }

    /* GLOBAL OVERLAY MODALS (SEARCH & PUBLIC AUTH) */
    .dk-modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 99999;
      justify-content: center;
      align-items: center;
      padding: 14px;
    }
    .dk-modal-overlay.active {
      display: flex;
    }
    .dk-modal-box {
      background: var(--dk-card);
      max-width: 440px;
      width: 100%;
      border-radius: 16px;
      border: 1.5px solid var(--dk-border);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      font-family: 'Vijaya', 'Noto Serif Tamil', Georgia, serif;
    }
    .dk-modal-header {
      background: var(--dk-header);
      padding: 14px 18px;
      border-bottom: 1px solid var(--dk-border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dk-modal-body {
      padding: 18px 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .dk-search-row {
      display: flex;
      gap: 8px;
    }
    .dk-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid var(--dk-border);
      background: var(--dk-header);
      color: var(--dk-text);
      font-size: 15px;
      font-weight: bold;
      outline: none;
    }
    .dk-input:focus {
      border-color: var(--dk-accent);
    }
    .dk-btn-primary {
      padding: 10px 18px;
      border-radius: 22px;
      border: none;
      background: var(--dk-accent);
      color: #ffffff;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .dk-btn-google {
      width: 100%;
      padding: 10px 16px;
      border-radius: 22px;
      border: 1.5px solid var(--dk-border);
      background: #ffffff;
      color: #1f1f1f;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .dk-btn-google:hover {
      border-color: var(--dk-accent);
    }
    .dk-divider {
      text-align: center;
      font-size: 12px;
      color: var(--dk-muted);
      position: relative;
      margin: 4px 0;
    }
    .dk-search-results {
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dk-search-item {
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--dk-header);
      border: 1px solid var(--dk-border-light);
      color: var(--dk-text);
      text-decoration: none;
      font-size: 15px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dk-search-item:hover {
      border-color: var(--dk-accent);
      color: var(--dk-accent);
    }
  `;

  const styleTag = document.createElement("style");
  styleTag.textContent = sharedCSS;
  document.head.appendChild(styleTag);

  // ==========================================================================
  // 4. INJECT GLOBAL TOP BAR, SIDE DRAWER, SEARCH MODAL & PUBLIC AUTH MODAL
  // ==========================================================================
  const showAccountSection = isUserInAuthRollout();

  const layoutHTML = `
    <nav class="dk-global-topbar" aria-label="Global Navigation">
      <button class="dk-hamburger-btn" id="dkOpenDrawerBtn" title="Menu (பட்டியல்)" type="button">☰</button>
      <div class="dk-topbar-right">
        <a class="dk-top-btn icon-only" href="index.html" title="முகப்பு (Home)">🏠</a>
        <button class="dk-top-btn" id="dkTopLangBtn" title="Switch Language (தமிழ் / English / हिंदी)" type="button">
          <span>文A</span>
          <span id="dkTopLangBadge">அ</span>
        </button>
        <button class="dk-top-btn icon-only" id="dkTopThemeBtn" title="Dark / Light Mode" type="button">🌙</button>
        <button class="dk-top-btn icon-only" id="dkTopSearchBtn" title="குறள் தேடல் (Search Kural)" type="button">🔍</button>
        <button class="dk-top-btn icon-only" id="dkTopAuthBtn" title="Sign In (உள்நுழைக)" type="button" style="${showAccountSection ? '' : 'display:none;'}">👤</button>
      </div>
    </nav>

    <div class="dk-drawer-backdrop" id="dkDrawerBackdrop"></div>
    <aside class="dk-side-drawer" id="dkSideDrawer" aria-label="Side Navigation Panel">
      <div class="dk-drawer-header">
        <a class="dk-drawer-brand" href="index.html">
          <span>📜</span>
          <span>Daily-Kural</span>
        </a>
        <button class="dk-drawer-close" id="dkCloseDrawerBtn" title="Close Menu" type="button">×</button>
      </div>

      <!-- NAVIGATION -->
      <div class="dk-drawer-section">
        <div class="dk-drawer-sec-title">வழிசெலுத்தல் / NAVIGATION</div>
        <a class="dk-drawer-link" href="index.html"><span>🏠</span><span>முகப்பு (Home)</span></a>
        <a class="dk-drawer-link" href="chapters.html"><span>📖</span><span>அதிகாரங்கள் (Chapters)</span></a>
        <a class="dk-drawer-link" href="favourite.html"><span>❤️</span><span>விருப்பக் குறள்கள் (Favorites)</span></a>
        <a class="dk-drawer-link" href="calendar.html"><span>📅</span><span>நாள்காட்டி (Calendar)</span></a>
        <a class="dk-drawer-link admin-link" id="dkAdminPortalLink" href="admin.html" style="display:none;">
          <span>🛡️</span><span>Admin Control Center</span>
        </a>
      </div>

      <!-- PUBLIC USER ACCOUNT (GOOGLE / EMAIL SIGN-IN) -->
      <div class="dk-drawer-section" id="dkPublicAccountSection" style="${showAccountSection ? '' : 'display:none;'}">
        <div class="dk-drawer-sec-title">கணக்கு / READER ACCOUNT</div>
        <div id="dkSignedOutView">
          <div class="dk-drawer-setting-row">
            <div class="dk-drawer-setting-label"><span>👤</span><span>விருப்பங்களைச் சேமிக்க</span></div>
            <button class="dk-drawer-pill" id="dkOpenAuthModalBtn" type="button">Sign In (உள்நுழைக)</button>
          </div>
        </div>
        <div id="dkSignedInView" style="display:none;">
          <div class="dk-user-profile-chip">
            <span class="dk-user-email-text" id="dkSignedInUserEmail">user@example.com</span>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
              <span style="font-size:12px; color:var(--dk-accent); font-weight:bold;" id="dkSyncStatusLabel">☁️ Synced</span>
              <button class="dk-drawer-pill" id="dkSignOutBtn" type="button">Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SETTINGS -->
      <div class="dk-drawer-section">
        <div class="dk-drawer-sec-title">அமைப்புகள் / SETTINGS</div>
        <div class="dk-drawer-setting-row">
          <div class="dk-drawer-setting-label"><span>🌐</span><span>மொழி (Language)</span></div>
          <button class="dk-drawer-pill" id="dkDrawerLangBtn" type="button">Switch (அ / A / अ)</button>
        </div>
        <div class="dk-drawer-setting-row">
          <div class="dk-drawer-setting-label"><span>🌓</span><span>தோற்றம் (Theme)</span></div>
          <button class="dk-drawer-pill" id="dkDrawerThemeBtn" type="button">Dark / Light</button>
        </div>
      </div>

      <!-- INFORMATION -->
      <div class="dk-drawer-section">
        <div class="dk-drawer-sec-title">தகவல் / INFORMATION</div>
        <a class="dk-drawer-link info-link" href="about.html"><span>ℹ️</span><span>எங்களைப் பற்றி (About Us)</span></a>
        <a class="dk-drawer-link info-link" href="contact.html"><span>✉️</span><span>தொடர்புக்கு (Contact Us)</span></a>
      </div>
    </aside>

    <!-- SEARCH MODAL -->
    <div class="dk-modal-overlay" id="dkSearchModal">
      <div class="dk-modal-box">
        <div class="dk-modal-header">
          <h3 style="margin:0; font-size:18px; color:var(--dk-accent);">🔍 குறள் / அதிகாரம் தேடல் (Search)</h3>
          <button id="dkCloseSearchBtn" style="background:none; border:none; font-size:26px; font-weight:bold; color:var(--dk-accent); cursor:pointer;" type="button">×</button>
        </div>
        <div class="dk-modal-body">
          <div class="dk-search-row">
            <input class="dk-input" id="dkSearchInput" type="text" placeholder="குறள் எண் (1–1330) அல்லது அதிகாரம் (1–133)">
            <button class="dk-btn-primary" id="dkSearchGoBtn" type="button" style="border-radius:10px;">செல்</button>
          </div>
          <div class="dk-search-results" id="dkSearchResults">
            <div style="color:var(--dk-muted); font-size:13px; text-align:center;">
              குறள் எண் (உதாரணம்: 321) அல்லது அதிகாரம் எண் (உதாரணம்: 33) உள்ளிடவும்.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PUBLIC GOOGLE / EMAIL SIGN-IN MODAL -->
    <div class="dk-modal-overlay" id="dkPublicAuthModal">
      <div class="dk-modal-box" style="max-width:400px;">
        <div class="dk-modal-header">
          <h3 style="margin:0; font-size:18px; color:var(--dk-accent);">👤 வாசகர் உள்நுழைவு (Reader Sign In)</h3>
          <button id="dkCloseAuthBtn" style="background:none; border:none; font-size:26px; font-weight:bold; color:var(--dk-accent); cursor:pointer;" type="button">×</button>
        </div>
        <div class="dk-modal-body">
          <div style="font-size:14px; color:var(--dk-muted); text-align:center;">
            உங்கள் விருப்பக் குறள்கள் (Favorites) மற்றும் தினசரி அறிவிப்புகளை அனைத்து சாதனங்களிலும் சேமிக்க உள்நுழையவும்.
          </div>

          <button class="dk-btn-google" id="dkGoogleSignInBtn" type="button">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div class="dk-divider">— அல்லது (OR) —</div>

          <input class="dk-input" id="dkMagicEmailInput" type="email" placeholder="உங்கள் மின்னஞ்சல் (Enter your email)">
          <button class="dk-btn-primary" id="dkEmailMagicLinkBtn" type="button" style="width:100%;">
            ✉️ Send Sign-In Link (மின்னஞ்சல் இணைப்பு)
          </button>
          <div id="dkAuthFeedback" style="font-size:13px; text-align:center; color:var(--dk-accent); font-weight:bold;"></div>
        </div>
      </div>
    </div>
  `;

  // ==========================================================================
  // 5. SUPABASE AUTH & CLOUD FAVORITES SYNC ENGINE
  // ==========================================================================
  let supabaseClient = null;
  let isUserSignedIn = false;

  function loadSupabaseSDK(callback) {
    if (SUPABASE_URL.includes("YOUR-PROJECT-ID")) return;
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      callback(supabaseClient);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = function() {
      if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        callback(supabaseClient);
      }
    };
    document.head.appendChild(script);
  }

  async function syncFavoritesWithSupabase(sb, userId) {
    try {
      const localFavs = JSON.parse(localStorage.getItem("daily_kural_favs") || "[]").map(Number);

      const { data: cloudRows, error } = await sb
        .from("user_favorites")
        .select("kural_num")
        .eq("user_id", userId);

      if (error) return;
      const cloudFavs = (cloudRows || []).map(r => Number(r.kural_num));

      const toUpload = localFavs
        .filter(num => num >= 1 && num <= 1330 && !cloudFavs.includes(num))
        .map(num => ({ user_id: userId, kural_num: num }));

      if (toUpload.length > 0) {
        await sb.from("user_favorites").upsert(toUpload, { onConflict: "user_id,kural_num" });
      }

      const merged = Array.from(new Set([...localFavs, ...cloudFavs])).sort((a, b) => a - b);
      localStorage.setItem("daily_kural_favs", JSON.stringify(merged));

      const badge = document.getElementById("homeFavCount");
      if (badge) badge.textContent = String(merged.length);
    } catch (e) {
      console.error("Favorites sync error:", e);
    }
  }

  async function handleAuthSessionState(sb) {
    const { data: { session } } = await sb.auth.getSession();
    const signedOutView = document.getElementById("dkSignedOutView");
    const signedInView = document.getElementById("dkSignedInView");
    const adminLink = document.getElementById("dkAdminPortalLink");
    const topAuthBtn = document.getElementById("dkTopAuthBtn");

    if (session && session.user) {
      isUserSignedIn = true;
      if (signedOutView) signedOutView.style.display = "none";
      if (signedInView) signedInView.style.display = "block";
      if (topAuthBtn) {
        topAuthBtn.textContent = "✅";
        topAuthBtn.title = `Signed in: ${session.user.email}`;
        topAuthBtn.classList.add("signed-in-badge");
      }

      const emailEl = document.getElementById("dkSignedInUserEmail");
      if (emailEl) emailEl.textContent = session.user.email || "Signed In Reader";

      const { data: profile } = await sb
        .from("user_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile && ["central_admin", "sub_admin"].includes(profile.role)) {
        if (adminLink) adminLink.style.display = "flex";
      }

      await syncFavoritesWithSupabase(sb, session.user.id);
    } else {
      isUserSignedIn = false;
      if (signedOutView) signedOutView.style.display = "block";
      if (signedInView) signedInView.style.display = "none";
      if (adminLink) adminLink.style.display = "none";
      if (topAuthBtn) {
        topAuthBtn.textContent = "👤";
        topAuthBtn.title = "Sign In (உள்நுழைக)";
        topAuthBtn.classList.remove("signed-in-badge");
      }
    }
  }

  // ==========================================================================
  // 6. MOUNT GLOBAL LAYOUT & WIRE ALL EVENT LISTENERS
  // ==========================================================================
  function mountGlobalLayout() {
    if (document.querySelector(".dk-global-topbar")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = layoutHTML;
    while (wrapper.lastElementChild) {
      document.body.insertBefore(wrapper.lastElementChild, document.body.firstChild);
    }

    // Drawer Controls
    const drawer = document.getElementById("dkSideDrawer");
    const backdrop = document.getElementById("dkDrawerBackdrop");
    function openDrawer() {
      drawer.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    function closeDrawer() {
      drawer.classList.remove("open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "auto";
    }
    document.getElementById("dkOpenDrawerBtn").addEventListener("click", openDrawer);
    document.getElementById("dkCloseDrawerBtn").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    // Language Switcher
    function updateLangBadge(lang) {
      const badge = document.getElementById("dkTopLangBadge");
      if (!badge) return;
      badge.textContent = (lang === "en") ? "A" : (lang === "hi" ? "अ" : "அ");
    }
    function cycleGlobalLang() {
      const cur = localStorage.getItem("daily_kural_lang") || document.documentElement.getAttribute("data-lang") || "ta";
      const next = (cur === "ta") ? "en" : (cur === "en" ? "hi" : "ta");
      document.documentElement.setAttribute("data-lang", next);
      try { localStorage.setItem("daily_kural_lang", next); } catch (e) {}
      updateLangBadge(next);
      window.dispatchEvent(new CustomEvent("kuralLanguageChanged", { detail: { lang: next } }));
    }
    updateLangBadge(localStorage.getItem("daily_kural_lang") || "ta");
    document.getElementById("dkTopLangBtn").addEventListener("click", cycleGlobalLang);
    document.getElementById("dkDrawerLangBtn").addEventListener("click", cycleGlobalLang);

    // Theme Switcher
    function syncThemeIcon() {
      const isDark = document.documentElement.classList.contains("dark-mode");
      const btn = document.getElementById("dkTopThemeBtn");
      if (btn) btn.textContent = isDark ? "☀️" : "🌙";
    }
    function toggleGlobalTheme() {
      const isDark = !document.documentElement.classList.contains("dark-mode");
      document.documentElement.classList.toggle("dark-mode", isDark);
      document.body.classList.toggle("dark-mode", isDark);
      syncThemeIcon();
      try { localStorage.setItem("daily_kural_theme", isDark ? "dark" : "light"); } catch (e) {}
    }
    syncThemeIcon();
    document.getElementById("dkTopThemeBtn").addEventListener("click", toggleGlobalTheme);
    document.getElementById("dkDrawerThemeBtn").addEventListener("click", toggleGlobalTheme);

    // Search Modal Controls
    const searchModal = document.getElementById("dkSearchModal");
    const searchInput = document.getElementById("dkSearchInput");
    const searchResults = document.getElementById("dkSearchResults");

    function getPaal(ch) {
      if (ch >= 39 && ch <= 108) return "porul";
      if (ch >= 109) return "inbam";
      return "aram";
    }
    function openSearch() {
      searchModal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => searchInput.focus(), 60);
    }
    function closeSearch() {
      searchModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
    function renderSearchResults() {
      const val = (searchInput.value || "").trim();
      const num = parseInt(val, 10);
      if (!val || isNaN(num) || num < 1) {
        searchResults.innerHTML = '<div style="color:var(--dk-muted); font-size:13px; text-align:center;">குறள் எண் (1–1330) அல்லது அதிகாரம் எண் (1–133) உள்ளிடவும்.</div>';
        return;
      }
      let html = "";
      if (num >= 1 && num <= 1330) {
        const ch = Math.ceil(num / 10);
        html += `<a class="dk-search-item" href="chapters.html?ch=${ch}&paal=${getPaal(ch)}&kural=${num}#kural-${num}">
          <span>📜 குறள் ${num} (Kural ${num})</span><span>அதிகாரம் ${ch} →</span>
        </a>`;
      }
      if (num >= 1 && num <= 133) {
        html += `<a class="dk-search-item" href="chapters.html?ch=${num}&paal=${getPaal(num)}">
          <span>📖 அதிகாரம் ${num} (Chapter ${num})</span><span>குறள் ${(num - 1) * 10 + 1}–${num * 10} →</span>
        </a>`;
      }
      searchResults.innerHTML = html || '<div style="color:var(--dk-muted); font-size:13px; text-align:center;">பொருத்தமான முடிவுகள் இல்லை (1–1330).</div>';
    }
    function goFirstResult() {
      const num = parseInt((searchInput.value || "").trim(), 10);
      if (num >= 1 && num <= 1330) {
        const ch = Math.ceil(num / 10);
        window.location.href = `chapters.html?ch=${ch}&paal=${getPaal(ch)}&kural=${num}#kural-${num}`;
      }
    }

    document.getElementById("dkTopSearchBtn").addEventListener("click", openSearch);
    document.getElementById("dkCloseSearchBtn").addEventListener("click", closeSearch);
    searchModal.addEventListener("click", (e) => { if (e.target === searchModal) closeSearch(); });
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") goFirstResult();
      else renderSearchResults();
    });
    document.getElementById("dkSearchGoBtn").addEventListener("click", goFirstResult);

    // Public Auth Modal Controls
    const authModal = document.getElementById("dkPublicAuthModal");
    const openAuthBtn = document.getElementById("dkOpenAuthModalBtn");
    const topAuthBtn = document.getElementById("dkTopAuthBtn");
    const closeAuthBtn = document.getElementById("dkCloseAuthBtn");
    const googleBtn = document.getElementById("dkGoogleSignInBtn");
    const magicLinkBtn = document.getElementById("dkEmailMagicLinkBtn");
    const signOutBtn = document.getElementById("dkSignOutBtn");
    const feedbackEl = document.getElementById("dkAuthFeedback");

    function openAuthModal() {
      closeDrawer();
      feedbackEl.textContent = "";
      authModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    if (openAuthBtn) {
      openAuthBtn.addEventListener("click", openAuthModal);
    }
    if (topAuthBtn) {
      topAuthBtn.addEventListener("click", function() {
        if (isUserSignedIn) {
          openDrawer();
        } else {
          openAuthModal();
        }
      });
    }
    if (closeAuthBtn) {
      closeAuthBtn.addEventListener("click", function() {
        authModal.classList.remove("active");
        document.body.style.overflow = "auto";
      });
    }
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) {
        authModal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });

    // Wire Google OAuth & Email Magic Link via Supabase
    loadSupabaseSDK(function(sb) {
      handleAuthSessionState(sb);

      sb.auth.onAuthStateChange(function() {
        handleAuthSessionState(sb);
      });

      if (googleBtn) {
        googleBtn.addEventListener("click", async function() {
          feedbackEl.textContent = "Redirecting to Google...";
          const { error } = await sb.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.origin + window.location.pathname
            }
          });
          if (error) feedbackEl.textContent = error.message;
        });
      }

      if (magicLinkBtn) {
        magicLinkBtn.addEventListener("click", async function() {
          const email = (document.getElementById("dkMagicEmailInput").value || "").trim();
          if (!email || !email.includes("@")) {
            feedbackEl.textContent = "சரியான மின்னஞ்சலை உள்ளிடவும் (Enter a valid email).";
            return;
          }
          feedbackEl.textContent = "Sending link...";
          const { error } = await sb.auth.signInWithOtp({
            email: email,
            options: {
              emailRedirectTo: window.location.origin + window.location.pathname
            }
          });
          if (error) {
            feedbackEl.textContent = error.message;
          } else {
            feedbackEl.textContent = "✅ உள்நுழைவு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது! (Check your inbox)";
          }
        });
      }

      if (signOutBtn) {
        signOutBtn.addEventListener("click", async function() {
          await sb.auth.signOut();
          window.location.reload();
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountGlobalLayout);
  } else {
    mountGlobalLayout();
  }
})();
