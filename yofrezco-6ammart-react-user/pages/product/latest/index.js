import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CustomBoxFullWidth } from "../../../src/styled-components/CustomStyles.style";
import MainLayout from "../../../src/components/layout/MainLayout";
import SEO from "../../../src/components/seo";
import { getImageUrl } from "utils/CustomFunctions";
import { useDispatch, useSelector } from "react-redux";
import { useGetConfigData } from "../../../src/api-manage/hooks/useGetConfigData";
import { setConfigData } from "../../../src/redux/slices/configData";
import CssBaseline from "@mui/material/CssBaseline";
import SearchResult from "../../../src/components/home/search";
import { useRouter } from "next/router";

const LatestProductsPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const router = useRouter();

    const { landingPageData, configData } = useSelector(
        (state) => state.configData
    );
    const { data: dataConfig, refetch: configRefetch } = useGetConfigData();

    useEffect(() => {
        if (!configData) {
            configRefetch();
        }
    }, [configData]);

    useEffect(() => {
        if (dataConfig) {
            dispatch(setConfigData(dataConfig));
        }
    }, [dataConfig]);

    return (
        <>
            <CssBaseline />
            <SEO
                title={configData ? t("Latest Products") : "Loading..."}
                image={`${getImageUrl(
                    { value: configData?.logo_storage },
                    "business_logo_url",
                    configData
                )}/${configData?.fav_icon}`}
                businessName={configData?.business_name}
            />
            <MainLayout configData={configData} landingPageData={landingPageData}>
                <CustomBoxFullWidth>
                    <SearchResult
                        key={router.asPath} // Force re-render on route change
                        searchValue=""
                        data_type="latest"
                        configData={configData}
                    />
                </CustomBoxFullWidth>
            </MainLayout>
        </>
    );
};

export default LatestProductsPage;
