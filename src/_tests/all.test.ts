import fs from "node:fs";
import { execSync } from "node:child_process";

describe("test", () => {
    it("should work", () => {
        fs.rmSync("generated", { recursive: true, force: true });

        execSync("pnpm prisma generate");
        const before = fs.readdirSync("generated");
        expect(before.includes("runtime")).toBe(true);
        expect(before.find((f) => f.endsWith(".node"))).toBeDefined();

        execSync("pnpm start generated");
        const after = fs.readdirSync("generated");
        expect(after.includes("runtime")).toBe(false);
        expect(after.find((f) => f.endsWith(".node"))).toBeUndefined();
    });
});
