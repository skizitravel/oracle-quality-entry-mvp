# Oracle Quality Receiving Inspection MVP

Phase 1 prototype for a web app that will eventually sit on top of Oracle E-Business Suite and simplify Oracle Quality / Receiving Inspection data entry.

This version intentionally does not connect to Oracle. The app uses a clean `OracleConnector` interface and a `MockOracleConnector` with realistic sample data so a future `VisionEbsConnector` can replace the mock implementation.

## What It Does

- Admins can view mock Oracle collection plans.
- Admins can select a plan and build a simple inspection form.
- The builder supports drag-and-drop fields, sections, display labels, visibility, required, and read-only settings.
- Published forms persist in browser `localStorage`.
- Inspectors can select a published form, enter receipt `R-100245`, load a mock pending inspection receipt, complete required values, and submit.
- Submissions persist in browser `localStorage`.
- Submitted inspections generate a clean printable inspection record page.

## Tech Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- dnd-kit
- Zod
- Local browser storage for Phase 1 persistence

## Project Structure

```text
src/
  app/
    page.tsx
    admin/forms/page.tsx
    admin/forms/new/page.tsx
    admin/forms/[id]/builder/page.tsx
    inspect/page.tsx
    inspect/[formId]/page.tsx
    inspection-record/[submissionId]/page.tsx
  components/
    field-control.tsx
    page-shell.tsx
    receipt-summary.tsx
    ui/
  lib/
    oracle/
      oracle-connector.ts
      mock-oracle-connector.ts
    storage.ts
    types.ts
    utils.ts
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Workflow

1. Go to Admin Form Builder.
2. Create a form from `Incoming Tubing Inspection`.
3. Drag fields into sections and publish the form.
4. Go to Inspector Entry.
5. Open the published form.
6. Load receipt `R-100245`.
7. Complete the inspection and submit.
8. Print the generated inspection record.

## Mock Oracle Integration

The Oracle boundary lives in:

- `src/lib/oracle/oracle-connector.ts`
- `src/lib/oracle/mock-oracle-connector.ts`

The interface currently includes:

- `getCollectionPlans()`
- `getCollectionPlanFields(planId)`
- `getPendingInspectionByReceiptNumber(receiptNumber)`
- `submitInspectionResult(payload)`

## Next Best Steps

1. Add a real persistence layer for forms and submissions.
2. Add server routes or API handlers around the connector boundary.
3. Add user authentication and admin/inspector roles.
4. Add a `VisionEbsConnector` implementation for Oracle EBS APIs.
5. Add automated tests for form validation, receipt loading, and submission.
6. Add PDF export for inspection records.
