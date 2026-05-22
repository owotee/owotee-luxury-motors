import fs from "fs";
import path from "path";

const root = process.cwd();

const filesToCheck = [
  "src/App.jsx",
  "src/AdminDashboard.jsx",
  "api/index.js",
  "index.html",
  "README.md",
  "package.json"
];

const replacements = [
  ["234 Luxury Motors", "234 Motors"],
  ["234 LUXURY MOTORS", "234 MOTORS"],
  ["234 <span className=\"text-yellow-400\">Luxury</span> Motors", "234 <span className=\"text-yellow-400\">Motors</span>"],
];

for (const file of filesToCheck) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf8");
  let updated = content;

  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log(`Updated: ${file}`);
  }
}

console.log("Brand update complete.");
