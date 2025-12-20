import { alpha, Box, positions } from "@mui/system";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import { Button, Grid, Skeleton, Stack, Typography } from "@mui/material";
import RentalCardWrapper from "../global/RentalCardWrapper";
import CustomContainer from "components/container";
import RentalProceedtoCheckout from "../global/RentalProceedtoCheckout";
import CardDetailsSingleCard from "../global/CardDetailsSingleCard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NearMeIcon from "@mui/icons-material/NearMe";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import RoomIcon from "@mui/icons-material/Room";
import CheckoutStepper from "components/checkout/item-checkout/CheckoutStepper";
import CustomModal from "components/modal";
import TripModalContent from "./TripModalContent";
import React, { useEffect, useState } from "react";
import { t } from "i18next";
import Link from "next/link";
import { useSelector } from "react-redux";
import CartPageCartContentCard from "components/home/module-wise-components/rental/components/rental-cart/CartPageCartContentCard";
import { FormatedDateWithTime } from "utils/CustomFunctions";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { useRouter } from "next/router";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import TripVehicleList from "components/home/module-wise-components/rental/components/rental-cart/TripVehicleList";
import dynamic from "next/dynamic";
import {
  calculateProviderWiseDiscount,
  calculateTotalDiscount,
  getTotalAmount,
  isCurrentTime,
} from "components/home/module-wise-components/rental/components/rental-checkout/checkoutHeplerFunction";
const CarBookingModal = dynamic(() =>
  import(
    "components/home/module-wise-components/rental/components/global/CarBookingModal"
  )
);
const RentalCartPage = () => {
  useScrollToTop();
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [openTripChange, setOpenTripChange] = React.useState(false);
  const [ids, setIds] = React.useState(null);
  const [updateCartObject, setUpdateCartObject] = React.useState({});
  const { cartList } = useSelector((state) => state.cart);
  const currentTime = new Date().toLocaleTimeString();
  // useEffect(() => {
  //   if ( cartList?.carts?.length === 0) {
  //     router.push("/home");
  //   }
  // }, [cartList]);

  const tripCost = getTotalAmount(cartList)
  const calculateProviderWiseDiscounts = calculateProviderWiseDiscount(cartList, tripCost)
  const isShowDiscount = calculateProviderWiseDiscounts > calculateTotalDiscount(cartList, tripCost)
  const finalDiscount = calculateProviderWiseDiscounts > calculateTotalDiscount(cartList, tripCost) ? calculateProviderWiseDiscounts : calculateTotalDiscount(cartList, tripCost)
  const discountDifference = calculateProviderWiseDiscounts === 0 || calculateTotalDiscount(cartList, tripCost) === 0 ? 0 : Math.abs(calculateProviderWiseDiscounts - calculateTotalDiscount(cartList, tripCost));

  return (
    <>
      <CustomContainer>
        <CustomStackFullWidth sx={{ mt: "40px" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <CustomStackFullWidth sx={{ mb: "30px" }}>
                <CheckoutStepper text2={t("Trip details")} text={t("Cart")} text1={t("Checkout")} />
              </CustomStackFullWidth>
              <RentalCardWrapper>
                {!cartList?.carts && <Skeleton height="200px" width="100%" />}
                {cartList?.carts?.map((item, index) => (
                  <CartPageCartContentCard
                    key={index}
                    item={item}
                    userData={cartList?.user_data}
                    cartPage={true}
                    showPrice={true}
                  />
                ))}
                <Box sx={{ textAlign: "center" }}>
                  {cartList?.carts?.length > 0 && (
                    <Link
                      href={`/rental/provider-details/${cartList?.carts[0].provider?.id}`}
                    >
                      <Button
                        sx={{
                          background: "none",
                          color: (theme) => theme.palette.primary.main,
                        }}
                      >
                        {t("Add More Vehicle")} +
                      </Button>
                    </Link>
                  )}
                </Box>
              </RentalCardWrapper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ position: "sticky", top: "80px" }}>
                <RentalCardWrapper >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    marginBottom="1rem"
                  >
                    <Typography fontWeight="600" fontSize="1rem">
                      {t("Trip Details")}
                    </Typography>

                    <BorderColorOutlinedIcon
                      onClick={() => setOpenModal(true)}
                      sx={{
                        fontSize: "16px",
                        cursor: "pointer",
                        color: (theme) => theme.palette.main,
                      }}
                    />
                  </Stack>
                  <Box sx={{ mb: "30px" }}>
                    <Box
                      sx={{
                        borderRadius: "10px",
                        mb: "15px",
                        border: (theme) =>
                          `1px solid ${theme.palette.neutral[200]}`,
                      }}
                    >
                      <CardDetailsSingleCard
                        icon={
                          <RoomIcon
                            sx={{
                              fontSize: "16px",
                              color: (theme) => theme.palette.neutral[400],
                            }}
                          />
                        }
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2, // Limits to 2 lines
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}

                          >
                            {cartList?.user_data?.pickup_location
                              ?.location_name ? (
                              cartList?.user_data?.pickup_location
                                ?.location_name
                            ) : (
                              <Skeleton height="20px" width="200px" />
                            )}
                          </Typography>
                        </Box>
                      </CardDetailsSingleCard>
                      <CardDetailsSingleCard
                        isShowEdit={false}
                        icon={
                          <NearMeIcon
                            sx={{
                              fontSize: "16px",
                              color: (theme) => theme.palette.neutral[400],
                            }}
                          />
                        }
                        sx={{ position: "relative" }}
                      >
                        <Box
                          sx={{
                            width: "1px",
                            borderLeft: (theme) =>
                              `1px dashed ${theme.palette.neutral[400]}`,
                            height: "50%",
                            position: "absolute",
                            top: "-15px",
                            left: "8%",
                          }}
                        ></Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2, // Limits to 2 lines
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {cartList?.user_data?.destination_location
                              ?.location_name ? (
                              cartList?.user_data?.destination_location
                                ?.location_name
                            ) : (
                              <Skeleton height="20px" width="200px" />
                            )}
                          </Typography>
                        </Box>
                      </CardDetailsSingleCard>
                    </Box>
                    <CardDetailsSingleCard
                      icon={
                        <CalendarTodayIcon
                          sx={{
                            fontSize: "16px",

                            color: (theme) => theme.palette.neutral[400],
                          }}
                        />
                      }
                      sx={{
                        borderRadius: "10px",
                        mb: "15px",
                        border: (theme) =>
                          `1px solid ${theme.palette.neutral[200]}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {isCurrentTime(cartList)
                            ? t("Schedule at")
                            : t("Pickup Now")}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: "400",
                            color: (theme) => theme.palette.neutral[400],
                            fontSize: "12px",
                          }}
                        >
                          - {isCurrentTime(cartList)
                            ? FormatedDateWithTime(
                              cartList?.user_data?.pickup_time
                            )
                            : FormatedDateWithTime(new Date())}
                        </Typography>
                      </Box>
                    </CardDetailsSingleCard>
                    <CardDetailsSingleCard
                      onClickEdit={() => setOpenModal(true)}
                      sx={{
                        borderRadius: "10px",
                        border: (theme) =>
                          `1px solid ${theme.palette.neutral[200]}`,
                      }}
                      icon={
                        <HourglassEmptyOutlinedIcon
                          sx={{
                            fontSize: "16px",
                            color: (theme) => theme.palette.neutral[500],
                          }}
                        />
                      }
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "start",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          {t("Rent Type")}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: "400",
                            color: (theme) => theme.palette.neutral[400],
                            fontSize: "12px",
                            textTransform: "capitalize",
                          }}
                        >
                          - {cartList?.user_data?.rental_type?.replace("_", " ")}
                        </Typography>
                      </Box>
                    </CardDetailsSingleCard>
                  </Box>
                  <RentalProceedtoCheckout
                    rentalUserData={cartList}
                    totalAmount={
                      Math.max(tripCost - finalDiscount, 0)
                    }
                    sx={{
                      boxShadow: "none",
                      p: "0px",
                    }}
                    onClick={() => {
                      router.push("/rental/checkout");
                    }}
                    discountDifference={discountDifference}
                    isShowDiscount={isShowDiscount}
                  />
                </RentalCardWrapper>
              </Box>
            </Grid>
          </Grid>
        </CustomStackFullWidth>
        {openModal && (
          <CarBookingModal
            open={openModal}
            handleClose={() => setOpenModal(false)}
            update
            data={cartList?.user_data}
            setOpenTripChange={setOpenTripChange}
            setIds={setIds}
            setUpdateCartObject={setUpdateCartObject}
          />
        )}
      </CustomContainer>
      <CustomModal
        openModal={openTripChange}
        handleClose={() => setOpenTripChange(false)}
      >
        <TripModalContent
          title="Trip Vehicle List"
          onCloseModal={() => {
            setOpenTripChange(false);
          }}
          content={
            <TripVehicleList
              onCloseModal={() => {
                setOpenTripChange(false);
              }}
              ids={ids}
              cartLists={cartList?.carts}
              updateCartObject={updateCartObject}
            />
          }
        />
      </CustomModal>
    </>
  );
};

export default RentalCartPage;
