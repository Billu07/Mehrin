import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const tsApiUtilsDir = join(process.cwd(), "node_modules", "ts-api-utils", "lib");
const cjsPath = join(tsApiUtilsDir, "index.cjs");
const esmPath = join(tsApiUtilsDir, "index.js");

if (!existsSync(cjsPath) && existsSync(esmPath)) {
  writeFileSync(cjsPath, "module.exports = require('./index.js');\n", "utf8");
}
