export default {
  base: `./`,
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  publicDir: `../static/`,
  root: `src/`,
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: true,
  },
};
