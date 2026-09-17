import sharp from "sharp";

const socialSource = "public/social-card-v5.svg";
const faviconSource = "public/favicon-v2.svg";

await sharp(socialSource)
  .resize(1200, 630)
  .flatten({ background: "#11100e" })
  .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
  .toFile("public/social-card-v5.jpg");

await sharp(faviconSource)
  .resize(64, 64)
  .png()
  .toFile("public/favicon-v3-64.png");

await sharp(faviconSource)
  .resize(32, 32)
  .png()
  .toFile("public/favicon-v3-32.png");

await sharp(faviconSource)
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon-v3.png");

console.log("Generated social-card-v5.jpg and favicon raster assets.");
