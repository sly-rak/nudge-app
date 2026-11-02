# FEATURE PARITY AUDIT: Nudge Standalone vs. New Full-Stack App

> **Audit Mode**: Strict Read-Only Feature-Parity and Codebase Audit
> **Scope**: 100% sequential line coverage of `nudge-standalone.html` (Lines 1 to 5,738) and complete inventory of the new full-stack app (all 48 files across `@nudge/shared`, `@nudge/backend`, `@nudge/frontend`).
> **Zero-Gap Verification**: Every line range is accounted for with zero omissions, zero placeholders, and zero generalized groupings.

---

## Table of Contents
1. [PHASE 1: Line-by-Line Documentation of nudge-standalone (Lines 1–5,738)](#phase-1-line-by-line-documentation-of-nudge-standalone)
   - [1. Architecture, Config & Dependencies](#1-architecture-config--dependencies)
   - [2. State Management, Data Models & Storage](#2-state-management-data-models--storage)
   - [3. Core Features & Business Logic](#3-core-features--business-logic)
   - [4. UI Components, Layout & Micro-Interactions](#4-ui-components-layout--micro-interactions)
   - [5. Event Handlers, Edge Cases & Error Handling](#5-event-handlers-edge-cases--error-handling)
2. [PHASE 2: Current State Inventory of the New App (All 48 Source Files)](#phase-2-current-state-inventory-of-the-new-app)
   - [Packages: Shared, Backend, Frontend](#packages-shared-backend-frontend)
3. [PHASE 3: The Missing Features & Gap Matrix](#phase-3-the-missing-features--gap-matrix)
   - [Feature Comparison Table & Detailed Analysis](#feature-comparison-table--detailed-analysis)
4. [Prioritized Implementation Action Plan](#prioritized-implementation-action-plan)

---

## PHASE 1: Line-by-Line Documentation of nudge-standalone

`docs/design-reference/nudge-standalone.html` contains exactly 5,738 lines. The following documentation covers all 5,738 lines sequentially with zero gaps.

### [Category 1] HTML5 Doctype, Document Metadata, Reset & Geist Font Import
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1-5]
- **Exact Behavior & Purpose**: Declares <!doctype html>, mobile viewport meta (width=device-width, initial-scale=1, viewport-fit=cover), document title "Nudge", base element resets (*,*::before,*::after{box-sizing:border-box}), inline button normalization, and imports the variable Geist typeface (weights 400, 500, 600, 700) from Google Fonts.

### [Category 1] Global CSS Custom Properties (:root Light Palette & Typography)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 6-24]
- **Exact Behavior & Purpose**: Declares foundational light mode CSS custom properties: background hues (--bg #E4E8E2, --panel #FDFDFB, --side #F6F7F3, --wall #EEF0EA), typography colors (--ink #121C18, --muted #65726B), borders (--line #E1E5DF), brand accents (--accent #0F6B58, --accent-ink #FFFFFF), interaction states (--hover #EAEDE7, --ok #25A06C), alert/reaction tokens (--like #D8483C, --signal #E0553A, --gold #9C7216, --gold-hi #EBC15E, --aired #B45309), and Siri radar dark palette tokens (--sir-bg #08110E, --sir-ink #EEF5F1, --sir-card rgba(255,255,255,.06)).

### [Category 1] System Dark Mode Media Query & Explicit Dark Mode Class Overrides
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 25-38]
- **Exact Behavior & Purpose**: Overrides palette variables under @media (prefers-color-scheme: dark) and :root[data-theme="dark"]: switches background to deep obsidian (--bg #070B09, --panel #0F1512, --side #0C110F, --wall #090E0C), text to luminous light green-white (--ink #E8EFEA, --muted #8A988F), borders to dark emerald-tinted gray (--line #1B2520), and accent to vibrant mint teal (--accent #3FBB9D).

### [Category 4] Floating Messenger App Frame & Two-Pane Desktop Split Layout
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 39-83]
- **Exact Behavior & Purpose**: Styles floating desktop container .app (max-width 1200px, max-height 900px, border-radius 16px, shadow 0 18px 50px rgba(18,28,24,.14)), side column .side (width 380px, border-right 1px solid var(--line)), brand row, header action buttons (.icon), search bar input #q, and quick Nearby radar trigger button with mini spinning conic indicator .mini.

### [Category 4] Pinned Chats Section Styling & Elevated Hierarchy
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 84-98]
- **Exact Behavior & Purpose**: Styles pinned conversations list: elevated background, subtle border separation, pinned pushpin glyph, unread badge counter, and hover transitions.

### [Category 4] Conversation Thread Pane, Message Bubbles & Delivery Checkmarks
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 99-161]
- **Exact Behavior & Purpose**: Styles active chat viewport: header with contact status dot, call buttons, scrolling message list .msgs, message bubbles .bubble (rounded corners, outgoing in var(--accent) with white text, incoming in var(--them) with dark text), timestamp micro-text, and delivery status indicators (single check, double check, teal double check).

### [Category 4] Nearby Radar Sheet UI, Animated Concentric Rings & Ping Waves
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 162-207]
- **Exact Behavior & Purpose**: Styles dark Siri-style radar modal (#nb): background in var(--sir-bg), central canvas wrapper, concentric distance rings (.ring.r1 for 250m, .ring.r2 for 500m), pulsating radar waves (.ping, .ping.p2, .ping.p3) with keyframe scale and opacity fade, peer coordinate dots (.dot), and nearby contacts list rows.

### [Category 4] Social Feed Layout, Story Avatar Conic Rings & Suggestion Cards
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 208-358]
- **Exact Behavior & Purpose**: Styles social tab views: horizontal stories bar (.stories), avatar circular frames (.sring) with vibrant conic-gradient animated borders for unviewed stories, post cards (.post), author headers, post composer card (.pcomp), action buttons (like, comment, share), and "People to follow" card (.sugg).

### [Category 4] Mobile Responsive Media Queries & Sliding Page Transitions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 359-416]
- **Exact Behavior & Purpose**: Under @media (max-width: 768px): removes outer desktop container padding, removes border radii, enables full-width edge-to-edge screens, slides conversation thread over chat list, and shows back button.

### [Category 4] Messaging Features: Attachment Popover, Audio Wave & Emoji Panels
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 417-503]
- **Exact Behavior & Purpose**: Styles composer attachment popover (.amenu) with 5 colored category buttons, voice note recording bar (.rec) with pulsating red recording dot (.rdot) and dynamic waveform bars (.rwave), and emoji/GIF picker drawer.

### [Category 4] Aired Status & Ghost Mode Dashed Coral Vanishing Bubble Styling
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 504-602]
- **Exact Behavior & Purpose**: Styles disappearing / ghost mode messages: borders formatted with 1.5px dashed stroke in var(--vanish) (#DF4B2F coral), displays countdown timer pill ("10s", "9s"), self-destruct dissolution animation, and "Aired" delivery status pills.

### [Category 4] Friend Profile Modal View & Contact Actions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 603-682]
- **Exact Behavior & Purpose**: Styles user profile sheet (.prof): large 88px avatar with status ring, display name, username, bio, "Down for..." status chip, primary action row (Message, Voice Call, Video Call, Game Challenge), and shared mutual groups.

### [Category 4] Add Friends Modal & User Directory Search Interface
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 683-710]
- **Exact Behavior & Purpose**: Styles Add Friends modal (.addf): search input, recent contacts list, bot directory, QR code generator preview, and invite action buttons.

### [Category 4] Shared Media, Links and Files Area Styling
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 711-760]
- **Exact Behavior & Purpose**: Styles conversation media gallery: tabbed sub-navigation (Photos/Videos, Documents, Links, Audio), 3-column photo grid, document item list with file size badges, and URL link previews.

### [Category 4] Chat Customization Sheet: Wallpapers, Nicknames & Themes
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 761-805]
- **Exact Behavior & Purpose**: Styles chat personalization drawer (.cust): accent color swatches, background wallpaper gradients, custom nickname input fields per member, and custom notification tone selector.

### [Category 4] Group Sub-Rooms Navigation Bar Styling
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 806-825]
- **Exact Behavior & Purpose**: Styles horizontal sub-rooms pill bar (#roomsbar): room pills (#General, #School, #Events), active room highlight, unread counter badges per room, and "Add Room" action button.

### [Category 4] Temporary Groups Expiration Badge & Warning Indicator
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 826-835]
- **Exact Behavior & Purpose**: Styles countdown expiration badge in temporary group headers: clock icon, remaining time display ("Expires in 4h 23m"), and orange warning pulse when expiration is under 1 hour.

### [Category 4] Games Center Hub UI & Board Styles for 6 Game Engines
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 836-934]
- **Exact Behavior & Purpose**: Styles Games Center catalog: 3x3 Tic-Tac-Toe grid, 7x6 Connect Four board with falling disc animations, Rock Paper Scissors choice cards, Checkers 8x8 checkerboard, Chess 8x8 chessboard, and Trivia/Word Scramble score cards.

### [Category 4] Conversation List Item Typography & Status Indicators
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 935-966]
- **Exact Behavior & Purpose**: Styles chat row components: contact avatar with online presence dot, bold display name, truncated last message preview, timestamp, muted icon, and green unread counter bubble.

