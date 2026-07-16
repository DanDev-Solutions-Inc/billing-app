import sharp from "sharp";

const mark = "public/brand/DDDark.png";

const make = async (size, out, logoFrac = 0.62) => {
  const logoW = Math.round(size * logoFrac);
  const logo = await sharp(mark).resize({ width: logoW }).toBuffer();
  const meta = await sharp(logo).metadata();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([
      {
        input: logo,
        top: Math.round((size - meta.height) / 2),
        left: Math.round((size - logoW) / 2),
      },
    ])
    .png()
    .toFile(out);
  console.log("wrote", out);
};

await make(192, "public/icon-192.png");
await make(512, "public/icon-512.png");
await make(180, "public/apple-touch-icon.png", 0.6);
await make(512, "public/icon-maskable-512.png", 0.46); // extra safe-zone padding
