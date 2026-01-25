import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { styled, useMediaQuery, useTheme } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { getLanguage } from "../../../helper-functions/getLanguage";
import { RTL } from "../../rtl";

const ButtonContainer = styled(Box)(
	({ theme, right, isdisabled, noBackground, isRtl, rightSpace }) => ({
		top: 0,
		height: "100%",
		width: "42px",
		transition:
			"background-image 0.3s ease-in-out, transform 0.3s ease-in-out",
		transform: "translateX(0)",
		background:
			noBackground === "true"
				? null
				: right === "true"
					? `linear-gradient(270deg, ${isRtl === "rtl"
						? "rgba(255, 255, 255, 0)"
						: theme.palette.neutral[100]
					} 0%, ${isRtl === "rtl"
						? theme.palette.neutral[100]
						: "rgba(75, 86, 107, 0.05) -28.57%, rgba(255, 255, 255, 0) 122.62%"
					} 100%)`
					: `linear-gradient(${isRtl === "rtl" ? "to left" : "to right"
					},  ${isRtl === "rtl"
						? "rgba(255, 255, 255, 0)"
						: "rgba(75, 86, 107, 0.05) -28.57%, rgba(255, 255, 255, 0) 122.62%"
					} 0%, ${isRtl === "rtl"
						? theme.palette.neutral[100]
						: "rgba(255, 255, 255, 0)"
					}  100%)`,

		zIndex: 1,
		right: right === "true" && "-8px",
		left: right !== "true" && 0,
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
		display: isdisabled ? "none" : "flex",
		borderTopRightRadius: "12px",
		borderBottomRightRadius: "12px",
		[theme.breakpoints.down("sm")]: {
			display: "none",
		},
	})
);

// Mobile arrow container - positioned outside the card
const MobileArrowContainer = styled(Box)(
	({ theme, right, isdisabled }) => ({
		position: "absolute",
		top: "50%",
		transform: "translateY(-50%)",
		zIndex: 10,
		display: "none",
		cursor: "pointer",
		right: right === "true" ? "-5px" : "auto",
		left: right === "true" ? "auto" : "-5px",
		[theme.breakpoints.down("sm")]: {
			display: isdisabled ? "none" : "flex",
		},
	})
);

const PrevWrapper = styled(Box)(({ theme, isdisabled }) => ({
	zIndex: 1,
	top: "50%",
	left: 0,
	display: isdisabled ? "none" : "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: theme.palette.primary.main,
	boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
	height: "35px",
	width: "35px",
	borderRadius: "50%",
	"&:hover": {
		backgroundColor: theme.palette.primary.dark,
	},
}));

const NextWrapper = styled(Box)(({ theme, isdisabled }) => ({
	top: "50%",
	zIndex: 1,
	right: 8,
	display: isdisabled ? "none" : "flex",
	backgroundColor: theme.palette.primary.main,
	borderRadius: "50%",
	boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
	alignItems: "center",
	justifyContent: "center",
	height: "35px",
	width: "35px",
	"&:hover": {
		backgroundColor: theme.palette.primary.deep,
	},
}));

export const NextFood = ({
	onClick,
	className,
	displayNoneOnMobile,
	noBackground,
	rightSpace,
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const displayNone = isSmall ? (displayNoneOnMobile ? true : false) : false;
	const isDisabled = className?.includes("slick-disabled");

	return (
		<>
			{/* Desktop arrow */}
			<ButtonContainer
				isdisabled={displayNone || isDisabled}
				right="true"
				noBackground={noBackground ? "true" : "false"}
				isRtl={getLanguage()}
				rightSpace={rightSpace}
			>
				<NextWrapper
					className={`client-nav client-next ${className}`}
					onClick={onClick}
					isdisabled={isDisabled}
				>
					{getLanguage() === "rtl" ? (
						<ChevronLeftIcon
							sx={{
								fontSize: "30px",
								color: (theme) => theme.palette.neutral[600],
								"&:hover": {
									color: theme.palette.neutral[100],
								},
							}}
						/>
					) : (
						<ChevronRightIcon
							sx={{
								fontSize: "30px",
								color: (theme) => theme.palette.neutral[600],
								"&:hover": {
									color: theme.palette.neutral[100],
								},
							}}
						/>
					)}
				</NextWrapper>
			</ButtonContainer>

			{/* Mobile arrow with custom image */}
			<MobileArrowContainer
				right="true"
				isdisabled={isDisabled}
				onClick={onClick}
			>
				<img
					src="/right.png"
					alt="Next"
					style={{
						width: "40px",
						height: "40px",
						objectFit: "contain"
					}}
				/>
			</MobileArrowContainer>
		</>
	);
};

export const PrevFood = ({
	onClick,
	className,
	displayNoneOnMobile,
	noBackground,
	lanDirection,
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const displayNone = isSmall ? (displayNoneOnMobile ? true : false) : false;
	const rtl = getLanguage();
	const isDisabled = className?.includes("slick-disabled");

	return (
		<>
			{/* Desktop arrow */}
			<ButtonContainer
				isdisabled={displayNone || isDisabled}
				noBackground={noBackground ? "true" : "false"}
				isRtl={rtl}
			>
				<PrevWrapper
					className={`client-nav client-prev ${className}`}
					onClick={onClick}
					isdisabled={isDisabled}
				>
					{getLanguage() === "rtl" ? (
						<ChevronRightIcon
							sx={{
								fontSize: "30px",
								color: (theme) => theme.palette.neutral[600],
								"&:hover": {
									color: theme.palette.neutral[100],
								},
							}}
						/>
					) : (
						<ChevronLeftIcon
							sx={{
								fontSize: "30px",
								color: (theme) => theme.palette.neutral[600],
								"&:hover": {
									color: theme.palette.neutral[100],
								},
							}}
						/>
					)}
				</PrevWrapper>
			</ButtonContainer>

			{/* Mobile arrow with custom image */}
			<MobileArrowContainer
				right="false"
				isdisabled={isDisabled}
				onClick={onClick}
			>
				<img
					src="/left.png"
					alt="Previous"
					style={{
						width: "40px",
						height: "40px",
						objectFit: "contain"
					}}
				/>
			</MobileArrowContainer>
		</>
	);
};
