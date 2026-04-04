import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import reactInspector from "vite-plugin-react-inspector";

const isDev = process.env.NODE_ENV !== "production";

function transformInspectorPaths(): Plugin {
  const srcPath = path.resolve(import.meta.dirname, "src");

  return {
    name: "transform-inspector-paths",
    enforce: "pre",
    transform(code, id) {
      if (!isDev || id.includes("node_modules") || !code) {
        return null;
      }

      if (!code.includes("data-react-inspector")) {
        return null;
      }

      const patterns = [
        /data-react-inspector\s*=\s*["']([^"']+)["']/g,
        /"data-react-inspector"\s*:\s*"([^"]+)"/g,
        /'data-react-inspector'\s*:\s*'([^']+)'/g,
      ];

      let modified = false;
      let transformedCode = code;

      for (const regex of patterns) {
        transformedCode = transformedCode.replace(regex, (match, fullPath) => {
          const parts = fullPath.split(":");
          const filePath = parts[0];
          const location = parts.slice(1).join(":");

          if (filePath && filePath.startsWith(srcPath)) {
            const relativePath = path.relative(srcPath, filePath);
            const newPath = `src/${relativePath}${location ? ":" + location : ""}`;
            modified = true;
            return match.replace(fullPath, newPath);
          }

          return match;
        });
      }

      return modified ? { code: transformedCode, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [
    reactInspector(),

    react(),
    isDev && transformInspectorPaths(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: isDev,
  },

  server: {
    port: 3000,
    host: true,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },

  preview: {
    port: 3000,
    host: true,
  },
});
