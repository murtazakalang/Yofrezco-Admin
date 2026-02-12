import React, { useEffect, useState, useRef } from "react";
import { Box, Grid, NoSsr, styled, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
	CustomBoxFullWidth,
	CustomStackFullWidth,
} from "../../styled-components/CustomStyles.style";
import CustomContainer from "../container";
import { useGetFlashSalesInfinityScroll } from "../../api-manage/hooks/react-query/useGetFlashSales";
import ProductCard from "../cards/ProductCard";
import CustomCountdown from "../countdown";
import CounterSimmer from "../Shimmer/CounterSimmer";
import DotSpin from "../DotSpin";
import EmptySearchResults from "../EmptySearchResults";
import SearchFilter from "../search/search-filter";
import H1 from "../typographies/H1";
import HighToLow from "../../sort/HighToLow";
import WindowIcon from "@mui/icons-material/Window";
import ViewListIcon from "@mui/icons-material/ViewList";
import Body2 from "../typographies/Body2";

import { useInView } from "react-intersection-observer";
import { removeDuplicates } from "../../utils/CustomFunctions";
import { useRouter } from "next/router";

const BgBox = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "20px 0",
}));

const CustomCounterBox = styled(CustomStackFullWidth)(({ theme }) => ({
	height: "20px",
	width: "260px",
}));

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

const FlashSales = () => {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const [offset, setOffset] = useState(1);
	const [limit, setLimit] = useState(10);
	const { ref, inView } = useInView();
	const [itemData, setItemData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [currentView, setCurrentView] = useState(0);
	const [sortBy, setSortBy] = useState("");

	const flashSaleImage = i18n.language === "es"
		? "/flash_sale_spanish.png"
		: "/flash_sale_english.png";

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setLoading(true);
		}, 2000);
		return () => clearTimeout(timeoutId);
	}, []);

	const pageParams = {
		offset,
		limit: limit,
		id: id
	};

	const {
		data: flashSales,
		refetch: flashSalesRefetch,
		isFetchingNextPage,
		fetchNextPage,
		isLoading,
		isRefetching,
		hasNextPage
	} = useGetFlashSalesInfinityScroll(pageParams);

	const handleItemData = () => {
		if (flashSales && flashSales?.pages?.length > 0) {
			flashSales?.pages?.forEach((item) => {
				setItemData((prev) =>
					removeDuplicates([...new Set([...prev, ...item?.products])], "id")
				);
			});
		}
	};

	useEffect(() => {
		handleItemData();
	}, [flashSales]);

	useEffect(() => {
		if (inView) {
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
				const itemCategoryId = item?.item?.category_id;
				return selectedCategories.includes(String(itemCategoryId)) ||
					selectedCategories.includes(itemCategoryId);
			});
		}

		// Sort
		if (sortBy === "high") {
			filtered = [...filtered].sort((a, b) => (b?.item?.price || 0) - (a?.item?.price || 0));
		} else if (sortBy === "low") {
			filtered = [...filtered].sort((a, b) => (a?.item?.price || 0) - (b?.item?.price || 0));
		}

		return filtered;
	};

	const filteredItems = getFilteredItems();

	return (
		<NoSsr>
			<CustomBoxFullWidth>
				<BgBox>
					<CustomContainer>
						<Box
							sx={{
								display: "flex",
								flexDirection: { xs: "column", sm: "column", md: "row" },
								alignItems: "center",
								justifyContent: "space-between",
								gap: "30px",
								padding: "20px"
							}}
						>
							<img
								src={flashSaleImage}
								alt="Flash Sale"
								style={{ maxWidth: "100%", height: "auto", maxHeight: "150px", objectFit: "contain" }}
							/>

							<Box>
								{isLoading ? (
									<CounterSimmer />
								) : (
									<CustomCounterBox alignItems="center" justifyContent="center">
										<CustomCountdown
											startDate={flashSales?.pages[0]?.flash_sale?.start_date}
											endDate={flashSales?.pages[0]?.flash_sale?.end_date}
											startTime={flashSales?.pages[0]?.flash_sale?.start_time}
											endTime={flashSales?.pages[0]?.flash_sale?.end_time}
										/>
									</CustomCounterBox>
								)}
							</Box>
						</Box>
					</CustomContainer>
				</BgBox>

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
					<CustomContainer>
						{/* Search menu header */}
						<CustomBoxFullWidth sx={{ marginBottom: "20px", marginTop: "20px" }}>
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
						<CustomBoxFullWidth sx={{ marginTop: "20px" }}>
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
									<CustomStackFullWidth spacing={2} sx={{ paddingTop: "1rem" }}>
										<CustomBoxFullWidth>
											{itemData.length === 0 && loading && !isLoading ? (
												<CustomStackFullWidth
													sx={{ height: "100%", padding: "2rem" }}
													alignItems="center"
													justifyContent="center"
												>
													<EmptySearchResults text="No Flash Sales Product Found!" isItems />
												</CustomStackFullWidth>
											) : (
												<Grid container spacing={2}>
													{currentView === 0 ? (
														<>
															{filteredItems?.map((item, index) => (
																<Grid
																	key={item?.item?.id || index}
																	item
																	xs={6}
																	sm={4}
																	md={3}
																>
																	<ProductCard
																		item={{ ...item?.item }}
																		cardheight="365px"
																		cardFor="flashSale"
																		cardType="vertical-type"
																		sold={item?.sold}
																		stock={item?.available_stock}
																	/>
																</Grid>
															))}
														</>
													) : (
														<>
															{filteredItems?.map((item, index) => (
																<Grid
																	key={item?.item?.id || index}
																	item
																	xs={12}
																	sm={6}
																	md={6}
																>
																	<ProductCard
																		item={{ ...item?.item }}
																		cardheight="150px"
																		cardType="vertical-type"
																		horizontalcard="true"
																		cardFor="list-view"
																		sold={item?.sold}
																		stock={item?.available_stock}
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
											)}
										</CustomBoxFullWidth>
									</CustomStackFullWidth>
								</Grid>
							</Grid>
						</CustomBoxFullWidth>

						{flashSales?.total_size !== itemData?.length && (
							<CustomBoxFullWidth ref={ref}></CustomBoxFullWidth>
						)}
					</CustomContainer>
				)}
			</CustomBoxFullWidth>
		</NoSsr>
	);
};

export default FlashSales;
