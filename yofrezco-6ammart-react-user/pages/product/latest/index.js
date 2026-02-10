import React, { useEffect, useState } from "react";
import { Box, Grid, NoSsr, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import {
    CustomBoxFullWidth,
    CustomStackFullWidth,
} from "../../../src/styled-components/CustomStyles.style";
import CustomContainer from "../../../src/components/container";
import { useNewArrivalsInfiniteScroll } from "../../../src/api-manage/hooks/react-query/product-details/useNewArrivals";
import ProductCard from "../../../src/components/cards/ProductCard";
import DotSpin from "../../../src/components/DotSpin";
import EmptySearchResults from "../../../src/components/EmptySearchResults";
import { removeDuplicates } from "../../../src/utils/CustomFunctions";
import MainLayout from "../../../src/components/layout/MainLayout";
import SEO from "../../../src/components/seo";
import { getImageUrl } from "utils/CustomFunctions";
import { useDispatch, useSelector } from "react-redux";
import { useGetConfigData } from "../../../src/api-manage/hooks/useGetConfigData";
import { setConfigData } from "../../../src/redux/slices/configData";
import CssBaseline from "@mui/material/CssBaseline";

// Localized Title Image Component for Latest Products
const LocalizedLatestProductsTitle = () => {
    const { i18n, t } = useTranslation();
    const theme = useTheme();
    const currentLang = i18n.language || "en";
    const isSpanish = currentLang === "es" || currentLang.startsWith("es");

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                mb: 2,
                mt: 2
            }}
        >
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    textAlign: "center"
                }}
            >
                {isSpanish ? "Productos Más Recientes" : "Latest Products"}
            </Typography>
        </Box>
    );
};

const LatestProductsPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const dispatch = useDispatch();
    const [offset, setOffset] = useState(1);
    const [limit] = useState(12);
    const { ref, inView } = useInView();
    const [itemData, setItemData] = useState([]);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setLoading(true);
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, []);

    const pageParams = {
        offset,
        limit: limit,
        currentTab: "all"
    };

    const {
        data: latestProducts,
        refetch,
        isFetchingNextPage,
        fetchNextPage,
        isLoading,
        hasNextPage
    } = useNewArrivalsInfiniteScroll(pageParams);

    useEffect(() => {
        refetch();
    }, []);

    const handleItemData = () => {
        if (latestProducts && latestProducts?.pages?.length > 0) {
            latestProducts?.pages?.forEach((item) => {
                setItemData((prev) =>
                    removeDuplicates([...new Set([...prev, ...item?.products])], "id")
                );
            });
        }
    };

    useEffect(() => {
        handleItemData();
    }, [latestProducts]);

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
            if (!isLoading) {
                setOffset((prevState) => prevState + 1);
            }
        }
    }, [inView]);

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
                <NoSsr>
                    <CustomBoxFullWidth>
                        <CustomContainer>
                            <LocalizedLatestProductsTitle />

                            {isLoading ? (
                                <CustomStackFullWidth
                                    sx={{
                                        width: "100%",
                                        height: "70vh",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <DotSpin />
                                </CustomStackFullWidth>
                            ) : (
                                <>
                                    {itemData.length === 0 && loading && !isLoading ? (
                                        <CustomStackFullWidth
                                            sx={{ height: "100%", padding: "2rem" }}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <EmptySearchResults text={t("No Latest Products Found!")} isItems />
                                        </CustomStackFullWidth>
                                    ) : (
                                        <Box sx={{ paddingTop: "20px", paddingBottom: "80px" }}>
                                            <Grid container rowSpacing={4} columnSpacing={2}>
                                                {itemData?.map((item, index) => {
                                                    return (
                                                        <Grid
                                                            key={item?.id || index}
                                                            item
                                                            xs={6}
                                                            sm={4}
                                                            md={3}
                                                            lg={2.4}
                                                        >
                                                            <ProductCard
                                                                item={item}
                                                                cardheight="365px"
                                                                cardFor="latest items"
                                                                cardType="vertical-type"
                                                            />
                                                        </Grid>
                                                    );
                                                })}
                                                {isFetchingNextPage && (
                                                    <CustomStackFullWidth
                                                        sx={{
                                                            width: "100%",
                                                            height: "20vh",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }}
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <DotSpin />
                                                    </CustomStackFullWidth>
                                                )}
                                            </Grid>
                                        </Box>
                                    )}
                                </>
                            )}
                            {latestProducts?.total_size !== itemData?.length && (
                                <CustomBoxFullWidth ref={ref}></CustomBoxFullWidth>
                            )}
                        </CustomContainer>
                    </CustomBoxFullWidth>
                </NoSsr>
            </MainLayout>
        </>
    );
};

export default LatestProductsPage;
