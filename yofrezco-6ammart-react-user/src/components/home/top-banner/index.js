import { useTheme } from "@mui/material";
import { Box } from "@mui/system";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { CustomBoxFullWidth } from "styled-components/CustomStyles.style";
import CustomImageContainer from "../../CustomImageContainer";
import { BannerCityIcon } from "components/home/module-wise-components/rental/RentalIcons";
import LeftCar from "/public/static/rental/left_car.png";
import RightCar from "/public/static/rental/right_car.png";
import { useEffect, useState } from "react";

const TopBanner = ({ children }) => {
  const [moduleType, setModuleType] = useState(null);
  const theme = useTheme();
  // Ensure moduleType is set on the client
  useEffect(() => {
    setModuleType(getCurrentModuleType());
  }, []);
  // if (!moduleType) return null;

  return (
    <CustomBoxFullWidth
      sx={{
        // minHeight: {
        //   xs: moduleType === "parcel" ? "250px" : "160px",
        //   sm: "290px",
        //   md: "290px",
        // },
        backgroundColor: "#002bfe",
        position: "relative",
        padding: "16px 0",
      }}
    >
      {getCurrentModuleType() === "rental" && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            overflow: "hidden",
            zIndex: 0,
            svg: { position: "absolute" },

            ".left_img": (theme) => ({
              position: "absolute",
              left: "-150px",
              bottom: 0,
              [theme.breakpoints.up("sm")]: {
                left: "-60px",
              },
            }),
            ".right_img": (theme) => ({
              position: "absolute",
              left: "auto",
              right: "-150px",
              bottom: 0,
              [theme.breakpoints.up("sm")]: {
                right: "-50px",
              },
            }),
          }}
        >
          <BannerCityIcon height="100%" width="100%" objectFit="cover" />
          <CustomImageContainer
            className="left_img"
            src={LeftCar?.src}
            width={238}
            height={94}
          />
          <CustomImageContainer
            className="right_img"
            src={RightCar?.src}
            width={246}
            height={122}
          />
        </Box>
      )}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {children}
      </Box>
    </CustomBoxFullWidth>
  );
};

export default TopBanner;
