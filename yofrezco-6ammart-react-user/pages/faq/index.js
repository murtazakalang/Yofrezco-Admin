import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "../../src/components/layout/MainLayout";
import FaqPage from "../../src/components/faq-page/FaqPage";
import { useTranslation } from "react-i18next";
import SEO from "../../src/components/seo";
import { getImageUrl } from "utils/CustomFunctions";

const Index = ({ configData, landingPageData }) => {
    const { t } = useTranslation();

    // Handle cases where `configData` is missing
    if (!configData) {
        return <div>{t("Configuration data is not available")}</div>;
    }

    return (
        <>
            <CssBaseline />
            <SEO
                configData={configData}
                title={landingPageData?.faq_section?.faq_title || "Frequently Asked Questions"}
                description="Find answers to frequently asked questions about our services."
                image={`${getImageUrl(
                    { value: configData?.logo_storage },
                    "business_logo_url",
                    configData
                )}/${configData?.fav_icon}`}
                businessName={configData?.business_name}
            />
            <MainLayout configData={configData} landingPageData={landingPageData}>
                <FaqPage
                    faq_section={landingPageData?.faq_section}
                    configData={configData}
                />
            </MainLayout>
        </>
    );
};

export default Index;

export const getStaticProps = async () => {
    try {
        // Fetch configuration data
        const [configRes, landingPageRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config`, {
                method: "GET",
                headers: {
                    "X-software-id": 33571750,
                    "X-server": "server",
                    origin: process.env.NEXT_CLIENT_HOST_URL,
                },
            }),
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/react-landing-page`, {
                method: "GET",
                headers: {
                    "X-software-id": 33571750,
                    "X-server": "server",
                    origin: process.env.NEXT_CLIENT_HOST_URL,
                },
            }),
        ]);

        if (!configRes.ok) {
            throw new Error(`Failed to fetch config: ${configRes.statusText}`);
        }

        const [config, landingPageData] = await Promise.all([
            configRes.json(),
            landingPageRes.ok ? landingPageRes.json() : {},
        ]);

        return {
            props: {
                configData: config,
                landingPageData: landingPageData,
            },
            revalidate: 3600, // Revalidate every 1 hour (3600 seconds)
        };
    } catch (error) {
        console.error("Error fetching data:", error);

        return {
            props: {
                configData: null,
                landingPageData: {},
            },
            revalidate: 3600,
        };
    }
};
