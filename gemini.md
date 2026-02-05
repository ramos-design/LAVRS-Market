# 📜 Project Constitution: LAVRS Market

## 🎯 Behavioral Rules
- **Rule: No Auto-Acceptance**: Application submission never reserves a spot. Status must pass through manual approval ("Pending" -> "Approved").
- **Rule: Blind Spot Selection**: UI does not allow specific map position selection. User selects only size (S/M/L).
- **Rule: 5-Day Payment Logic**: Upon approval, a 5-day timer starts. If unpaid, status becomes "Expired" and capacity is released.
- **Rule: Waitlist Logic**: If a zone is full, CTA changes from "Apply" to "Join Waitlist".
- **Rule: System Pilot Identity**: Follow B.L.A.S.T. protocol and A.N.T. architecture.
- **Rule: Reliability Over Speed**: Never estimate business logic.
- **Rule: Documentation First**: Documentation must precede code changes.

## 🏗️ Architectural Invariants
- **Source of Truth**: Supabase (PostgreSQL). No critical data in local storage.
- **3-Layer Architecture**: Architecture (SOPs), Navigation (Decisions), Tools (Execution).
- **Deployment**: Next.js/Vite on Vercel with Exhibitor Portal and Admin Dashboard.

## 📊 Data Schemas (JSON Payload Shapes)

### Exhibitor Profile
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "brand_name": "string",
  "description": "string",
  "social_links": {
    "instagram": "string",
    "website": "string"
  },
  "contact_info": {
    "email": "string",
    "phone": "string"
  },
  "created_at": "timestamp"
}
```

### Event Configuration
```json
{
  "id": "uuid",
  "name": "string",
  "date": "timestamp",
  "location": "string",
  "status": "draft | active | completed",
  "zones": [
    {
      "type": "S | M | L",
      "capacity": "number",
      "price_czk": "number",
      "current_occupancy": "number"
    }
  ]
}
```

### Application Lifecycle
```json
{
  "id": "uuid",
  "exhibitor_id": "uuid",
  "event_id": "uuid",
  "zone_type": "string",
  "status": "pending | approved | rejected | expired",
  "payment_status": "unpaid | processing | paid",
  "approved_at": "timestamp | null",
  "expires_at": "timestamp | null",
  "invoice_id": "string | null",
  "created_at": "timestamp"
}
```


## 🛠️ Maintenance Log
- **2026-02-05**: Initialized Project Constitution and B.L.A.S.T. protocol.
