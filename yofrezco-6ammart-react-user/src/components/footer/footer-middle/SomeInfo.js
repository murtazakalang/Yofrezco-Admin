import { useTheme } from "@emotion/react";
import { Typography } from "@mui/material";
import React from "react";
import {
  CustomStackFullWidth,
  CustomTypographyBold,
} from "styled-components/CustomStyles.style";
import CustomImageContainer from "../../CustomImageContainer";
import Link from "next/link";

const SomeInfo = (props) => {
  const { image, alt, title, info, t, href, isExternal } = props;
  const theme = useTheme();

  // Handle both SVG imports (object with src) and direct string paths
  const imageSrc = typeof image === 'string' ? image : image?.src;

  const contentElement = (
    <CustomStackFullWidth
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        cursor: "pointer",
        img: {
          transition: "all ease 0.5s",
        },
        "&:hover": {
          ".MuiTypography-body1": {
            color: "#9CA3AF",
          },
          ".MuiTypography-body2": {
            color: "#9CA3AF",
          },
        },
      }}
    >
      <CustomImageContainer src={imageSrc} alt={alt} height={120} width={120} />
      <Typography
        variant="body1"
        fontWeight="600"
        sx={{
          textAlign: "center",
          fontSize: "18px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </Typography>
    </CustomStackFullWidth>
  );

  if (!href) {
    return contentElement;
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {contentElement}
      </a>
    );
  }

  return (
    <Link href={href}>
      {contentElement}
    </Link>
  );
};

SomeInfo.propTypes = {};

export default SomeInfo;

