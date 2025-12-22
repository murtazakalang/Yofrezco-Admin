import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Default location: Panama City, Panama
const DEFAULT_LOCATION = {
  lat: 8.9824,
  lng: -79.5199,
  address: "Panama City, Panama"
};

const ZoneGuard = (props) => {
  const { children } = props;
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(
    () => {
      if (!router.isReady || isSettingUp) {
        return;
      }

      const zoneIdRaw = localStorage.getItem("zoneid");
      const location = localStorage.getItem("location");
      const module = localStorage.getItem("module");

      // Parse zoneid - handle both string and array formats
      let zoneId = null;
      if (zoneIdRaw) {
        try {
          zoneId = JSON.parse(zoneIdRaw);
        } catch (e) {
          // zoneid might be a plain string (not JSON)
          zoneId = zoneIdRaw;
        }
      }

      // Check if zone is valid (can be string, number, or non-empty array)
      const hasValidZone = zoneId && (
        typeof zoneId === 'string' ||
        typeof zoneId === 'number' ||
        (Array.isArray(zoneId) && zoneId.length > 0)
      );

      if (hasValidZone && location && module) {
        // All data exists - allow access
        setChecked(true);
      } else {
        // Missing data - auto-setup with default location instead of redirecting
        setIsSettingUp(true);

        // Set default location if missing
        if (!location) {
          localStorage.setItem("location", DEFAULT_LOCATION.address);
          localStorage.setItem("currentLatLng", JSON.stringify({
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng
          }));
        }

        // Redirect to root to fetch zone and module data
        // The index.js will set these up and redirect back
        router.replace("/");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.isReady, isSettingUp]
  );

  if (!checked) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
};

export default ZoneGuard;
