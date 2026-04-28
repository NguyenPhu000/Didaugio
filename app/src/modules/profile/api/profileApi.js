import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getMyProfileApi = () => client.get(ENDPOINTS.profile.summary);

export const updateMyProfileApi = (data) =>
  client.put(ENDPOINTS.profile.update, data);

export const updateMyAvatarApi = (avatarUrl) =>
  client.put(ENDPOINTS.profile.updateAvatar, { avatarUrl });
