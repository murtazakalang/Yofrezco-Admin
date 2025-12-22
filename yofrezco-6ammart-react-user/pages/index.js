import CssBaseline from "@mui/material/CssBaseline";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setConfigData, setLandingPageData } from "redux/slices/configData";
import Router from "next/router";
import SEO from "../src/components/seo";

// Default location: Panama City, Panama
const DEFAULT_LOCATION = {
	lat: 8.9824,
	lng: -79.5199,
	address: "Panama City, Panama"
};

const Root = (props) => {
	const { configData, landingPageData, defaultZoneId, defaultModule } = props;
	const dispatch = useDispatch();

	// Set up default location and redirect immediately
	useEffect(() => {
		if (typeof window !== "undefined") {
			// Check if data already exists
			const existingLocation = localStorage.getItem("location");
			const existingZoneId = localStorage.getItem("zoneid");
			const existingModule = localStorage.getItem("module");

			if (!existingLocation || !existingZoneId || !existingModule) {
				// Set default location data
				localStorage.setItem("location", DEFAULT_LOCATION.address);
				localStorage.setItem("currentLatLng", JSON.stringify({
					lat: DEFAULT_LOCATION.lat,
					lng: DEFAULT_LOCATION.lng
				}));

				// Set zone ID from server-side fetch
				if (defaultZoneId) {
					localStorage.setItem("zoneid", defaultZoneId);
				}

				// Set first module from server-side fetch
				if (defaultModule) {
					localStorage.setItem("module", JSON.stringify(defaultModule));
				}
			}

			// Store config data in Redux
			if (configData) {
				dispatch(setConfigData(configData));
			}
			if (landingPageData) {
				dispatch(setLandingPageData(landingPageData));
			}

			// Redirect to home immediately
			Router.replace("/home");
		}
	}, [configData, landingPageData, defaultZoneId, defaultModule, dispatch]);

	// Show nothing while redirecting - just SEO tags
	return (
		<>
			<CssBaseline />
			<SEO
				image={landingPageData?.meta_image || configData?.fav_icon_full_url}
				businessName={configData?.business_name}
				configData={configData}
				title={landingPageData?.meta_title || configData?.business_name}
				description={landingPageData?.meta_description || configData?.meta_description}
			/>
		</>
	);
};

export default Root;

export const getServerSideProps = async (context) => {
	const { req, res } = context;
	const language = req.cookies.languageSetting;

	// Default location coordinates for Panama City
	const defaultLat = 8.9824;
	const defaultLng = -79.5199;

	// Parallelize API calls for faster server-side rendering
	const [configRes, landingPageRes, zoneRes, moduleRes] = await Promise.all([
		fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config`, {
			method: "GET",
			headers: {
				"X-software-id": 33571750,
				"X-server": "server",
				"X-localization": language,
				origin: process.env.NEXT_CLIENT_HOST_URL,
			},
		}),
		fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/react-landing-page`, {
			method: "GET",
			headers: {
				"X-software-id": 33571750,
				"X-server": "server",
				"X-localization": language,
				origin: process.env.NEXT_CLIENT_HOST_URL,
			},
		}),
		// Fetch zone ID for default location
		fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config/get-zone-id?lat=${defaultLat}&lng=${defaultLng}`, {
			method: "GET",
			headers: {
				"X-software-id": 33571750,
				"X-server": "server",
				origin: process.env.NEXT_CLIENT_HOST_URL,
			},
		}),
		// Fetch available modules
		fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/module`, {
			method: "GET",
			headers: {
				"X-software-id": 33571750,
				"X-server": "server",
				origin: process.env.NEXT_CLIENT_HOST_URL,
			},
		})
	]);

	// Parse JSON responses in parallel
	const [config, landingPageData, zoneData, moduleData] = await Promise.all([
		configRes.json(),
		landingPageRes.json(),
		zoneRes.ok ? zoneRes.json() : null,
		moduleRes.ok ? moduleRes.json() : null
	]);

	// Get first available module
	const defaultModule = moduleData && moduleData.length > 0 ? moduleData[0] : null;
	const defaultZoneId = zoneData?.zone_id || null;

	// Set cache control headers for 1 hour (3600 seconds)
	res.setHeader(
		"Cache-Control",
		"public, s-maxage=3600, stale-while-revalidate"
	);

	return {
		props: {
			configData: config,
			landingPageData: landingPageData,
			defaultZoneId: defaultZoneId ? String(defaultZoneId) : null,
			defaultModule: defaultModule
		},
	};
};
