import React, { useEffect, useState } from "react";
import { Box, Grid, NoSsr, Typography, useTheme, styled, useMediaQuery } from "@mui/material";
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
import SearchFilter from "../../../src/components/search/search-filter";
import H1 from "../../../src/components/typographies/H1";
import HighToLow from "../../../src/sort/HighToLow";
import WindowIcon from "@mui/icons-material/Window";
import ViewListIcon from "@mui/icons-material/ViewList";
import Body2 from "../../../src/components/typographies/Body2";

const ViewWrapper = styled(Box)(({ theme, active }) => ({
    display: "flex",
    direction: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "5px",
    cursor: "pointer",
    color:
        active === "true"
            ? theme.palette.primary.main
            : theme.palette.neutral[500],
}));

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
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const [offset, setOffset] = useState(1);
    const [limit] = useState(12);
    const { ref, inView } = useInView();
    const [itemData, setItemData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [currentView, setCurrentView] = useState(0);
    const [sortBy, setSortBy] = useState("");

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

    // Category filter handler
    const selectedCategoriesHandler = (ids) => {
        setSelectedCategories(ids);
    };

    // Sort handler
    const handleSortBy = (value) => {
        setSortBy(value);
    };

    // Filter items by selected categories
    const getFilteredItems = () => {
        let filtered = itemData;

        // Filter by categories
        if (selectedCategories.length > 0 && selectedCategories[0] !== "undefined") {
            filtered = filtered.filter((item) => {
                const itemCategoryId = item?.category_id;
                return selectedCategories.includes(String(itemCategoryId)) ||
                    selectedCategories.includes(itemCategoryId);
            });
        }

        // Sort
        if (sortBy === "high") {
            filtered = [...filtered].sort((a, b) => (b?.price || 0) - (a?.price || 0));
        } else if (sortBy === "low") {
            filtered = [...filtered].sort((a, b) => (a?.price || 0) - (b?.price || 0));
        }

        return filtered;
    };

    const filteredItems = getFilteredItems();

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
                                        <Box>
                                            {itemData?.length > 0 && <Box sx={{ paddingTop: "20px", paddingBottom: "80px" }}>
                                                {/* Search menu header */}
                                                <CustomBoxFullWidth sx={{ marginBottom: "20px" }}>
                                                    <Grid container alignItems="center" justifyContent="center">
                                                        <Grid item xs={9} md={6}>
                                                            <H1
                                                                textTransform="capitalize"
                                                                textAlign="start"
                                                                text={`${filteredItems.length} ${t("Items")} ${t("Found")}`}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={3} md={6} container spacing={2}>
                                                            <Grid item xs={3} md={2}>
                                                                <ViewWrapper
                                                                    active={currentView === 0 ? "true" : "false"}
                                                                    onClick={() => setCurrentView(0)}
                                                                >
                                                                    <WindowIcon />
                                                                    {isSmall ? null : <Body2 text="Grid view" />}
                                                                </ViewWrapper>
                                                            </Grid>
                                                            <Grid item xs={4} md={2}>
                                                                <ViewWrapper
                                                                    active={currentView === 1 ? "true" : "false"}
                                                                    onClick={() => setCurrentView(1)}
                                                                >
                                                                    <ViewListIcon sx={{ fontSize: "30px" }} />
                                                                    {isSmall ? null : <Body2 text="List view" />}
                                                                </ViewWrapper>
                                                            </Grid>
                                                            {isSmall ? null : (
                                                                <Grid item xs={0} md={5.5} align="center">
                                                                    <HighToLow
                                                                        handleSortBy={handleSortBy}
                                                                        sortBy={sortBy}
                                                                    />
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </Grid>
                                                </CustomBoxFullWidth>

                                                {/* Main content with sidebar */}
                                                <Grid container>
                                                    {/* Sidebar */}
                                                    <Grid item xs={0} sm={0} md={0} lg={3} sx={{ display: { xs: 'none', lg: 'block' } }}>
                                                        <CustomBoxFullWidth
                                                            sx={{
                                                                position: 'sticky',
                                                                top: '80px',
                                                                height: 'calc(100vh - 100px)',
                                                            }}
                                                        >
                                                            <SearchFilter
                                                                searchValue=""
                                                                selectedCategoriesHandler={selectedCategoriesHandler}
                                                                currentTab={0}
                                                            />
                                                        </CustomBoxFullWidth>
                                                    </Grid>

                                                    {/* Products Grid */}
                                                    <Grid item xs={12} sm={12} md={12} lg={9}>
                                                        <Grid container rowSpacing={4} columnSpacing={2}>
                                                            {currentView === 0 ? (
                                                                <>
                                                                    {filteredItems?.map((item, index) => (
                                                                        <Grid
                                                                            key={item?.id || index}
                                                                            item
                                                                            xs={6}
                                                                            sm={4}
                                                                            md={3}
                                                                        >
                                                                            <ProductCard
                                                                                item={item}
                                                                                cardheight="365px"
                                                                                cardFor="vertical"
                                                                                cardType="vertical-type"
                                                                            />
                                                                        </Grid>
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {filteredItems?.map((item, index) => (
                                                                        <Grid
                                                                            key={item?.id || index}
                                                                            item
                                                                            xs={12}
                                                                            sm={6}
                                                                            md={6}
                                                                        >
                                                                            <ProductCard
                                                                                item={item}
                                                                                cardheight="150px"
                                                                                cardType="vertical-type"
                                                                                horizontalcard="true"
                                                                                cardFor="list-view"
                                                                            />
                                                                        </Grid>
                                                                    ))}
                                                                </>
                                                            )}
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
                                                    </Grid>
                                                </Grid>
                                            </Box>}
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
