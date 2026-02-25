import client from "../../../api/client";

/** Get authenticated user's profile */
export const getMyProfileApi = () => client.get("/app/me/profile");
