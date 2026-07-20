# Administrative data source and release policy

## Decision

Di Dau Gio owns its runtime Province → Ward hierarchy in PostgreSQL. The
community repository
[`ThangLeQuoc/vietnamese-provinces-database`](https://github.com/ThangLeQuoc/vietnamese-provinces-database)
is an upstream build artifact, not a runtime service and not an application
schema.

The initial candidate snapshot is release `v3.1.0`, commit
`21419f261aba49dc475e66290f83d4b6d3af4546`, retrieved on
2026-07-20. It is MIT licensed and lists decree coverage
`30/2026/QH16` and `237/NQ-UBTVQH16`, effective 2026-04-30.

The verified JSON contains 34 provinces and 3,321 current second-tier units:
697 wards, 2,611 communes, and 13 special regions. Cần Thơ has official code
`92` and 103 second-tier units in this snapshot. Codes are strings and leading
zeroes are significant.

## Trust and update boundary

- The upstream authors are independent from the Vietnamese government. Source
  decree/GSO claims remain part of the R0 product/technical review.
- Production never calls GitHub or `34tinhthanh.com` at runtime.
- A release is immutable and identified by repository, Git ref, commit, and
  per-file SHA-256 checksums.
- Updates are manual-review-only. They are imported as inactive releases,
  audited, compared with the active release, and activated explicitly.
- Upstream DDL is never executed in `public`; application migrations own all
  canonical tables. Any staging load is confined to `vn_admin_source`.
- Official province/ward codes are never coerced to numbers or inferred from
  display names.

## Artifact handling

The manifest is version-controlled at
`server/test/fixtures/administrative/upstream-manifest.json`. The source JSON,
SQL, and large GIS artifact live in immutable release storage and are supplied
to the import process through `VN_ADMIN_SOURCE_DIR`. Import stops before any DB
write when an artifact is absent or its checksum differs.

GIS is retained in this rollout only for point-in-polygon migration and
coordinate verification. Map presentation, boundary-serving APIs, and map UI
changes are explicitly deferred.

## R0 status

The candidate revision, counts, licence, checksums, and manual release policy
are prepared for joint review. R0 is not approved merely because these files
exist; activation requires explicit product and technical-owner approval.
