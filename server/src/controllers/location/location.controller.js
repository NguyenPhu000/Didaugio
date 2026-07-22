import * as locationService from "../../services/location/location.service.js";

const send = (res, result, { cacheable = true } = {}) => {
  res.setHeader(
    "Cache-Control",
    cacheable ? "public, max-age=300, stale-while-revalidate=900" : "no-store",
  );
  res.setHeader("X-Administrative-Dataset-Release", String(result.datasetReleaseId));
  return res.json({
    success: true,
    data: result.data ?? {
      province: result.province,
      ward: result.ward,
      confidence: result.confidence,
    },
    meta: {
      datasetReleaseId: result.datasetReleaseId,
      releaseName: result.releaseName,
    },
  });
};

export const getProvinces = async (_req, res, next) => {
  try {
    send(res, await locationService.listProvinces());
  } catch (error) {
    next(error);
  }
};

export const getWards = async (req, res, next) => {
  try {
    send(res, await locationService.listWards(req.params.provinceCode));
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    send(
      res,
      await locationService.searchLocations({
        provinceCode: req.query.provinceCode,
        query: req.query.q,
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const lookup = async (req, res, next) => {
  try {
    send(res, await locationService.lookupLocation(req.body), { cacheable: false });
  } catch (error) {
    next(error);
  }
};
