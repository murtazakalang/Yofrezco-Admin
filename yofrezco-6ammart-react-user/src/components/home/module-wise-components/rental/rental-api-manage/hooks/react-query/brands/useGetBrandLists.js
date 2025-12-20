import MainApi from "api-manage/MainApi";
import { useQuery } from "react-query";
import { onSingleErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import { vehicle_brand_list } from "../../../ApiRoutes";

// Define a standalone fetcher function
const fetchBrandLists = async () => {
  const { data } = await MainApi.get(
    `${vehicle_brand_list}?offset=1&limit=100`
  );
  return data;
};

// Use the fetcher function in useQuery
export const useGetBrandLists = () => {
  return useQuery("brand-list", fetchBrandLists, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    onError: onSingleErrorResponse,
  });
};
