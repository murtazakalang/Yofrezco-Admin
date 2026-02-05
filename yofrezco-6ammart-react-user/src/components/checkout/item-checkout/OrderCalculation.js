import InfoIcon from "@mui/icons-material/Info";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Box, alpha } from "@mui/system";
import {
  getAmountWithSign,
  getReferDiscount,
} from "helper-functions/CardHelpers";
import { getGuestId, getToken } from "helper-functions/getToken";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setTotalAmount } from "redux/slices/cart";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import {
  bad_weather_fees,
  getCalculatedTotal,
  getCouponDiscount,
  getDeliveryFees,
  getProductDiscount,
  getSubTotalPrice,
  getTaxableTotalPrice,
  handlePurchasedAmount,
  handleDistance,
  getInfoFromZoneData,
} from "utils/CustomFunctions";
import CustomDivider from "../../CustomDivider";
import { CalculationGrid, TotalGrid } from "../CheckOut.style";
import { useGetSurgePrice } from "api-manage/hooks/react-query/order-place/useGetSurgePrice";
import { onErrorResponse } from "api-manage/api-error-response/ErrorResponses";

const OrderCalculation = (props) => {
  const {
    cartList,
    storeData,
    couponDiscount,
    distanceData,
    configData,
    orderType,
    deliveryTip,
    origin,
    destination,
    zoneData,
    setDeliveryFee,
    extraCharge,
    walletBalance,
    setPayableAmount,
    additionalCharge,
    payableAmount,
    cashbackAmount,
    handleExtraPackaging,
    isPackaging,
    packagingCharge,
    customerData,
    initVauleEx,
    isLoading,
    taxAmount,
    scheduleAt,
    paymentMethod
  } = props;

  const token = getToken();
  const { t } = useTranslation();
  const [freeDelivery, setFreeDelivery] = useState("false");
  const { profileInfo } = useSelector((state) => state.profileInfo);
  const tempExtraCharge = extraCharge ?? 0;
  const theme = useTheme();
  let couponType = "coupon";
  const { data: surgePrice, mutate } = useGetSurgePrice()
  useEffect(() => {
    if (storeData) {
      const temData = {
        zone_id: storeData?.zone_id,
        module_id: storeData?.module_id,
        date_time: orderType === "schedule_order" ? scheduleAt : new Date().toISOString(),
        guest_id: getGuestId()
      }
      mutate(temData, {
        onError: onErrorResponse
      })
    }
  }, [storeData, orderType, scheduleAt]);
  const handleDeliveryFee = () => {
    let price = getDeliveryFees(
      storeData,
      configData,
      cartList,
      distanceData?.data,
      couponDiscount,
      couponType,
      orderType,
      zoneData,
      origin,
      destination,
      tempExtraCharge,
      surgePrice

    );

    // Add delivery commission to display the delivery fee including commission (but NOT tax)
    const commissionPercentage = configData?.delivery_commission_percentage ?? 0;
    const deliveryCommission = (commissionPercentage / 100) * price;
    const feeWithCommission = price + deliveryCommission;

    setDeliveryFee(orderType !== "delivery" ? 0 : price);
    if (price === 0) {
      return <Typography>{t("Free")}</Typography>;
    } else {
      return (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          spacing={0.5}
          width="100%"
        >
          <Typography>{"(+)"}</Typography>
          <Typography>{storeData && getAmountWithSign(feeWithCommission)}</Typography>
        </Stack>
      );
    }
  };

  const handleCouponDiscount = () => {
    let couponDiscountValue = getCouponDiscount(
      couponDiscount,
      storeData,
      cartList
    );

    if (couponDiscount && couponDiscount.coupon_type === "free_delivery") {
      setFreeDelivery("true");
      return 0;
    } else {
      return getAmountWithSign(couponDiscountValue);
    }
  };

  const totalAmountForRefer = couponDiscount
    ? handlePurchasedAmount(cartList) -
    getProductDiscount(cartList, storeData) -
    getCouponDiscount(couponDiscount, storeData, cartList)
    : handlePurchasedAmount(cartList) - getProductDiscount(cartList, storeData);
  const dispatch = useDispatch();
  const referDiscount = getReferDiscount(
    totalAmountForRefer,
    customerData?.data?.discount_amount,
    customerData?.data?.discount_amount_type
  );
  // Calculate delivery commission (product commission is already included in prices from API)
  const getDeliveryCommission = () => {
    if (orderType === 'take_away') return 0;
    const commissionPercentage = configData?.delivery_commission_percentage ?? 0;
    const deliveryFee = getDeliveryFees(
      storeData,
      configData,
      cartList,
      distanceData?.data,
      couponDiscount,
      couponType,
      orderType,
      zoneData,
      origin,
      destination,
      tempExtraCharge,
      surgePrice
    );
    return (commissionPercentage / 100) * deliveryFee;
  };

  // Calculate delivery tax on (delivery fee + commission)
  const getDeliveryTax = () => {
    if (orderType === 'take_away') return 0;
    const commissionPercentage = configData?.delivery_commission_percentage ?? 0;
    const taxPercentage = configData?.delivery_tax_percentage ?? 0;
    const deliveryFee = getDeliveryFees(
      storeData,
      configData,
      cartList,
      distanceData?.data,
      couponDiscount,
      couponType,
      orderType,
      zoneData,
      origin,
      destination,
      tempExtraCharge,
      surgePrice
    );
    const deliveryCommission = (commissionPercentage / 100) * deliveryFee;
    const feeWithCommission = deliveryFee + deliveryCommission;
    return (taxPercentage / 100) * feeWithCommission;
  };

  // Calculate payment gateway fee based on selected payment method
  // CyberSource + Fygaro (Visa/Mastercard): 3.5% card fee + $0.50 bank fee + 7% ITBMS on fees + $0.10 fygaro
  // Tilopay (Yappy): 1% fee + 7% ITBMS on fee
  const getPaymentGatewayFee = (baseTotal) => {
    if (!paymentMethod) return { total: 0, details: null };

    const isCyberSource = paymentMethod === 'cybersource';
    const isTilopay = paymentMethod === 'tilopay';

    if (isCyberSource) {
      const cardFeePercent = 3.5;
      const bankFixedFee = 0.50;
      const itbmsPercent = 7;
      const fygaroFixedFee = 0.10;

      const cardFee = (cardFeePercent / 100) * baseTotal;
      const feesBeforeItbms = cardFee + bankFixedFee;
      const itbmsFee = (itbmsPercent / 100) * feesBeforeItbms;
      const totalFee = cardFee + bankFixedFee + itbmsFee + fygaroFixedFee;

      return {
        total: totalFee,
        type: 'visa_mastercard',
        details: {
          cardFee,
          bankFixedFee,
          itbmsFee,
          fygaroFixedFee
        }
      };
    }

    if (isTilopay) {
      const yappyFeePercent = 1;
      const itbmsPercent = 7;

      const yappyFee = (yappyFeePercent / 100) * baseTotal;
      const itbmsFee = (itbmsPercent / 100) * yappyFee;
      const totalFee = yappyFee + itbmsFee;

      return {
        total: totalFee,
        type: 'yappy',
        details: {
          yappyFee,
          itbmsFee
        }
      };
    }

    return { total: 0, details: null };
  };

  const handleOrderAmount = () => {
    let totalAmount = getCalculatedTotal(
      cartList,
      couponDiscount,
      storeData,
      configData,
      distanceData,
      couponType,
      orderType,
      freeDelivery,
      Number(deliveryTip),
      zoneData,
      origin,
      destination,
      extraCharge,
      additionalCharge,
      packagingCharge,
      referDiscount,
      taxAmount?.tax_amount,
      surgePrice
    );
    // Add delivery commission (product commission is already included in product prices from API)
    const deliveryCommission = getDeliveryCommission();
    // Add delivery tax on (delivery fee + commission)
    const deliveryTax = getDeliveryTax();
    // Calculate base total before payment fees
    const baseTotalBeforePaymentFee = totalAmount + deliveryCommission + deliveryTax;
    // Add payment gateway fee
    const paymentFee = getPaymentGatewayFee(baseTotalBeforePaymentFee);
    totalAmount = baseTotalBeforePaymentFee + paymentFee.total;
    setPayableAmount(totalAmount);
    dispatch(setTotalAmount(totalAmount));
    return totalAmount;
  };
  let diffDiscount = {
    value: 0
  }
  const discountedPrice = getProductDiscount(cartList, storeData, diffDiscount);
  const totalAmountAfterPartial = handleOrderAmount() - walletBalance;
  const finalTotalAmount = profileInfo?.is_valid_for_discount
    ? handleOrderAmount() - referDiscount
    : handleOrderAmount();

  const text1 = t("After completing the order, you will receive a");
  const text2 = t(
    "cashback. The minimum purchase required to avail this offer is"
  );
  const text3 = t("However, the maximum cashback amount is");
  const extraText = t("This delivery fee includes all the applicable charges on delivery");
  const badText = t("and bad weather charge");

  // Calculate delivery details for debug/verification
  const distanceKm = handleDistance(distanceData?.data, origin, destination);
  let perKmCharge = 0;
  let minCharge = 0;

  if (Number.parseInt(storeData?.self_delivery_system) === 1) {
    perKmCharge = storeData?.per_km_shipping_charge || 0;
    minCharge = storeData?.minimum_shipping_charge || 0;
  } else {
    const chargeInfo = getInfoFromZoneData(zoneData);
    perKmCharge = chargeInfo?.pivot?.per_km_shipping_charge || 0;
    minCharge = chargeInfo?.pivot?.minimum_shipping_charge || 0;
  }

  const deliveryDebugText = ` (Dist: ${distanceKm?.toFixed(2)}km, Rate: ${getAmountWithSign(perKmCharge)}/km, Min: ${getAmountWithSign(minCharge)})`;

  const deliveryToolTipsText = `${extraText}${deliveryDebugText}${surgePrice?.customer_note_status !== 0
    ? `. ${surgePrice?.customer_note} `
    : ""
    }`;
  return (
    <>
      <CalculationGrid container item xs={12} spacing={1} mt="1rem">
        {storeData?.extra_packaging_status ? (
          <>
            <Grid item xs={8}>
              <FormControlLabel
                onChange={(e) => handleExtraPackaging(e)}
                control={<Checkbox />}
                label={
                  <Typography
                    fontWeight="400"
                    fontSize="13px"
                    color={theme.palette.primary.main}
                  >
                    {t("Extra Packaging")}
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={4} align="right" alignSelf="center">
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
              >
                <Typography>{getAmountWithSign(initVauleEx)}</Typography>
              </Stack>
            </Grid>
          </>
        ) : null}

        <Grid item md={8} xs={8}>
          {cartList.length > 1 ? t("Items Price") : t("Item Price")}
        </Grid>
        <Grid item md={4} xs={4} align="right">
          <Typography textTransform="capitalize" align="right">
            {getAmountWithSign(getSubTotalPrice(cartList))}

          </Typography>
        </Grid>
        <Grid item md={8} xs={8}>
          {t("Discount")}
        </Grid>
        <Grid item md={4} xs={4} align="right">
          <Stack
            width="100%"
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={0.5}
          >
            <Typography>{"(-)"}</Typography>
            <Typography>
              {storeData ? getAmountWithSign(discountedPrice) : null}
            </Typography>
          </Stack>
        </Grid>
        {couponDiscount ? (
          <>
            <Grid item md={8} xs={8}>
              {t("Coupon Discount")}
            </Grid>
            <Grid item md={4} xs={4} align="right">
              {couponDiscount.coupon_type === "free_delivery" ? (
                <Typography textTransform="capitalize">
                  {t("Free Delivery")}
                </Typography>
              ) : (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                >
                  <Typography>{"(-)"}</Typography>
                  <Typography>
                    {storeData && cartList && handleCouponDiscount()}
                  </Typography>
                </Stack>
              )}
            </Grid>
          </>
        ) : null}
        {customerData?.data?.is_valid_for_discount ? (
          <>
            <Grid item md={8} xs={8}>
              {t("Referral Discount")}
            </Grid>
            <Grid item md={4} xs={4} align="right">
              <Stack
                width="100%"
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
              >
                <Typography>{"(-)"}</Typography>
                <Typography>{getAmountWithSign(referDiscount)}</Typography>
              </Stack>
            </Grid>
          </>
        ) : null}
        {
          taxAmount?.tax_included !== null && taxAmount?.tax_included === 0 ? (
            <>
              <Grid item md={8} xs={8}>
                {t("VAT/TAX")}
              </Grid>
              <Grid item md={4} xs={4} align="right">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                >
                  <Typography>
                    {taxAmount?.tax_included === 0 && <>{"(+)"}</>}
                    {getAmountWithSign(taxAmount?.tax_amount)}
                  </Typography>
                </Stack>
              </Grid>
            </>
          ) : null
        }
        {orderType === "delivery" || orderType === "schedule_order" ? (
          Number.parseInt(configData?.dm_tips_status) === 1 ? (
            <>
              <Grid item md={8} xs={8} sx={{ textTransform: "capitalize" }}>
                {t("Deliveryman tips")}
              </Grid>
              <Grid item md={4} xs={4} align="right">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                >
                  <Typography>{"(+)"}</Typography>
                  <Typography>{getAmountWithSign(deliveryTip)}</Typography>
                </Stack>
              </Grid>
            </>
          ) : null
        ) : null}

        {configData?.additional_charge_status === 1 ? (
          <>
            <Grid item xs={8} sx={{
              textTransform: "capitalize",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap", // ensures single line
            }}>
              {t(configData?.additional_charge_name)}
            </Grid>
            <Grid item xs={4} align="right">
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
              >
                <Typography>{"(+)"}</Typography>
                <Typography>
                  {getAmountWithSign(configData?.additional_charge)}
                </Typography>
              </Stack>
            </Grid>
          </>
        ) : null}
        {isPackaging ? (
          <>
            <Grid item xs={8} sx={{ textTransform: "capitalize" }}>
              {t("Extra Packaging")}
            </Grid>
            <Grid item xs={4} align="right">
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
              >
                <Typography>{"(+)"}</Typography>
                <Typography>{getAmountWithSign(packagingCharge)}</Typography>
              </Stack>
            </Grid>
          </>
        ) : null}
        {
          <>
            {isLoading ? (
              <CustomStackFullWidth
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ paddingInlineStart: "5px" }}
              >
                <Skeleton variant="text" width="50px" />
                <Skeleton variant="text" width="50px" />
              </CustomStackFullWidth>
            ) : (
              <>
                {orderType === "delivery" || orderType === "schedule_order" ? (
                  <>
                    <Grid item xs={8} sx={{ textTransform: "capitalize" }}>
                      <Typography component="span" align="center">
                        {t("Delivery fee")}
                        {Number.parseInt(storeData?.self_delivery_system) !==
                          1 && (
                            <Typography component="span">
                              <Tooltip
                                title={deliveryToolTipsText}
                                placement="top"
                                arrow={true}
                              >
                                <InfoIcon sx={{ fontSize: "11px" }} />
                              </Tooltip>
                            </Typography>
                          )}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} align="right">
                      {couponDiscount ? (
                        couponDiscount?.coupon_type === "free_delivery" ? (
                          <Typography>{t("Free")}</Typography>
                        ) : (
                          storeData && handleDeliveryFee()
                        )
                      ) : (
                        storeData && handleDeliveryFee()
                      )}
                    </Grid>
                    {/* Delivery Tax/ITBMS - shown separately */}
                    {getDeliveryTax() > 0 && (
                      <>
                        <Grid item xs={8} sx={{ textTransform: "capitalize" }}>
                          <Typography component="span">
                            {t("Delivery Tax/ITBMS")}
                          </Typography>
                        </Grid>
                        <Grid item xs={4} align="right">
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-end"
                            spacing={0.5}
                          >
                            <Typography>{"(+)"}</Typography>
                            <Typography>{getAmountWithSign(getDeliveryTax())}</Typography>
                          </Stack>
                        </Grid>
                      </>
                    )}
                    {/* Payment Gateway Fee - shown based on selected payment method */}
                    {(() => {
                      // Calculate base total for payment fee
                      const baseTotal = getCalculatedTotal(
                        cartList,
                        couponDiscount,
                        storeData,
                        configData,
                        distanceData,
                        couponType,
                        orderType,
                        freeDelivery,
                        Number(deliveryTip),
                        zoneData,
                        origin,
                        destination,
                        extraCharge,
                        additionalCharge,
                        packagingCharge,
                        referDiscount,
                        taxAmount?.tax_amount,
                        surgePrice
                      ) + getDeliveryCommission() + getDeliveryTax();
                      const paymentFee = getPaymentGatewayFee(baseTotal);

                      if (paymentFee.total > 0) {
                        return (
                          <>
                            <Grid item xs={8} sx={{ textTransform: "capitalize" }}>
                              <Typography component="span">
                                {paymentFee.type === 'visa_mastercard'
                                  ? t("Visa/Mastercard Fee")
                                  : t("Yappy Fee")}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} align="right">
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="flex-end"
                                spacing={0.5}
                              >
                                <Typography>{"(+)"}</Typography>
                                <Typography>{getAmountWithSign(paymentFee.total)}</Typography>
                              </Stack>
                            </Grid>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </>
                ) : null}
              </>
            )}
          </>
        }

        <CustomDivider border="1px" />
        <TotalGrid container md={12} xs={12} mt="1rem">
          {isLoading ? (
            <CustomStackFullWidth
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ paddingInlineStart: "5px" }}
            >
              <Skeleton variant="text" width="50px" />
              <Skeleton variant="text" width="50px" />
            </CustomStackFullWidth>
          ) : (
            <>
              <Grid
                item
                md={8}
                xs={8}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: "700",
                  color: (theme) => theme.palette.primary.main,
                  paddingInlineStart: "7px",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    textTransform: "capitalize",
                    fontWeight: "700",
                  }}
                >
                  {t("Total")}
                  <Typography sx={{ marginInlineStart: "5px" }} component="span" fontSize="12px" fontWeight="400" color={theme.palette.primary.main}>
                    {(taxAmount?.tax_included === 1) && ("(Vat/Tax incl.)")}
                  </Typography>
                </Typography>
              </Grid>
              <Grid item md={4} xs={4} align="right">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                >
                  <Typography color={theme.palette.primary.main} align="right">
                    {" "}
                    {storeData &&
                      cartList &&
                      getAmountWithSign(finalTotalAmount)}
                  </Typography>
                </Stack>
              </Grid>
            </>
          )}
        </TotalGrid>
        {diffDiscount?.value > 0 ? <Typography
          sx={{
            fontSize: "14px",
            fontWeight: "400",
            width: "100%",
            color: (theme) => theme.palette.neutral[1000],
            padding: "5px 0px",
            backgroundColor: "#FFF6CA",
          }}
          align="center"
        >
          {t(`You got ${getAmountWithSign(diffDiscount?.value)} additional discount`)}
        </Typography> : null}
        {token && cashbackAmount?.cashback_amount > 0 && (
          <Grid item xs={12}>
            <Box
              borderRadius={"5px"}
              borderLeft={`2px solid ${theme.palette.primary.main}`}
              padding={"0.3rem"}
              paddingLeft={"0.7rem"}
              backgroundColor={alpha(theme.palette.primary.main, 0.051)}
              fontSize={{ xs: "0.7rem" }}
            >
              {cashbackAmount?.cashback_amount > 0
                ? `${text1} ${cashbackAmount?.cashback_type === "percentage"
                  ? cashbackAmount?.cashback_amount + "%"
                  : getAmountWithSign(cashbackAmount?.cashback_amount)
                } ${text2} ${getAmountWithSign(
                  cashbackAmount?.min_purchase
                )}. ${cashbackAmount?.cashback_type === "percentage"
                  ? text3 +
                  " " +
                  getAmountWithSign(cashbackAmount?.max_discount) +
                  "."
                  : ""
                }
`
                : ""}
            </Box>
          </Grid>
        )}
      </CalculationGrid>
    </>
  );
};

OrderCalculation.propTypes = {};

export default OrderCalculation;
