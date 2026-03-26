import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendNodeModules = path.join(currentDir, "node_modules");

const nextConfig: NextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
	turbopack: {
		root: currentDir,
		resolveAlias: {
			tailwindcss: path.join(frontendNodeModules, "tailwindcss"),
			shadcn: path.join(frontendNodeModules, "shadcn"),
		},
	},
	webpack: (config) => {
		config.resolve = config.resolve ?? {};
		config.resolve.alias = {
			...(config.resolve.alias ?? {}),
			tailwindcss: path.join(frontendNodeModules, "tailwindcss"),
			shadcn: path.join(frontendNodeModules, "shadcn"),
		};
		config.resolve.modules = [
			frontendNodeModules,
			...(config.resolve.modules ?? []),
		];
		return config;
	},
};

export default nextConfig;
