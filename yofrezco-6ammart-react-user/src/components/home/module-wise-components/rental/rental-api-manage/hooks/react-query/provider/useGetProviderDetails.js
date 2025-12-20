import MainApi from "api-manage/MainApi";
import { useQuery } from "react-query";

import { onSingleErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import { provider_details_banner } from "../../../ApiRoutes";

// Define a standalone fetcher function
const fetchProviderDetails = async (id) => {
  if(id){ 
    const { data } = await MainApi.get(`${provider_details_banner}/${id}`);
    return data;
  }
  return null;
};

// Use the fetcher function in useQuery
export const useGetProviderDetails = (id) => {
  return useQuery(["provider-details", id], () => fetchProviderDetails(id), {
    onError: onSingleErrorResponse,
    enabled: !!id // Only run query if id exists
  });
};
