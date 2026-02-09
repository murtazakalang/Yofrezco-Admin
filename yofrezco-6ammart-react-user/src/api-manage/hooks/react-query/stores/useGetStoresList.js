import { typewise_store_api } from "api-manage/ApiRoutes";
import { useQuery } from "react-query";
import { getToken } from "helper-functions/getToken";
import MainApi from "../../../MainApi";
import { onSingleErrorResponse } from "../../../api-error-response/ErrorResponses";

const getData = async () => {
    const userToken = getToken();
    const { data } = await MainApi.get(typewise_store_api);
    return data;
};

export default function useGetStoresList(handleSuccess) {
    return useQuery("get-stores-list", () => getData(), {
        enabled: false,
        onSuccess: handleSuccess,
        onError: onSingleErrorResponse,
    });
}
