process.env.TZ = process.env.TZ || "UTC";

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("jest").run(process.argv.slice(2));
