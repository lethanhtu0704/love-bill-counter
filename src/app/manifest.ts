import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tú & Ngân",
    short_name: "Tú & Ngân",
    description: "App cho tụi mình",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/assets/app-icon.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}