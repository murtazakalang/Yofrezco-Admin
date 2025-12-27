import React from "react";
import {
  CustomBoxFullWidth,
} from "styled-components/CustomStyles.style";
import { styled, Box, Grid, Skeleton } from "@mui/material";
import { useSelector } from "react-redux";
import { useGetFeaturedCategories } from "api-manage/hooks/react-query/all-category/all-categorys";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { ModuleTypes } from "helper-functions/moduleTypes";
import FoodCategoryCard from "../../cards/FoodCategoryCard";
import PharmacyCategoryCard from "../../cards/PharmacyCategoryCard";
import ShopCategoryCard from "../../cards/ShopCategoryCard";
import { HomeComponentsWrapper } from "../HomePageComponents";
import FeaturedItemCard from "./card";
import { useTranslation } from "react-i18next";

// Localized Title Image Component for Categories
const LocalizedCategoryTitle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isSpanish = currentLang === "es" || currentLang.startsWith("es");

  const imageSrc = isSpanish
    ? "/categories_spanish.png"
    : "/categories_english.png";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        mb: 2
      }}
    >
      <img
        src={imageSrc}
        alt="Categories"
        style={{
          height: "220px",
          width: "auto",
          objectFit: "contain"
        }}
      />
    </Box>
  );
};

// Grid container for categories
const CategoriesGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "16px",
  padding: "0 16px",
  [theme.breakpoints.down("sm")]: {
    gap: "10px",
    padding: "0 8px",
  },
}));

const FeaturedCategories = () => {
  const { featuredCategories } = useSelector((state) => state.storedData);
  const { data, isFetched, refetch, isLoading } = useGetFeaturedCategories();

  const moduleWiseGrid = () => {
    switch (getCurrentModuleType()) {
      case ModuleTypes.GROCERY:
        return (
          <CategoriesGrid>
            {[...data?.data].reverse().map((item, index) => (
              <FeaturedItemCard
                key={index}
                image={item?.image_full_url}
                title={item?.name}
                id={item?.id}
                slug={item?.slug}
              />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.PHARMACY:
        return (
          <CategoriesGrid>
            {[...data?.data].reverse()?.map((item, index) => (
              <PharmacyCategoryCard
                key={index}
                image={item?.image_full_url}
                title={item?.name}
                slug={item?.slug}
                id={item?.id}
              />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.ECOMMERCE:
        return (
          <CategoriesGrid>
            {data?.data?.map((item, index) => (
              <ShopCategoryCard
                key={index}
                imageUrl={item?.image_full_url}
                item={item}
              />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.FOOD:
        return (
          <CategoriesGrid>
            {data?.data?.map((item, index) => (
              <FoodCategoryCard
                key={item?.id}
                id={item?.id}
                categoryImage={item?.image}
                name={item?.name}
                slug={item?.slug}
                categoryImageUrl={item?.image_full_url}
                height="40px"
              />
            ))}
          </CategoriesGrid>
        );
      default:
        return null;
    }
  };

  const moduleWiseGridShimmer = () => {
    const shimmerCount = 12; // Show 12 shimmer items
    switch (getCurrentModuleType()) {
      case ModuleTypes.GROCERY:
        return (
          <CategoriesGrid>
            {[...Array(shimmerCount)]?.map((_, index) => (
              <FeaturedItemCard key={index} onlyshimmer />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.PHARMACY:
        return (
          <CategoriesGrid>
            {[...Array(shimmerCount)]?.map((_, index) => (
              <PharmacyCategoryCard key={index} onlyshimmer />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.ECOMMERCE:
        return (
          <CategoriesGrid>
            {[...Array(shimmerCount)]?.map((_, index) => (
              <ShopCategoryCard key={index} onlyshimmer />
            ))}
          </CategoriesGrid>
        );
      case ModuleTypes.FOOD:
        return (
          <CategoriesGrid>
            {[...Array(shimmerCount)]?.map((_, index) => (
              <FoodCategoryCard key={index} onlyshimmer />
            ))}
          </CategoriesGrid>
        );
      default:
        return null;
    }
  };

  return (
    <CustomBoxFullWidth sx={{ mt: "20px" }}>
      {isLoading ? (
        <HomeComponentsWrapper>
          {moduleWiseGridShimmer()}
        </HomeComponentsWrapper>
      ) : (
        data?.data &&
        data?.data.length > 0 && (
          <HomeComponentsWrapper>
            <LocalizedCategoryTitle />
            {data?.data && data?.data.length > 0 && (
              <>
                {moduleWiseGrid()}
              </>
            )}
          </HomeComponentsWrapper>
        )
      )}
    </CustomBoxFullWidth>
  );
};

export default FeaturedCategories;
