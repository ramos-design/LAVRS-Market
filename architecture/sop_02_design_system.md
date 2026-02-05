# SOP-2: UI/UX & Design System

## 📋 Goal
Create a premium, racing-inspired (LAVRS aesthetic) design system for the Exhibitor Portal and Admin Dashboard.

## 🎨 Design Tokens

### Colors
- **Space Black**: `#050505` (Main BG)
- **Circuit Dark**: `#0F0F0F` (Surface)
- **LAVRS Red**: `#FF3B3B` (Primary Accent / CTA)
- **Glass White**: `rgba(255, 255, 255, 0.05)` (Borders/Cards)
- **Success Green**: `#00FF85`
- **Warning Gold**: `#FFD700`

### Typography
- **Headings**: 'Outfit' or 'Inter', Semi-bold, Tracked -2%
- **Body**: 'Inter', Regular

## 🏗️ UI Hierarchy

### 1. Exhibitor Portal (User-Facing)
- **Dashboard**: Quick stats (Total events, Unpaid invoices, Active applications).
- **Event Catalog**: Grid of upcoming LAVRS events with badge (Open / Coming Soon / Waitlist).
- **Application Flow**: 3-step wizard (Select size -> Confirm Info -> Finish).

### 2. Admin Dashboard (Organizer-Facing)
- **Master View**: Kanban-style or Table view with status filters.
- **Curation Panel**: Side sheet with exhibitor details, social links, and the BIG buttons: `APPROVE`, `REJECT`, `WAITLIST`.
- **Event Config**: Settings for S/M/L capacities.

## ✨ Interactive Rules
- All buttons must have smooth scale transitions (1.0 -> 0.98).
- Hovering over event cards should reveal subtle glassmorphism glow.
- Status changes (Pending -> Approved) should have a micro-animation.
