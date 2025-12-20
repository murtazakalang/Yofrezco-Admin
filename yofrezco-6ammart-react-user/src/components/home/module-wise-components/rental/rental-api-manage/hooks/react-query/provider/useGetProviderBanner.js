import { useQuery } from "react-query";
import { provider_banner } from "../../../ApiRoutes";;
import { onSingleErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import MainApi from "api-manage/MainApi";
const getBanners = async (id) => {
  const { data } = await MainApi.get(`${provider_banner}/${id}`);
  return data;
};

export default function useGetProviderBanner(id) {
  return useQuery("store-banners", () => getBanners(id), {
    enabled: !!id,
    onError: onSingleErrorResponse,
    retry: false,
  });
}
