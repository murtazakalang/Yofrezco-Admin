import React, { useEffect, useState } from "react";
import { Box, Grid, NoSsr, Skeleton, Typography, alpha, styled } from "@mui/material";
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

import { useInView } from "react-intersection-observer";
import { removeDuplicates } from "../../utils/CustomFunctions";
import { useRouter } from "next/router";
import SearchResult from "../home/search";
import { useSelector } from "react-redux";

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
	const { landingPageData, configData } = useSelector((state) => state.configData);

	const flashSaleImage = i18n.language === "es"
		? "/flash_sale_spanish.png"
		: "/flash_sale_english.png";

	const { data: flashSales, isLoading } = useGetFlashSalesInfinityScroll({
		limit: 1,
		id: id,
		offset: 1
	});

	const [currentTab, setCurrentTab] = useState(0);

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
				<SearchResult
					key={id}
					searchValue=""
					data_type="flash_sale"
					configData={configData}
					flash_sale_id={id}
					currentTab={currentTab}
					setCurrentTab={setCurrentTab}
				/>
			</CustomBoxFullWidth >
		</NoSsr >
	);
};

export default FlashSales;
