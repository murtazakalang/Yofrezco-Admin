import React, { useEffect, useState } from "react";
import { Button, Popover, Stack, Typography, useTheme } from "@mui/material";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import CustomAlert from "../../../alert/CustomAlert";
import { CustomButtonPrimary } from "styled-components/CustomButtons.style";
import DeliveryAddress from "../../../checkout/delivery-address";
import { useGeolocated } from "react-geolocated";
import ControlPointOutlinedIcon from "@mui/icons-material/ControlPointOutlined";
import useGetGeoCode from "../../../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../../../api-manage/hooks/react-query/google-api/useGetZone";
import { invalidateHeaderCache } from "api-manage/MainApi";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const MapModal = dynamic(() => import("../../../Map/MapModal"));

const AddressReselectPopover = (props) => {
  const { anchorEl, onClose, open, t, address, setAddress, token, currentLatLngForMar, ...other } =
    props;
  const theme = useTheme();
  const [openMapModal, setOpenMapModal] = useState(false);
  const [location, setLocation] = useState(undefined);
  const [currentLocation, setCurrentLocation] = useState(undefined);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [geoLocationEnable, setGeoLocationEnable] = useState(false);
  const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [zoneCheckCompleted, setZoneCheckCompleted] = useState(false);

  const { coords } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: true,
  });

  // Handle "Use Current Location" button click
  const handleAgreeLocation = async () => {
    // Use native geolocation API to properly handle permission prompt
    if (!navigator.geolocation) {
      toast.error(t("Geolocation is not supported by this browser."));
      return;
    }

    setIsDetectingLocation(true);
    setZoneCheckCompleted(false);

    try {
      // This will trigger permission prompt and wait for user response
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        });
      });

      // Set location from the received coordinates
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setShowCurrentLocation(true);
      setGeoLocationEnable(true);
      setZoneIdEnabled(true);
    } catch (error) {
      setIsDetectingLocation(false);
      // User denied permission or error occurred
      if (error.code === 1) {
        // Permission denied - user can still select manually
        toast.error(t("Location permission denied. You can select location manually."));
      } else {
        toast.error(t("Could not detect your location. Please select manually."));
      }
    }
  };

  // Get geocode for the detected location
  const { data: geoCodeResults, isLoading: isLoadingGeoCode } = useGetGeoCode(
    location,
    geoLocationEnable
  );

  // Get zone ID for the detected location
  const { data: zoneData, isLoading: isLoadingZone, error: zoneError, isError: isZoneError } = useGetZoneId(
    location,
    zoneIdEnabled
  );

  // Update current location address when geocode results arrive
  useEffect(() => {
    if (geoCodeResults?.results && showCurrentLocation) {
      setCurrentLocation(geoCodeResults?.results[0]?.formatted_address);
    }
  }, [geoCodeResults, showCurrentLocation]);

  // Handle zone data response - this is where we check if location is valid
  useEffect(() => {
    if (!isDetectingLocation || !zoneIdEnabled || zoneCheckCompleted) return;
    if (isLoadingZone || isLoadingGeoCode) return;

    // Zone check completed
    if (zoneData?.zone_id) {
      // User is in a valid zone - update location
      localStorage.setItem("zoneid", zoneData.zone_id);
      invalidateHeaderCache();

      // Wait for geocode to complete, then save and reload
      if (currentLocation && location) {
        localStorage.setItem("location", currentLocation);
        localStorage.setItem("currentLatLng", JSON.stringify(location));
        toast.success(t("Location updated successfully!"));
        setZoneCheckCompleted(true);
        setIsDetectingLocation(false);
        window.location.reload();
      }
    } else if (isZoneError || zoneError || (zoneData && !zoneData.zone_id)) {
      // User is NOT in a valid zone - show error
      toast.error(t("Sorry, service is not available in your current location."));
      setZoneCheckCompleted(true);
      setIsDetectingLocation(false);
      // Reset states so user can try again or select manually
      setLocation(undefined);
      setCurrentLocation(undefined);
      setShowCurrentLocation(false);
      setGeoLocationEnable(false);
      setZoneIdEnabled(false);
    }
  }, [zoneData, zoneError, isZoneError, isLoadingZone, isLoadingGeoCode, currentLocation, location, isDetectingLocation, zoneIdEnabled, zoneCheckCompleted, t]);

  const handleCloseMapModal = () => {
    setOpenMapModal(false);
    onClose();
  };

  const popOverHeightHandler = () => {
    if (token) {
      return "475px";
    } else {
      return "150px";
    }
  };

  return (
    <>
      <Popover
        disableScrollLock={true}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        keepMounted
        onClose={onClose}
        open={open}
        PaperProps={{
          sx: { width: { xs: 300, sm: 320, md: 350 }, p: "1rem" },
        }}
        transitionDuration={2}
        {...other}
      >
        <Stack justifyContent="center" textAlign="center" spacing={2}>
          <SimpleBar
            className="custom-scrollbar"
            style={{
              maxHeight: popOverHeightHandler(),
              paddingRight: "5px",
            }}
          >
            <Stack width="100%" alignItems="center">
              {token ? (
                open && (
                  <Stack
                    pt="15px"
                    gap={{ xs: "0px", sm: "15px" }}
                    paddingRight="5px"
                  >
                    <Typography
                      fontSize="16px"
                      fontWeight={500}
                      textAlign="left"
                    >
                      {t("Select from saved addresses or pick from map")}
                    </Typography>
                    <DeliveryAddress
                      setAddress={setAddress}
                      address={address}
                      hideAddressSelectionField="true"
                      renderOnNavbar="true"
                    />
                  </Stack>
                )
              ) : (
                <CustomAlert
                  type="info"
                  text={t(
                    "To select from saved addresses, you need to sign in."
                  )}
                />
              )}
            </Stack>
          </SimpleBar>
          <Button
            fullWidth
            onClick={handleAgreeLocation}
            disabled={isDetectingLocation}
            startIcon={
              <ControlPointOutlinedIcon sx={{ color: isDetectingLocation ? theme.palette.grey[400] : theme.palette.primary.main }} />
            }
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              fontWeight: 600,
              color: isDetectingLocation ? theme.palette.grey[400] : theme.palette.primary.main,
            }}
          >
            {isDetectingLocation ? t("Detecting...") : t("Use Current Location")}
          </Button>
          <Stack width="100%" justifyContent="center" alignItems="center">
            <CustomButtonPrimary onClick={() => setOpenMapModal(true)}>
              {t("Pick from map")}
            </CustomButtonPrimary>
          </Stack>
        </Stack>
      </Popover>
      {openMapModal && (
        <MapModal open={openMapModal} handleClose={handleCloseMapModal} selectedLocation={currentLatLngForMar} />
      )}
    </>
  );
};

AddressReselectPopover.propTypes = {};

export default AddressReselectPopover;
