---
name: roles-model
description: How admin/staff/participant roles work across WorkOS and Convex guards
metadata:
  type: project
---

Three tiers. Two different mechanisms.

- **admin** / **staff** = WorkOS RBAC roles. Slug read from JWT claim `role`/`org_role` by `identityRoles` (`convex/sgc/shared.ts`). `ADMIN_ROLES = ['admin','admin_sgc','coordinador_proceso']`, `STAFF_ROLES = ['staff']`, `isManagerRole` = admin OR staff.
- **participant** = NOT a role. Any authenticated WorkOS user whose `identity.subject` matches a `rondaParticipantes.workosUserId` row in Convex. Matched by DB lookup (`convex/access.ts`). Before claim, row holds `pending_` placeholder (`isParticipanteReclamado`).

Guard map:
- SGC writes: `requireSgcManage` (admin+staff). Publish (`publicaciones.ts`): `requireSgcAdmin` (admin only).
- Rounds reads/writes: `requireViewerIdentity`/`requireManagerIdentity` (admin+staff).
- Publication (`convex/sgc/publicaciones.ts`) remains admin-only through `requireSgcAdmin`.
- Tests in `convex/access.test.ts`. Note convex-test needs `api.sgc.index.*` path (not `api.sgc.*`).

WorkOS gotcha: assigning `staff` role errors "user not found" unless the user already exists — invite user first, add to org, then set membership role. Participants need zero WorkOS role config.
