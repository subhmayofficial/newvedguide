import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      files.push(p);
    }
  }
}
walk(path.join(root, "app"));
walk(path.join(root, "components"));
walk(path.join(root, "lib"));

const importLine =
  'import { adminPath, ADMIN_PANEL_BASE } from "@/lib/admin/admin-paths";\n';

for (const fp of files) {
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes("/admindeoghar")) continue;

  if (!s.includes("@/lib/admin/admin-paths")) {
    const m = s.match(/^((?:import[^\n]+\n)+)/);
    s = m ? m[1] + importLine + s.slice(m[1].length) : importLine + s;
  }

  s = s.replace(/"\/admindeoghar"/g, "ADMIN_PANEL_BASE");
  s = s.replace(/"\/admindeoghar([^"]*)"/g, (_, rest) => `adminPath("${rest}")`);

  s = s.replace(/`\/admindeoghar\/([^`]+)`/g, (_, inner) => {
    const parts = inner.split("${");
    const staticPart = parts[0];
    if (parts.length === 1) {
      return `\`\${adminPath("/${staticPart}")}\``;
    }
    const dynamic = parts.slice(1).join("${");
    return `\`\${adminPath("/${staticPart}")}\${${dynamic}\``;
  });

  s = s.replace(/`\/admindeoghar\?/g, "`${adminPath()}?");
  s = s.replace(/`\/admindeoghar`/g, "`${ADMIN_PANEL_BASE}`");

  fs.writeFileSync(fp, s);
  console.log("updated", path.relative(root, fp));
}
