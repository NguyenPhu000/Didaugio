import * as placeV2Service from "../../services/place/placeV2.service.js";

const send = (res, payload) => res.json({ success: true, ...payload });

export async function listPlacesV2(req, res, next) {
  try {
    send(res, await placeV2Service.listPlacesV2(req.query));
  } catch (error) {
    next(error);
  }
}

export async function listMapMarkersV2(req, res, next) {
  try {
    send(res, { data: await placeV2Service.listMapMarkers(req.query) });
  } catch (error) {
    next(error);
  }
}

export async function listNearbyMarkersV2(req, res, next) {
  try {
    send(res, { data: await placeV2Service.listNearbyMarkers(req.query) });
  } catch (error) {
    next(error);
  }
}
