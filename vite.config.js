export default {
  root: `src/`,
  publicDir: `../static/`,
  base: `./`,
  server: {
    host: "0.0.0.0", // Allow access from other devices in the same network
    port: 3000, // You can choose a custom port if you prefer
    open: true, // Optionally open the browser when the server starts
  },
};
