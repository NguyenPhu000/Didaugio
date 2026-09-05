import { keepPreviousData } from "@tanstack/react-query";

export const getMapPlacesQueryOptions = () => ({
  placeholderData: keepPreviousData,
});