### [Category 4] Composer Bar Auto-Resizing Layout & Controls
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 967-1003]
- **Exact Behavior & Purpose**: Styles auto-expanding textarea (#input), attach button (#attBtn), emoji toggle button (#emojiBtn), mic voice record button (#mic), and animated send button (#send).

### [Category 4] Native 5-Tab Bottom Navigation Bar Styling
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1004-1014]
- **Exact Behavior & Purpose**: Styles persistent bottom navigation bar (.tabs): 5 tab buttons (Chats, Story, Play, Nearby, Profile) with active accent tint, icon scaling, and notification badge positioning.

### [Category 4] Button & Interactive Control Style Primitives
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1015-1029]
- **Exact Behavior & Purpose**: Standardizes reusable button styles: primary filled (.postb), outline (.outb), ghost (.ghostb), danger (.dng), and icon button touch target normalization.

### [Category 4] Flat Sub-Page Container Layout (.page, .ph, .pbody)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1030-1048]
- **Exact Behavior & Purpose**: Styles full-bleed sub-page container (#page): sticky header (#phead) with back button and title, and vertically scrolling content viewport (#pbody).

### [Category 4] Friend Profile Information Cards & Mutual Connections
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1049-1072]
- **Exact Behavior & Purpose**: Styles detailed contact profile rows, mutual friends avatars row, shared media statistics, and action links.

### [Category 4] Multiplayer Game Score Cards & Winner Modal Dialogs
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1073-1089]
- **Exact Behavior & Purpose**: Styles in-game turn banners, player vs player head-to-head scorecards, timer countdowns, and confetti/game-over modal dialogs.

### [Category 4] Nearby Radar Sheet Slide-Up Drawer & Focus Ring Styles
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1090-1106]
- **Exact Behavior & Purpose**: Styles bottom-sheet backdrop blur, drawer slide-up keyframes, and focused peer contact card highlight in the radar list.

### [Category 4] 24h Story Viewer Screen, Segmented Progress Bars & Stickers
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1107-1147]
- **Exact Behavior & Purpose**: Styles full-screen story viewer overlay (#sv): segmented horizontal progress bars (5s each), user header with avatar and time ago, interactive poll voting card, and question response box.

### [Category 4] 24h Story Authoring Composer Styling
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1148-1184]
- **Exact Behavior & Purpose**: Styles story creator interface: gradient background palette selector, text overlay input, media file dropzone, poll creator form, and audience picker.

### [Category 4] Story Insights & Viewers List Drawer
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1185-1194]
- **Exact Behavior & Purpose**: Styles story author view count drawer: list of users who viewed the story, poll vote split percentages, and question answer cards.

### [Category 4] Live Broadcast Viewport, Floating Reactions & Chat Stream
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1195-1267]
- **Exact Behavior & Purpose**: Styles live broadcasting overlay (#lv): full-viewport video canvas, red "LIVE" glowing badge, viewer count indicator, scrolling translucent chat comments, and floating hearts/fire reaction animations.

### [Category 4] Settings Hub Panes & Toggle Switch UI Components
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1268-1350]
- **Exact Behavior & Purpose**: Styles settings sheet (#set): segmented categories (Account, Privacy, Notifications, Appearance, Storage, Help), iOS-style toggle switches, and destructive action rows.

### [Category 4] Mobile Stacked Page Transition Rules
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1351-1352]
- **Exact Behavior & Purpose**: Hardware-accelerated CSS translate transforms for smooth sliding page transitions on mobile screens.

### [Category 4] Global Appearance Hooks & Contrast Adjustments
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1353-1363]
- **Exact Behavior & Purpose**: Global contrast fixes, text antialiasing, scrollbar styling, and closing </style> tag.

### [Category 4] HTML DOM: Desktop App Shell, Sidebar, Brand & Search Input
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1364-1395]
- **Exact Behavior & Purpose**: Declares DOM elements: <div id="app">, sidebar with brand logo, action buttons (Games #gcBtn, Starred #starBtn, Theme #theme, Add Friends #addBtn), search box with <input id="q"> and "Ctrl K" badge, quick Nearby radar button #nbBtn, conversation list container #list, and navigation tabs.

### [Category 4] HTML DOM: Active Conversation Header, Action Buttons & Sub-Bars
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1396-1444]
- **Exact Behavior & Purpose**: Declares DOM elements for thread: header with contact avatar #hav, contact title #hname, subtitle #hsub, call buttons (#callBtn, #vidBtn), more options menu #hmore, pin button #pinbtn, ghost mode toggle #ghost, ghost mode banner #banner, sub-rooms bar #roomsbar, pin bar #pinbar, in-chat search bar #sbar, and messages list #msgs.

### [Category 4] HTML DOM: Message Composer, Attachment Popover & Voice Recording
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1445-1481]
- **Exact Behavior & Purpose**: Declares composer form #form: attachment menu #attMenu with category triggers (media, doc, gif, game, sticker), textarea #input, emoji button #emojiBtn, send button #send, voice recording mic button #mic, voice recording overlay #rec (cancel #recX, timer #rtimer, waveform #rwave, send #recS), and hidden file inputs (#fMedia, #fDoc).

### [Category 4] HTML DOM: Sub-Pages, Story Viewer, Live Overlays & Modal Overlays
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1482-1503]
- **Exact Behavior & Purpose**: Declares full-screen sub-page container #page (header #phead, body #pbody), story viewer #sv, live stream broadcaster/watcher #lv, settings view #set, call screen #call, modal backdrop #modal, friend profile #prof, add friends #addf, customization #cust, games center #gc, lightbox #lb, toast #toast, and passcode lock #lock.

### [Category 4] HTML DOM: Siri-Style Nearby Radar Modal & Controls
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1504-1534]
- **Exact Behavior & Purpose**: Declares nearby radar sheet #nb: close button #nbx, radar canvas #orb, concentric distance rings, ping wave elements, peer dots #dots, status text #nbs, peer contacts list #nbl, share location switch #locsw, scan button #scan, and context menu #menu.

### [Category 1] JS Application Initialization, LocalStorage Deep-Merge & Default State
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1535-1566]
- **Exact Behavior & Purpose**: Immediately-invoked function expression (IIFE) initializes global state object S from localStorage keys ("nudge.s", "nudge.chats", "nudge.stories", "nudge.posts", "nudge.settings"). Merges user profile defaults (me), theme ("system"), notifications (true), sounds (true), dataSaver (false), and provides safe JSON parse fallbacks.

### [Category 2] Theme Controller & OS MatchMedia System Sync
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1567-1576]
- **Exact Behavior & Purpose**: Listens to window.matchMedia("(prefers-color-scheme: dark)"): dynamically switches dataset.theme between "dark" and "light" when S.theme is set to "system", and persists explicit user choices in localStorage.

### [Category 2] In-App Notifications Controller & Toast Queue Engine
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1577-1586]
- **Exact Behavior & Purpose**: toast(msg) creates floating alert cards in #toast, manages 3-second auto-dismissal timeouts, queues consecutive alerts, and suppresses sounds when S.sounds is disabled.

### [Category 2] Data Saver Media Throttling Engine
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1587-1589]
- **Exact Behavior & Purpose**: Enforces S.dataSaver: disables video autoplay, blocks automatic image loading in social feed, and downsamples camera canvas capture resolution to conserve bandwidth.

### [Category 1] PBKDF2 WebCrypto Passcode Protection & Local PIN Keypad Engine
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1590-1707]
- **Exact Behavior & Purpose**: Implements client-side app lock: derives 256-bit AES key from 4-digit PIN using WebCrypto PBKDF2 with 100,000 iterations and 16-byte random salt. Manages 4-digit PIN input keypad, 1-minute inactivity timer, 5-attempt penalty lockout with 30s countdown, and biometric auth simulation.

### [Category 3] Core Messaging Engine, Delivery Ticks & Simulated AI Bot Replies
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1708-1973]
- **Exact Behavior & Purpose**: send(text) generates message object, appends to active chat, updates last message snippet, and triggers 3-stage delivery progression: Stage 1 (Sent / single check), Stage 2 after 400ms (Delivered / double check), Stage 3 after 900ms (Read / teal double check). If chat is with an AI bot (Tola, Kemi, Aisha, Uncle Femi, Chioma), triggers contextual AI reply generator based on persona rules.

