import React, { useEffect } from "react";
import ParcelHero from "./ParcelHero";
import { CustomStackFullWidth } from "../../styled-components/CustomStyles.style";
import ParcelCategory from "./parcel-category/ParcelCategory";
import TopBanner from "../home/top-banner";
import SearchWithTitle from "../home/SearchWithTitle";
import CustomContainer from "../container";

const PercelComponents = () => {
  useEffect(() => {
    window.scrollTo({ top, behavior: "smooth" });
  }, []);
  let zoneid = undefined;
  if (typeof window !== "undefined") {
    zoneid = localStorage.getItem("zoneid");
  }
  let token = undefined;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }
  return (
    <CustomStackFullWidth>
      <TopBanner>
        <CustomStackFullWidth
          alignItems="center"
          justifyContent="center"
          sx={{
            height: "100%",
          }}
        >
          <SearchWithTitle zoneid={zoneid} token={token} />
        </CustomStackFullWidth>
      </TopBanner>
      <CustomContainer>
        <ParcelCategory />
      </CustomContainer>
    </CustomStackFullWidth>
  );
};

export default PercelComponents;
