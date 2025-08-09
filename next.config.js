/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: [
      "avatars.githubusercontent.com",

      "images.unsplash.com",
      "cloudinary.com",
      "res.cloudinary.com",

      "lh3.googleusercontent.com",
      "platform-lookaside.fbsbx.com",
      "placehold.co",
      "via.placeholder.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

export default config;
