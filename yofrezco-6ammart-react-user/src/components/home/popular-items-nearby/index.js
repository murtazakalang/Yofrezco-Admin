import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useGetPopularItemsNearby from "../../../api-manage/hooks/react-query/useGetPopularItemsNearby";

import { Grid, Skeleton, Box, Stack, Typography, useTheme } from "@mui/material";
import Slider from "react-slick";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

import { useGetFlashSales } from "api-manage/hooks/react-query/useGetFlashSales";
import { getLanguage } from "helper-functions/getLanguage";
import { setPopularItemsNearby } from "redux/slices/storedData";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import {
  CustomBoxFullWidth,
  CustomStackFullWidth,
  SliderCustom,
} from "styled-components/CustomStyles.style";
import ProductCard from "../../cards/ProductCard";
import CampaignSimmerTimmer from "../../Shimmer/CampaignSimmerTimmer";
import ProductCardSimmerHorizontal from "../../Shimmer/ProductCardSimmerHorizontal";
import H2 from "../../typographies/H2";
import Subtitle1 from "../../typographies/Subtitle1";
import { NextFood, PrevFood } from "../best-reviewed-items/SliderSettings";
import { HomeComponentsWrapper } from "../HomeStyles";
import ItemsCampaign from "./items-campaign-slide";

// Localized Title Image Component for Popular Products
const LocalizedPopularProductsTitle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isSpanish = currentLang === "es" || currentLang.startsWith("es");

  const imageSrc = isSpanish
    ? "/popular_products_spanish.png"
    : "/popular_products_english.png";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        mb: 1
      }}
    >
      <img
        src={imageSrc}
        alt="Most Popular Products"
        style={{
          height: "220px",
          width: "auto",
          objectFit: "contain"
        }}
      />
    </Box>
  );
};

const PopularItemsNearby = ({ title, subTitle }) => {
  const { popularItemsNearby } = useSelector((state) => state.storedData);
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const limit = 2;
  const offset = 1;
  const { data, refetch, isLoading, isFetching } = useGetPopularItemsNearby({
    offset: 1,
    type: "all",
  });
  const {
    data: flashSales,
    refetch: flashSalesRefetch,
    isLoading: flashSalesIsLoading,
  } = useGetFlashSales({ limit, offset });
  const dispatch = useDispatch();
  // useEffect(() => {
  //   if (popularItemsNearby.products.length === 0) {
  //     refetch();
  //   }
  // }, [popularItemsNearby]);

  useEffect(() => {
    flashSalesRefetch();
  }, []);

  useEffect(() => {
    if (data) {
      dispatch(setPopularItemsNearby(data));
    }
  }, [data]);
  useEffect(() => {
    refetch();
  }, []);

  const flashSaleslength = () => {
    if (
      (flashSales &&
        typeof flashSales === "object" &&
        Object.keys(flashSales).length === 0) ||
      flashSales?.active_products?.length < 1
    ) {
      return false;
    } else {
      return true;
    }
  };
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesPerRow: 1,
    rows: 3,
    slidesToShow: flashSaleslength() ? 2 : 2.7,
    slidesToScroll: 1,
    cssEase: "linear",
    rtl: getLanguage() === "rtl",
    responsive: [
      {
        breakpoint: 320,
        settings: {
          slidesToShow: 1,
          slidesPerRow: 1,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 375,
        settings: {
          slidesToShow: 1.1,
          slidesPerRow: 1,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 450,
        settings: {
          slidesToShow: 1.2,
          slidesPerRow: 1,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 750,
        settings: {
          slidesToShow: 1.5,
          slidesPerRow: 2,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 830,
        settings: {
          slidesToShow: 1.55,
          slidesPerRow: 1,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 1.75,
          slidesPerRow: 1,
          rows: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1150,
        settings: {
          slidesToShow: 1.8,
          slidesPerRow: 1,
          rows: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: flashSaleslength() ? 2 : 2.5,
          slidesPerRow: 1,
          rows: 3,
          slidesToScroll: 1,
        },
      },
    ],
    prevArrow: <PrevFood />,
    nextArrow: <NextFood />,
  };
  return (
    <HomeComponentsWrapper>
      {data && data?.products?.length > 0 && (
        <>
          <CustomStackFullWidth
            alignItems="center"
            justyfyContent="center"
            mt={{ xs: "10x", md: "16px" }}
            spacing={1}
          >
            {/* Flash Sale Section - First */}
            {flashSalesIsLoading ? (
              <CustomBoxFullWidth sx={{ mb: 3 }}>
                <CampaignSimmerTimmer />
              </CustomBoxFullWidth>
            ) : (
              flashSaleslength() && (
                <CustomBoxFullWidth sx={{ mb: 3 }}>
                  <ItemsCampaign flashSales={flashSales} />
                </CustomBoxFullWidth>
              )
            )}


          </CustomStackFullWidth>
        </>
      )}
    </HomeComponentsWrapper>
  );
};

export default PopularItemsNearby;
