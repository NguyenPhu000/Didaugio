import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const submitFeedbackApi = (payload) =>
  client.post(ENDPOINTS.feedback, payload);