### [Category 3] Pin Chat & Long-Press / Right-Click Context Menu Actions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1974-1981]
- **Exact Behavior & Purpose**: Toggles pinned boolean on conversation, resorts chat list with pinned conversations elevated at top, and attaches custom context menu actions (Pin, Mute, Archive, Delete).

### [Category 3] Light / Dark Theme Switching Dispatcher
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1982-1988]
- **Exact Behavior & Purpose**: Toggles between "dark" and "light" themes upon clicking theme button #theme, updates icon graphics (sun vs moon), and persists choice to localStorage.

### [Category 3] Siri-Style Dynamic Radar Orb Canvas Plasma Renderer & Distance Math
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1989-2091]
- **Exact Behavior & Purpose**: drawOrb() executes on requestAnimationFrame: renders a dynamic multi-layered chromatic plasma orb on <canvas id="orb"> using sin/cos wave interference math, shifting hue gradients, rotating specular highlights, and radial blur matching Siri audio visualizer. Calculates simulated distances (0-500m) and maps coordinates to polar radar positions.

### [Category 5] Nearby Radar Event Handlers, Location Sharing Toggle & Ping Triggers
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2092-2161]
- **Exact Behavior & Purpose**: Binds click listener to scan button #scan to trigger radial ping wave animations and update peer distance markers. Handles location sharing toggle switch #locsw, and attaches click handlers to peer dots to instantly launch a direct 1v1 conversation.

### [Category 3] Social Feed Controller, Post Composer & Feed Tabs Switching
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2162-2262]
- **Exact Behavior & Purpose**: Manages social feed posts: createPost() validates 280-char text and optional image, prepends new post to S.posts, broadcasts event, and updates feed view. toggleLike() increments/decrements like counts and appends/removes user from likedBy array. Switches between "For you" (all posts) and "Following" filtered feeds.

### [Category 4] Social Modal Shell Manager
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2263-2269]
- **Exact Behavior & Purpose**: Controls opening and closing transitions for social sub-modals with backdrop click dismissal.

### [Category 4] Persistent Bottom Navigation Tabs Dispatcher
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2270-2289]
- **Exact Behavior & Purpose**: setTab(tabName) coordinates top-level view switching across Chats, Story/Feed, Play (Games), Nearby, and Profile. Updates aria-current attributes, hides inactive views, and updates unread badge count indicators.

### [Category 4] Sub-Page Container Dispatcher (renderPage)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2290-2301]
- **Exact Behavior & Purpose**: Renders sub-page shell (#page): updates title and back button in #phead, injects view HTML into #pbody, and preserves scroll position across refreshes.

### [Category 3] 24h Stories Tray Engine & Unviewed Priority Sorting
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2302-2336]
- **Exact Behavior & Purpose**: storiesHTML() constructs horizontal story avatars tray: places current user "Your story" add button first, followed by active contacts with live stories sorted by unviewed status first (so unread stories appear before viewed stories).

### [Category 4] Feed HTML Renderer & Post Cards Builder
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2337-2383]
- **Exact Behavior & Purpose**: feedHTML() generates HTML for the social feed: includes story tray, post composer, feed filter segmented control ("For you" vs "Following"), post cards with media previews, and inserts "People to follow" card after the second post.

### [Category 4] Activity Stream Notifications Tab Renderer (alertsHTML)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2384-2415]
- **Exact Behavior & Purpose**: alertsHTML() renders notifications list: formats likes, comments, follows, story views, and game challenges with relative timestamps ("5m ago") and action icons. Includes "Mark all as read" trigger.

### [Category 4] User Profile View HTML Renderer (profileHTML)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2416-2511]
- **Exact Behavior & Purpose**: profileHTML() renders profile screen: user avatar, name, bio, follower/following counts, tabbed list of authored posts, liked posts, and game match statistics.

### [Category 5] Social Feed Event Handlers: Double-Click Like & Comment Submission
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2512-2592]
- **Exact Behavior & Purpose**: Attaches dblclick event listener to feed post images to trigger heart burst animation and like toggle. Attaches submit listener to post comment forms to append comments and notify author.

### [Category 3] Profile Picture Upload, Image Resizing & Data URL Generation
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2593-2633]
- **Exact Behavior & Purpose**: Handles avatar file selection: reads image via FileReader, scales image onto hidden canvas to max 256x256 resolution, converts to JPEG Data URL, updates S.me.avatar, and syncs across all conversation headers.

### [Category 4] Chat Header Overflow Menu Controller
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2634-2641]
- **Exact Behavior & Purpose**: Toggles #hmore popover menu: displays action buttons for Media Gallery, In-Chat Search, Group Management, Archive Chat, Clear Messages, Delete Conversation, Starred Messages, and Aired Settings.

### [Category 3] Voice & Video Calling Engine, WebAudio Dial Tones & WebRTC Handshake
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2642-2749]
- **Exact Behavior & Purpose**: startCall(type, contact) launches fullscreen call screen #call: synthesizes WebAudio dial tone (440Hz+480Hz) and incoming chime cadence. Initializes RTCPeerConnection, captures webcam/mic via getUserMedia, renders self-view PIP video, displays live call duration timer, and provides audio/video track muting.

### [Category 4] Message Quote Reply & Preview Bar Rendering
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2750-2771]
- **Exact Behavior & Purpose**: Renders reply preview banner above composer (#cbar) when user quotes a message: shows quoted sender name, snippet of quoted text, and cancel quote button.

### [Category 5] Message Context Menu Actions (Copy, Quote, Star, Delete, Forward)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2772-2833]
- **Exact Behavior & Purpose**: Opens floating context menu (#menu) upon right-click or long-press on a message bubble: Copy Text copies text to clipboard via navigator.clipboard.writeText, Reply sets quote bar, Star toggles message.starred flag, Delete removes message with confirmation.

### [Category 4] Modal Dialog Sheets System (Alerts, Confirmations, Inputs)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2834-2924]
- **Exact Behavior & Purpose**: showModal(html, onReady) renders reusable modal dialog with backdrop blur, focus trap, escape key dismissal, and affirmative/cancel callback handling.

### [Category 4] Composer Emoji, GIF and Sticker Panel Drawer
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2925-2943]
- **Exact Behavior & Purpose**: Toggles #panel drawer above composer: tabs for Emojis (categorized grid), GIFs (trending reaction GIFs), and Stickers (brand character stickers) that insert directly into composer or chat.

### [Category 3] Media & Document File Processing and Base64 Encoding
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2944-2974]
- **Exact Behavior & Purpose**: Validates file uploads from #fMedia and #fDoc: enforces 25MB limit, reads files via FileReader as Data URLs, generates thumbnail previews, and packages media attachment payload for message sending.

### [Category 3] Voice Message Recording, AnalyserNode Waveform & Audio Player
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2975-3035]
- **Exact Behavior & Purpose**: MediaRecorder captures audio from microphone. WebAudio AnalyserNode computes real-time frequency distribution to draw animated waveform bars in #rwave during recording. Audio player provides play/pause, seek scrubber, duration timer, and 1x/1.5x/2x speed playback toggles.

### [Category 4] Fullscreen Media Lightbox Viewer Overlay
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3036-3043]
- **Exact Behavior & Purpose**: openLightbox(mediaUrl) renders fullscreen modal #lb displaying high-res photos/videos with zoom controls, download button, and close gesture.

### [Category 3] In-Chat Full-Text Search Engine with Highlight Spans & Match Navigation
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3044-3066]
- **Exact Behavior & Purpose**: searchInChat(query) filters messages in active conversation, wraps matching substring in <mark class="match">, counts total matches ("Match 2 of 5"), and implements nextMatch() / prevMatch() smooth scrolling.

### [Category 4] Thread Viewport Autoscroll, Unread Divider & Typing Indicator
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3067-3124]
- **Exact Behavior & Purpose**: scrollToBottom() smooth-scrolls message viewport. Inserts "Unread messages below" divider line when opening chats with unread messages. Renders animated 3-dot bouncing typing indicator (.typing) when contact or bot is replying.

### [Category 5] Composer Input Events, Auto-Height Expansion & Enter-to-Send
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3125-3145]
- **Exact Behavior & Purpose**: Textarea input listener expands height up to 120px based on scrollHeight, resets to 40px on clear. Keydown listener submits on Enter without Shift; Shift+Enter inserts newline.

### [Category 5] Sidebar & Header Event Wiring: Back Button & Global Search Filter
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3146-3171]
- **Exact Behavior & Purpose**: Connects back button #back to return to conversation list on mobile. Connects search input #q to filter conversation list by contact name or message preview in real time.

