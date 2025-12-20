import { CustomCarCard } from "components/home/module-wise-components/rental/components/Rental.style";
import { Box, Stack } from "@mui/system";
import {
  alpha,
  Button,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import GroupIcon from "@mui/icons-material/Group";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";
import AirIcon from "@mui/icons-material/Air";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import EvStationIcon from "@mui/icons-material/EvStation";
import InfoIcon from "@mui/icons-material/Info";
import QuickView from "components/cards/QuickView";
import { CustomOverLay } from "components/cards/Card.style";
import RentWithIncrementDecrement from "components/home/module-wise-components/rental/components/global/RentWithIncrementDecrement";
import HorizontalCarCard from "./HorizontalCarCard";
import { t } from "i18next";
import WarningIcon from '@mui/icons-material/Warning';
import React, { useEffect, useReducer, useState } from "react";
import {
  ACTIONS,
  carCardInitialState,
  carCardReducer,
} from "components/home/module-wise-components/rental/components/global/carCardState";
import CustomModal from "components/modal";
import RentalCarQuickView from "./RentalCarQuickView";
import { useRouter } from "next/router";

import { useDispatch, useSelector } from "react-redux";
import useUpdateBookingCart from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/confirm-booking/useUpdateBookingCart";
import useDeleteItemFromBooking from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/confirm-booking/useDeleteItemFromBooking";
import {
  removeItemFromCart,
  updateCart,
} from "components/home/module-wise-components/rental/components/rental-cart/helper";
import { setCartList } from "redux/slices/cart";
import {
  getAmountWithSign,
  getDiscountedAmount,
} from "helper-functions/CardHelpers";
import useConfirmBooking from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/confirm-booking/useConfirmBooking";
import { bookingConfirm } from "components/home/module-wise-components/rental/components/global/search/searchHepler";
import { toast } from "react-hot-toast";
import { onErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import { useAddWishlist } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/wishlist/useAddWishlist";
import { mainPrice } from "components/home/module-wise-components/rental/components/utils/bookingHepler";
import CustomImageContainer from "components/CustomImageContainer";
import { not_logged_in_message } from "utils/toasterMessages";
import {
  addWishListVehicle,
  removeWishListVehicle,
} from "redux/slices/wishList";
import { useRemoveRentalWishList } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/wishlist/useRemoveWishlist";
import { getGuestId, getToken } from "helper-functions/getToken";
import CustomBadge from "components/cards/CustomBadge";
import dynamic from "next/dynamic";
import ProviderCheck from "components/home/module-wise-components/rental/components/global/ProviderCheck";
import TripModalContent from "../rental-cart/TripModalContent";
import TripVehicleList from "../rental-cart/TripVehicleList";
import usePostLocationUpdate from "../../rental-api-manage/hooks/react-query/confirm-booking/usePostLocationUpdate";
import { LoadingButton } from "@mui/lab";
import ChangeTripType from "components/home/module-wise-components/rental/components/vehicle-details/ChangeTripType";
import ChangeTripHours from "components/home/module-wise-components/rental/components/vehicle-details/ChangeTripHours";
import NextImage from "components/NextImage";

const CarBookingModal = dynamic(() =>
  import(
    "components/home/module-wise-components/rental/components/global/CarBookingModal"
  )
);

const p_off = t("% off");

export const handleBadgeRental = (data) => {
  if (Number.parseInt(data?.discount_price) > 0) {
    if (data?.discount_type === "percent") {
      return (
        <CustomBadge 
          bg_color="#DA6868"
          fontSize="12px" 
          border_radius="5px 1px 14px 0px" 
          top={0} 
          text={`${data?.discount_price}${p_off}`} 
        />
      );
    } else {
      return (
        <CustomBadge
          fontSize="12px"
          bg_color="#DA6868"
          border_radius="5px 1px 14px 0px"
          top={0}
          text={`${getAmountWithSign(
            data?.discount_price,
            data?.discount_price % 1 ? true : false
          )} ${t("off")}`}
        />
      );
    }
  }
};

const CarCard = ({
  data,
  setOpenModal,
  currentView = 0,
  direction = "column",
  showSameVehicleText = true,
  from,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartItemData, setCartItemData] = useState({});
  const [carDetails, setCarDetails] = useState({});
  const [open, setOpen] = useState(false);
  const [isSameOpen, setIsSameOpen] = useState(false);
  const [openTripChange, setOpenTripChange] = React.useState(false);
  const [ids, setIds] = React.useState(null);
  const [updateCartObject, setUpdateCartObject] = React.useState({});
  const [callUpdateUserData, setCallUpdateUserData] = useState(false);
  const [openHourDiffModal, setOpenHourDiffModal] = useState(false);
  const [updateOrAdd, setUpdateOrAdd] = useState({
    type: 'add',
    quantity: 0
  });
  const [state, carCardDispatch] = useReducer(
    carCardReducer,
    carCardInitialState
  );
  const { cartList } = useSelector((state) => state.cart);
  const rentalSearch = useSelector(
    (state) => state?.rentalSearch?.rentalSearch
  );
  const fromSearch = router?.query?.from;
  const { mutate: addFavoriteMutation } = useAddWishlist();
  const { mutate: removeFavoriteMutation } = useRemoveRentalWishList();
  const { mutate: userDataUpdateMutate, isLoading: userDataIsLoading } =
    usePostLocationUpdate();
  const { wishLists } = useSelector((state) => state?.wishList);

  useEffect(() => {
    wishlistItemExistHandler();
  }, [wishLists]);

  const wishlistItemExistHandler = () => {
    if (wishLists?.vehicles?.find((wishItem) => wishItem.id === data?.id)) {
      setIsWishlisted(true);
    } else {
      setIsWishlisted(false);
    }
  };

  const addToWishlistHandler = (e) => {
    e.stopPropagation();
    if (getToken()) {
      addFavoriteMutation(
        { key: "vehicle_id", id: data?.id },
        {
          onSuccess: (response) => {
            if (response) {
              dispatch(addWishListVehicle(data));
              setIsWishlisted(true);
              toast.success(response?.message);
            }
          },
          onError: (error) => {
            toast.error(error.response.data.message);
          },
        }
      );
    } else toast.error(t(not_logged_in_message));
  };

  const removeFromWishlistHandler = (e) => {
    e.stopPropagation();
    const onSuccessHandlerForDelete = (res) => {
      dispatch(removeWishListVehicle(data?.id));
      setIsWishlisted(false);
      toast.success(res.message, {
        id: "wishlist",
      });
    };
    removeFavoriteMutation(
      { key: "vehicle_id", id: data?.id },
      {
        onSuccess: onSuccessHandlerForDelete,
        onError: (error) => {
          toast.error(error.response.data.message);
        },
      }
    );
  };

  const { mutate: confirmMutate, isLoading: confirmIsLoading } = useConfirmBooking();

  const isProductExist = cartList?.carts?.find(
    (item) => item.vehicle?.id === data?.id
  );
  const { mutate: updateMutate, isLoading: updateIsLoading } =
    useUpdateBookingCart();
  const { mutate } = useDeleteItemFromBooking();

  const handleIncrement = (cartItem) => {
    const updateQuantity = cartItem?.quantity + 1;
    if (data?.total_vehicle_count < updateQuantity) {
      toast.error(t(`You can't add more than ${data?.total_vehicle_count} quantities of this vehicle.`));
    } else {
      if(from === "from_search"){
        if(Number(rentalSearch?.duration) === Number(cartList?.user_data?.estimated_hours)){
          updateCart(
            cartItem,
            cartList?.user_data,
            dispatch,
            setCartList,
            updateQuantity,
            updateMutate
          )
        }else{
          setUpdateOrAdd({
            type: 'update',
            quantity: updateQuantity,
            cartItem: cartItem
          });
          setOpenHourDiffModal(true);
          setOpen(false)
        }
      }else{
        updateCart(
          cartItem,
          cartList?.user_data,
          dispatch,
          setCartList,
          updateQuantity,
          updateMutate
        )
      }
    }
  };

  const handleDecrement = (cartItem) => {
    const updateQuantity = cartItem?.quantity - 1;
    if(from === "from_search"){
      if(Number(rentalSearch?.duration) === Number(cartList?.user_data?.estimated_hours)){
        updateCart(
          cartItem,
          cartList?.user_data,
          dispatch,
          setCartList,    
          updateQuantity,
          updateMutate
        )
      }else{
        setUpdateOrAdd({
          type: 'update',
          quantity: updateQuantity,
          cartItem: cartItem
        })
        setOpenHourDiffModal(true);
      }
    }else{
      updateCart(
        cartItem,
        cartList?.user_data,
        dispatch,
        setCartList,
        updateQuantity,
        updateMutate
      );
    }
  };

  const removeItemCart = (cartItem) => {
    removeItemFromCart(cartItem, mutate, dispatch, setCartList);
  };

  const isDifferentProvider = cartList?.carts?.some(
    (cart) => cart.provider?.id !== data?.provider?.id
  );

  const openCarBookingModal = () => {
    carCardDispatch({ type: ACTIONS.setOpen, payload: true });
    setOpen(false);
  };

  const rentalLocations = {
    pickup: rentalSearch?.pickup_location,
    destination: rentalSearch?.destination_location,
  };

  const bookingDetails = {
    id: data?.id,
    locations: rentalLocations,
    searchKey1: rentalSearch?.pickup_location?.location_name,
    searchKey2: rentalSearch?.destination_location?.location_name,
    tripType: rentalSearch?.tripType,
    durationValue: rentalSearch?.duration,
    dateValue: rentalSearch?.selectedDate?.$d,
    data: rentalSearch?.distanceData,
  };


  const addToCartHandler = () => {
    if (from === "from_search") {
      if (isDifferentProvider) {
        handleDifferentProvider(bookingDetails);
      } else {
        handleSameProvider(bookingDetails);
      }
      setOpen(false)
    } else {
      openCarBookingModal();
      setOpen(false);
    }
  };

  const handleDifferentProvider = (bookingDetails) => {
    carCardDispatch({ type: ACTIONS.setOpenSameProvider, payload: true });
    setCartItemData(bookingDetails);
  };


  const handleSameProvider = (bookingDetails) => {
    if(cartList?.carts?.length>0){
      if (rentalSearch?.tripType === cartList?.user_data?.rental_type) {
        if(cartList?.user_data?.rental_type === "hourly" || cartList?.user_data?.rental_type==="day_wise"){
          if (Number(rentalSearch?.duration) === Number(cartList?.user_data?.estimated_hours)) {
            bookingConfirm({
              ...bookingDetails,
              confirmMutate,
              dispatch,
              setCartList,
              toast,
              handleClose: null,
              onErrorResponse,
            });
          } else {
            setUpdateOrAdd({
              type: 'add',
            });
            setOpenHourDiffModal(true);
          }
        }else{
          bookingConfirm({
            ...bookingDetails,
            confirmMutate,
            dispatch,
            setCartList,
            toast,
            handleClose: null,
            onErrorResponse,
          });
        }
      } else {
        setUpdateCartObject?.({
          ...bookingDetails,
          userId: cartList?.user_data?.id,
          id: data?.id
        });
        setIsSameOpen?.(true);
        handleClose?.();
      }
    }else{
      bookingConfirm({
        ...bookingDetails,
        confirmMutate,
        dispatch,
        setCartList,
        toast,
        handleClose: null,
        onErrorResponse,
      });
    }
  };

  const handleClose = (value) => {
    carCardDispatch({
      type: ACTIONS.setOpen,
      payload: value,
    });
  };

  const handleProviderCheck = (payload) => {
    carCardDispatch({
      type: ACTIONS.setOpenSameProvider,
      payload: payload,
    });
  };

  const handleRentalTripType = (value) => {
    carCardDispatch({
      type: ACTIONS.setSelectedTripType,
      payload: value,
    });
  };

  const handleChangePrvTripType = () => {
    const tempUpdateCartObject = {
      userId: updateCartObject?.userId,
      pickup_location: updateCartObject?.locations?.pickup,
      destination_location: updateCartObject?.locations?.destination,
      rental_type: updateCartObject?.tripType,
      estimated_hours: updateCartObject?.durationValue,
      pickup_time: updateCartObject?.dateValue,
      destination_time: Math.floor(
        updateCartObject?.data?.distanceMeters  / (60 * 60)
      ),
      distance:Number(updateCartObject?.data?.duration?.replace('s', ''))/ 1000,
      guest_id: getToken() ? null : getGuestId()
    };

    userDataUpdateMutate(tempUpdateCartObject, {
      onSuccess: (res) => {
        bookingConfirm({
          ...updateCartObject,
          confirmMutate,
          dispatch,
          setCartList,
          toast,
          handleClose: setIsSameOpen(false),
          onErrorResponse,
        });
      },
      onError: (error) => {
        if (error.response.data?.length > 0) {
          setIds?.(error.response.data);
          setUpdateCartObject?.(updateCartObject);
          setOpenTripChange?.(true);
          setIsSameOpen(false);
        } else {
          onErrorResponse(error);
        }
      },
    });
  };

  const handleHourDiffModal = (bookingDetails,updateOrAdd) => {
    if(updateOrAdd?.type === 'add'){
      bookingConfirm({
        ...bookingDetails,
        confirmMutate,
        dispatch,
        setCartList,
        toast,
        handleClose: () => setOpenHourDiffModal(false),
        onErrorResponse,
      });
    }else{
      const tempUserData = {...cartList?.user_data,
        estimated_hours: rentalSearch?.duration,
      }
      updateCart(
        updateOrAdd?.cartItem,
        tempUserData,
        dispatch,
        setCartList,
        updateOrAdd?.quantity,
        updateMutate  
      )
      setOpenHourDiffModal(false);
    }
  };

  return (
    <>
      {currentView === 0 ? (
        <CustomCarCard
          onClick={() =>
            router.push({
              pathname: `/rental/vehicle-details/${data?.id}`,
              query: {
                from: from,
              },
            })
          }
          sx={{ cursor: "pointer" }}
        >
          <Box p={2}>
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Stack gap={1}>
                <Tooltip title={data?.name} placement="top">
                  <Typography
                    noWrap
                    variant="body1"
                    component="h6"
                    width={180}
                    fontSize={16}
                    fontWeight={600}
                    sx={{
                      color: (theme) => theme.palette.neutral[1000],
                    }}
                  >
                    {data?.name}
                  </Typography>
                </Tooltip>
                <Typography sx={{ fontSize: "12px", mt: "-6px" }} component="p">
                  {data?.provider?.name}
                </Typography>
              </Stack>

              <Stack gap={1} alignItems="center">
                {data?.total_reviews > 0 && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      padding: "3px 8px",
                      borderRadius: "5px",
                      color: theme.palette.primary.main,
                      svg: { fontSize: "14px" },
                    }}
                  >
                    <StarIcon />
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {data && Number(data?.avg_rating).toFixed(1)}
                    </Typography>
                  </Stack>
                )}
                {data?.total_reviews > 0 && (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      color: (theme) => theme.palette.neutral[500],
                      whiteSpace: "nowrap",
                    }}
                  >
                    {data?.total_reviews} {t("Reviews")}
                  </Typography>
                )}
              </Stack>
            </Stack>
            {showSameVehicleText && direction === "row" && (
              <Box
                sx={{
                  mt: "12px",
                  px: "8px",
                  py: "4px",
                  background: (theme) => alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    color: (theme) => theme.palette.neutral[500],
                    paddingTop: "2px"
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    component="strong"
                    sx={{ mx: "4px" }}
                  >
                    {data?.total_vehicle_count}
                  </Typography>{" "}
                  {t(`Vehicles available`)}
                </Typography>
              </Box>
            )}
            <Stack
              direction={direction === "row" ? "row-reverse" : "column"}
              mt={"15px"}
              gap={3}
            >
              <Stack
                position="relative"
                sx={{
                  img: {
                    width: direction === "row" ? "150px" : "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                  },
                }}
              >
                {data?.new_tag === 1 ? (
                  <CustomBadge
                    top={30}
                    bg_color="#EF8C45"
                    text={t("New Arrival")}
                    fontSize="12px"
                   border_radius="0px 1px 14px 0px"
                    
                  />
                ) : null}

                {handleBadgeRental(data)}
                <CustomOverLay
                  border_radius="10px"
                  className="custom_overlay"
                  sx={{
                    display: direction === "row" && "none",
                  }}
                >
                  <QuickView
                    addToWishlistHandler={addToWishlistHandler}
                    removeFromWishlistHandler={removeFromWishlistHandler}
                    isWishlisted={isWishlisted}
                    quickViewHandleClick={(e) => {
                      e.stopPropagation();
                      setOpen(true);
                      setCarDetails(data);
                    }}
                  />
                </CustomOverLay>

                <NextImage
                  width={255}
                  maxWidth="100%"
                  height={126}
                  src={data?.thumbnail_full_url || ""}
                />
                {showSameVehicleText && direction === "column" && data?.total_vehicle_count !== 1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: "0.625rem",
                      bottom: "0.625rem",
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: "50rem",
                      display: "flex",
                      alignItems: "center",
                      zIndex: 0,
                      svg: {
                        color: theme.palette.info.main,
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="div"
                      className="infoText"
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        component="strong"
                        sx={{ mx: "3px" }}
                      >
                        {data?.total_vehicle_count}
                      </Typography>
                      {t(`Vehicles available`)}
                    </Typography>
                    <InfoIcon />
                  </Box>
                )}
              </Stack>
              <Stack
                direction="row"
                flexWrap="wrap"
                rowGap={0.5}
                columnGap={2}
                sx={{
                  color: theme.palette.neutral[400],
                  minHeight: 40,
                  svg: {
                    fontSize: "16px",
                    marginBottom: "2px",
                  },
                }}
              >
                {data?.seating_capacity && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {data?.seating_capacity} {t("Seats")}
                    </Typography>
                  </Stack>
                )}
                {data?.type && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DirectionsCarFilledIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      mt={1}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize"
                      }}
                    >
                      {data?.type}
                    </Typography>
                  </Stack>
                )}
                {data?.air_condition > 0 && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AirIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      mt={1}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize"
                      }}
                    >
                      {("ac")}
                    </Typography>
                  </Stack>
                )}
                {data?.air_condition === 0 && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AirIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      mt={1}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize"
                      }}
                    >
                      {("non ac")}
                    </Typography>
                  </Stack>
                )}
                {data?.transmission_type && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ManageHistoryIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      mt={1}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize"
                      }}
                    >
                      {data?.transmission_type.replace("_", " ")}
                    </Typography>
                  </Stack>
                )}
                {data?.fuel_type && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EvStationIcon />
                    <Typography
                      variant="body2"
                      component="div"
                      mt={1}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize"
                      }}
                    >
                      {data?.fuel_type.replace("_", " ")}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            height={96}
            sx={{
              padding: "15px",
              borderRadius: "20px",
              backgroundColor: theme.palette.background.custom7,
            }}
          >
            <Box>
              <Typography
                className="original-price"
                sx={{
                  fontSize: "13px",
                  fontWeight: "400",
                  color: (theme) => theme.palette.neutral[400],
                }}
              >
                {t("Start From")}
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                alignItems="baseline"
                columnGap={0.5}
              >
                {data?.discount_price > 0 ||
                  data?.provider?.discount?.discount > 0 ? (
                  <Typography
                    className="original-price"
                    sx={{
                      fontSize:data?.discount_type!=='amount'? "13px":"18px",
                      fontWeight:data?.discount_type!=='amount'? "400":"600",
                      textDecoration:data?.discount_type==='amount'?"none": "line-through",
                      color: (theme) => data?.discount_type==="amount"? theme.palette.neutral[1000]:theme.palette.neutral[400],
                    }}
                  >
                    {getAmountWithSign(mainPrice(data, rentalSearch?.tripType))}
                  </Typography>
                ) :   <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: (theme) => theme.palette.neutral[1000],
                  }}
                >   {getAmountWithSign(mainPrice(data, rentalSearch?.tripType))}</Typography>}
                {data?.discount_type==='amount' ? null:(
                  <Typography
                    sx={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: (theme) => theme.palette.neutral[1000],
                    }}
                  >
                    {getAmountWithSign(
                      getDiscountedAmount(
                        mainPrice(data, rentalSearch?.tripType),
                        data?.discount_price,
                        data?.discount_type,
                        data?.provider?.discount,
                        1,
                        data?.provider?.discount?.max_discount

                      )
                    )}{" "}
                  </Typography>
                )}

                
              </Stack>
            </Box>
            <RentWithIncrementDecrement
              addToCartHandler={addToCartHandler}
              variations={data?.total_vehicle_count}
              isProductExist={isProductExist}
              count={isProductExist?.quantity}
              handleIncrement={handleIncrement}
              itemId={isProductExist?.id}
              handleDecrement={handleDecrement}
              updateLoading={updateIsLoading}
              removeItemCart={removeItemCart}
              from={from}
              fullWidth={false}
            />
          </Stack>
        </CustomCarCard>
      ) : (
        <HorizontalCarCard
          addToWishlistHandler={addToWishlistHandler}
          removeFromWishlistHandler={removeFromWishlistHandler}
          isWishlisted={isWishlisted}
          addToCartHandler={addToCartHandler}
          variations={data?.total_vehicle_count}
          isProductExist={isProductExist}
          count={isProductExist?.quantity}
          handleIncrement={handleIncrement}
          itemId={isProductExist?.id}
          handleDecrement={handleDecrement}
          updateLoading={updateIsLoading}
          removeItemCart={removeItemCart}
          fromSearch={fromSearch}
          data={data}
          setOpenModal={setOpen}
          setCarDetails={setCarDetails}
        />
      )}

      {state.open && (
        <CarBookingModal
          open={state.open}
          handleClose={handleClose}
          id={data?.id}
          fromCard={cartList?.carts?.length > 0}
          isDifferentProvider={isDifferentProvider}
          handleProviderCheck={handleProviderCheck}
          setCartItemData={setCartItemData}
          selectedPricing={state.selectedTripType}
          isHourly={data?.trip_hourly}
          isDistence={data?.trip_distance}
          card
          setIsSameOpen={setIsSameOpen}
          setOpenTripChange={setOpenTripChange}
          setIds={setIds}
          setUpdateCartObject={setUpdateCartObject}
          isDayWise={data?.trip_day_wise}
        />
      )}
      <CustomModal
        openModal={state.openSameProvider}
        handleClose={() => handleProviderCheck(false)}
      >
        <IconButton
          onClick={() => handleProviderCheck(false)}
          sx={{ position: "absolute", top: 0, right: 0 }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
        <ProviderCheck
          cartItemData={cartItemData}
          handleProviderCheck={handleProviderCheck}
          confirmMutate={confirmMutate}
          providerId={data?.provider?.id}
        />
      </CustomModal>
      <CustomModal openModal={open} handleClose={() => setOpen(false)} maxWidth="900px">
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", top: 0, right: 0 }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
        <RentalCarQuickView
          carDetails={{ ...carDetails, mainPrice: mainPrice(data, rentalSearch?.tripType) }}
          addToCartHandler={addToCartHandler}
          selectedTripType={rentalSearch?.tripType}
          tripHours={
            rentalSearch?.duration ||
            (cartList?.carts?.length > 0 &&
              cartList?.user_data?.estimated_hours)
          }
          quantity={isProductExist?.quantity || 1}
          isProductExist={isProductExist}
          count={isProductExist?.quantity}
          handleIncrement={handleIncrement}
          itemId={isProductExist?.id}
          handleDecrement={handleDecrement}
          updateLoading={updateIsLoading}
          removeItemCart={removeItemCart}
          userData={cartList?.user_data}
          tripDistance={cartList?.user_data?.distance}
          handleRentalTripType={handleRentalTripType}
          handleClose={() => { setOpen(false) }}
          setIsSameOpen={setIsSameOpen}
          setOpenTripChange={setOpenTripChange}
          updateCartObject={updateCartObject}
          setIds={setIds}
          setUpdateCartObject={setUpdateCartObject}
          openCarBookingModal={openCarBookingModal}
          handleIncrementFromCard={handleIncrement}
          handleDecrementFromCard={handleDecrement}
          from={fromSearch}
        />
      </CustomModal>
      <CustomModal openModal={isSameOpen} handleClose={()=>{setIsSameOpen(false)}} maxWidth="380px">
      <IconButton
          onClick={() => setIsSameOpen(false)}
          sx={{ position: "absolute", top: 0, right: 0 }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
        <ChangeTripType cartList={cartList}
                        setIsSameOpen={setIsSameOpen}
                        userDataIsLoading={userDataIsLoading}
                        handleChangePrvTripType={handleChangePrvTripType}
                        updateCartObject={updateCartObject}
        />
      </CustomModal>
      <CustomModal openModal={openTripChange} maxWidth="380px">
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
              card
              confirmMutate={confirmMutate}
              dispatch={dispatch}
            />
          }
        />
      </CustomModal>
      <CustomModal openModal={openHourDiffModal} handleClose={()=>{setOpenHourDiffModal(false)}} maxWidth="350px">
      <IconButton
          onClick={() => setOpenHourDiffModal(false)}
          sx={{ position: "absolute", top: 0, right: 0 }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
        <ChangeTripHours
          rentalSearch={rentalSearch}
          setOpenHourDiffModal={setOpenHourDiffModal}
          confirmIsLoading={confirmIsLoading}
          handleHourDiffModal={handleHourDiffModal}
          bookingDetails={bookingDetails}
          updateOrAdd={updateOrAdd}
        />
      </CustomModal>
    </>
  );
};

export default CarCard;
