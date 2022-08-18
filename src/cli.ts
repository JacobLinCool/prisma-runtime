import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DIR = args.filter((arg) => !arg.startsWith("-"))[0] || ".";
const DRY = args.includes("--dry") || args.includes("-d");
const HELP = args.includes("--help") || args.includes("-h");

export function run(): void {
    if (HELP) {
        console.log(
            "prisma-runtime: fix require/import path of prisma generated files in a directory",
        );
        console.log("Options: -d, --dry  : dry run");
        console.log("         -h, --help : show this help");
        console.log("Example: prisma-runtime target/dir");
        return;
    }

    if (DRY) {
        console.log("Dry run - no changes will be made");
    }

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

    if (!DRY) {
        const dirs = new Set<string>();
        files.forEach((file) => {
            const content = fs.readFileSync(file, "utf8");
            if (content.includes("./runtime/index-browser")) {
                const patched = content.replace(
                    /\.\/runtime\/index-browser/g,
                    "prisma-runtime/dist/runtime/index-browser",
                );
                fs.writeFileSync(file, patched);
            } else {
                const patched = content.replace(/\.\/runtime\/index/g, "prisma-runtime");
                fs.writeFileSync(file, patched);
            }
            console.log(`Updated ${file}`);
            dirs.add(path.dirname(file));
        });

        [...dirs].forEach((dir) => {
            const runtime = path.join(dir, "runtime");
            if (fs.existsSync(runtime)) {
                fs.rmSync(runtime, { recursive: true });
                console.log(`Removed ${runtime}`);
            }
            const lib = fs.readdirSync(dir).find((file) => file.endsWith(".node"));
            if (lib) {
                fs.rmSync(path.join(dir, lib));
                console.log(`Removed ${lib}`);
            }
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
