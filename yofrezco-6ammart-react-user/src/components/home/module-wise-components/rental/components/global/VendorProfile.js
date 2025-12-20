import { Box, Typography } from "@mui/material";
import CustomImageContainer from "components/CustomImageContainer";
import React, { useEffect, useState } from "react";
import { CustomBoxFullWidth } from "styled-components/CustomStyles.style";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { IconButtonStyled, PrimaryToolTip } from "components/cards/QuickView";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useDispatch, useSelector } from "react-redux";
import { useAddWishlist } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/wishlist/useAddWishlist";
import { useRemoveRentalWishList } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/wishlist/useRemoveWishlist";
import { getToken } from "helper-functions/getToken";
import {
  addWishListProvider,
  removeWishListProvider,
  setWishList,
} from "redux/slices/wishList";
import { toast } from "react-hot-toast";
import { t } from "i18next";
import { not_logged_in_message } from "utils/toasterMessages";
import { useGetWishList } from "components/home/module-wise-components/rental/rental-api-manage/hooks/react-query/wishlist/useGetWishlist";

const VendorProfile = ({ vehicleDetails }) => {
  const dispatch = useDispatch();
  const { wishLists } = useSelector((state) => state?.wishList);

  const onSuccessHandler = (response) => {
    dispatch(setWishList(response));
  };
  const { refetch } = useGetWishList(onSuccessHandler);
  const token = getToken();

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token]);

  const { mutate: addFavoriteMutation } = useAddWishlist();
  const { mutate: removeFavoriteMutation } = useRemoveRentalWishList();

  const checkIsWishListed = () => {
    return wishLists?.providers?.find(
      (wishItem) => wishItem.id === vehicleDetails?.provider_id
    );
  };

  const addToWishlistHandler = (e) => {
    e.stopPropagation();
    if (getToken()) {
      addFavoriteMutation(
        { key: "provider_id", id: vehicleDetails?.provider_id },
        {
          onSuccess: (response) => {
            if (response) {
              dispatch(addWishListProvider(vehicleDetails?.provider));
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
      dispatch(removeWishListProvider(vehicleDetails?.provider_id));
      toast.success(res.message, {
        id: "wishlist_removeWishlist",
      });
    };
    removeFavoriteMutation(
      { key: "provider_id", id: vehicleDetails?.provider_id },
      {
        onSuccess: onSuccessHandlerForDelete,
        onError: (error) => {
          toast.error(error.response.data.message);
        },
      }
    );
  };

  return (
    <>
      <CustomBoxFullWidth
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          background: "",
          flexWrap: { xs: "wrap", md: "nowrap" },
          gap: "20px",
          backgroundColor: (theme) => theme.palette.neutral[90],
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "20px",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box>
            <CustomImageContainer
              src={vehicleDetails?.provider?.logo_full_url}
              width={"60px"}
              height={"60px"}
              borderRadius={"50%"}
            />
          </Box>
          <Box sx={{ maxWidth: "150px" }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: "500",
                textTransform: "capitalize",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {vehicleDetails?.provider?.name}
            </Typography>

            <Typography
              sx={{
                fontWeight: "400",
                fontSize: "11px",
                mt: "6px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {vehicleDetails?.provider?.address}
            </Typography>
          </Box>
        </Box>
        <>
          {checkIsWishListed() ? (
            <PrimaryToolTip text="Remove from wishlist">
              <IconButtonStyled
                color="#EF7822"
                border="1px solid"
                onClick={(e) => removeFromWishlistHandler(e)}
              >
                <FavoriteIcon />
              </IconButtonStyled>
            </PrimaryToolTip>
          ) : (
            <PrimaryToolTip text="Add to wishlist">
              <IconButtonStyled
                border="1px solid #EAEEF2"
                color="#EF7822"
                onClick={(e) => addToWishlistHandler(e)}
              >
                <FavoriteBorderIcon />
              </IconButtonStyled>
            </PrimaryToolTip>
          )}
        </>
      </CustomBoxFullWidth>
    </>
  );
};

export default VendorProfile;
