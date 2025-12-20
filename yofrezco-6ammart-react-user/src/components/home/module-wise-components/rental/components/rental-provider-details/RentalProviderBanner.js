import RentalCardWrapper from "../global/RentalCardWrapper";
import RentalCarVehicleRating from "./RentalCarVehicleRating";
import { Grid } from "@mui/material";
import RentalCarDetailsBannerImg from "./RentalCarDetailsBannerImg";
import { useRouter } from "next/router";
import { useGetProviderDetails } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/provider/useGetProviderDetails";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import StoreCustomMessage from "components/store-details/StoreCustomMessage";
import useGetProviderBanner from "../../rental-api-manage/hooks/react-query/provider/useGetProviderBanner";

const RentalProviderBanner = ({ configData }) => {
  useScrollToTop();
  const router = useRouter();
  const id = router.query?.id;
  const { data ,isLoading} = useGetProviderDetails(id);
  const { data: bannerData, isLoading: bannerLoading } = useGetProviderBanner(id);

  return (
    <RentalCardWrapper
      borderTopLeftRadius="0px"
      borderTopRightRadius="0px"
      sx={{
        mb: { xs: "20px", md: "-20px" },
      }}
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <RentalCarVehicleRating data={data || []} configData={configData} isLoading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RentalCarDetailsBannerImg
            cover_photo_url={data?.cover_photo_full_url}
            bannerData={bannerData}
            bannerLoading={bannerLoading}
            data={data}
          />
        </Grid>
        <Grid item xs={12} md={12}>
        {data?.announcement === 1 && (
            <StoreCustomMessage
              storeAnnouncement={data?.announcement_message}
            />
          )}
        </Grid>
      </Grid>
    </RentalCardWrapper>
  );
};

export default RentalProviderBanner;