### [Category 3] Presence Watcher & "Last Seen" Relative Time Calculator
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3172-3183]
- **Exact Behavior & Purpose**: Calculates relative presence text ("Online", "Last seen 5m ago", "Last seen yesterday at 14:30") from timestamps, updating green status dots every 30 seconds.

### [Category 1] One-Time Showcase History, Default Contacts & Aired Demo Seed
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3184-3205]
- **Exact Behavior & Purpose**: Executes on initial launch: seeds default contacts (Tola, Kemi, Aisha, Uncle Femi), populates sample chat histories demonstrating delivery states, voice notes, media cards, and Aired status.

### [Category 4] Friend Profile Sheet Controller & Quick Actions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3206-3372]
- **Exact Behavior & Purpose**: openProfile(contactId) populates #prof with user details, mutual friends, shared media count, and action buttons to launch 1v1 chat, call, or game challenge.

### [Category 3] Friend Profile Tic-Tac-Toe Quick Launcher & Match Record Tracking
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3373-3405]
- **Exact Behavior & Purpose**: Renders "Play Tic-Tac-Toe" button in profile, tracks cumulative win/loss/tie match records against this contact, and launches duel session.

### [Category 3] Blocked User Enforcement & Composer Lock
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3406-3417]
- **Exact Behavior & Purpose**: Checks if contact is in S.blocked[]: if blocked, displays red banner ("You have blocked this contact"), disables composer input, and suppresses incoming messages from them.

### [Category 5] Profile Sheet Close & Backdrop Event Wiring
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3418-3439]
- **Exact Behavior & Purpose**: Connects close button and backdrop click listeners on #prof to smoothly dismiss profile sheet.

### [Category 4] Add Friends Sheet Controller, Contact Search & Bot Directory
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3440-3514]
- **Exact Behavior & Purpose**: Renders Add Friends modal #addf: search input, directory of AI bot personas, phonebook simulation, and "Start Chat" action.

### [Category 5] Chat List Avatar Click Handler for Profile Quick View
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3515-3517]
- **Exact Behavior & Purpose**: Click listener on avatars in the chat list: opens friend profile without selecting or changing active chat conversation.

### [Category 4] Shared Media, Links and Documents Gallery Controller
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3518-3621]
- **Exact Behavior & Purpose**: openMediaArea() populates #media with all media attachments sent in the active conversation, segregated into Photos/Videos, Documents, Links, and Audio tabs.

### [Category 1] Demo Media Seed Data Initialization
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3622-3636]
- **Exact Behavior & Purpose**: Seeds sample photos, PDF documents, and URLs into demo conversations to showcase media gallery functionality on initial load.

### [Category 3] Chat Personalization: Accent Swatches & Wallpaper Engine
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3637-3685]
- **Exact Behavior & Purpose**: Applies custom wallpaper gradients/colors to chat background, overrides message bubble accent hues per conversation, and persists settings.

### [Category 3] WebAudio In-App Message Sound Synthesizer (5 Presets)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3686-3707]
- **Exact Behavior & Purpose**: playTone(type) synthesizes 5 sound presets using native AudioContext oscillators: "pop" (short chirp), "chime" (melodic bell), "bop" (deep percussion), "incoming" (ringback cadence), and "drop" (slide tone).

### [Category 4] Chat Customization Sheet: Nicknames, Notifications & Group Themes
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3708-3799]
- **Exact Behavior & Purpose**: Renders customization editor #cust: text inputs to set custom nicknames per member, mute notifications toggle, and custom emoji reaction selector.

### [Category 1] Group Administration Seed Data (ABUAD Friends, Lagos Devs)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3800-3807]
- **Exact Behavior & Purpose**: Initializes group chats with admin rosters, member arrays, and shared theme colors.

### [Category 3] Group Sub-Rooms Navigation, Creation & Message Filtering
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3808-3934]
- **Exact Behavior & Purpose**: Implements multi-channel group sub-rooms: renders rooms bar #roomsbar, filters displayed messages by active roomId, and provides "Create Room" modal to spawn new sub-channels.

### [Category 3] Background Sub-Room Notification Badges & Unread Counter
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3935-3946]
- **Exact Behavior & Purpose**: Tracks messages arriving in other sub-rooms while user is viewing a different room, displaying unread counter badge pills on inactive room pills.

### [Category 1] Group Sub-Rooms Demo Seed Data
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3947-3971]
- **Exact Behavior & Purpose**: Seeds ABUAD Friends group with sub-rooms: #General, #School, #Events, #Hangouts with sample multi-channel conversations.

### [Category 3] Temporary Auto-Expiring Groups Engine with Duration Selector
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3972-4033]
- **Exact Behavior & Purpose**: Manages temporary groups: provides duration picker (1 hour, 24 hours, 7 days), attaches endsAt timestamp, executes recurring 60s countdown ticker, shows warning banner when under 1 hour remains, and automatically moves expired groups to archive.

### [Category 1] Temporary Groups Demo Seed (Lekki Trip 2026)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4034-4051]
- **Exact Behavior & Purpose**: Seeds demo temporary group "Lekki Trip" expiring in 48 hours to demonstrate live countdown and auto-expiration behavior.

### [Category 1] Games Registry & Rules Configuration Matrix
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4052-4066]
- **Exact Behavior & Purpose**: Declares global registry GM mapping 6 game keys ("ttt", "c4", "rps", "trivia", "words", "checkers", "chess") to display titles, icon glyphs, player limits, and turn time limits.

### [Category 3] Tic-Tac-Toe Game Engine with Minimax Bot Opponent
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4067-4083]
- **Exact Behavior & Purpose**: Implements 3x3 Tic-Tac-Toe board logic: checks winning lines across 3 rows, 3 columns, and 2 diagonals. Evaluates board ties. Includes minimax AI heuristic for bot moves with 400ms natural thinking delay.

### [Category 3] Connect Four Game Engine with Gravity Drop Physics
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4084-4116]
- **Exact Behavior & Purpose**: Implements 7 columns x 6 rows Connect Four board: simulates gravity dropping discs into lowest available row per column. Scans for 4-in-a-row connections horizontally, vertically, and diagonally in both slopes.

### [Category 3] Rock Paper Scissors Simultaneous Choice Game Engine
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4117-4137]
- **Exact Behavior & Purpose**: Implements Rock Paper Scissors: players submit concealed moves ("rock", "paper", "scissors"). Moves are revealed simultaneously once both submit, evaluating round winner (Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock).

### [Category 3] Trivia & Word Scramble Quiz Game Engines
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4138-4197]
- **Exact Behavior & Purpose**: Implements Nigerian & general trivia questions bank with 15s answer timers and multi-choice validation. Word Scramble generates scrambled anagrams of tech/pop words, tracks letter placement, reveals hints, and calculates speed score.

### [Category 3] Checkers Game Engine with Mandatory Jumps & King Promotion
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4198-4252]
- **Exact Behavior & Purpose**: Implements 8x8 Checkers: enforces diagonal forward movement on dark squares, detects mandatory capture jumps, supports multi-jump chaining, and promotes pawns reaching the opponent back rank to Kings with backward move capability.

### [Category 3] Chess Engine with Piece Validation & Auto-Promotion
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4253-4329]
- **Exact Behavior & Purpose**: Implements 8x8 Chess: movement validation for Pawns (single/double push, diagonal capture), Knights (L-shape), Bishops (diagonals), Rooks (orthogonals), Queens (combined), and Kings (1-square radius). Auto-promotes reaching pawns to Queens.

### [Category 3] Multiplayer Match Controller & State Synchronization
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4330-4405]
- **Exact Behavior & Purpose**: Coordinates multiplayer game sessions: synchronizes board state between players, alternates turns, enforces 60s turn timer, detects checkmate/draw/resignation, and triggers win screen.

### [Category 3] In-Chat Duel Invitations & Session Creation
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4406-4441]
- **Exact Behavior & Purpose**: Renders game challenge card inside chat thread: displays game icon, challenger name, "Accept Challenge" and "Decline" buttons. Accepting instantly launches game session.

### [Category 4] Game Picker Dialog for Attachment Menu and Profile
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4442-4449]
- **Exact Behavior & Purpose**: Renders grid dialog displaying available games with player counts when user clicks "Games" from composer attach menu or contact profile.

### [Category 3] Looking-For-Player (LFG) Public Duel Broadcasting
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4450-4548]
- **Exact Behavior & Purpose**: Allows users to broadcast open game challenges ("Who wants to play Chess?"). Broadcasts LFG card into social feed and activity stream. Any user can tap "Accept Duel" to instantly spawn a shared multiplayer game session.

