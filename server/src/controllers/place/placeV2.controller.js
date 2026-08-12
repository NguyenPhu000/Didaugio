import * as placeV2Service from "../../services/place/placeV2.service.js";
import {
  buildKey,
  getOrLoad,
  TTL,
} from "../../services/cache/cache.service.js";

const send = (res, payload) => res.json({ success: true, ...payload });

export async function listPlacesV2(req, res, next) {
  try {
    const cacheKey = buildKey("places:v2:list", req.query);
    const result = await getOrLoad(
      cacheKey,
      () => placeV2Service.listPlacesV2(req.query),
      TTL.PLACES,
    );
    return send(res, result);
  } catch (error) {
    next(error);
  }
}

export async function listMapMarkersV2(req, res, next) {
  try {
    const cacheKey = buildKey("places:v2:map", req.query);
    const data = await getOrLoad(
      cacheKey,
      () => placeV2Service.listMapMarkers(req.query),
      TTL.PLACES,
    );
    return send(res, { data });
  } catch (error) {
    next(error);
  }
}

export async function listNearbyMarkersV2(req, res, next) {
  try {
    const cacheKey = buildKey("places:v2:nearby", req.query);
    const data = await getOrLoad(
      cacheKey,
      () => placeV2Service.listNearbyMarkers(req.query),
      TTL.PLACES,
    );
    return send(res, { data });
  } catch (error) {
    next(error);
  }
}
