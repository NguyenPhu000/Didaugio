import { Counter, Gauge } from "prom-client";
import { metricsRegistry } from "./registry.js";

export const administrativeLocationTraffic = new Counter({
  name: "administrative_location_requests_total",
  help: "Administrative location requests by API version, route and outcome",
  labelNames: ["version", "route", "outcome", "status_code"],
  registers: [metricsRegistry],
});

export const administrativeLocationCacheOperations = new Counter({
  name: "administrative_location_cache_operations_total",
  help: "Administrative location cache operations by outcome",
  labelNames: ["outcome"],
  registers: [metricsRegistry],
});

export const locationTrafficMiddleware = (version) => (req, res, next) => {
  res.once("finish", () => {
    administrativeLocationTraffic.inc({
      version,
      route: `${req.baseUrl || ""}${req.route?.path || req.path || "unmatched"}`,
      outcome: res.statusCode >= 400 ? "error" : "ok",
      status_code: String(res.statusCode),
    });
  });
  next();
};

export function registerAdministrativeCollectors({ registry, prisma }) {
  const activeRelease = new Gauge({
    name: "administrative_dataset_active_info",
    help: "Active administrative dataset release metadata",
    labelNames: ["release_id", "release_name", "source_commit"],
    registers: [registry],
    async collect() {
      this.reset();
      const release = await prisma.administrativeDatasetRelease.findFirst({
        where: { isActive: true },
        select: { id: true, releaseName: true, sourceCommit: true },
      });
      if (release) {
        this.set(
          {
            release_id: String(release.id),
            release_name: release.releaseName,
            source_commit: release.sourceCommit,
          },
          1,
        );
      }
    },
  });

  const mappingStatus = new Gauge({
    name: "place_administrative_mapping_status",
    help: "Active place counts by canonical administrative mapping status",
    labelNames: ["status"],
    registers: [registry],
    async collect() {
      this.reset();
      const release = await prisma.administrativeDatasetRelease.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!release) return;
      const activeException = {
        status: "open",
        datasetReleaseId: release.id,
      };
      const activeWard = {
        is: { records: { some: { datasetReleaseId: release.id, isActive: true } } },
      };
      const [total, mapped, provinceOnly, unmapped, exceptionOpen] = await Promise.all([
        prisma.place.count({ where: { deletedAt: null } }),
        prisma.place.count({
          where: {
            deletedAt: null,
            administrativeWardCode: { not: null },
            administrativeWard: activeWard,
            administrativeLocationExceptions: { none: activeException },
          },
        }),
        prisma.place.count({
          where: {
            deletedAt: null,
            provinceCode: { not: null },
            administrativeWardCode: null,
            administrativeLocationExceptions: { none: activeException },
          },
        }),
        prisma.place.count({
          where: { deletedAt: null, provinceCode: null, administrativeLocationExceptions: { none: activeException } },
        }),
        prisma.place.count({
          where: { deletedAt: null, administrativeLocationExceptions: { some: activeException } },
        }),
      ]);
      this.set({ status: "total" }, total);
      this.set({ status: "mapped" }, mapped);
      this.set({ status: "province_only" }, provinceOnly);
      this.set({ status: "unmapped" }, unmapped);
      this.set({ status: "exception_open" }, exceptionOpen);
      this.set(
        { status: "stale_mapping" },
        Math.max(total - mapped - provinceOnly - unmapped - exceptionOpen, 0),
      );
    },
  });

  return { activeRelease, mappingStatus };
}
