import { useQuery } from "@tanstack/react-query";
import { getHomeApi } from "../api/mapApi";

export const useHomeData = (params = { limit: 12 }) => {
  return useQuery({
    queryKey: ["home-data", params],
    queryFn: () => getHomeApi(params),
  });
};
