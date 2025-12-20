import { LandingLayout } from "components/layout/LandingLayout";
import LandingPage from "../src/components/landing-page";
import CssBaseline from "@mui/material/CssBaseline";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setConfigData, setLandingPageData } from "redux/slices/configData";
import Router from "next/router";
import SEO from "../src/components/seo";
import AutoLocationDetector from "../src/components/landing-page/AutoLocationDetector";

const Root = (props) => {
	const { configData, landingPageData } = props;
	const dispatch = useDispatch();

	// Check immediately (synchronously) to prevent flash
	const [shouldShowLanding, setShouldShowLanding] = useState(() => {
		if (typeof window !== "undefined") {
			const existingLocation = localStorage.getItem("location");
			const existingZoneId = localStorage.getItem("zoneid");
			const existingModule = localStorage.getItem("module");

			// If everything is set, don't show landing page - will redirect
			if (existingLocation && existingZoneId && existingModule) {
				return false; // Don't show landing page
			}
		}
		// Show landing page by default (will be hidden if redirect happens)
		return true;
	});

	// Immediate check for existing location - redirect before rendering
	useEffect(() => {
		if (typeof window !== "undefined") {
			const existingLocation = localStorage.getItem("location");
			const existingZoneId = localStorage.getItem("zoneid");
			const existingModule = localStorage.getItem("module");

			if (existingLocation && existingZoneId && existingModule) {
				// Everything already set, redirect immediately - don't show landing page
				setShouldShowLanding(false);
				Router.replace("/home");
				return;
			}
		}
	}, []);

	// Use server-side data directly instead of refetching
	useEffect(() => {
		dispatch(setLandingPageData(landingPageData));
		if (configData) {
			if (configData.length === 0) {
				Router.push("/404");
			} else if (configData?.maintenance_mode) {
				Router.push("/maintainance");
			} else {
				dispatch(setConfigData(configData));
			}
		}
	}, [configData, landingPageData, dispatch]);
	let lanDirection = undefined;

	if (typeof window !== "undefined") {
		lanDirection = JSON.parse(localStorage.getItem("settings"));
		// languageSetting = JSON.parse(localStorage.getItem("language-setting"));
	}
	// console.log({ lanDirection })
	return (
		<>
			<CssBaseline />
			{/* <DynamicFavicon configData={configData} /> */}
			<SEO
				image={landingPageData?.meta_image || configData?.fav_icon_full_url}
				businessName={configData?.business_name}
				configData={configData}
				title={landingPageData?.meta_title || configData?.business_name}
				description={landingPageData?.meta_description || configData?.meta_description}
			/>
			<AutoLocationDetector onRedirectStart={() => {
				setShouldShowLanding(false);
			}} />
			{shouldShowLanding && landingPageData && (
				<LandingLayout configData={configData} landingPageData={landingPageData}>

					<LandingPage
						configData={configData}
						landingPageData={landingPageData}
					/>

				</LandingLayout>
			)}
		</>
	);
};
export default Root;
export const getServerSideProps = async (context) => {
	const { req, res } = context;
	const language = req.cookies.languageSetting;

	// Parallelize API calls for faster server-side rendering
	const [configRes, landingPageRes] = await Promise.all([
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
		})
	]);

	// Parse JSON responses in parallel
	const [config, landingPageData] = await Promise.all([
		configRes.json(),
		landingPageRes.json()
	]);

	// Set cache control headers for 1 hour (3600 seconds)
	res.setHeader(
		"Cache-Control",
		"public, s-maxage=3600, stale-while-revalidate"
	);

	return {
		props: {
			configData: config,
			landingPageData: landingPageData
		},
	};
};
