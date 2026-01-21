import MainApi from "../../MainApi";
import { data_limit, moduleList, popular_items } from "../../ApiRoutes";
import { useQuery, useInfiniteQuery } from "react-query";
import { onErrorResponse, onSingleErrorResponse } from "../../api-error-response/ErrorResponses";
import { getModuleId } from "helper-functions/getModuleId";
import { getZoneId } from "helper-functions/getZoneId";
const getData = async (pageParams) => {
  const { offset, type } = pageParams;
  const { data } = await MainApi.get(
    `${popular_items}?limit=${data_limit}&offset=${offset}&type=${type}`
  );
  return data;
};

export default function useGetPopularItemsNearby(pageParams) {
  return useQuery(["popular-items-nearby", getModuleId(), getZoneId()], () => getData(pageParams), {
    enabled: true,
    cacheTime: 300000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: onErrorResponse,
  });
}

// Infinite scroll version for dedicated page
const getDataWithPagination = async (pageParams) => {
  const { limit, pageParam, type } = pageParams;
  const { data } = await MainApi.get(
    `${popular_items}?limit=${limit}&offset=${pageParam}&type=${type}`
  );
  return data;
};

export function useGetPopularItemsInfiniteScroll(pageParams) {
  return useInfiniteQuery(
    ["popular-items-infinite", getModuleId(), getZoneId()],
    ({ pageParam = 1 }) => getDataWithPagination({ ...pageParams, pageParam }),
    {
      getNextPageParam: (lastPage, allPages) => {
        const nextPage = allPages.length + 1;
        return lastPage?.products?.length > 0 ? nextPage : undefined;
      },
      getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
      retry: 3,
      enabled: false,
      onError: onSingleErrorResponse,
      cacheTime: "0",
    }
  );
}
