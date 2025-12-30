import React from "react";
import PropTypes from "prop-types";
import {
  CustomBoxFullWidth,
  CustomStackFullWidth,
} from "../../../../styled-components/CustomStyles.style";
import { Typography, useTheme, Stack, Grid } from "@mui/material";
import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";
import CustomCountdown from "../../../countdown";
import { useRouter } from "next/router";
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
          height: "220px",
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

const ItemsCampaign = ({ flashSales }) => {

  const theme = useTheme();
  const router = useRouter()

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
        backgroundColor: "transparent",
        padding: "4px",
        borderRadius: "10px",
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

      {/* Grid Layout for Flash Sale Products */}
      <Box sx={{ width: "100%", px: 2, py: 2 }}>
        <Grid container spacing={2}>
          {flashSales?.active_products?.slice(0, 10).map((item, index) => {
            return (
              <Grid
                key={item?.item?.id || index}
                item
                xs={6}
                sm={4}
                md={3}
                lg={2.4}
              >
                <ProductCard
                  item={{ ...item?.item }}
                  cardheight="340px"
                  cardFor="flashSale"
                  cardType="vertical-type"
                  sold={item?.sold}
                  stock={item?.available_stock}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Stack width="100%" alignItems="end" justifyContent="center">
        <Typography
          onClick={handleFlashSales}
          sx={{
            textDecoration: "underLine",
            color: theme => theme.palette.neutral[400],
            cursor: "pointer"
          }}
          fontSize="16px"
          fontWeight="600"
          marginRight="10px"
        >
          {("See All")}
        </Typography>
      </Stack>
    </CustomStackFullWidth>
  );
};

ItemsCampaign.propTypes = {};

export default ItemsCampaign;
