module.exports = {
	testEnvironment: "node",
	testMatch: ["<rootDir>/tests/**/*.test.ts"],
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "<rootDir>/tsconfig.json",
			},
		],
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};