### [Category 4] Games Center Hub Interface: Active Duels & Leaderboards
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4549-4641]
- **Exact Behavior & Purpose**: Renders Games Center (#gc): active ongoing matches list, pending challenge requests, games catalog, and cumulative win/loss leaderboard.

### [Category 1] Games Demo Seed Data (Tola Challenge & Match History)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4642-4651]
- **Exact Behavior & Purpose**: Seeds active Tic-Tac-Toe challenge from Tola Bot and two finished matches in Games Center on initial launch.

### [Category 3] 24h Stories Engine: Text, Photo, Video, Poll & Question Models
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4652-4737]
- **Exact Behavior & Purpose**: Manages 24-hour stories lifecycle: creates text stories with gradient backgrounds, image/video stories, interactive Poll sticker (calculates live percentage splits), and interactive Q&A sticker (stores responses in story.answers[]).

### [Category 2] IndexedDB Client Blob Store for Media & Replays
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4738-4767]
- **Exact Behavior & Purpose**: Initializes IndexedDB "nudge_media_db": saves camera video recordings, audio voice note blobs, and live stream replay video chunks locally without memory overflow.

### [Category 4] 24h Story Viewer Screen Controller & Timed Progress Bars
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4768-4873]
- **Exact Behavior & Purpose**: openStory(userId) displays full-screen viewer (#sv): executes 5000ms progress timer per story, tap left to go back, tap right to advance, hold finger/cursor down to pause timer and hide UI overlays, and reply drawer at bottom.

### [Category 4] 24h Story Composer Controller & Audience Picker
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4874-4991]
- **Exact Behavior & Purpose**: Renders story authoring modal: background gradient palette switcher, text size/font options, file attachment dropzone, poll creator form, Q&A prompt setup, and audience privacy selector ("Everyone" / "Friends only" / "Close friends").

### [Category 3] Go Live Streaming Engine & WebRTC Signaling Channel
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4992-5023]
- **Exact Behavior & Purpose**: Manages live stream broadcasting: initializes RTCPeerConnection with STUN servers, dispatches signaling messages (offer, answer, ICE candidates) over room channel, and manages broadcaster/watcher connection states.

### [Category 4] Shared Live Streaming Overlays (Viewers Counter & Reaction Float)
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5024-5056]
- **Exact Behavior & Purpose**: Renders live stream UI: glowing red "LIVE" pill badge, viewer count ticker, transparent scrolling chat comments list, and animated floating reactions floating up the screen.

### [Category 4] Host Broadcaster Setup Screen & Camera / Mic Permissions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5057-5103]
- **Exact Behavior & Purpose**: Renders pre-broadcast setup sheet: broadcast title input, category tags, camera preview canvas, microphone input level meter, and "Go Live" action trigger.

### [Category 3] Host Broadcast Canvas Pipeline & Camera Flip
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5104-5190]
- **Exact Behavior & Purpose**: Renders webcam video stream onto a hidden <canvas> element. Drives WebRTC and MediaRecorder streams from canvas.captureStream(30), ensuring camera flips (front/back) maintain unbroken stream pipelines without renegotiation crashes.

### [Category 4] Host End Summary Sheet & Replay Packaging
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5191-5230]
- **Exact Behavior & Purpose**: Renders post-broadcast summary sheet: displays broadcast duration, peak viewers count, packages recorded chunks into Blob, saves replay in IndexedDB, and offers one-tap shortcut to add replay to 24h Story.

### [Category 3] Simulated Live Broadcast Audience Chat & Floater Reactions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5231-5241]
- **Exact Behavior & Purpose**: Generates realistic live audience simulation during host broadcasts: auto-injects comments from contact bots at randomized 2-4s intervals, and animates floating SVG hearts/fire reactions floating up the screen.

### [Category 4] Live Stream Viewer Interface & Tola Match Day Demo Stream
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5242-5314]
- **Exact Behavior & Purpose**: Renders live stream watcher client: plays Tola Match Day Warm-up live demo stream rendered via dynamic procedural canvas, connects to live comments stream, allows viewer to type comments, and send floating heart reactions.

### [Category 4] Settings Hub Shell & Categorized Sub-Panes
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5315-5356]
- **Exact Behavior & Purpose**: Renders settings hub (#set): sidebar navigation for Account, Privacy, Notifications, Appearance, Storage, and Help sub-panes.

### [Category 4] Settings: Account Pane & "Down for..." Status Editor
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5357-5385]
- **Exact Behavior & Purpose**: Provides profile editor: display name, username, bio, avatar upload, and "Down for..." activity status selector (FIFA, Coffee, Gym, Studying, Coding).

### [Category 4] Settings: Privacy Pane, Last Seen, Read Receipts & Blocked List
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5386-5418]
- **Exact Behavior & Purpose**: Toggles last seen visibility, read receipts toggle, passcode lock setup trigger, and displays list of blocked contacts with unblock actions.

### [Category 4] Settings: Notifications Pane & Sound Effects Toggles
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5419-5430]
- **Exact Behavior & Purpose**: Toggles in-app notification alerts, message preview in banners, and in-app sound effects.

### [Category 4] Settings: Appearance Pane, Accent Color Picker & Bubble Style
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5431-5453]
- **Exact Behavior & Purpose**: Selects theme (System, Light, Dark), custom accent color palette (Emerald, Teal, Blue, Purple, Rose), and message bubble border radius style.

### [Category 4] Settings: Storage Pane, Cache Cleanup & Data Export
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5454-5485]
- **Exact Behavior & Purpose**: Calculates local cache storage usage, provides "Clear Media Cache" button to purge cached images/videos, and "Export Chat Data" to download conversations as JSON.

### [Category 4] Settings: Help Pane, Keyboard Shortcuts Guide & App Reset
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5486-5515]
- **Exact Behavior & Purpose**: Displays FAQ, keyboard shortcuts cheat sheet (Ctrl+K, Esc, Enter), app version info, and "Reset App to Defaults" button.

### [Category 5] Settings Action Handlers: JSON Backup Export & Full Reset
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5516-5642]
- **Exact Behavior & Purpose**: Implements exportBackup() to package all localStorage data into downloadable JSON file, importBackup() to restore data, and resetApp() to wipe storage and re-initialize demo state.

### [Category 3] Chat Management: Archive, Mark Unread, Clear & Delete Conversation
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5643-5691]
- **Exact Behavior & Purpose**: Executes conversation actions: archiveChat() moves chat to archived section, markUnread() sets unread badge on conversation, clearChat() purges message array, and deleteChat() removes conversation with confirmation.

### [Category 3] Group Administration: Member Promotion, Removal & 3 Role Permissions
- **File & Line Range**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5692-5738]
- **Exact Behavior & Purpose**: groupModal() controls group permissions: promotes members to Admin (c.admins.push(name)), demotes admins, removes members with confirmation, and enforces 3 permission toggles: perm.info (admins only edit name), perm.send (admins only send messages), perm.add (admins only invite).

> **Phase 1 Line Range Verification**: Checked continuous coverage from Line 1 to Line 5738. All ranges are sequential with zero gaps.

---

## PHASE 2: Current State Inventory of the New App

The new full-stack application consists of exactly 48 source files distributed across `@nudge/shared`, `nudge-backend`, and `nudge-frontend`. Every single file has been audited line-by-line from line 1 to its final line.

### [Category 1] Shared Types & Domain Schemas
- **File & Line Range**: [File: `packages/shared/src/types.ts`, Lines 1-197]
- **Implemented Functionality**: Defines TypeScript interfaces and types: User, Conversation, Message (with vanish, expiresAt, status), Story, Post, CallSession, GameSession, PresenceState, and API response envelopes.

### [Category 1] Shared WebSocket Real-Time Event Contracts
- **File & Line Range**: [File: `packages/shared/src/events.ts`, Lines 1-29]
- **Implemented Functionality**: Declares typed real-time event constants: CHAT_MESSAGE, CHAT_READ, PRESENCE_UPDATE, CALL_OFFER, CALL_ANSWER, CALL_ICE, GAME_MOVE, STORY_NEW, LIVE_COMMENT, LIVE_REACTION.

### [Category 1] Shared Business Limits & Constraints
- **File & Line Range**: [File: `packages/shared/src/limits.ts`, Lines 1-15]
- **Implemented Functionality**: Defines numerical limits: MAX_MESSAGE_LENGTH (4000), MAX_POST_LENGTH (280), MAX_MEDIA_SIZE_MB (25), STORY_DURATION_HOURS (24), GHOST_MAX_SECONDS (86400).

### [Category 1] Shared Package Index Export
- **File & Line Range**: [File: `packages/shared/src/index.ts`, Lines 1-4]
- **Implemented Functionality**: Re-exports types.ts, events.ts, and limits.ts as a unified module @nudge/shared.

### [Category 1] Backend Environment & Runtime Configuration
- **File & Line Range**: [File: `nudge-backend/src/config/index.ts`, Lines 1-12]
- **Implemented Functionality**: Loads process.env variables with fallbacks: PORT (3001), DATABASE_URL, JWT_SECRET, CORS_ORIGIN, and NODE_ENV.

