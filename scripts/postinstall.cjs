/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const DEBUG = process.env.DEBUG;

// generate runtime deps by prisma
execSync("npx -y prisma generate", { stdio: DEBUG ? "inherit" : "ignore" });

const generated = path.join(__dirname, "../generated");
const dist = path.join(__dirname, "../dist");
if (!fs.existsSync(generated)) {
    throw new Error("No file generated");
}
if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist, { recursive: true });
}

// copy js / d.ts files
fs.cpSync(path.join(generated, "runtime"), path.join(dist, "runtime"), { recursive: true });

// copy lib files
const lib = fs.readdirSync(generated).find((file) => file.endsWith(".node"));
if (!lib) {
    throw new Error("No .node lib file found in generated directory");
}
DEBUG && console.log(`Copying ${lib}`);
fs.cpSync(path.join(generated, lib), path.join(dist, lib));

// clean up prisma generated files
fs.rmSync(generated, { recursive: true });

console.log("All Good!");
