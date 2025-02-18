export default {
  base: `./`,
  build: {
    minify: "esbuild", // 🔹 Use ESBuild minifier
    esbuild: {
      keepNames: true, // 🔹 Preserve class names
    },
  },
  publicDir: `../static/`,
  root: `src/`,
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: true,
  },
};
