import CustomLogo from "./CustomLogo";
import { Stack } from "@mui/system";

const LogoSide = ({
  configData,
  width = 300,
  height = 70,
  objectFit,
  className = "",
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      className={className}
      sx={{
        "&.custom-logo-side": {
          width: `${width}`, // container width
          height: `auto !important`,
        },
      }}
    >
      <CustomLogo
        atlText="logo"
        logoImg={configData?.logo_full_url}
        width={width} // number ✔
        height={height} // number ✔
        objectFit={objectFit}
      />
    </Stack>
  );
};

export default LogoSide;
