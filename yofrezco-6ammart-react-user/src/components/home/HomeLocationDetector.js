import React, { useEffect, useState, useRef } from "react";
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
 * - Only prompts once per session (tracked via sessionStorage)
 */
const HomeLocationDetector = () => {
    const [showMapModal, setShowMapModal] = useState(false);
    const [location, setLocation] = useState(undefined);
    const [geoLocationEnable, setGeoLocationEnable] = useState(false);
    const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
    const [shouldSkip, setShouldSkip] = useState(true); // Start with skip=true, only enable after check
    const hasProcessedCoords = useRef(false);

    // Check if we should run detection on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Only skip if user was already prompted this session
            const sessionPrompted = sessionStorage.getItem("locationAutoDetected");

            if (sessionPrompted) {
                setShouldSkip(true);
            } else {
                // Mark that we're attempting detection this session
                sessionStorage.setItem("locationAutoDetected", "true");
                setShouldSkip(false);
            }
        }
    }, []);

    // Use geolocation hook - this will trigger browser permission prompt
    const { coords, isGeolocationEnabled, positionError } = useGeolocated({
        positionOptions: {
            enableHighAccuracy: true,
        },
        userDecisionTimeout: 15000, // Wait 15 seconds for user decision
        isGeolocationEnabled: true,
    });

    // Handle geolocation result
    useEffect(() => {
        if (shouldSkip) return;
        if (hasProcessedCoords.current) return;

        // If user denied permission or geolocation not available
        if (positionError) {
            hasProcessedCoords.current = true;
            // setShouldSkip(true); // Don't show map, just skip
            // setShowMapModal(true); 
            return;
        }

        // Check if geolocation is explicitly disabled
        if (isGeolocationEnabled === false) {
            hasProcessedCoords.current = true;
            // setShouldSkip(true); // Don't show map, just skip
            // setShowMapModal(true);
            return;
        }

        // If we got coordinates, set location
        if (coords && coords.latitude && coords.longitude) {
            hasProcessedCoords.current = true;
            console.log("Auto-detected location:", coords.latitude, coords.longitude);
            setLocation({ lat: coords.latitude, lng: coords.longitude });
            setGeoLocationEnable(true);
            setZoneIdEnabled(true);
        }
    }, [coords, positionError, isGeolocationEnabled, shouldSkip]);

    // Get geocode from coordinates
    const { data: geoCodeResults } = useGetGeoCode(location, geoLocationEnable);

    // Get zone ID from coordinates
    const { data: zoneData, error: zoneError } = useGetZoneId(location, zoneIdEnabled);

    // Handle geocode results - save location address
    useEffect(() => {
        if (geoCodeResults?.results && geoCodeResults.results.length > 0 && location) {
            const formattedAddress = geoCodeResults.results[0]?.formatted_address;
            if (formattedAddress) {
                console.log("Setting location address:", formattedAddress);
                localStorage.setItem("location", formattedAddress);
                localStorage.setItem("currentLatLng", JSON.stringify(location));
            }
        }
    }, [geoCodeResults, location]);

    // Handle zone data - save zone ID and reload page
    useEffect(() => {
        if (zoneData?.zone_id && location && geoCodeResults?.results) {
            console.log("Setting zone ID:", zoneData.zone_id);
            // Ensure consistent storage format
            const zoneIdValue = typeof zoneData.zone_id === 'string'
                ? zoneData.zone_id
                : JSON.stringify(zoneData.zone_id);
            localStorage.setItem("zoneid", zoneIdValue);

            // Validate current module against new zone
            // If module is not valid for this zone, clear it so auto-selection kicks in
            /* 
            try {
                const currentModule = localStorage.getItem("module");
                if (currentModule) {
                    const moduleObj = JSON.parse(currentModule);
                    const moduleZones = moduleObj?.zones?.map(z => z.id) || [];

                    // Parse new zone IDs
                    const parsedZoneIds = JSON.parse(zoneIdValue);
                    const newZoneArray = Array.isArray(parsedZoneIds) ? parsedZoneIds : [parsedZoneIds];

                    // Check if current module is valid for the new zone
                    const isModuleValid = newZoneArray.some(id => moduleZones.includes(id));

                    if (!isModuleValid) {
                        console.log("Current module not valid for new zone, clearing module");
                        localStorage.removeItem("module");
                        localStorage.setItem("forceModuleSelection", "true");
                    }
                }
            } catch (e) {
                console.error("Error validating module:", e);
                // On error, clear module and force selection
                localStorage.removeItem("module");
                localStorage.setItem("forceModuleSelection", "true");
            }
            */

            invalidateHeaderCache();
            // Reload to apply the new location
            window.location.reload();
        }
    }, [zoneData, location, geoCodeResults]);

    // Handle zone error - location not in service area, show map modal
    useEffect(() => {
        if (zoneError && location) {
            console.log("Zone error - showing map modal", zoneError);
            // Location detected but not in service area, let user pick manually
            // setShowMapModal(true); 
        }
    }, [zoneError, location]);

    // Handle map modal close
    const handleCloseMapModal = () => {
        setShowMapModal(false);
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
