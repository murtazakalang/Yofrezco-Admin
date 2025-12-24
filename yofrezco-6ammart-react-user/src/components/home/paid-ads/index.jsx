import { Grid, Skeleton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useGetAdds } from "api-manage/hooks/react-query/useGetAds";
import SpecialOfferCardShimmer from "components/Shimmer/SpecialOfferCardSimmer";
import {
  NextFood,
  PrevFood,
} from "components/home/best-reviewed-items/SliderSettings";
import AdsCard from "components/home/paid-ads/AdsCard";
import Subtitle1 from "components/typographies/Subtitle1";
import { getModuleId } from "helper-functions/getModuleId";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import {
  CustomStackFullWidth,
  SliderCustom,
} from "styled-components/CustomStyles.style";

// Localized Title Image Component for Highlights
const LocalizedHighlightsTitle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isSpanish = currentLang === "es" || currentLang.startsWith("es");

  const imageSrc = isSpanish
    ? "/highlights_spanish.png"
    : "/highlights_english.png";

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
        alt="Highlights for you"
        style={{
          height: "180px",
          width: "auto",
          objectFit: "contain"
        }}
      />
    </Box>
  );
};

const PaidAds = () => {
  const theme = useTheme();
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSlideData, setActiveSlideData] = useState(null);
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, isLoading, refetch, isFetched } = useGetAdds();


  const settings = {
    autoplay: true,
    infinite: data?.length > 3 && true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <PrevFood />,
    nextArrow: <NextFood />,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    afterChange: (currentSlide) => {
      setCurrentSlide(currentSlide);
      const activeSlideIndex = sliderRef?.current?.innerSlider?.state?.currentSlide;
      const activeSlide = data?.length > 0 && data[activeSlideIndex || 0];
      setActiveSlideData(activeSlide);
      if (activeSlide?.add_type === "video_promotion") {
        sliderRef?.current?.slickPause?.();
      } else {
      }
    },
    responsive: [
      {
        breakpoint: 2000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: data?.length > 3 && true,
        },
      },
      {
        breakpoint: 1600,
        settings: {
          // autoplay: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: data?.length > 3 && true,
        },
      },
      {
        breakpoint: 1340,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: data?.length > 3 && true,
        },
      },
      {
        breakpoint: 1075,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: data?.length > 3 && true,
        },
      },
      {
        breakpoint: 999,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 850,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 770,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 670,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 540,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 495,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 460,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 400,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 370,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: false,
        },
      },
    ],
  };
  const SliderShouldPlay = () => {
    if (data && data.length > 0) {
      const firstSlide = data[0];
      const secondSlide = data[1];
      const thirdSlide = data[2];
      setActiveSlideData(firstSlide);
      if (firstSlide.add_type === "video_promotion") {
        sliderRef?.current?.slickPause?.();
        //setIsAutoPlay(false);
      } else if (
        secondSlide?.add_type === "video_promotion" &&
        firstSlide.add_type !== "video_promotion"
      ) {
        sliderRef?.current?.slickPause?.();
        sliderRef?.current?.slickNext?.();
        setActiveSlideData(secondSlide);
      } else if (
        thirdSlide?.add_type === "video_promotion" &&
        secondSlide.add_type !== "video_promotion"
      ) {
        sliderRef?.current?.slickPause?.();
        sliderRef?.current?.slickNext?.();
        setTimeout(() => {
          sliderRef?.current?.slickPause?.();
          sliderRef?.current?.slickNext?.();
          setActiveSlideData(thirdSlide);
        }, 500);
      }
    }
  };

  useEffect(() => {
    SliderShouldPlay();
  }, [data]);

  return (
    <>
      {isFetched && data?.length === 0 ? null : (
        <Box
          sx={{
            marginTop: "10px",
            borderRadius: "10px",
          }}
        >
          <Box
            sx={{
              borderRadius: "inherit",
            }}
          >
            <Stack padding="20px 20px 0px 20px" alignItems="center">
              <LocalizedHighlightsTitle />
            </Stack>
            <CustomStackFullWidth>
              <CustomStackFullWidth>
                <SliderCustom padding={isSmall ? "5px" : "16px"}>
                  {data?.length > 0 ? (
                    <Slider {...settings} ref={sliderRef}>
                      {data?.map((item, index) => (
                        <AdsCard
                          key={item?.id}
                          data={data}
                          activeSlideData={activeSlideData}
                          itemLength={data?.length}
                          item={item}
                          index={index}
                          sliderRef={sliderRef}
                        />
                      ))}
                    </Slider>
                  ) : (
                    <Slider {...settings} ref={sliderRef}>
                      {[...Array(4)].map((_, index) => {
                        return (
                          <AdsCard
                            key={index}
                            onlyShimmer
                          />
                        );
                      })}
                    </Slider>
                  )}
                </SliderCustom>
              </CustomStackFullWidth>
            </CustomStackFullWidth>
          </Box>
        </Box>
      )}
    </>
  );
};

export default PaidAds;
