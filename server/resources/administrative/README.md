# Vietnamese administrative source artifacts

The application uses a pinned, offline snapshot of
`ThangLeQuoc/vietnamese-provinces-database`. Large source and GIS artifacts are
not committed to this repository.

For an import, place the exact files listed in
`server/test/fixtures/administrative/upstream-manifest.json` in immutable
release storage, then expose the downloaded snapshot directory through
`VN_ADMIN_SOURCE_DIR`. The importer must verify every SHA-256 checksum before
opening a database transaction.

The upstream SQL is evidence only. Never execute its DDL or unqualified
`DROP TABLE` statements in the application `public` schema. Administrative
records are parsed from the pinned JSON and written through the
application-owned staging/canonical migration.

Runtime HTTP synchronization is prohibited. Updating the dataset means making
a new reviewed manifest, importing it as a new inactive release, auditing it,
and explicitly activating it after R0 approval.
