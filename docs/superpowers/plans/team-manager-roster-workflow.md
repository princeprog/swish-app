# Team Manager Roster Workflow

Implemented as a division-scoped roster lifecycle:

- `draft`: assigned managers can edit players and submit.
- `submitted`: player changes are locked while admins review.
- `returned`: assigned managers can correct and resubmit.
- `approved`: player changes are locked until an amendment starts.

Publication is separate from workflow status. A division release publishes only
currently approved rosters, using immutable roster versions instead of editable
player rows. Published versions remain visible while amendments are pending.

Release can happen when all active teams in a division are approved, when a
division deadline arrives, or when an admin/owner publishes manually.

Existing public-enabled seasons are grandfathered into approved and published
version 1 during the migration so current public rosters stay visible.
