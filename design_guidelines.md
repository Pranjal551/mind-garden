# AI4Health Emergency MVP - Design Guidelines

## Design Approach: Medical Dashboard System

**Selected Framework**: Adapted from Carbon Design System and clinical dashboard patterns  
**Rationale**: Healthcare emergency systems demand clarity, data density, and rapid decision-making. Design prioritizes functional hierarchy, status indicators, and role-specific workflows over aesthetic flourishes.

## Core Design Principles

1. **Medical Clarity First**: Every element serves operational needs - zero decorative complexity
2. **Status-Driven Visual Language**: Color communicates urgency, not brand identity
3. **Role-Optimized Layouts**: Each user type gets a distinct dashboard experience
4. **Mobile-Critical Design**: Ambulance interface prioritizes one-handed operation

---

## Color Palette

### Triage System (Primary Functional Colors)
- **Critical Red**: 0 85% 50% - Severe emergencies, alerts, critical vitals
- **Urgent Yellow**: 45 95% 50% - Moderate urgency, warnings, pending actions
- **Stable Green**: 145 65% 45% - Normal status, completed tasks, stable vitals

### Interface Foundation
**Dark Mode** (Primary for all dashboards):
- Background: 220 15% 10% (deep slate)
- Surface: 220 12% 15% (elevated panels)
- Border: 220 10% 25% (subtle dividers)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%

**Light Mode** (Optional for patient-facing):
- Background: 210 20% 98%
- Surface: 0 0% 100%
- Border: 220 15% 90%
- Text Primary: 220 25% 15%

### Accent & Support
- **Info Blue**: 210 85% 55% - System messages, navigation highlights
- **Chart Purple**: 270 70% 60% - Data visualization secondary

---

## Typography

**Primary**: Inter (Google Fonts) - Clean, clinical readability  
**Monospace**: JetBrains Mono - Vital signs, timestamps, patient IDs

### Hierarchy
- **Dashboard Headers**: 32px/2rem, font-weight 700, tracking -0.02em
- **Section Titles**: 20px/1.25rem, font-weight 600
- **Body Text**: 16px/1rem, font-weight 400, line-height 1.6
- **Critical Data**: 24px/1.5rem, font-weight 700, monospace
- **Metadata**: 14px/0.875rem, font-weight 400, opacity 70%

---

## Layout System

**Spacing Scale**: Tailwind units of **4, 6, 8, 12, 16** for consistent rhythm  
(e.g., p-4 for cards, gap-6 for grids, mb-8 for section breaks)

### Dashboard Grid Structure
- **Patient View**: Single column mobile, 2-column tablet+ (Status + Actions)
- **Ambulance View**: Stacked vertical cards (Map → Patient Details → Navigation)
- **Hospital View**: 3-column desktop (Incoming Queue | Active Cases | Resources)

### Container Strategy
- Full viewport dashboards (h-screen with overflow-y-auto)
- Card-based content: max-w-7xl mx-auto
- Mobile: Full-width with p-4 margins
- Desktop: px-8 with defined max-widths per role

---

## Component Library

### Status Cards
**Triage-coded borders** (border-l-4 with triage colors):
- Patient info card: Photo/ID, vitals, triage badge
- Incident card: Location, time elapsed, urgency ring indicator
- Resource card: Availability count, status dot

### Data Displays
- **Vital Signs Panel**: Grid of labeled values (HR, BP, SpO2) with trend arrows
- **Timeline Component**: Vertical dots connected line showing event history
- **Map Component**: Full-width interactive with live ambulance markers
- **Alert Banners**: Top-positioned, dismissible, severity-colored backgrounds

### Controls
- **Primary Actions**: Solid buttons with triage colors (Accept/Reject/Complete)
- **Secondary Actions**: Outline buttons with subtle hover states (white/10% bg on dark)
- **Emergency Button**: Large, red, pulsing subtle ring animation (scale-105 on press)

### Navigation
- **Top Bar**: Logo left, role indicator center, notifications/profile right
- **Mobile**: Bottom tab bar with icons (Dashboard, Cases, Map, Profile)
- **Desktop**: Sidebar with collapsible sections

---

## Images & Visual Assets

### Hero Section: NO traditional hero image
Instead: **Mission Control Dashboard** immediately visible on load

### Required Images/Icons
1. **Ambulance Icons**: Use Heroicons (truck, map-pin, clock for ETA)
2. **Medical Icons**: Heroicons (heart, clipboard-check, user-group)
3. **Patient Avatars**: Placeholder circles with initials, colored by triage status
4. **Map Markers**: Custom colored pins (SVG) matching triage system
5. **Hospital Badge**: Small logo/icon in top navigation (32px square)

### Image Placement
- **Patient Cards**: 64px circular avatar, left-aligned
- **Ambulance Map**: Full-width embedded map (Mapbox/Leaflet style)
- **Hospital Dashboard**: No decorative images - data visualization only

---

## Role-Specific Experiences

### Patient/User View
- **Layout**: Centered card design, breathing room, reassuring tone
- **Focus**: Clear status updates, estimated times, emergency contact button
- **Colors**: Softer triage indicators, more white space

### Ambulance Driver (Mobile-First)
- **Layout**: Stacked vertical, thumb-zone optimized buttons
- **Focus**: Large map (50% viewport), next action card, one-tap status updates
- **Interactions**: Swipe gestures for case details, large tap targets (min 48px)

### Hospital Dashboard (Desktop-Optimized)
- **Layout**: Multi-column grid, information density maximized
- **Focus**: Queue management, resource allocation, real-time beds/staff counts
- **Features**: Sortable tables, drag-drop triage, bulk actions toolbar

---

## Accessibility & Performance

- **Contrast**: All text meets WCAG AAA on backgrounds (7:1 minimum)
- **Focus States**: 2px blue ring offset on all interactive elements
- **Touch Targets**: 48px minimum on mobile, 40px desktop
- **Loading States**: Skeleton screens for dashboards, pulse animation
- **Error Handling**: Inline validation, red border + icon + message
- **Offline Mode**: Gray indicator banner, cached critical data visible

---

## Animation Strategy

**Minimal, Purposeful Only**:
- Status transitions: 200ms ease color changes
- Emergency alerts: Single pulse on appearance (scale 1 to 1.02)
- Live updates: Subtle fade-in for new items (300ms opacity)
- NO scroll animations, NO decorative motion

---

## Key Design Decisions

✓ Dark mode default for reduced eye strain during long shifts  
✓ Triage colors override brand colors for instant recognition  
✓ Mobile-first ambulance UI with landscape support for in-vehicle tablets  
✓ Dashboard over landing page - users log directly into operational view  
✓ Real-time indicators (pulsing dots, live timestamps) for active monitoring  
✓ Zero marketing fluff - 100% functional healthcare interface