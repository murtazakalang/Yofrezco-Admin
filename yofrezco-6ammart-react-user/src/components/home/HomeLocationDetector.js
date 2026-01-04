import React, { useEffect, useState } from "react";
import { useGeolocated } from "react-geolocated";
import dynamic from "next/dynamic";
import useGetGeoCode from "../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../api-manage/hooks/react-query/google-api/useGetZone";
import { invalidateHeaderCache } from "api-manage/MainApi";

const MapModal = dynamic(() => import("../Map/MapModal"));

/**
 * HomeLocationDetector
 * 
 * Automatically requests browser location permission on /home page load.
 * - If user allows: auto-detects and sets current location
 * - If user denies: opens MapModal for manual location selection
 * - Skips if location is already set in localStorage
 */
const HomeLocationDetector = () => {
    const [showMapModal, setShowMapModal] = useState(false);
    const [location, setLocation] = useState(undefined);
    const [geoLocationEnable, setGeoLocationEnable] = useState(false);
    const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
    const [hasAttemptedDetection, setHasAttemptedDetection] = useState(false);
    const [shouldSkip, setShouldSkip] = useState(false);

    // Check if location already exists on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const existingLocation = localStorage.getItem("location");
            const existingZoneId = localStorage.getItem("zoneid");
            const sessionDismissed = sessionStorage.getItem("locationDetectorDismissed");

            // Skip if location is already set or user dismissed this session
            if ((existingLocation && existingZoneId) || sessionDismissed) {
                setShouldSkip(true);
            }
        }
    }, []);

    // Use geolocation hook - this will trigger browser permission prompt
    const { coords, isGeolocationEnabled, positionError } = useGeolocated({
        positionOptions: {
            enableHighAccuracy: false,
        },
        userDecisionTimeout: 10000, // Wait 10 seconds for user decision
        isGeolocationEnabled: true,
    });

    // Handle geolocation result
    useEffect(() => {
        if (shouldSkip || hasAttemptedDetection) return;

        // If user denied permission or geolocation not available
        if (positionError || (!isGeolocationEnabled && isGeolocationEnabled !== undefined)) {
            setHasAttemptedDetection(true);
            setShowMapModal(true);
            return;
        }

        // If we got coordinates, set location
        if (coords) {
            setHasAttemptedDetection(true);
            setLocation({ lat: coords.latitude, lng: coords.longitude });
            setGeoLocationEnable(true);
            setZoneIdEnabled(true);
        }
    }, [coords, positionError, isGeolocationEnabled, shouldSkip, hasAttemptedDetection]);

    // Get geocode from coordinates
    const { data: geoCodeResults } = useGetGeoCode(location, geoLocationEnable);

    // Get zone ID from coordinates
    const { data: zoneData, error: zoneError } = useGetZoneId(location, zoneIdEnabled);

    // Handle geocode results - save location address
    useEffect(() => {
        if (geoCodeResults?.results && geoCodeResults.results.length > 0 && location) {
            const formattedAddress = geoCodeResults.results[0]?.formatted_address;
            if (formattedAddress) {
                localStorage.setItem("location", formattedAddress);
                localStorage.setItem("currentLatLng", JSON.stringify(location));
            }
        }
    }, [geoCodeResults, location]);

    // Handle zone data - save zone ID and reload page
    useEffect(() => {
        if (zoneData?.zone_id && location) {
            localStorage.setItem("zoneid", zoneData.zone_id);
            invalidateHeaderCache();
            // Reload to apply the new location
            window.location.reload();
        }
    }, [zoneData, location]);

    // Handle zone error - location not in service area, show map modal
    useEffect(() => {
        if (zoneError && location) {
            // Location detected but not in service area, let user pick manually
            setShowMapModal(true);
        }
    }, [zoneError, location]);

    // Handle map modal close
    const handleCloseMapModal = () => {
        setShowMapModal(false);
        // Mark as dismissed for this session so we don't prompt again
        sessionStorage.setItem("locationDetectorDismissed", "true");
    };

    // Don't render anything if we should skip
    if (shouldSkip) {
        return null;
    }

    return (
        <>
            {showMapModal && (
                <MapModal
                    open={showMapModal}
                    handleClose={handleCloseMapModal}
                    coords={coords}
                    disableAutoFocus
                />
            )}
        </>
    );
};

export default HomeLocationDetector;
