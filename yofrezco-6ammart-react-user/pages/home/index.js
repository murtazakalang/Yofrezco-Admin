import CssBaseline from "@mui/material/CssBaseline";
import Router from "next/router";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MainLayout from "../../src/components/layout/MainLayout";
import ModuleWiseLayout from "../../src/components/module-wise-layout";
import ZoneGuard from "../../src/components/route-guard/ZoneGuard";
import SEO from "../../src/components/seo";
import { setConfigData, setLandingPageData } from "../../src/redux/slices/configData";

const Home = (props) => {
  // Get data from server-side props first, then fallback to Redux
  const { configData: ssrConfigData, landingPageData: ssrLandingPageData } = props;
  const { landingPageData: reduxLandingPageData, configData: reduxConfigData } = useSelector(
    (state) => state.configData
  );
  const dispatch = useDispatch();

  // Use SSR data if available, otherwise use Redux data
  const configData = ssrConfigData || reduxConfigData;
  const landingPageData = ssrLandingPageData || reduxLandingPageData;

  // Store server-side data in Redux for other components
  useEffect(() => {
    if (ssrConfigData && !reduxConfigData) {
      dispatch(setConfigData(ssrConfigData));
    }
    if (ssrLandingPageData && !reduxLandingPageData) {
      dispatch(setLandingPageData(ssrLandingPageData));
    }
  }, [ssrConfigData, ssrLandingPageData, reduxConfigData, reduxLandingPageData, dispatch]);

  useEffect(() => {
    // Validation only - no API calls
    if (configData) {
      if (configData.length === 0) {
        Router.push("/404");
      } else if (configData?.maintenance_mode) {
        Router.push("/maintainance");
      }
    }
  }, [configData]);

  return (
    <>
      <CssBaseline />
      {configData && (
        <SEO
          title="Home"
          image={configData?.fav_icon_full_url}
          businessName={configData?.business_name}
          configData={configData}
        />
      )}

      <MainLayout configData={configData} landingPageData={landingPageData}>
        <ModuleWiseLayout
          configData={configData}
          landingPageData={landingPageData}
        />
      </MainLayout>
    </>
  );
};

export default Home;

Home.getLayout = (page) => <ZoneGuard>{page}</ZoneGuard>;

// Fetch config data server-side to ensure logo is available immediately
export const getServerSideProps = async (context) => {
  const { req, res } = context;
  const language = req.cookies.languageSetting;

  try {
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
    const [configData, landingPageData] = await Promise.all([
      configRes.ok ? configRes.json() : null,
      landingPageRes.ok ? landingPageRes.json() : null
    ]);

    // Set cache control headers for 1 hour (3600 seconds)
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate"
    );

    return {
      props: {
        configData: configData || null,
        landingPageData: landingPageData || null
      },
    };
  } catch (error) {
    console.error("Error fetching config data:", error);
    return {
      props: {
        configData: null,
        landingPageData: null
      },
    };
  }
};