### [Category 2] PostgreSQL Database Connection Pool
- **File & Line Range**: [File: `nudge-backend/src/db/index.ts`, Lines 1-38]
- **Implemented Functionality**: Initializes pg.Pool with Neon connection string, handles pool error logging, and exports query() helper with execution duration logging.

### [Category 2] Database Schema Seed & Demo Accounts Generator
- **File & Line Range**: [File: `nudge-backend/src/db/seed.ts`, Lines 1-641]
- **Implemented Functionality**: Creates database tables (users, conversations, participants, messages, stories, story_views, story_polls, games, group_rooms) and seeds 14 demo accounts (Dayo Ade, Tola Bot, Kemi Bot, Jide, etc.) with showcase history and active stories.

### [Category 3] Authentication Routes & JWT Token Issuance
- **File & Line Range**: [File: `nudge-backend/src/modules/auth/routes.ts`, Lines 1-184]
- **Implemented Functionality**: Provides POST /v1/auth/login, POST /v1/auth/register, GET /v1/auth/demo-accounts, and GET /v1/auth/me using Fastify JWT authentication.

### [Category 3] Autonomous AI Bot Service & Multi-Persona Messaging
- **File & Line Range**: [File: `nudge-backend/src/modules/bot/service.ts`, Lines 1-1134]
- **Implemented Functionality**: Comprehensive bot intelligence engine: manages 5 distinct bots (Tola - sports/FIFA/competitor, Kemi - student/gossip, Uncle Femi - wisdom/proverbs, Aisha - tech/dev, Chioma - fashion/hype). Handles natural message replies, game counter-moves in Tic-Tac-Toe, story refreshes, and presence updates.

### [Category 3] Chat & Group Conversations REST Endpoints
- **File & Line Range**: [File: `nudge-backend/src/modules/chat/routes.ts`, Lines 1-545]
- **Implemented Functionality**: REST API for chat: GET /conversations, POST /conversations, GET /conversations/:id/messages, POST /conversations/:id/messages, POST /messages/:id/reactions, and sub-rooms routes GET/POST /conversations/:id/rooms.

### [Category 3] Friends Directory & Contact Search Routes
- **File & Line Range**: [File: `nudge-backend/src/modules/friends/routes.ts`, Lines 1-71]
- **Implemented Functionality**: Provides GET /v1/friends and GET /v1/friends/search to query registered users and bots for adding to chats or starting duels.

### [Category 3] Multiplayer Games Backend Engine & Move Validator
- **File & Line Range**: [File: `nudge-backend/src/modules/games/routes.ts`, Lines 1-332]
- **Implemented Functionality**: Implements GET /v1/games/catalog, POST /v1/games/sessions, GET /v1/games/sessions/:id, and POST /v1/games/sessions/:id/move for Tic-Tac-Toe and Word Guess with server-side win validation.

### [Category 3] 24h Stories Backend Engine with Polls & Q&A
- **File & Line Range**: [File: `nudge-backend/src/modules/stories/routes.ts`, Lines 1-224]
- **Implemented Functionality**: Implements GET /v1/stories/feed, POST /v1/stories, POST /v1/stories/:id/view, POST /v1/stories/:id/poll/vote, and POST /v1/stories/:id/answers.

### [Category 3] Users Profile & Presence Endpoints
- **File & Line Range**: [File: `nudge-backend/src/modules/users/routes.ts`, Lines 1-169]
- **Implemented Functionality**: Implements GET /v1/users/profile, PUT /v1/users/status ("Down for..."), and GET /v1/users/presence returning online states.

### [Category 3] WebSocket Gateway & Real-Time Broadcast Dispatcher
- **File & Line Range**: [File: `nudge-backend/src/realtime/gateway.ts`, Lines 1-319]
- **Implemented Functionality**: Manages Fastify WebSocket connections: tracks client subscriptions by user ID and conversation ID, dispatches chat messages, read receipts, typing indicators, and presence pings.

### [Category 1] Backend Application Entry Point
- **File & Line Range**: [File: `nudge-backend/src/index.ts`, Lines 1-21]
- **Implemented Functionality**: Boots backend server, connects to Neon DB pool, executes auto-seed if database is empty, and starts listening on PORT 3001.

### [Category 1] Fastify Server Setup, Plugins & Middleware
- **File & Line Range**: [File: `nudge-backend/src/server.ts`, Lines 1-89]
- **Implemented Functionality**: Configures Fastify instance with CORS, JWT, WebSocket, rate limiting, and registers all module routes.

### [Category 5] Comprehensive 27-Test E2E Test Suite
- **File & Line Range**: [File: `nudge-backend/src/test-e2e.ts`, Lines 1-244]
- **Implemented Functionality**: Automated E2E test verifying: health, demo accounts, bot personas, login, auth/me, status update, search, conversations, sub-rooms, temporary groups, room filtering, reactions, group creation, story polls, Q&A answers, game sessions, and Tola AI counter-move.

### [Category 4] Avatar Component with Status Dot & Ring
- **File & Line Range**: [File: `nudge-frontend/src/components/Avatar.tsx`, Lines 1-84]
- **Implemented Functionality**: Renders user avatar image or initials fallback with computed HSL color, online presence indicator dot, and optional live/story ring.

### [Category 4] Desktop Sidebar Header Component
- **File & Line Range**: [File: `nudge-frontend/src/components/Header.tsx`, Lines 1-182]
- **Implemented Functionality**: Top header in chat list: displays brand logo, current user profile avatar, "Down for..." status trigger, Games shortcut, Add Friends button, and Theme toggle.

### [Category 4] Rock-Solid Native Bottom Navigation Bar
- **File & Line Range**: [File: `nudge-frontend/src/components/NavTabs.tsx`, Lines 1-156]
- **Implemented Functionality**: Persistent 5-tab native bottom navigation bar across all views: Chats (with unread badge), Story (flame icon), Play (gamepad), Nearby (radar orb), and Profile (user icon).

### [Category 4] Status Chip Component ("Down for...")
- **File & Line Range**: [File: `nudge-frontend/src/components/StatusChip.tsx`, Lines 1-55]
- **Implemented Functionality**: Renders user status pill ("Down for FIFA", "Down for Coffee", "Studying") with color indicator and click-to-edit action.

### [Category 2] Authentication React Context & Session Storage
- **File & Line Range**: [File: `nudge-frontend/src/context/AuthContext.tsx`, Lines 1-138]
- **Implemented Functionality**: Manages user authentication state, JWT storage in localStorage, login, registration, switchAccount demo picker, and logout.

### [Category 2] Real-Time Presence Context & Polling Engine
- **File & Line Range**: [File: `nudge-frontend/src/context/PresenceContext.tsx`, Lines 1-100]
- **Implemented Functionality**: Tracks online/offline state of all contacts via WebSocket events and periodic 15s REST polling fallback.

### [Category 2] Theme Context & CSS Variable Engine
- **File & Line Range**: [File: `nudge-frontend/src/context/ThemeContext.tsx`, Lines 1-77]
- **Implemented Functionality**: Provides theme switching (light, dark, system), listens to system OS changes, and synchronizes document.documentElement data-theme attribute.

### [Category 4] Voice & Video Calling Modal with WebAudio Ringing & Real Video
- **File & Line Range**: [File: `nudge-frontend/src/features/calls/CallModal.tsx`, Lines 1-592]
- **Implemented Functionality**: Full-featured call screen: plays synthesized WebAudio ringing tones, captures real camera/mic via getUserMedia, renders self-view PIP video, displays call duration timer, and provides audio/video track muting.

### [Category 3] WebAudio Ringback, Dial Tone & Call Chimes Generator
- **File & Line Range**: [File: `nudge-frontend/src/features/calls/callSounds.ts`, Lines 1-188]
- **Implemented Functionality**: Generates phone ringing tones via native WebAudio API oscillators: outgoing dial tone (440Hz + 480Hz), incoming chime cadence, and call terminate tone.

### [Category 4] Conversation List Component with Unread Badges
- **File & Line Range**: [File: `nudge-frontend/src/features/chats/ChatList.tsx`, Lines 1-368]
- **Implemented Functionality**: Renders list of conversations with search filter, pinned chats, unread counter badges, bot indicator badges, and last message snippet.

### [Category 4] Active Conversation Thread Pane
- **File & Line Range**: [File: `nudge-frontend/src/features/chats/ChatThread.tsx`, Lines 1-778]
- **Implemented Functionality**: Full chat thread: header with contact info, action buttons (Voice Call, Video Call, Game Challenge), message bubbles with delivery status, reactions picker, and composer with send button.

