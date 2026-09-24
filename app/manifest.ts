import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Craig OS",
    short_name: "Craig OS",
    description: "Craig OS premium command surface — personal and business operating system.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#12161c",
    theme_color: "#12161c",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
