import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const HELP = args.includes("--help") || args.includes("-h");
const DIR = args.filter((arg) => !arg.startsWith("-"))[0] || ".";
const DRY = args.includes("--dry") || args.includes("-d");
const KEEP_RUNTIME = args.includes("--keep-runtime");
const NO_FIX_DTS = args.includes("--no-fix-dts");
const NO_BROWSER = args.includes("--no-browser");
const NO_PACKAGE_JSON = args.includes("--no-package-json");

export function run(): void {
    if (HELP) {
        console.log(
            "prisma-runtime: fix require/import path of prisma generated files in a directory",
        );
        console.log("Options: -d, --dry         : dry run");
        console.log("         -h, --help        : show this help");
        console.log("         --keep-runtime    : keep the generated runtime");
        console.log("         --no-fix-dts      : do not fix d.ts exports");
        console.log("         --no-browser      : remove index-browser.js");
        console.log("         --no-package-json : remove package.json");
        console.log("Example: prisma-runtime target/dir");
        return;
    }

    DRY && console.log("Dry run - no changes will be made");

    const targets = ["index.js", "index.d.ts", "index-browser.js"];
    const files = list(DIR)
        .filter((file) => targets.includes(path.basename(file)))
        .filter((file) => fs.readFileSync(file, "utf8").includes("./runtime/index"));

    if (files.length === 0) {
        console.log("No files matched");
        return;
    } else {
        console.log(`Found ${files.length} files:`);
        files.forEach((file) => console.log(`- ${file}`));
    }

    if (NO_BROWSER) {
        for (let i = files.length - 1; i >= 0; i--) {
            if (path.basename(files[i]) === "index-browser.js") {
                DRY || fs.unlinkSync(files[i]);
                console.log(`Removed ${files[i]}`);
                files.splice(i, 1);
            }
        }
    }

    const dirs = new Set<string>();
    files.forEach((file) => {
        if (!KEEP_RUNTIME) {
            const content = fs.readFileSync(file, "utf8");
            if (content.includes("./runtime/index-browser")) {
                const patched = content.replace(
                    /\.\/runtime\/index-browser/g,
                    "prisma-runtime/dist/runtime/index-browser",
                );
                DRY || fs.writeFileSync(file, patched);
            } else {
                const patched = content.replace(/\.\/runtime(\/index)?/g, "prisma-runtime");
                DRY || fs.writeFileSync(file, patched);
            }
            console.log(`Updated ${file}`);
        }
        dirs.add(path.dirname(file));
    });

    [...dirs].forEach((dir) => {
        if (!KEEP_RUNTIME) {
            const runtime = path.join(dir, "runtime");
            if (fs.existsSync(runtime)) {
                DRY || fs.rmSync(runtime, { recursive: true });
                console.log(`Removed ${runtime}`);
            }
            const lib = fs.readdirSync(dir).find((file) => file.endsWith(".node"));
            if (lib) {
                DRY || fs.rmSync(path.join(dir, lib));
                console.log(`Removed ${lib}`);
            }
        }

        if (NO_PACKAGE_JSON) {
            const file = path.join(dir, "package.json");
            if (fs.existsSync(file)) {
                DRY || fs.unlinkSync(file);
                console.log(`Removed ${file}`);
            }
        }
    });

    if (!NO_FIX_DTS) {
        files
            .filter((file) => file.endsWith(".d.ts"))
            .forEach((file) => {
                const content = fs.readFileSync(file, "utf8");
                const patched = content.replace(/export import/g, "export const");
                DRY || fs.writeFileSync(file, patched);
                console.log(`DTS Patched ${file}`);
            });
    }
}

/** list all files recursively in a directory */
function list(dir: string, depth = 5): string[] {
    if (depth <= 0) {
        return [];
    }

    if (path.basename(dir) === "node_modules") {
        return [];
    }

    dir = path.resolve(dir);
    return fs.readdirSync(dir).reduce((files, file) => {
        const name = path.join(dir, file);
        const stats = fs.statSync(name);
        if (stats.isSymbolicLink()) {
            return [];
        }
        return stats.isDirectory() ? [...files, ...list(name, depth - 1)] : [...files, name];
    }, [] as string[]);
}
