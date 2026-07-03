import { useQuery } from "@tanstack/react-query";
import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const useServiceAvailability = (serviceId, date) => {
  return useQuery({
    queryKey: ["service-availability", serviceId, date],
    queryFn: async () => {
      const res = await client.get(
        ENDPOINTS.booking.publicAvailability(serviceId),
        { params: { date } },
      );
      return res.data?.data ?? null;
    },
    enabled: Boolean(serviceId) && Boolean(date),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};
