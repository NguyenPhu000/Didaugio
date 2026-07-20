import assert from "node:assert/strict";
import test from "node:test";
import { Registry } from "prom-client";

import { registerAdministrativeCollectors } from "../src/observability/administrativeMetrics.js";

test("administrative collectors expose active release and migration status", async () => {
  const registry = new Registry();
  const prisma = {
    administrativeDatasetRelease: {
      findFirst: async () => ({ id: 7, releaseName: "v3.1.0", sourceCommit: "abc" }),
    },
    place: {
      count: async ({ where }) => {
        if (where.administrativeWardCode) return 12;
        if (where.provinceCode?.not === null) return 4;
        if (where.provinceCode === null) return 1;
        if (where.administrativeLocationExceptions?.some) return 3;
        return 20;
      },
    },
  };

  registerAdministrativeCollectors({ registry, prisma });
  const output = await registry.metrics();

  assert.match(output, /administrative_dataset_active_info\{release_id="7",release_name="v3.1.0",source_commit="abc"\} 1/u);
  assert.match(output, /place_administrative_mapping_status\{status="mapped"\} 12/u);
  assert.match(output, /place_administrative_mapping_status\{status="province_only"\} 4/u);
  assert.match(output, /place_administrative_mapping_status\{status="unmapped"\} 1/u);
  assert.match(output, /place_administrative_mapping_status\{status="exception_open"\} 3/u);
  assert.match(output, /place_administrative_mapping_status\{status="stale_mapping"\} 0/u);
});
