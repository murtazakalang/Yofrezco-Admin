import React, { useEffect, useState } from "react";
import { Box, Grid, NoSsr, Skeleton, Typography, alpha, styled } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
	CustomBoxFullWidth,
	CustomStackFullWidth,
} from "../../styled-components/CustomStyles.style";
import CustomContainer from "../container";
import { useGetFlashSales, useGetFlashSalesInfinityScroll } from "../../api-manage/hooks/react-query/useGetFlashSales";
import ProductCard from "../cards/ProductCard";
import CustomCountdown from "../countdown";
import CounterSimmer from "../Shimmer/CounterSimmer";
import DotSpin from "../DotSpin";
import EmptySearchResults from "../EmptySearchResults";


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

const FlashSales = () => {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [offset, setOffset] = useState(1);
	const [limit, setLimit] = useState(10);
	const { ref, inView } = useInView();
	const [itemData, setItemData] = useState([]);
	const [loading, setLoading] = useState(false);

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

	return (
		<NoSsr>
			<CustomBoxFullWidth>
				<BgBox referenece="bg-box">
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
					<>{
						itemData.length === 0 && loading && !isLoading ?
							(<CustomStackFullWidth
								sx={{ height: "100%", padding: "2rem" }}
								alignItems="center"
								justifyContent="center"
							>
								<EmptySearchResults text="No Flash Sales Product Found!" isItems />
							</CustomStackFullWidth>
							) : (
								<Box>
									{itemData?.length > 0 && <Box sx={{ paddingTop: "50px", paddingBottom: "80px" }}>
										<CustomContainer>
											<Grid container rowSpacing={4} columnSpacing={2}>
												{itemData?.map((item, index) => {
													return (
														<Grid
															key={item?.item?.id}
															item
															xs={12}
															sm={4}
															md={3}
															lg={2.4}
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
													);
												})}
												{isFetchingNextPage &&
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
													</CustomStackFullWidth>}
											</Grid>
										</CustomContainer>
									</Box>}
								</Box>
							)

					}

					</>
				)
				}
				{flashSales?.total_size !== itemData?.length && (
					<CustomBoxFullWidth ref={ref}></CustomBoxFullWidth>
				)}
			</CustomBoxFullWidth >
		</NoSsr >
	);
};

export default FlashSales;
