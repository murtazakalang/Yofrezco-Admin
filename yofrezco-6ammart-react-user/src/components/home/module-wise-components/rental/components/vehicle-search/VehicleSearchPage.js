import React, { useEffect, useRef, useState } from "react";
import RentalFilterLayout from "../global/RentalFilterLayout";
import TopBanner from "components/home/top-banner";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import TaxiSearchPanel from "../global/search/TaxiSearchPanel";
import { alpha, Box } from "@mui/system";
import { useTheme } from "@emotion/react";
import { search_api } from "components/home/module-wise-components/rental/rental-api-manage/ApiRoutes";
import { Typography, useMediaQuery, useScrollTrigger } from "@mui/material";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import SearchWithTitle from "components/home/SearchWithTitle";
import { t } from "i18next";
import { useSelector } from "react-redux";

const VehicleSearchPage = () => {
  
  useScrollToTop();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const scrolling = useScrollTrigger();
  const searchPanelRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const { configData } = useSelector((state) => state.configData);
  useEffect(() => {
    const handleScroll = () => {
      if (searchPanelRef.current) {
        const topOffset = searchPanelRef.current.getBoundingClientRect().top;

        if (window.scrollY > topOffset) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getBannerTexts = t("Get your car rental service with")
  const getBannerSubTexts = t("with affordable price.")

  return (
    <Box>
      <RentalFilterLayout
        api_endpoint={search_api}
        isSticky={isSticky}
        topContent={
          <CustomStackFullWidth
            sx={{
              position: "relative",
            }}
          >
            {/* Top Banner */}
            <TopBanner />
            <CustomStackFullWidth
						alignItems="center"
						justifyContent="center"
						sx={{
							position: "absolute",
							top: { xs: -4, sm: 50 },
							left: 0,
							right: 0,
						}}
					>
					<CustomStackFullWidth
      alignItems="center"
      justifyContent="center"
      spacing={isSmall ? 1 : 3}
      p={isSmall ? "25px" : "20px"}
      mt={{ xs: 0, sm: 2 }}
    >
      <CustomStackFullWidth
        alignItems="center"
        justifyContent="center"
        spacing={1.5}
      >
        <Typography
          variant={isSmall ? "h6" : "h5"}
          textAlign="center"
          fontWeight="600"
          lineHeight="33.18px"
          component="h1"
          sx={{
            fontSize: {
              md: "30px !important",
            },
            textTransform:
               "capitalize" ,
          }}
        >
          {t("Rent best car for best experience")}
        </Typography>
        <Typography
          variant={isSmall ? "subtitle2" : "subtitle1"}
          textAlign="center"
          sx={{ color: (theme) => theme.palette.neutral[400] }}
          fontWeight="400"
          lineHeight="18.75px"
          component="p"
        >
          {t(`${getBannerTexts}${configData?.business_name} ${getBannerSubTexts}`)}
        </Typography>
      </CustomStackFullWidth>

  
    </CustomStackFullWidth>
					</CustomStackFullWidth>

            <Box
              ref={searchPanelRef}
              sx={{
                mt: isSticky ? { xs: "0", sm: "60px" } : "0px",
                position: isSticky ? { xs: "fixed" } : "relative",
                top: isSticky
                  ? {
                      xs: "70px",
                      sm: "20px",
                      md: scrolling ? "43px" : "74px",
                    }
                  : "auto",
                pt: isSticky && { xs: "25px", md: "0px" },
                zIndex: isSticky ? 1100 : "auto",
                width: "100%",
                transition: "all 0.4s ease",
                backgroundColor: isSticky
                  ? {
                      xs: theme.palette.background.paper,
                      sm: "transparent",
                    }
                  : "transparent",
                boxShadow: isSticky
                  ? {
                      xs: `0px 10px 20px 0px ${alpha(
                        theme.palette.neutral[1000],
                        0.2
                      )}`,
                      sm: `none`,
                    }
                  : "transparent",
              }}
            >
              <TaxiSearchPanel isSticky={isSticky} showSearch={false} />
            </Box>
          </CustomStackFullWidth>
        }
      />
    </Box>
  );
};

export default VehicleSearchPage;
