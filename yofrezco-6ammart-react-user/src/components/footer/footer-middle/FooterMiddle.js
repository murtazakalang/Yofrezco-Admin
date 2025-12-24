import { Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Box, alpha } from "@mui/system";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { ModuleTypes } from "helper-functions/moduleTypes";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import CustomImageContainer from "../../CustomImageContainer";
import AppLinks from "./AppLinks";
import RouteLinks from "./RouteLinks";
import SocialLinks from "./SocialLinks";
import SomeInfo from "./SomeInfo";
import FooterBottomItems from "../FooterBottomItems";
import { useRouter } from "next/router";
import LocationViewOnMap from "../../Map/location-view/LocationViewOnMap";
import { getImageUrl } from "utils/CustomFunctions";

const FooterMiddle = (props) => {
  const { configData, landingPageData } = props;
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const handleOpenCloseMap = () => {
    setOpen(!open);
  };
  const handleClickToRoute = (href) => {
    router.push(href, undefined, { shallow: true });
  };
  let zoneid = undefined;
  if (typeof window !== "undefined") {
    zoneid = localStorage.getItem("zoneid");
  }
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  let token;
  const businessLogo = configData?.logo_full_url;
  // console.log("landingPageData", landingPageData);
  return (
    <CustomStackFullWidth sx={{ py: { xs: "10px", sm: "3rem" } }}>
      <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="flex-start">
        <Grid item xs={12} sm={6} md={4.2}>
          <CustomStackFullWidth
            // spacing={2}
            gap="10px"
            alignItems={{ xs: "center", sm: "flex-start" }}
            justifyContent="flex-start"
          >
            <Box
              sx={{
                img: {
                  transition: "all ease 0.5s",
                },
                "&:hover": {
                  img: {
                    transform: "scale(1.04)",
                  },
                },
              }}
            >
              <CustomImageContainer
                src={businessLogo}
                alt={`${configData?.business_name}`}
                width="auto"
                height="50px"
                objectfit="contain"
              />
            </Box>
            <SocialLinks
              configData={configData}
              landingPageData={landingPageData}
            />
            <AppLinks
              landingPageData={{
                app_store_link:
                  landingPageData?.user_app_download_section
                    ?.download_user_app_links?.apple_store_url,
                play_store_link:
                  landingPageData?.user_app_download_section
                    ?.download_user_app_links?.playstore_url,
                app_status:
                  landingPageData?.user_app_download_section
                    ?.download_user_app_links?.apple_store_url_status,
                play_status:
                  landingPageData?.user_app_download_section
                    ?.download_user_app_links?.playstore_url_status,
              }}
            />
            {/* Payment Methods */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Box
                component="img"
                src="/Visa Mastercard.png"
                alt="Visa Mastercard"
                sx={{ height: "30px", width: "auto", objectFit: "contain" }}
              />
              <Box
                component="img"
                src="/Yappy.png"
                alt="Yappy"
                sx={{ height: "30px", width: "auto", objectFit: "contain" }}
              />
              <Box
                component="img"
                src="/Rapidpay.png"
                alt="Rapidpay"
                sx={{ height: "30px", width: "auto", objectFit: "contain" }}
              />
            </Stack>
          </CustomStackFullWidth>
        </Grid>
        <Grid item xs={12} sm={6} md={7.8}>
          <Box
            sx={{
              position: "relative",
              height: "100%",
              "&::before": {
                content: '""',
                position: "absolute",
                borderRadius: "23px",
                inset: "0",
                background: theme.palette.background.default,
              },
            }}
          >
            <Box
              padding={{ xs: "20px 8px", sm: "40px" }}
              sx={{
                backgroundColor:
                  getCurrentModuleType() === ModuleTypes?.FOOD
                    ? alpha(theme.palette.moduleTheme.food, 0.051)
                    : "#062bfe",
                borderRadius: "23px",
                position: "relative",
                color: "#FFFFFF",
                "& .MuiTypography-root": {
                  color: "#FFFFFF",
                },
              }}
            >
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={3} align={isSmall && "center"}>
                  <CustomStackFullWidth
                    flexDirection="row"
                    justifyContent="space-between"
                    gap="10px"
                  >
                    <RouteLinks token={token} configData={configData} />
                    {isSmall && (
                      <FooterBottomItems
                        handleClickToRoute={handleClickToRoute}
                        configData={configData}
                      />
                    )}
                  </CustomStackFullWidth>
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4.5}
                  sx={{
                    display: { xs: "flex", sm: "none", md: "flex" },
                    alignItems: "flex-start",
                    justifyContent: "center",
                  }}
                >
                  <SomeInfo
                    image="/email_footer.png"
                    alt="Email"
                    title="Send us mails"
                    info={configData?.email}
                    t={t}
                    href={`mailto:${configData?.email}`}
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4.5}
                  sx={{
                    display: { xs: "flex", sm: "none", md: "flex" },
                    alignItems: "flex-start",
                    justifyContent: "center",
                  }}
                >
                  <SomeInfo
                    image="/Whatsapp_footer.png"
                    alt="WhatsApp"
                    title="Contact us"
                    info="Info & Support"
                    t={t}
                    href="https://wa.link/yofrezco"
                    isExternal={true}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{ display: { xs: "none", sm: "inherit", md: "none" } }}
        >
          <Box
            sx={{
              width: "100%",
              backgroundColor:
                getCurrentModuleType() === ModuleTypes?.FOOD
                  ? alpha(theme.palette.moduleTheme.food, 0.05)
                  : "#062bfe",
              borderRadius: "23px",
              padding: "30px",
              color: "#FFFFFF",
              "& .MuiTypography-root": {
                color: "#FFFFFF",
              },
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <SomeInfo
                  image="/email_footer.png"
                  alt="Email"
                  title="Send us mails"
                  info={configData?.email}
                  t={t}
                  href={`mailto:${configData?.email}`}
                />
              </Grid>
              <Grid item xs={6}>
                <SomeInfo
                  image="/Whatsapp_footer.png"
                  alt="WhatsApp"
                  title="Contact us"
                  info="Info & Support"
                  t={t}
                  href="https://wa.link/yofrezco"
                  isExternal={true}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      {open && (
        <LocationViewOnMap
          open={open}
          handleClose={handleOpenCloseMap}
          latitude={configData?.default_location?.lat}
          longitude={configData?.default_location?.lng}
          address={configData?.address}
          isFooter
        />
      )}
    </CustomStackFullWidth>
  );
};

FooterMiddle.propTypes = {};

export default FooterMiddle;
