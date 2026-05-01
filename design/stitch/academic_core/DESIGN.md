---
name: Academic Core Design System
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9de'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e8ec'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737780'
  outline-variant: '#c3c6d0'
  surface-tint: '#3c5f93'
  primary: '#002b57'
  on-primary: '#ffffff'
  primary-container: '#1a4173'
  on-primary-container: '#8caee7'
  inverse-primary: '#a8c8ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#442200'
  on-tertiary: '#ffffff'
  tertiary-container: '#643500'
  on-tertiary-container: '#e39e62'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#224779'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#ffdcc1'
  tertiary-fixed-dim: '#ffb779'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6b3b05'
  background: '#faf9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
  success: '#2e7d32'
  info: '#0288d1'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  stats-display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  container_max: 1440px
  sidebar_width: 260px
  gutter: 24px
  container-max: 1440px
  sidebar-width: 260px
---

## Brand & Style

The design system is built on the pillars of **clarity, authority, and focus**. It targets a diverse university ecosystem where information density must be balanced with cognitive ease. The visual style is **Corporate / Modern**, leaning into a sophisticated academic aesthetic that feels like a premium productivity tool rather than a traditional classroom interface.

The emotional response should be one of "structured calm." By using ample whitespace and a disciplined grid, the system reduces "academic anxiety," helping students and staff feel in control of their schedules and data. The aesthetic avoids unnecessary ornamentation, favoring functional elegance and high legibility.

## Colors

The palette is anchored by a **Deep Academic Blue** (#1A4173) which signifies trust and tradition. This is paired with a secondary background color of **Off-White/Blue-Gray** to prevent eye strain during long study sessions.

- **Primary:** Used for key actions, active navigation states, and primary branding.
- **Surface Colors:** Pure white is reserved for cards and content containers, while the page background uses a subtle gray to create a tiered visual depth.
- **Accents:** Semantic colors follow industry standards but are slightly desaturated to maintain the professional tone. Success (Completion), Warning (Deadlines), and Info (Announcements) are clearly distinguishable.

## Typography

This design system utilizes **Inter** for its exceptional legibility and systematic feel. The hierarchy is strictly enforced to manage dense information environments. 

- **Headlines:** Use tighter letter-spacing and heavier weights to command attention.
- **Body Text:** Uses a generous line-height (1.5-1.6) to improve readability of course materials and long-form feedback.
- **Labels:** Small caps or bold weights are used for metadata, such as "Course Code" or "Semester," to differentiate them from primary content.

## Layout & Spacing

The system employs a **12-column fixed-width grid** centered within the viewport for desktop, ensuring content remains readable on ultra-wide monitors. 

- **The Student Home Dashboard** follows a multi-pane layout: a fixed left sidebar for global navigation, a main central feed for "In-Progress Courses" and "Upcoming Tasks," and a right-hand utility rail for "Deadlines" and "Advisor Quick Links."
- **Rhythm:** An 8px-based spacing system (with a 4px half-step for tight components) ensures consistent vertical rhythm. Large 32px or 48px gaps are used to separate major sections like "My Semester at a Glance" from "Current Coursework."

## Elevation & Depth

To maintain a clean, academic feel, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Subtle gray (#F1F5F9) creates the canvas.
- **Level 1 (Cards/Containers):** Pure white surfaces with a 1px border (#E2E8F0). No shadow is used here to keep the UI flat and fast.
- **Level 2 (Hover/Active):** A very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) is applied only when a card is hovered or an element is interactive.
- **Sidebars:** Use a slightly darker tonal fill or a high-contrast primary color to distinguish the "Navigation" zone from the "Work" zone.

## Shapes

The design system adopts a **Soft** shape language. This provides a modern, approachable feel while maintaining the seriousness of a higher-education institution. 

- **Cards & Primary Containers:** Use a 0.5rem (8px) radius.
- **Buttons & Input Fields:** Use a 0.25rem (4px) radius to keep them looking precise and professional.
- **Progress Bars:** Use a fully rounded (pill) shape to emphasize fluidity and movement toward completion.

## Components

### Cards
Cards are the primary organizational unit. On the **Student Home Dashboard**, course cards feature a top-accent border colored by the subject area. Content is padded at 24px with clear distinction between the header (Course Name) and footer (Progress bar).

### Sidebars
The sidebar is minimalist. Icons are stroke-based (2px weight) for clarity. The "Active" state is indicated by a primary blue vertical pill on the left edge and a subtle background tint.

### Progress Indicators
Linear progress bars are used within course cards. On the dashboard, a circular "GPA/Credit" gauge provides a high-level summary. Use the status-success color for completed items and status-info for items in progress.

### Tables
Tables for grades or course lists use a "Ghost" style: no vertical lines, only 1px horizontal dividers. The header row is capitalized and set in `label-caps` for clear distinction.

### Buttons
- **Primary:** Solid Primary Blue with white text.
- **Secondary:** Transparent with a 1px Primary Blue border.
- **Ghost:** No border or background, used for secondary actions like "View All."

### Interactive Chips
Used for tagging assignments as "Overdue," "Submitted," or "Graded." These use a light tint of the semantic color with a darker text color (e.g., light green background with dark green text).