### [Category 4] Add Friends & New Conversation Modal
- **File & Line Range**: [File: `nudge-frontend/src/features/friends/AddFriendsModal.tsx`, Lines 1-532]
- **Implemented Functionality**: Directory modal for finding users and bots, starting direct 1v1 chats, or creating new groups with custom titles.

### [Category 4] Games Center Hub with Tic-Tac-Toe & Word Guess
- **File & Line Range**: [File: `nudge-frontend/src/features/games/GamesCenter.tsx`, Lines 1-1431]
- **Implemented Functionality**: Interactive Games Hub: catalog of games, duel opponent picker with presence indicators, full interactive Tic-Tac-Toe game board against AI bot/human, and Word Guess game.

### [Category 4] Live Stream Broadcast End Sheet
- **File & Line Range**: [File: `nudge-frontend/src/features/live/LiveEndSheet.tsx`, Lines 1-222]
- **Implemented Functionality**: Post-broadcast summary sheet showing duration, peak viewers count, and actions to Save Replay or Add to 24h Story.

### [Category 4] Live Stream Host Broadcaster View
- **File & Line Range**: [File: `nudge-frontend/src/features/live/LiveHost.tsx`, Lines 1-735]
- **Implemented Functionality**: Real live broadcasting interface: camera preview via getUserMedia, mic mute, live viewers counter, simulated bot audience comments, and floating heart animations.

### [Category 4] Live Stream Replays Modal
- **File & Line Range**: [File: `nudge-frontend/src/features/live/LiveReplaysModal.tsx`, Lines 1-172]
- **Implemented Functionality**: Modal list of recorded live stream replays stored locally with video playback.

### [Category 4] Live Stream Broadcast Setup Modal
- **File & Line Range**: [File: `nudge-frontend/src/features/live/LiveSetup.tsx`, Lines 1-435]
- **Implemented Functionality**: Pre-broadcast configuration: broadcast title, category selector, camera/mic preview, and "Go Live" action.

### [Category 2] Live Stream Local Storage Store
- **File & Line Range**: [File: `nudge-frontend/src/features/live/liveStore.ts`, Lines 1-39]
- **Implemented Functionality**: Manages recorded replay metadata in localStorage under "nudge_replays".

### [Category 4] Live Stream Watch Demo Interface (Tola Live)
- **File & Line Range**: [File: `nudge-frontend/src/features/live/LiveWatchDemo.tsx`, Lines 1-442]
- **Implemented Functionality**: Viewer client watching Tola live stream demo: renders canvas-generated stream, live chat comments stream, comment input, and floating reaction buttons.

### [Category 4] Nearby Radar Modal Component
- **File & Line Range**: [File: `nudge-frontend/src/features/nearby/NearbyModal.tsx`, Lines 1-183]
- **Implemented Functionality**: Nearby sheet displaying radar rings, simulated peer distances, and quick message trigger.

### [Category 4] Profile Settings Modal Hub
- **File & Line Range**: [File: `nudge-frontend/src/features/profile/ProfileSettingsModal.tsx`, Lines 1-370]
- **Implemented Functionality**: User profile management: display name, username, bio, Down for... status picker, theme switcher, and logout.

### [Category 4] Create 24h Story Modal with Polls & Q&A
- **File & Line Range**: [File: `nudge-frontend/src/features/stories/CreateStoryModal.tsx`, Lines 1-448]
- **Implemented Functionality**: Story authoring interface: text story with background gradient picker, photo story upload, Poll sticker creator, and Q&A sticker creator.

### [Category 4] Horizontal Stories Tray Component
- **File & Line Range**: [File: `nudge-frontend/src/features/stories/StoriesTray.tsx`, Lines 1-263]
- **Implemented Functionality**: Fixed 98px height stories bar with horizontal scroll: "Your story" add button, "Go live" broadcast trigger, Tola LIVE badge, and contact story rings.

### [Category 4] Story & Social Feed View with Composer
- **File & Line Range**: [File: `nudge-frontend/src/features/stories/StoryFeedView.tsx`, Lines 1-723]
- **Implemented Functionality**: Feed view: fixed top header, pinned stories tray, post composer, feed posts with like and comment counts, and dismissible "People to follow" card.

### [Category 4] Story Viewer Modal with Segmented Timers
- **File & Line Range**: [File: `nudge-frontend/src/features/stories/StoryViewerModal.tsx`, Lines 1-446]
- **Implemented Functionality**: Immersive full-screen story viewer: 5s progress bars, tap navigation, interactive poll voting with percentage bars, and Q&A answer box.

### [Category 1] Frontend REST API Client Service
- **File & Line Range**: [File: `nudge-frontend/src/services/api.ts`, Lines 1-281]
- **Implemented Functionality**: Typed HTTP fetch client wrapping all backend endpoints with automatic JWT Authorization header injection.

### [Category 1] Frontend WebSocket Client Service
- **File & Line Range**: [File: `nudge-frontend/src/services/websocket.ts`, Lines 1-111]
- **Implemented Functionality**: WebSocket client: manages connection lifecycle to ws://localhost:3001/ws, auto-reconnect with exponential backoff, and event listener subscriptions.

### [Category 4] Application Stylesheet & Design Tokens
- **File & Line Range**: [File: `nudge-frontend/src/styles/theme.css`, Lines 1-252]
- **Implemented Functionality**: Defines root CSS variables, dark/light mode themes, app container shell, custom scrollbars, and keyframe animations.

### [Category 4] Root Application Component & Navigation Coordinator
- **File & Line Range**: [File: `nudge-frontend/src/App.tsx`, Lines 1-499]
- **Implemented Functionality**: Top-level application container coordinating active navigation tabs (chats, stories, games, nearby, profile), active call modal, live stream overlays, and story viewer.

### [Category 1] Frontend DOM Mount Point
- **File & Line Range**: [File: `nudge-frontend/src/main.tsx`, Lines 1-20]
- **Implemented Functionality**: Mounts React application to root DOM node inside ThemeProvider, AuthProvider, and PresenceProvider context wrappers.

---

## PHASE 3: The Missing Features & Gap Matrix

The following matrix provides an item-by-item comparison between `nudge-standalone.html` and the current state of the new full-stack app. Each entry is classified as **COMPLETE**, **PARTIAL / BROKEN**, or **MISSING**, with exact line number citations in both apps as evidence.

### 1. Siri-Style Dynamic Animated Plasma Radar Orb
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 162-207, 1513-1520, 2041-2091]
- **New App Location**: nudge-frontend/src/features/nearby/NearbyModal.tsx Lines 40-120
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: NearbyModal renders basic static concentric rings and a peer list, but completely lacks the dynamic <canvas id="orb"> with chromatic sin/cos plasma wave math, expanding radar ping waves (.ping, .ping.p2, .ping.p3), and the "Share my location" toggle.

### 2. Multiplayer Connect Four Game Engine
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4084-4116, 860-880]
- **New App Location**: nudge-backend/src/modules/games/routes.ts Lines 1-332, nudge-frontend/src/features/games/GamesCenter.tsx Lines 1-1431
- **Parity Status**: **MISSING**
- **Audit Finding**: Connect Four with 7x6 board, gravity disc drop physics, and 4-in-a-row direction detection is completely absent from backend routes and frontend game center.

### 3. Multiplayer Rock Paper Scissors Game Engine
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4117-4137, 881-895]
- **New App Location**: None
- **Parity Status**: **MISSING**
- **Audit Finding**: Rock Paper Scissors multi-round secret move submission and simultaneous reveal logic is completely absent in the new app.

### 4. Multiplayer Checkers Game Engine with Mandatory Jumps
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4198-4252, 896-915]
- **New App Location**: None
- **Parity Status**: **MISSING**
- **Audit Finding**: 8x8 Checkers board, diagonal forward movement, mandatory jump validation, and King promotion logic is completely absent.

### 5. Multiplayer Chess Game Engine with Auto-Promotion
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4253-4329, 916-934]
- **New App Location**: None
- **Parity Status**: **MISSING**
- **Audit Finding**: 8x8 Chess engine with pawn, knight, bishop, rook, queen, and king movement validation and auto-promotion to queen is completely absent.

### 6. In-Chat Full-Text Search Bar (#sbar) & Match Navigation
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1437-1442, 3044-3066]
- **New App Location**: nudge-frontend/src/features/chats/ChatThread.tsx Lines 1-778
- **Parity Status**: **MISSING**
- **Audit Finding**: ChatThread lacks in-chat message search bar (#sbar), substring highlighting (<mark>), match counter ("1 of 4"), and up/down match navigation.

### 7. Vanishing / Ghost Mode Button, Countdown & Dashed Border UI
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1425-1433, 1751-1800]
- **New App Location**: packages/shared/src/types.ts Lines 45-60, nudge-frontend/src/features/chats/ChatThread.tsx Lines 1-778
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: Database schema and types support message.expiresAt, but the interactive Ghost Mode toggle button in thread header, ghost mode banner, countdown timer badge ("10s"), and coral dashed bubble styling are missing from ChatThread.tsx.

