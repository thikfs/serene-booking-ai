

# BookingAgent Pro – Serenity Minds Therapy Center

## Design System
- **Color palette**: Sage greens and soft blues (calming therapy aesthetic)
- **Typography**: Clean, accessible fonts with proper contrast ratios
- **Overall feel**: Professional, warm, serene

---

## 1. Public Landing Page (`/`)

### Hero Section
- Calming gradient background with sage green/soft blue tones
- Headline: "Your Journey to Mental Wellness Starts Here"
- Subtext: "Compassionate, professional therapy tailored to your needs."
- Floating "Chat with Therapy Assistant" button (fixed position, bottom-right)

### Service List Grid
- Section title: "Our Therapeutic Services"
- Three cards using shadcn Card components:
  - Individual Therapy – 60 min, $120
  - Couples Counseling – 90 min, $180
  - Group Meditation – 45 min, $40

### AI Chat Widget
- Popup chat interface triggered by the floating button
- Chat message area with bot welcome message
- Quick-reply buttons: "Check availability," "Our specialties," "Emergency contacts"
- Text input for custom messages

### Footer
- "Built in AI Web Session 2026, BookingAgent Pro, Student: [Name], Team: [Slug]"

---

## 2. Admin Dashboard (`/admin`)

### Sidebar Layout
- Sidebar navigation with icons: Overview, Service Manager, Agent Persona, Appointment Calendar
- Language selector dropdown (English/Estonian) in the header
- Collapsible sidebar with trigger button

### Overview Page (`/admin`)
- Summary cards: Total appointments, active services, upcoming sessions

### Service Manager (`/admin/services`)
- Table listing services with columns: Name, Price, Duration
- "Add New Service" button opening a dialog form
- Edit button per row opening pre-filled dialog

### Agent Settings (`/admin/agent`)
- Textarea for "Agent System Prompt" with placeholder warm/empathetic text
- Toggle switch: "Information Only" vs "Full Booking" mode

### Appointment Calendar (`/admin/appointments`)
- List view of upcoming sessions showing: Customer Name, Service Type, Date/Time
- Clean table layout with status indicators

---

## 3. Technical Requirements

### Meta Tags
- Add `<meta name="mainor-assignment" content="ai-booking-2026">` and `<meta name="team-slug" content="[Your-Slug]">` to `index.html`

### Placeholder Route
- `/ai-booking-2026.txt` route rendering a simple text layout page

### Data
- All data stored in local state/mock data (no backend)
- Services, appointments, and settings managed with React state

### Routing
- `/` – Landing page
- `/admin` – Dashboard overview
- `/admin/services` – Service manager
- `/admin/agent` – Agent persona settings
- `/admin/appointments` – Appointment calendar
- `/ai-booking-2026.txt` – Text placeholder

