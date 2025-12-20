import { styled } from "@mui/material/styles";
import { Box } from "@mui/system";
import { alpha, Button } from "@mui/material";

export const RentalModuleWrap = styled(Box)(({ theme }) => ({
	".slick-dots": {
		position: "relative",
		marginTop: theme.spacing(2),
		"& li": {
			margin: 0,
			width: "16px",
			height: "16px",
			"&.slick-active": {
				"& button": {
					"&::before": {
						color: theme.palette.primary.main,
					},
				},
			},
			"& button": {
				width: "16px",
				height: "16px",
				"&::before": {
					fontSize: "8px",
					width: "16px",
					height: "16px",
					lineHeight: "16px",
				},
			},
		},
	},
}));

export const CustomCarCard = styled(Box)(({ theme }) => ({
	borderRadius: "20px",
	backgroundColor: theme.palette.background.paper,
	boxShadow: "0px 2px 5px 0px rgba(71, 71, 71, 0.07)",
	transition: "box-shadow 0.3s ease-in-out",
	".infoText": {
		position: "absolute",
		width: "max-content",
		paddingInlineStart: "0.5rem",
		paddingInlineEnd: "1.7rem",
		height: "100%",
		backgroundColor: theme.palette.background.paper,
		right: 0,
		top: 0,
		borderRadius: "50rem",
		display: "flex",
		gap: 0.5,
		alignItems: "center",
		zIndex: -1,
		transform: "scaleX(0)",
		transition: "all 300ms ease-in-out",
		transformOrigin: "top right",
		opacity: 0,
	},
	"&:hover": {
		boxShadow: "0px 5px 10px 0px rgba(71, 71, 71, 0.10)",
		"& .infoText": {
			transform: "scaleX(1)",
			opacity: 1,
		},
	},
	"& .custom_overlay:hover": {
		"~ .MuiBox-root .infoText": {
			transform: "scaleX(0)",
			opacity: "0",
		},
	},
}));

export const CouponsCard = styled(Box)(({ theme }) => ({
	borderRadius: "20px",
	padding: theme.spacing(3),
	position: "relative",
	width: "100%",
	zIndex: 1,
	"& > svg": {
		filter: "drop-shadow(0px 5px 10px rgba(71, 71, 71, 0.10))",
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		zIndex: -1,
		path: {
			fill:
				theme.palette.mode === "dark"
					? theme.palette.footer.foodFooterBg
					: theme.palette.background.paper,
		},
	},
}));

export const DownloadAppButton = styled(Button)(({ theme }) => ({
	padding: "8px 15px",
	borderRadius: "10px",
	display: "flex",
	gap: 16,
	color: "#fff",
	backgroundColor: theme.palette.footer.foodFooterBg,
	"&:hover": {
		backgroundColor: theme.palette.footer.foodFooterBg,
	},
}));
