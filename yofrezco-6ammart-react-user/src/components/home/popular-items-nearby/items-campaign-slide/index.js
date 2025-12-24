import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  CustomBoxFullWidth,
  CustomSpan,
  CustomStackFullWidth,
  SliderCustom,
} from "../../../../styled-components/CustomStyles.style";
import { Typography, alpha, useMediaQuery, useTheme, Stack } from "@mui/material";
import CustomImageContainer from "../../../CustomImageContainer";
import bg from "./assets/bg.png";
import Slide from "./Slide";
import Slider from "react-slick";
import { settings } from "./Settings";
import CustomSlider from "../../../search/CustomSlider";
import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";
import CustomCountdown from "../../../countdown";
import CustomLinearProgressbar from "../../../linear-progressbar";
import useGetFlashSales from "../../../../api-manage/hooks/react-query/useGetFlashSales";
import { useRouter } from "next/router";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import ProductCard from "components/cards/ProductCard";

// Localized Title Image Component for Flash Sale
const LocalizedFlashSaleTitle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isSpanish = currentLang === "es" || currentLang.startsWith("es");

  const imageSrc = isSpanish
    ? "/flash_sale_spanish.png"
    : "/flash_sale_english.png";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        mb: 1,
        mt: 2
      }}
    >
      <img
        src={imageSrc}
        alt="Flash Sale"
        style={{
          height: "180px",
          width: "auto",
          objectFit: "contain"
        }}
      />
    </Box>
  );
};

const CustomCounterBox = styled(CustomStackFullWidth)(({ theme }) => ({
  marginTop: "10px",
  marginBottom: "10px"
}))

const StyledCustomSlider = styled(SliderCustom)(({ theme, isSmall }) => ({
  "& .slick-dots": {
    top: "365px",
    maxWidth: "100px",
    "& li": {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      width: "8px",
      height: "3px",
      "& button::before": {
        color: "transparent",
      },
    },
    "& li.slick-active button::before": {
      backgroundColor: theme.palette.primary.main,
      width: "8px",
      height: "3px",
      borderRadius: "100px",
    },
  },
  [theme.breakpoints.down("sm")]: {
    "& .slick-dots": {
      bottom: 0,
      top: "480px",
    },
  },
}));
const ItemsCampaign = ({ flashSales }) => {

  const theme = useTheme();
  const router = useRouter()
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const handleFlashSales = () => {
    router.push({
      pathname: '/flash-sales',
      query: { id: flashSales?.id }
    })
  }

  return (
    <CustomStackFullWidth
      height="100%"
      alignItems="center"
      justifyContent="flex-start"

      sx={{
        backgroundColor: (theme) => alpha(theme.palette.neutral[400], 0.1),
        padding: "4px",
        // margin: { xs: "none", md: "10px 15px" },
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      <LocalizedFlashSaleTitle />
      {flashSales?.active_products?.length > 0 &&
        <CustomCounterBox
          alignItems="center"
          justifyContent="center"
        >
          <CustomCountdown
            startDate={flashSales?.start_date}
            endDate={flashSales?.end_date}
          />
        </CustomCounterBox>}
      <StyledCustomSlider isSmall={isSmall}>
        <Slider {...settings}>
          {flashSales?.active_products?.slice(0, 5).map((item, index) => {
            return (
              <Box key={index}>
                <ProductCard
                  item={{ ...item?.item }}
                  cardheight="340px"
                  cardFor="flashSale"
                  cardType="vertical-type"
                  sold={item?.sold}
                  stock={item?.available_stock}
                />
                {/*<Slide item={item} />*/}
              </Box>
            );
          })}
        </Slider>
      </StyledCustomSlider>
      <Stack width="100%" alignItems="end" justifyContent="center">
        <Typography onClick={handleFlashSales} sx={{ textDecoration: "underLine", color: theme => theme.palette.neutral[400] }} fontSize="16px" fontWeight="600" marginRight="10px">{("See All")}</Typography>
      </Stack>
    </CustomStackFullWidth>
  );
};

ItemsCampaign.propTypes = {};

export default ItemsCampaign;
