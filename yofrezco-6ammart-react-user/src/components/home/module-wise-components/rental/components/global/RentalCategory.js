import { CustomCarCard } from "components/home/module-wise-components/rental/components/Rental.style";
import { Box, Stack } from "@mui/system";
import { Tooltip, Typography, useTheme } from "@mui/material";

import { useRouter } from "next/router";
import CustomImageContainer from "components/CustomImageContainer";
import NextImage from "components/NextImage";

const RentalCategory = ({ data }) => {
  const router = useRouter();
  const rentalCategoryImage = data?.image_full_url;
  const rentalCategoryName = data?.name;
  const rentalCategoryId = data?.id;

  const handleCategoryClick = () => {
    router.push({
      pathname: "/rental/vehicle-search",
      query: { categoryId: rentalCategoryId },
    });
  };

  return (
    <CustomCarCard onClick={handleCategoryClick}>
      <Box sx={{ padding: "23px 16px 16px 16px" }}>
        <Stack
          alignItems="center"
          mb={1}
        
        >
          <NextImage
            width={180}
            height={120}
            src={rentalCategoryImage}
            objectFit="cover"
          />
        </Stack>
        <Tooltip
          title={rentalCategoryName}
          placement="top"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: (theme) => theme.palette.toolTipColor,
                "& .MuiTooltip-arrow": {
                  color: (theme) => theme.palette.toolTipColor,
                },
              },
            },
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              color: (theme) => theme.palette.neutral[500],
              fontWeight: "500",
              fontSize: "18px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {rentalCategoryName}
          </Typography>
        </Tooltip>
      </Box>
    </CustomCarCard>
  );
};

export default RentalCategory;
