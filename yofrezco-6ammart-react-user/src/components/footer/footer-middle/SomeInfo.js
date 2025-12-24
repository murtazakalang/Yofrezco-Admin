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
      spacing={3}
      sx={{
        cursor: "pointer",
        img: {
          transition: "all ease 0.5s",
        },
        "&:hover": {
          ".MuiTypography-body1": {
            color: theme.palette.primary.main,
          },
          ".MuiTypography-body2": {
            color: theme.palette.primary.main,
          },
        },
      }}
    >
      <CustomImageContainer src={imageSrc} alt={alt} height={50} width={50} />
      <CustomStackFullWidth
        alignItems="center"
        justifyContent="center"
        spacing={1}
      >
        <CustomTypographyBold
          sx={{
            textTransform: "capitalize",
          }}
        >
          {t(title)}
        </CustomTypographyBold>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
          }}
        >
          {info}
        </Typography>
      </CustomStackFullWidth>
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

