import CssBaseline from "@mui/material/CssBaseline";
import Router from "next/router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import MainLayout from "../../src/components/layout/MainLayout";
import ModuleWiseLayout from "../../src/components/module-wise-layout";
import ZoneGuard from "../../src/components/route-guard/ZoneGuard";
import SEO from "../../src/components/seo";

const Home = () => {
  const { landingPageData, configData } = useSelector(
    (state) => state.configData
  );

  // Removed duplicate API calls - data already loaded from landing page via Redux
  // The index.js page loads config and landing data server-side and stores in Redux

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
