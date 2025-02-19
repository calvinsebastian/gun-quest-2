export default {
  base: "/", // Correct base path for assets
  build: {
    outDir: "dist", // Output directory for the build
    emptyOutDir: true, // Clean the output directory before building
    rollupOptions: {
      input: {
        main: "index.html", // Main HTML file
        gunquest: "gun-quest.html", // Additional HTML file
        gunquest2: "gun-quest-2.html", // Additional HTML file
      },
    },
  },
  publicDir: "public", // Static assets directory
  server: {
    host: "0.0.0.0", // Access from network
    port: 3000, // Development server port
    open: true, // Open browser on start
  },
};
