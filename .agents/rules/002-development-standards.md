---
trigger: always_on
---

# Technical Standards — CRITICAL

Follow these standards for all implementation unless the task explicitly requires otherwise.

- **TypeScript First:** Use TypeScript throughout. Prefer strong typing over `any`, implicit types, and unsafe casts.
- **Modular Centralization:** Prefer modular, reusable, and focused code organized around clear responsibilities, while keeping shared business logic and common behavior centralized. Avoid both large monolithic components and unnecessary fragmentation.
- **Next.js Patterns:** Follow idiomatic Next.js patterns and use the appropriate Server/Client Component boundary.
Use these two pointers:
- **Prisma Standard:** Use and maintain Prisma as the standard ORM and data-access layer. Follow the existing Prisma schema, models, migrations, and project conventions; avoid introducing alternative ORM/data-access patterns without a clear requirement.
- **Server by Default:** Prefer Server Components and server-side execution; use Client Components only when browser interaction or client-only APIs require them.
- **Route Handlers:** Use Route Handlers for application server endpoints. Keep validation, authentication, business rules, and response handling clearly separated.
- **Boundary Validation:** Validate external input at application boundaries. Never trust client-provided IDs, permissions, or financial values.
- **Firebase Identity:** Treat Firebase Authentication as the source of truth for user identity and resolve the authenticated user before protected data access.
- **User Isolation:** Every user-owned database query and mutation must be scoped to the authenticated Firebase UID.
- **PostgreSQL Integrity:** Use PostgreSQL as the persistent data source and rely on relational modeling, constraints, indexes, and transactions for data integrity.
- **Financial Precision:** Never use floating-point arithmetic for monetary calculations. Keep financial calculations exact and deterministic.
- **Atomic Updates:** Related financial changes must leave the system in a consistent final state and must not produce partial balance updates.
- **shadcn Foundation:** Use shadcn/ui as the UI foundation and follow the project's shadcn rules.
- **Data-Dense UI:** Optimize interfaces for fast scanning, compact layouts, clear hierarchy, and efficient financial workflows.
- **Responsive First:** Treat mobile and desktop as first-class experiences; do not simply scale one layout to the other.
- **Reusable Components:** Prefer focused, reusable components and shared patterns over duplicated UI or business logic.
- **Separation of Concerns:** Keep presentation, business rules, data access, validation, and authentication responsibilities clearly separated.
- **Server Security:** Keep secrets, privileged operations, Firebase Admin usage, and database credentials server-side.
- **Safe Errors:** Handle expected failures explicitly and return useful errors without exposing secrets, internal details, or sensitive data.
- **Environment Config:** Store environment-specific configuration and secrets in environment variables; never hardcode credentials or deployment-specific values.
- **Async Discipline:** Handle asynchronous work explicitly and avoid unnecessary sequential operations when safe parallelism is possible.
- **Performance:** Minimize unnecessary client JavaScript, database queries, rerenders, and data fetching.
- **Project Consistency:** Follow established project conventions before introducing a new pattern, dependency, abstraction, or folder structure.
- **Minimal Complexity:** Prefer the simplest solution that satisfies the requirement. Avoid unnecessary libraries and abstractions.
- **Docker Compatibility:** Keep implementation compatible with the self-hosted Docker deployment model and Next.js standalone output.
- **Business Rules:** Document non-obvious financial, authentication, and data-integrity rules.
- **Verification:** Before completing work, verify types, validation, authentication boundaries, financial calculations, error handling, and responsive behavior.

## Core Principle

**Prefer idiomatic Next.js + TypeScript, secure server boundaries, exact financial logic, PostgreSQL integrity, shadcn/ui consistency, and minimal complexity.**
