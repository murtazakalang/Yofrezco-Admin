import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  CustomBoxFullWidth,
  CustomStackFullWidth,
} from "styled-components/CustomStyles.style";
import { Grid, Skeleton, useMediaQuery } from "@mui/material";
import { data_limit } from "api-manage/ApiRoutes";
import { setOrderType } from "redux/slices/utils";
import { useTheme } from "@mui/material/styles";
import { toast } from "react-hot-toast";
import { Stack } from "@mui/system";
import CustomEmptyResult from "components/custom-empty-result";
import CustomPagination from "components/custom-pagination";
import TabsTypeOne from "components/custom-tabs/TabsTypeOne";
import Trip, { CustomPaper } from "./Trip";
import useGetTripList from "../../rental-api-manage/hooks/react-query/trip-list/useGetTripList";
import nodata from "../../../rental/components/my-trips/assets/nodata.png";
const CustomShimmerCard = ({ isXs }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <CustomBoxFullWidth>
      <Grid container spacing={3}>
        {[...Array(6)].map((item, index) => {
          return (
            <Grid item xs={12} sm={isXs ? 12 : 6} md={12} lg={12} key={index}>
              <CustomPaper>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    width="100%"
                  >
                    <Skeleton
                      variant="rectangular"
                      width={isSmall ? "100px" : "90px"}
                      height={isSmall ? "100px" : "72px"}
                    />
                    <Stack width="100%" spacing={0.5}>
                      <Skeleton
                        variant="text"
                        width="200px"
                        height={isSmall ? "15px" : "20px"}
                      />
                      <Skeleton
                        variant="text"
                        width="130px"
                        height={isSmall ? "15px" : "20px"}
                      />
                      <Skeleton
                        variant="text"
                        width="130px"
                        height={isSmall ? "15px" : "20px"}
                      />
                      {isSmall && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Skeleton
                            variant="text"
                            width="100px"
                            height="20px"
                          />
                          <Skeleton
                            variant="text"
                            width="100px"
                            height="35px"
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                  {!isSmall && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Skeleton variant="text" width="130px" height="40px" />
                      <Skeleton variant="text" width="130px" height="60px" />
                    </Stack>
                  )}
                </Stack>
              </CustomPaper>
            </Grid>
          );
        })}
      </Grid>
    </CustomBoxFullWidth>
  );
};

const MyTrips = (props) => {
  const tabsData = [
    {
      title: "ongoing",
      // img: active,
      img: "",
    },
    {
      title: "previous",
      // img: past,
      img: "",
    },
  ];

  const theme = useTheme();
  const { configData } = props;
  const { t } = useTranslation();
  const isXs = useMediaQuery("(max-width:700px)");
  const { orderType, currentTab } = useSelector((state) => state.utilsData);

  const [offset, setOffSet] = useState(1);
  const dispatch = useDispatch();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const orderTypeValue = orderType === 0 ? "running" : "completed";
  const { data, refetch, isFetching } = useGetTripList({
    orderType: orderTypeValue,
    offset: offset,
  });

  useEffect(() => {
    refetch();
    dispatch(setOrderType(orderType === 0 ? 0 : 1));
  }, [orderType, offset]);

  useEffect(() => {
    if (currentTab) {
      setOffSet(1);
      dispatch(setOrderType(currentTab === "ongoing" ? 0 : 1));
    }
  }, [currentTab]);

  useEffect(() => {
    if (isFetching) {
      toast.loading(t("Getting Order List..."));
    } else {
      toast.dismiss();
    }
  }, [isFetching]);
  const handleInnerContent = () => {
    if (data) {
      if (data?.trips?.length === 0) {
        return (
          <CustomEmptyResult
            image={nodata}
            label="No Trips Found"
            width="128px"
            height="128px"
          />
        );
      } else {
        return (
          <Grid container spacing={2}>
            {data &&
              data?.trips?.length > 0 &&
              data?.trips?.map((order, index) => (
                <Grid
                  item
                  xs={12}
                  sm={isXs ? 12 : 6}
                  md={12}
                  lg={12}
                  key={order?.id}
                >
                  <Trip
                    index={index}
                    order={order}
                    t={t}
                    configData={configData}
                    dispatch={dispatch}
                  />
                </Grid>
              ))}
          </Grid>
        );
      }
    } else {
      return <CustomShimmerCard isXs={isXs} />;
    }
  };
  return (
    <CustomStackFullWidth
      spacing={2}
      sx={{
        minHeight: "80vh",
        padding: isSmall ? "10px 10px 10px 10px" : "20px 20px 20px 27px",
      }}
    >
      <TabsTypeOne
        tabs={tabsData}
        currentTab={currentTab}
        t={t}
        width="33px !important"
      />
      {/*<NavigationButtons t={t} setOffset={setOffSet} />*/}

      <CustomStackFullWidth spacing={3}>
        {handleInnerContent()}
        {data?.total_size > data_limit && (
          <CustomPagination
            total_size={data?.total_size}
            page_limit={data_limit}
            offset={offset}
            setOffset={setOffSet}
          />
        )}
      </CustomStackFullWidth>
    </CustomStackFullWidth>
  );
};

export default MyTrips;
