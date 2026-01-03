import { useEffect, useState, useRef } from "react";
import { useGeolocated } from "react-geolocated";
import useGetGeoCode from "../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../api-manage/hooks/react-query/google-api/useGetZone";
import { invalidateHeaderCache } from "api-manage/MainApi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

/**
 * LocationWatcher Component
 * 
 * Watches for geolocation permission being granted and automatically
 * updates the user's location if they're in a valid service zone.
 * Shows an error if they're not in a valid zone.
 */
const LocationWatcher = () => {
    const { t } = useTranslation();
    const [location, setLocation] = useState(null);
    const [geoLocationEnable, setGeoLocationEnable] = useState(false);
    const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
    const [hasCheckedLocation, setHasCheckedLocation] = useState(false);
    const previousCoordsRef = useRef(null);

    // Watch for geolocation
    const { coords, isGeolocationEnabled, isGeolocationAvailable } = useGeolocated({
        positionOptions: {
            enableHighAccuracy: false,
        },
        userDecisionTimeout: 10000,
        isGeolocationEnabled: true,
    });

    // Get geocode for the detected location
    const { data: geoCodeResults, isLoading: isLoadingGeoCode } = useGetGeoCode(
        location,
        geoLocationEnable
    );

    // Check if the location is in a valid zone
    const { data: zoneData, isLoading: isLoadingZone, error: zoneError } = useGetZoneId(
        location,
        zoneIdEnabled
    );

    // When coords become available (user granted permission), start the location check
    useEffect(() => {
        if (!coords || hasCheckedLocation) return;

        // Check if these are new coords (not the same as previously processed)
        const coordsKey = `${coords.latitude},${coords.longitude}`;
        if (previousCoordsRef.current === coordsKey) return;

        // Check if user's current stored location is already from geolocation
        // We only want to auto-update if it's a new permission grant
        const existingLocation = localStorage.getItem("currentLatLng");
        if (existingLocation) {
            try {
                const parsed = JSON.parse(existingLocation);
                // If stored location is very close to detected location, skip
                const latDiff = Math.abs(parsed.lat - coords.latitude);
                const lngDiff = Math.abs(parsed.lng - coords.longitude);
                if (latDiff < 0.01 && lngDiff < 0.01) {
                    // Already have similar location stored, don't update
                    setHasCheckedLocation(true);
                    return;
                }
            } catch (e) {
                // Invalid JSON, continue with update
            }
        }

        // Set the detected location and start zone check
        previousCoordsRef.current = coordsKey;
        setLocation({
            lat: coords.latitude,
            lng: coords.longitude,
        });
        setGeoLocationEnable(true);
        setZoneIdEnabled(true);
    }, [coords, hasCheckedLocation]);

    // Handle zone data response
    useEffect(() => {
        if (!location || !zoneIdEnabled || isLoadingZone || isLoadingGeoCode) return;
        if (hasCheckedLocation) return;

        // Zone check completed
        if (zoneData?.zone_id) {
            // User is in a valid zone - update location
            const address = geoCodeResults?.results?.[0]?.formatted_address ||
                `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

            localStorage.setItem("location", address);
            localStorage.setItem("currentLatLng", JSON.stringify(location));
            localStorage.setItem("zoneid", zoneData.zone_id);
            invalidateHeaderCache();

            toast.success(t("Location detected! Updating to your current location."));
            setHasCheckedLocation(true);

            // Reload to apply the new location
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else if (zoneError || (zoneData && !zoneData.zone_id)) {
            // User is not in a valid zone - show error
            toast.error(t("Sorry, service is not available in your current location."));
            setHasCheckedLocation(true);
        }
    }, [zoneData, zoneError, location, zoneIdEnabled, isLoadingZone, isLoadingGeoCode, geoCodeResults, hasCheckedLocation, t]);

    // This component doesn't render anything visible
    return null;
};

export default LocationWatcher;
