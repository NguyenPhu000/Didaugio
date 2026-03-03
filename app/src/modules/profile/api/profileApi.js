import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getMyProfileApi = () =>
  client.get(ENDPOINTS.profile.summary);
