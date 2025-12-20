import { useEffect, useState } from "react";
import { useGeolocated } from "react-geolocated";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import useGetGeoCode from "../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../api-manage/hooks/react-query/google-api/useGetZone";
import useGetModule from "../../api-manage/hooks/react-query/useGetModule";
import { setSelectedModule } from "../../redux/slices/utils";
import { zoneWiseModule } from "../../components/module-select/ModuleSelect";

// Default location: Panama City, Panama
const DEFAULT_LOCATION = {
  lat: 8.9824,
  lng: -79.5199,
  address: "Panama City, Panama"
};

const AutoLocationDetector = ({ onRedirectStart }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [location, setLocation] = useState(undefined);
  const [geoLocationEnable, setGeoLocationEnable] = useState(false);
  const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [useDefaultLocation, setUseDefaultLocation] = useState(false);

  // Get geolocation
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: true,
  });

  // Get geocode from coordinates
  const { data: geoCodeResults } = useGetGeoCode(
    location,
    geoLocationEnable
  );

  // Get zone ID from coordinates
  const { data: zoneData } = useGetZoneId(location, zoneIdEnabled);

  // Get modules for auto-selection
  const { data: modulesData, refetch: refetchModules } = useGetModule();
  const { modules: modulesFromRedux } = useSelector((state) => state.configData);
  
  // Use modules from Redux if available, otherwise use fetched data
  const availableModules = modulesFromRedux?.length > 0 ? modulesFromRedux : modulesData;

  useEffect(() => {
    // Check if location already exists
    if (typeof window !== "undefined" && !hasChecked && router.pathname === "/") {
      const existingLocation = localStorage.getItem("location");
      const existingZoneId = localStorage.getItem("zoneid");
      const existingModule = localStorage.getItem("module");

      if (existingLocation && existingZoneId && existingModule) {
        // Everything already set, redirect immediately
        setHasChecked(true);
        onRedirectStart?.();
        router.replace("/home");
        return;
      }

      // No location found, start auto-detection immediately
      // Use default location right away for faster response
      setHasChecked(true);
      setIsAutoDetecting(true);
      
      // Immediately set default location (don't wait for geolocation)
      setUseDefaultLocation(true);
      setLocation({
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
      });
      setGeoLocationEnable(true);
      setZoneIdEnabled(true);
      
      // Also try geolocation in parallel (but don't wait for it)
      // This will override default if geolocation succeeds quickly
    }
  }, [hasChecked, router]);

  // When geolocation is available quickly, override default location
  useEffect(() => {
    if (coords && isAutoDetecting && useDefaultLocation) {
      // If geolocation comes quickly, use it instead of default
      setLocation({
        lat: coords.latitude,
        lng: coords.longitude,
      });
      setUseDefaultLocation(false);
      // geoLocationEnable and zoneIdEnabled already set
    }
  }, [coords, isAutoDetecting, useDefaultLocation]);

  // When geocode results are available, store location address
  useEffect(() => {
    if (geoCodeResults?.results && geoCodeResults.results.length > 0) {
      const formattedAddress = geoCodeResults.results[0]?.formatted_address;
      if (formattedAddress && location) {
        localStorage.setItem("location", formattedAddress);
        localStorage.setItem("currentLatLng", JSON.stringify(location));
      }
    }
  }, [geoCodeResults, location]);

  // When using default location, set address immediately (don't wait for geocode)
  useEffect(() => {
    if (useDefaultLocation && location) {
      // Set default address and coordinates immediately
      localStorage.setItem("location", DEFAULT_LOCATION.address);
      localStorage.setItem("currentLatLng", JSON.stringify(location));
    }
  }, [useDefaultLocation, location]);

  // Pre-fetch modules immediately when location is set (don't wait for zone)
  useEffect(() => {
    if (location && !availableModules) {
      refetchModules();
    }
  }, [location, availableModules, refetchModules]);

  // Select first available module and redirect as soon as zone is available
  useEffect(() => {
    const hasLocation = localStorage.getItem("location");
    const hasZoneId = zoneData?.zone_id;
    const hasModules = availableModules?.length > 0;
    const noModuleSelected = !localStorage.getItem("module");

    if (hasZoneId && hasLocation && hasModules && noModuleSelected && location) {
      // Store zone ID immediately
      localStorage.setItem("zoneid", zoneData.zone_id);

      // Get zone-wise modules and select first one
      const zoneWiseModules = zoneWiseModule(availableModules);
      let selectedModule = null;
      
      if (zoneWiseModules && zoneWiseModules.length > 0) {
        selectedModule = zoneWiseModules[0];
      } else if (availableModules.length > 0) {
        // If no zone-wise modules, use first available module
        selectedModule = availableModules[0];
      }

      if (selectedModule) {
        localStorage.setItem("module", JSON.stringify(selectedModule));
        dispatch(setSelectedModule(selectedModule));
        
        // Hide landing page before redirect
        onRedirectStart?.();
        
        // Redirect immediately using replace (faster)
        setIsAutoDetecting(false);
        router.replace("/home");
      }
    }
  }, [zoneData, availableModules, location, dispatch, router]);

  return null; // This component doesn't render anything
};

export default AutoLocationDetector;
