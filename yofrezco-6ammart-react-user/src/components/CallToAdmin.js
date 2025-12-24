import { useTheme } from "@emotion/react";
import { Typography, Box } from "@mui/material";
import { TopBarButton } from "./header/NavBar.style";
import { useTranslation } from "react-i18next";

const CallToAdmin = ({ configData }) => {
  const theme = useTheme();
  const { i18n } = useTranslation();

  const currentLang = i18n.language || "en";
  const isSpanish = currentLang === "es" || currentLang.startsWith("es");

  const supportText = isSpanish ? "Info & Soporte" : "Info & Support";

  const handleClick = () => {
    window.open("https://wa.link/yofrezco", "_blank");
  };

  return (
    <TopBarButton
      size="small"
      variant="text"
      onClick={handleClick}
      sx={{
        ".MuiTypography-body1": {
          transition: "all ease 0.5s",
        },
        "&:hover .MuiTypography-body1": {
          color: theme.palette.primary.main + "!important",
        },
      }}
      startIcon={
        <Box
          component="img"
          src="/whatsapp.png"
          alt="WhatsApp"
          sx={{
            width: "20px",
            height: "20px",
            ml: 1,
          }}
        />
      }
    >
      <Typography sx={{ color: (theme) => theme.palette.neutral[1000] }}>
        {supportText}
      </Typography>
    </TopBarButton>
  );
};

CallToAdmin.propTypes = {};

export default CallToAdmin;

