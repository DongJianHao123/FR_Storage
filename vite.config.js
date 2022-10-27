import { builtinModules } from "module";
import { resolve } from "path";
import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "server",
      // the proper extensions will be added
      formats: ["es", "cjs"],
      fileName: (ext) => {
        if (ext === "cjs") {
          return "server.cjs";
        } else {
          return "server.js";
        }
      },
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        // @ts-ignore
        ...Object.keys(pkg.dependencies || {}),
      ],
    },
  },
});
