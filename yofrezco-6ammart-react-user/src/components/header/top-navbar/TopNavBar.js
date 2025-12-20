import { Box, NoSsr, Stack, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import { CustomStackForLoaction } from "../NavBar.style";
import AddressReselect from "./address-reselect/AddressReselect";
import CustomLanguage from "./language/CustomLanguage";
import { useSelector } from "react-redux";
import CallToAdmin from "../../CallToAdmin";
import CustomContainer from "../../container";
import LogoSide from "../../logo/LogoSide";
import DrawerMenu from "./drawer-menu/DrawerMenu";

const TopNavBar = () => {
  const { configData, countryCode, language } = useSelector(
    (state) => state.configData
  );
  const [openDrawer, setOpenDrawer] = useState(false);

  let location = undefined;
  if (typeof window !== "undefined") {
    location = localStorage.getItem("location");
  }

  const isSmall = useMediaQuery("(max-width:1180px)");

  return (
    <>
      <NoSsr>
        <Box
          sx={{
            width: "100%",
            background: (theme) => theme.palette.neutral[100],
          }}
        >
          {/* DESKTOP VIEW */}
          {!isSmall && (
            <CustomContainer>
              <Box
                sx={{
                  display: isSmall ? "none" : "block",
                  borderRadius: "0",
                }}
              >
                <Stack
                  pt=".4rem"
                  pb=".4rem"
                  width="100%"
                  height="30px"
                  direction="row"
                  justifyContent="space-between"
                >
                  <CustomStackForLoaction direction="row">
                    {location && (
                      <AddressReselect
                        setOpenDrawer={setOpenDrawer}
                        location={location}
                      />
                    )}
                  </CustomStackForLoaction>

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="end"
                    alignItems="center"
                  >
                    {configData?.phone && (
                      <CallToAdmin configData={configData} />
                    )}

                    <CustomLanguage
                      countryCode={countryCode}
                      language={language}
                    />
                  </Stack>
                </Stack>
              </Box>
            </CustomContainer>
          )}

          {/* MOBILE VIEW */}
          {isSmall && (
            <CustomContainer>
              <Box
                sx={{
                  display: {
                    xs: "grid",
                    md: "none",
                  },
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  width: "100%",
                  py: 1,
                }}
              >
                {/* LEFT — LOCATION */}
                <Box display="flex" justifyContent="flex-start">
                  {location && (
                    <AddressReselect
                      setOpenDrawer={setOpenDrawer}
                      location={location}
                    />
                  )}
                </Box>

                {/* CENTER — LOGO */}
                <Box display="flex" alignItems="center" justifyContent="center">
                  <LogoSide width="126px" configData={configData} />
                </Box>

                {/* RIGHT — DRAWER MENU */}
                <Box display="flex" justifyContent="flex-end">
                  <DrawerMenu
                    openDrawer={openDrawer}
                    setOpenDrawer={setOpenDrawer}
                  />
                </Box>
              </Box>
            </CustomContainer>
          )}
        </Box>
      </NoSsr>
    </>
  );
};

export default TopNavBar;
