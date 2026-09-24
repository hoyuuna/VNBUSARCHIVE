
const fs = require("fs");
let c = fs.readFileSync("temp/middle/src/routes/photos.ts", "utf8");
let parseConditionText = c.substring(c.indexOf("const parseCondition"), c.indexOf("for (const [k, v]"));
eval(c.substring(0, c.indexOf("const photos = ")));
eval(parseConditionText);

const allQueryParams = {
  route_no: "eq.05",
  or: "borrowed_route.eq.\"05 - Hà N?i\",and(borrowed_route.is.null,or(license_plate.ilike.29%,license_plate.ilike.30%))"
};
const match = {};

for (const [k, v] of Object.entries(allQueryParams)) {
    if (k === "and") {
      let cleanV = v;
      if (cleanV.startsWith("(") && cleanV.endsWith(")")) cleanV = cleanV.substring(1, cleanV.length - 1);
      const parts = splitByComma(cleanV);
      const andClauses = parts.map(parseCondition).filter(Boolean);
      if (andClauses.length > 0) {
        if (!match.$and) match.$and = [];
        match.$and.push(...andClauses);
      }
    } else if (k === "or") {
      let cleanV = v;
      if (cleanV.startsWith("(") && cleanV.endsWith(")")) cleanV = cleanV.substring(1, cleanV.length - 1);
      const parts = splitByComma(cleanV);
      const orClauses = parts.map(parseCondition).filter(Boolean);
      if (orClauses.length > 0) {
        if (!match.$or) match.$or = [];
        match.$or.push(...orClauses);
      }
    } else {
      let field = k;
      if (k.startsWith("ilike_")) {
         field = k.substring(6);
      }
      if (k.startsWith("neq_")) {
         match[k.substring(4)] = { $ne: v };
      } else if (String(v).startsWith("eq.")) {
        let val = String(v).substring(3);
        if (val === "null") match[field] = null;
        else match[field] = val;
      }
    }
}
console.log(JSON.stringify(match, null, 2));

