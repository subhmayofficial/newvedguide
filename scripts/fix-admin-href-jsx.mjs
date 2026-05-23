import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (["node_modules", ".git"].includes(ent.name)) continue;
      walk(p, out);
    } else if (/\.(tsx)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

for (const fp of walk(path.join(root, "app")).concat(walk(path.join(root, "components")))) {
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes("href=adminPath")) continue;
  s = s.replace(/href=adminPath\(([^)]+)\)/g, "href={adminPath($1)}");
  fs.writeFileSync(fp, s);
  console.log("fixed", path.relative(root, fp));
}
