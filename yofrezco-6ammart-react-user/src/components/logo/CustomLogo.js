import { useRouter } from "next/router";
import { styled } from "@mui/material";
import NextImage from "components/NextImage";

export const Logo = styled("div")(({ height, width }) => ({
  maxWidth: width,
  height: height,
  position: "relative",
  cursor: "pointer",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
}));

const CustomLogo = ({
  logoImg,
  atlText,
  height = 70,
  width = 300,
  objectFit,
}) => {
  const router = useRouter();
  let location = undefined;
  if (typeof window !== "undefined") {
    location = localStorage.getItem("location");
  }

  const handleClick = () => {
    if (router.pathname === "/") {
      if (location) router.replace("/home", undefined, { shallow: true });
      else router.push("/", undefined, { shallow: true });
    } else {
      router.replace("/home", undefined, { shallow: true });
    }
  };

  // Fallback logo in case configData is delayed
  const logoSrc = logoImg || '/logo.png';

  return (
    <Logo height={height} width={width} onClick={handleClick}>
      <NextImage
        src={logoSrc}
        alt={atlText}
        width={parseFloat(width)} // MUST be number ✔
        height={parseFloat(height)} // MUST be number ✔
        objectFit={objectFit || "contain"}
        priority={true} // Load logo immediately - critical for first paint
      />
    </Logo>
  );
};

export default CustomLogo;
