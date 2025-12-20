import React from "react";
import Head from "next/head";

const DynamicFavicon = ({ configData }) => {
  const fallback = "/static/no-image-found.png"; // must be a string URL

  const iconUrl =
    typeof configData?.fav_icon_full_url === "string"
      ? configData.fav_icon_full_url
      : fallback;

  return (
    <Head>
      <link rel="apple-touch-icon" sizes="180x180" href={iconUrl} />
      <link rel="icon" href={iconUrl} />
      <link rel="icon" type="image/png" sizes="32x32" href={iconUrl} />
      <link rel="icon" type="image/png" sizes="16x16" href={iconUrl} />
    </Head>
  );
};

DynamicFavicon.propTypes = {};

export default DynamicFavicon;
