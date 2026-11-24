# Research Compass

A frontend-only research planning workspace built with React, Vite, React Router, JavaScript, and vanilla CSS.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates a production build in `dist`; `npm run preview` serves it. `npm test` runs the deterministic scheduling, data validation, and reducer tests.

## Workflow

Start with the overview, then open a project to edit its stage, milestones, and tasks. Weekly planning connects deliverables to projects and milestones. Daily focus provides microgoals, task filters, proposed schedules, recurring commitments, a focus timer, and saved reflections. Click task or milestone titles to edit them. The journal records unplanned findings independently from tasks; actual-hour analytics use work sessions, so journal descriptions do not double-count time.

The assistant is a **local rule-based simulation**. Proposals require explicit approval. It never calls an external model. Schedule proposals consider fixed commitments, work hours, research days, weekly/Saturday budgets, priorities, dependencies, and breaks. Weekly scheduling fills available blocks across the selected week. Generated plans remain editable through task forms. Recurring commitments support weekly or daily recurrence and single-date edits/cancellations.

All records use a versioned localStorage document. Export/import backups and demo reset are in Settings. A storage failure is surfaced; malformed stored data is preserved until an explicit import/reset. Imported backups are validated before replacement. Demo date defaults to November 24, 2026 and can be changed in the header or Settings. Only the four completed milestones explicitly provided in the specification are initialized as completed; unspecified completion dates remain unknown.

The timeline and insights use current saved records, not reconstructed historical snapshots. Revision history retains approved proposal details and milestone deadline changes. No backend, authentication, real AI, cloud synchronization, or deployment is included. Production hosts must rewrite unknown paths to `index.html` for React Router.
