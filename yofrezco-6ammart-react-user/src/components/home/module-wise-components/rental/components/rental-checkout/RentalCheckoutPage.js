import { alpha, Box } from "@mui/system";
import {
  CustomBoxFullWidth,
  CustomPaperBigCard,
  CustomStackFullWidth,
} from "styled-components/CustomStyles.style";
import { CustomRentalCard } from "../global/CustomRentalCard";
import {
  Button,
  Grid,
  InputAdornment,
  NoSsr,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CustomContainer from "components/container";
import CheckoutStepper from "components/checkout/item-checkout/CheckoutStepper";
import RentalCardWrapper from "../global/RentalCardWrapper";
import RentalProceedtoCheckout from "../global/RentalProceedtoCheckout";
import { t } from "i18next";
import ErrorIcon from "@mui/icons-material/Error";
import H3 from "components/typographies/H3";
import RentalBillDetails from "./RentalBillDetails";
import CustomTextFieldWithFormik from "components/form-fields/CustomTextFieldWithFormik";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import RentalAdditionalNote from "../global/RentalAdditionalNote";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useReducer, useState } from "react";
import {
  ACTIONS,
  checkoutInitialState,
  rentalCheckoutReducer,
} from "components/home/module-wise-components/rental/components/rental-checkout/state";
import {
  calculateTotalDiscount,
  rentalCouponDiscount,
  getRentalSubTotalPrice,
  getTotalAmount,
  getVat,
  getTotalPrice,
  isCurrentTime,
  calculateProviderWiseDiscount,
} from "components/home/module-wise-components/rental/components/rental-checkout/checkoutHeplerFunction";
import { useTripBooking } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/trip-booking/useTripBooking";
import {
  onErrorResponse,
  onSingleErrorResponse,
} from "api-manage/api-error-response/ErrorResponses";
import { useQuery } from "react-query";
import { CouponApi } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/coupon/useApplyCoupon";
import { setCouponInfo, setCouponType } from "redux/slices/profileInfo";
import { toast } from "react-hot-toast";
import { coupon_minimum } from "utils/toasterMessages";
import { getAmountWithSign } from "helper-functions/CardHelpers";
import Router from "next/router";
import { getGuestId, getToken } from "helper-functions/getToken";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import GuestUserInforForm from "components/address/GuestUserInforForm";
import { fTime } from "components/home/module-wise-components/rental/components/rentalfilter/RentalCarFilterSection";
import useGetCashBackAmount from "api-manage/hooks/react-query/cashback/useGetCashBackAmount";
import { useTheme } from "@mui/material";
import CardDetailsSingleCard from "../global/CardDetailsSingleCard";
import RoomIcon from "@mui/icons-material/Room";
import NearMeIcon from "@mui/icons-material/NearMe";
import TripDetails from "../trip-status/TripDetails";
import CarBookingModal from "../global/CarBookingModal";
import CustomModal from "components/modal";
import TripModalContent from "../rental-cart/TripModalContent";
import TripVehicleList from "../rental-cart/TripVehicleList";
import {
  useGetRentalTax
} from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/trip-booking/useGetRentalTax";
import {useGetSurgePrice} from "api-manage/hooks/react-query/order-place/useGetSurgePrice";
const RentalCheckoutPage = () => {
  useScrollToTop();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { cartList } = useSelector((state) => state.cart);
  const { configData } = useSelector((state) => state.configData);
  const { couponInfo } = useSelector((state) => state.profileInfo);
  const { guestUserInfo } = useSelector((state) => state.guestUserInfo);
  const [scheduleAt, setScheduleAt] = React.useState(0);
  const [cashbackAmount, setCashbackAmount] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openTripChange, setOpenTripChange] = React.useState(false);
  const [ids, setIds] = useState(null);
  const [updateCartObject, setUpdateCartObject] = useState(null);
  const { mutate, isLoading } = useTripBooking();
  const {mutate:rentalTaxMutate,data}=useGetRentalTax()
  const {data:surgePrice,mutate:surgeMutate}=useGetSurgePrice()
  const [state, checkoutDispatch] = useReducer(
    rentalCheckoutReducer,
    checkoutInitialState
  );

  const text1 = t("After completing the trip, you will receive a");
  const text2 = t(
    "cashback. The minimum purchase required to avail this offer is"
  );
  const text3 = t("However, the maximum cashback amount is");

  useEffect(() => {
    if (isCurrentTime(cartList)) {
      setScheduleAt(1);
    } else {
      setScheduleAt(0);
    }
  }, [cartList?.user_data?.pickup_time]);

  const handleAdditionalNotes = (value) => {
    checkoutDispatch({
      type: ACTIONS.setAdditionalNotes,
      payload: value,
    });
  };

  const handleCouponChange = (value) => {
    checkoutDispatch({
      type: ACTIONS.setRentalCouponCode,
      payload: value,
    });
  };

  
  const tripCost = getTotalAmount(cartList);
  const calculateProviderWiseDiscounts=calculateProviderWiseDiscount(cartList,tripCost)
  const isShowDiscount=calculateProviderWiseDiscounts>calculateTotalDiscount(cartList,tripCost)
  const tripDiscount = calculateProviderWiseDiscounts>calculateTotalDiscount(cartList,tripCost)?calculateProviderWiseDiscounts:calculateTotalDiscount(cartList,tripCost)
  const discountDifference = calculateProviderWiseDiscounts === 0 || calculateTotalDiscount(cartList,tripCost) === 0 ? 0 : Math.abs(calculateProviderWiseDiscounts - calculateTotalDiscount(cartList,tripCost));
 
  

  const rentalCoupon =
    cartList?.carts?.length > 0 &&
    rentalCouponDiscount(
      state?.couponDiscount,
      cartList?.carts[0]?.provider,
      cartList
    );

  const subTotal = getRentalSubTotalPrice(cartList, rentalCoupon || 0,tripCost,(tripDiscount>tripCost? tripCost:tripDiscount));
  const storeData = cartList?.carts?.length > 0 && cartList?.carts[0]?.provider;
  const referDiscount = null;
  const vat_tax = getVat(cartList, storeData, referDiscount, rentalCoupon);
  const isIncluded = data?.tax_included === 0 ? data?.tax_amount : 0;
  const totalPrice = getTotalPrice(
    cartList,
    isIncluded,
    rentalCoupon || 0,
    configData?.additional_charge || 0,
    tripCost,
    (tripDiscount>tripCost? tripCost:tripDiscount)
  );
  const tripObject = {
    provider_id: Array.isArray(cartList?.carts) && cartList.carts.length > 0
      ? cartList.carts[0]?.provider?.id
      : null,
    trip_type: cartList?.user_data?.rental_type,
    trip_amount: totalPrice,
    additional_note: state.additionalNotes,
    coupon_code: state?.rental_coupon_code,
    coupon_discount_amount: state?.couponDiscount?.discount,
    coupon_discount_title: state?.couponDiscount?.title,
    guest_id: getToken() ? null : getGuestId(),
    contact_person_number: getToken()
      ? null
      : guestUserInfo?.contact_person_number,
    contact_person_name: getToken()
      ? null
      : guestUserInfo?.contact_person_name,
    contact_person_email: getToken()
      ? null
      : guestUserInfo?.contact_person_email,
    schedule_at:
      scheduleAt === 1
        ? fTime(cartList?.user_data?.pickup_time)
        : fTime(new Date()),
    scheduled: scheduleAt,
  };

  useEffect(() => {
    if( cartList?.carts?.length>0){
      rentalTaxMutate(
        tripObject,{
          onError:onErrorResponse
        }
      )
    }
  }, [cartList,state?.couponDiscount?.discount]);
  const handleTripPlace = () => {
    mutate(tripObject, {
      onSuccess: (data) => {
        if (data) {
          Router.push(`/rental/trip-status/${data}?from="place_order"`);
        }
      },
      onError: onErrorResponse,
    });
  };

  const handleSuccess = (response) => {
    if (
      Number.parseInt(response?.data?.min_purchase) <= Number.parseInt(tripCost)
    ) {
      if (response?.data?.discount_type === "percent") {
        dispatch(setCouponInfo(response.data));
        toast.success(t("Coupon Applied"));
        dispatch(setCouponType(response.data.coupon_type));
        checkoutDispatch({
          type: ACTIONS.setCouponDiscount,
          payload: { ...response.data },
        });
      } else {
        if (response?.data?.discount && tripCost >= response?.data?.discount) {
          dispatch(setCouponInfo(response.data));
          toast.success(t("Coupon Applied"));
          dispatch(setCouponType(response.data.coupon_type));
          checkoutDispatch({
            type: ACTIONS.setCouponDiscount,
            payload: { ...response.data },
          });
        } else {
          toast.error(t("Your total price must be more then coupon amount"));
        }
      }
    } else {
      toast.error(
        `${t(coupon_minimum)} ${getAmountWithSign(
          response?.data?.min_purchase
        )}`
      );
    }
  };

  const { isLoading: couponIsLoading, refetch } = useQuery(
    "apply-coupon-rental",
    () =>
      CouponApi.applyCoupon(
        state.rental_coupon_code,
        cartList?.carts[0].provider?.id
      ),
    {
      onSuccess: handleSuccess,
      onError: onErrorResponse,
      enabled: false,
      retry: 1,
    }
  );

  const handleApply = async () => {
    if (state.rental_coupon_code) {
      await refetch();
    } else {
      toast.error(t("Enter your coupon code"));
    }
  };

  const removeCoupon = () => {
    checkoutDispatch({
      type: ACTIONS.setCouponDiscount,
      payload: null,
    });
    checkoutDispatch({
      type: ACTIONS.setRentalCouponCode,
      payload: "",
    });
    dispatch(setCouponInfo(null));
  };

  let zoneId;
  if (typeof window !== "undefined") {
    zoneId = JSON.parse(localStorage.getItem("zoneid"));
  }

  useEffect(() => {
    if (cartList?.carts?.length === 0 || !zoneId) {
      Router.push("/home");
    }
  }, [cartList?.carts?.length, zoneId]);

  const handleCashbackAmount = (data) => {
    setCashbackAmount(data);
  };
  const { refetch: refetchCashbackAmount } = useGetCashBackAmount({
    amount: totalPrice,
    handleSuccess: handleCashbackAmount,
  });
  useEffect(() => {
    if (totalPrice > 0) {
      refetchCashbackAmount();
    }
  }, [totalPrice]);

  return (
    <CustomContainer>
      <CustomStackFullWidth sx={{ mt: "40px" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <CustomStackFullWidth sx={{ mb: "30px" }}>
              <CheckoutStepper
                text2={t("Trip details")}
                text={t("Cart")}
                text1={t("Checkout")}
              />
            </CustomStackFullWidth>
            <RentalCardWrapper>
              <H3
                text="Vehicle List"
                sx={{
                  fontWeight: "500",
                  color: (theme) => theme.palette.neutral[1000],
                }}
              />
              <Box sx={{ mt: "20px" }}>
                {!cartList?.carts && <Skeleton height="200px" width="100%" />}
                {cartList?.carts?.map((item, index) => (
                  <CustomRentalCard.root
                    key={index}
                    sx={{
                      background: (theme) =>
                        alpha(theme.palette.neutral[200], 0.2),
                      p: "20px",
                      mb: "20px",
                      justifyContent: "start",
                      flexWrap: {
                        xs: "wrap",
                        sm: "nowrap",
                      },
                      alignItems: {
                        xs: "start",
                        md: "center",
                      },
                      gap: "20px",
                    }}
                  >
                    <CustomRentalCard.image
                      itemImage={item?.vehicle?.thumbnail_full_url}
                      imgWidth={{
                        xs: "100%",
                        sm: "160px",
                        md: "160px",
                      }}
                      imgHeight={{
                        xs: "150px",
                        md: "80px",
                      }}
                    />
                    <CustomRentalCard.details item={item} showIcons={false} />
                  </CustomRentalCard.root>
                ))}
              </Box>
            </RentalCardWrapper>
            <TripDetails
              tripDetails={{
                destination_location: cartList?.user_data?.destination_location,
                pickup_location: cartList?.user_data?.pickup_location,
                schedule_at: cartList?.user_data?.pickup_time,
                trip_type: cartList?.user_data?.rental_type,
                estimated_hours: cartList?.user_data?.estimated_hours,
                distance: cartList?.user_data?.distance,
              }}
              setOpenModalCheckout={setOpenModal}
              checkOut
            />

            {!getToken() && (
              <RentalCardWrapper sx={{ mt: "20px" }}>
                <GuestUserInforForm configData={configData} rental />
              </RentalCardWrapper>
            )}

            <RentalAdditionalNote
              handleAdditionalNotes={handleAdditionalNotes}
              value={state.additionalNotes}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ minHeight: { xs: "0", md: "139vh" } }}>
              <RentalCardWrapper sx={{ position: "sticky", top: "80px" }}>
                {getToken() && (
                  <CustomBoxFullWidth
                    sx={{
                      display: "flex",
                      justifyContent: "start",
                      alignItems: "start",
                      gap: "10px",
                      mb: "20px",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <CustomTextFieldWithFormik
                        key={state.rental_coupon_code}
                        height="45px"
                        type="text"
                        label={t("Promo Coupon")}
                        placeholder={t("Enter Your Code")}
                        onChangeHandler={handleCouponChange}
                        value={
                          state.rental_coupon_code
                            ? state.rental_coupon_code
                            : ""
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleApply();
                          }
                        }}
                        startIcon={
                          <InputAdornment position="start">
                            <ConfirmationNumberIcon
                              sx={{
                                fontSize: "18px",
                                transform: "rotate(90deg)",
                                color: (theme) => theme.palette.neutral[400],
                              }}
                            />
                          </InputAdornment>
                        }
                      />
                    </Box>

                    <Box sx={{ flex: 0.3 }}>
                      {state?.couponDiscount ? (
                        <Button
                          sx={{
                            width: "100%",
                            backgroundColor: (theme) =>
                              theme.palette.error.main,
                            padding: "10px 20px",
                          }}
                          variant="contained"
                          onClick={removeCoupon}
                        >
                          {t("Remove")}
                        </Button>
                      ) : (
                        <Button
                          sx={{
                            width: "100%",
                            padding: "10px 20px",
                          }}
                          variant="contained"
                          onClick={handleApply}
                        >
                          {t("Apply")}
                        </Button>
                      )}
                    </Box>
                  </CustomBoxFullWidth>
                )}
                <RentalBillDetails
                  showTotal={false}
                  tripDiscount={tripDiscount}
                  tripCost={tripCost}
                  subTotal={subTotal}
                  rentalCoupon={rentalCoupon}
                  vatTax={data}
                  storeData={storeData}
                  totalPrice={totalPrice}
                  couponDiscount={state?.couponDiscount}
                  vatPer={storeData?.tax}
                  additionalCharge={configData?.additional_charge}
                />
                {getToken() && cashbackAmount?.cashback_amount > 0 && (
                  <Grid item xs={12} my="1rem">
                    <Box
                      borderRadius={"5px"}
                      borderLeft={`2px solid ${theme.palette.primary.main}`}
                      padding={"0.3rem"}
                      paddingLeft={"0.7rem"}
                      backgroundColor={alpha(theme.palette.primary.main, 0.051)}
                      fontSize={{ xs: "0.7rem" }}
                    >
                      {cashbackAmount?.cashback_amount > 0
                        ? `${text1} ${
                            cashbackAmount?.cashback_type === "percentage"
                              ? cashbackAmount?.cashback_amount + "%"
                              : getAmountWithSign(
                                  cashbackAmount?.cashback_amount
                                )
                          } ${text2} ${getAmountWithSign(
                            cashbackAmount?.min_purchase
                          )}. ${
                            cashbackAmount?.cashback_type === "percentage"
                              ? text3 +
                                " " +
                                getAmountWithSign(
                                  cashbackAmount?.max_discount
                                ) +
                                "."
                              : ""
                          }`
                        : ""}
                    </Box>
                  </Grid>
                )}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "start",
                    gap: "8px",
                    mb: "20px",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "12px",
                      color: (theme) => theme.palette.primary.main,
                    }}
                  >
                    *
                  </Typography>
                  <Typography sx={{ fontSize: "12px" }}>
                    {t("By placing the booking you are agreed to the")}{" "}
                    <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                      <Typography
                        component="span"
                        sx={{
                          textDecoration: "underline",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                          color: (theme) => theme.palette.primary.main,
                        }}
                      >
                        {t("Terms & Conditions")}
                      </Typography>
                    </Link>
                  </Typography>

                </Box>
                <RentalProceedtoCheckout
                  totalAmount={totalPrice}
                  rentalUserData={cartList}
                  text="Confirm Booking"
                  onClick={handleTripPlace}
                  isLoading={isLoading}
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
          callUpdateUserData={false}
        />
      )}
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
    </CustomContainer>
  );
};

export default RentalCheckoutPage;
