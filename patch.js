
const fs = require("fs");
let c = fs.readFileSync("temp/middle/src/routes/vehicles.ts", "utf8");

c = c.replace(
  /if \(val\.startsWith\("%"\) && val\.endsWith\("%"\)\) val = val\.substring\(1, val\.length - 1\);\s*if \(val\.startsWith\("\*"\) && val\.endsWith\("\*"\)\) val = val\.substring\(1, val\.length - 1\);/g,
  "val = val.replace(/^[%*]+/, \"\").replace(/[%*]+$/, \"\");"
);

const andParserRegex = /if \(and\) \{[\s\S]*?if \(!filter\.\$and\) filter\.\$and = \[\];\s*filter\.\$and\.push\(\.\.\.andConds\);\s*\}\s*\}/;

const andParserNew = `if (and) {
    let cleanAnd = and;
    if (cleanAnd.startsWith("and(") && cleanAnd.endsWith(")")) {
      cleanAnd = cleanAnd.substring(4, cleanAnd.length - 1);
    }
    const andParts = cleanAnd.split(",");
    const andConds = [];
    for (let p of andParts) {
      let cleanP = p;
      if (cleanP.startsWith("(") && cleanP.endsWith(")")) {
        cleanP = cleanP.substring(1, cleanP.length - 1);
      }
      const match = cleanP.match(/^([a-zA-Z_]+)\\.ilike\\.(.*)$/);
      if (match) {
        const field = match[1] === "license_plate" ? "_id" : match[1];
        let val = match[2];
        if (val.startsWith("\\"") && val.endsWith("\\"")) val = val.substring(1, val.length - 1);
        val = val.replace(/^[%*]+/, "").replace(/[%*]+$/, "");
        andConds.push({ [field]: { $$regex: escapeRegExp(val), $$options: "i" } });
      }
    }
    if (andConds.length > 0) {
      if (!filter.$$and) filter.$$and = [];
      filter.$$and.push(...andConds);
    }
  }`.replace(/\$\$/g, "$");

c = c.replace(andParserRegex, andParserNew);
fs.writeFileSync("temp/middle/src/routes/vehicles.ts", c);
console.log("vehicles.ts patched.");

