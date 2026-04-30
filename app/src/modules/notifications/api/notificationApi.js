import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getNotificationsApi = (params = {}) =>
  client.get(ENDPOINTS.notifications.list, { params });

export const markNotificationReadApi = (recipientId) =>
  client.put(ENDPOINTS.notifications.markRead(recipientId));

export const markAllNotificationsReadApi = () =>
  client.put(ENDPOINTS.notifications.markAllRead);