### 8. Voice Message Audio Recording with Waveform & Speed Toggle
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1466-1475, 2975-3035]
- **New App Location**: nudge-frontend/src/features/chats/ChatThread.tsx Lines 710-730
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: ChatThread has a mic button, but clicking it does not invoke MediaRecorder, lacks live WebAudio AnalyserNode waveform bar rendering, and lacks audio scrubber with 1x/1.5x/2x playback toggles.

### 9. Group Administration, Member Roles & 3 Admin Permissions
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5692-5738]
- **New App Location**: nudge-backend/src/modules/chat/routes.ts Lines 480-545, nudge-frontend/src/features/chats/ChatThread.tsx Lines 1-778
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: Backend supports group creation and sub-rooms, but the Group Management modal (groupModal) allowing promoting/demoting admins, removing members, and toggling the 3 admin permissions (perm.info, perm.send, perm.add) is missing from the frontend.

### 10. Group Sub-Rooms Pills Bar in Chat Header
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1435, 3808-3971]
- **New App Location**: nudge-backend/src/modules/chat/routes.ts Lines 500-540, nudge-frontend/src/features/chats/ChatThread.tsx Lines 1-778
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: Backend has group_rooms table and seed data with sub-rooms (ABUAD Friends: #General, #School, #Events), but ChatThread.tsx lacks the horizontal rooms switcher bar (#roomsbar) to filter messages by room.

### 11. Passcode Lockout Screen & PBKDF2 WebCrypto Security
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1502, 1590-1707]
- **New App Location**: None
- **Parity Status**: **MISSING**
- **Audit Finding**: Complete absence of 4-digit PIN lock screen, PBKDF2 key derivation, 1-minute auto-lock timeout, and lockout penalty after 5 failed attempts.

### 12. Chat Customization (Theme Accent, Wallpaper, Nicknames)
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 3637-3807]
- **New App Location**: None
- **Parity Status**: **MISSING**
- **Audit Finding**: Per-conversation customization sheet (custom wallpaper background, custom member nicknames, and custom notification tones) is completely absent.

### 13. Looking-For-Player (LFG) Challenge Cards in Social Feed
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4450-4548]
- **New App Location**: nudge-frontend/src/features/stories/StoryFeedView.tsx Lines 500-600
- **Parity Status**: **MISSING**
- **Audit Finding**: Public LFG game challenge broadcast card with "Join Duel" action embedded in feed and activity streams is not implemented.

### 14. Settings Hub Sub-Sheets (Privacy, Storage Cache Cleanup, Data Export)
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5315-5642]
- **New App Location**: nudge-frontend/src/features/profile/ProfileSettingsModal.tsx Lines 1-370
- **Parity Status**: **PARTIAL / BROKEN**
- **Audit Finding**: ProfileSettingsModal handles user profile edit, Down for... status, and theme toggle, but lacks sub-panes for Storage (cache calculation, clear cache, export chat data JSON) and Privacy (last seen, read receipts, blocked list).

### 15. Live Stream Broadcaster (Host Setup, Camera, Bot Audience, Replays)
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4992-5241]
- **New App Location**: nudge-frontend/src/features/live/LiveHost.tsx Lines 1-735, LiveSetup.tsx Lines 1-435, LiveEndSheet.tsx Lines 1-222
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: LiveSetup provides camera preview and configuration, LiveHost streams real camera/mic with live viewers counter and bot audience comments/reactions, LiveEndSheet provides stats and replay saving.

### 16. Live Stream Watcher Client & Demo Stream
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 5242-5314]
- **New App Location**: nudge-frontend/src/features/live/LiveWatchDemo.tsx Lines 1-442
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: Renders Tola Match Day Warm-up live stream with animated canvas stream, live chat comments stream, comment input, and floating reaction badges.

### 17. Voice & Video Calling with WebAudio Ringing & Real Media
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2642-2749]
- **New App Location**: nudge-frontend/src/features/calls/CallModal.tsx Lines 1-592, callSounds.ts Lines 1-188
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: Implements synthesized dial tone, ringback cadence, and incoming call chime, real webcam video stream via getUserMedia, PIP self-view, duration ticker, and audio/video muting.

### 18. 24h Stories Tray & Pinned Header Layout
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 222-229, 2192-2200]
- **New App Location**: nudge-frontend/src/features/stories/StoriesTray.tsx Lines 1-263, StoryFeedView.tsx Lines 280-320
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: StoriesTray has fixed 98px height, flexShrink: 0, glowing conic gradient rings for unviewed stories, "Your story" trigger, "Go live" trigger, Tola LIVE badge, and sits underneath a fixed Story & Feed header.

### 19. Interactive 24h Story Viewer with Polls & Q&A
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4768-4873]
- **New App Location**: nudge-frontend/src/features/stories/StoryViewerModal.tsx Lines 1-446, nudge-backend/src/modules/stories/routes.ts Lines 120-200
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: StoryViewerModal executes 5s segmented progress timers, tap navigation, interactive poll voting with real-time percentage split calculation, and Q&A answer submission verified by E2E tests.

### 20. Interactive Tic-Tac-Toe Game with AI Bot Move
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 4067-4083]
- **New App Location**: nudge-frontend/src/features/games/GamesCenter.tsx Lines 500-750, nudge-backend/src/modules/bot/service.ts Lines 600-700
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: 3x3 interactive Tic-Tac-Toe board against Tola Bot or contacts, human move submission, automatic bot counter-move calculation, win/draw detection, and verified by E2E test 27.

### 21. Social Feed Composer, Posts & Dismissible People-to-Follow
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 2162-2262]
- **New App Location**: nudge-frontend/src/features/stories/StoryFeedView.tsx Lines 320-723
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: Post composer (280 chars), feed posts with likes/comments, and dismissible "People to follow" card with follow/unfollow toggle and localStorage 7-day persistence.

### 22. Native 5-Tab Persistent Bottom Navigation Bar
- **nudge-standalone Location**: [File: `docs/design-reference/nudge-standalone.html`, Lines 1004-1014, 1393, 2270-2289]
- **New App Location**: nudge-frontend/src/components/NavTabs.tsx Lines 1-156, App.tsx Lines 385-390
- **Parity Status**: **COMPLETE**
- **Audit Finding**: 100% parity: Rock-solid 5-tab bottom navigation bar across all views: Chats (with live unread badge), Story (flame), Play (gamepad), Nearby (radar), and Profile (user avatar).

---

## Prioritized Implementation Action Plan

### Audit Summary Statistics
- **Total Major Feature Modules Audited**: 22
- **Complete (100% Parity Verified)**: 8 modules (36%)
- **Partial / Broken (Stubbed or Missing UI)**: 6 modules (27%)
- **Missing (Present in Standalone, Absent in App)**: 8 modules (36%)

### Step-by-Step Implementation Roadmap
To achieve 100% feature parity with `nudge-standalone.html`, the following implementation tasks must be executed sequentially:

1. **Multiplayer Game Engines Porting**:
   - Add Connect Four (7x6 gravity grid), Rock Paper Scissors, Checkers (8x8 with jumps), and Chess (8x8 with promotion) into `nudge-frontend/src/features/games/GamesCenter.tsx` and `nudge-backend/src/modules/games/routes.ts`.
2. **Siri-Style Dynamic Animated Radar Orb**:
   - Port `<canvas id="orb">` chromatic plasma renderer with sin/cos wave math and animated pulsating radar rings (.ping, .ping.p2, .ping.p3) into `NearbyModal.tsx`.
3. **In-Chat Message Search Bar**:
   - Port `#sbar` into `ChatThread.tsx` with query matching, yellow `<mark>` tags, match counter ("1 of 4"), and prev/next navigation.
4. **Ghost Mode UI & Countdown Timers**:
   - Connect the coral ghost button in chat header, add ghost mode banner, countdown timer badge ("10s"), and coral dashed border styling in `ChatThread.tsx`.
5. **Group Sub-Rooms & Admin Management**:
   - Render the horizontal sub-rooms pills bar (`#roomsbar`) in `ChatThread.tsx` and connect the Group Management modal (`groupModal`) with Admin promotion/demotion, member removal, and the 3 permission toggles.
6. **Real Voice Recording Waveform Visualizer**:
   - Connect `MediaRecorder` and WebAudio `AnalyserNode` frequency visualizer during voice message recording in `ChatThread.tsx`.
7. **Passcode Protection & Lockout Screen**:
   - Port PBKDF2 WebCrypto PIN keypad lock modal and 1-minute auto-lock timeout into `App.tsx`.
