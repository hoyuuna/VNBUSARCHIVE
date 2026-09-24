
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sqlToRegex = (sqlStr) => {
  if (!sqlStr) return "";
  return "^" + sqlStr.split("%").map(escapeRegExp).join(".*") + "$";
};
const splitByComma = (str) => {
  const parts = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "(") depth++;
    else if (str[i] === ")") depth--;
    else if (str[i] === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += str[i];
  }
  parts.push(current);
  return parts;
};
const parseCondition = (cond) => {
  cond = cond.trim();
  if (cond.startsWith("and(") && cond.endsWith(")")) {
    const inner = cond.substring(4, cond.length - 1);
    const parts = splitByComma(inner);
    return { $and: parts.map(parseCondition).filter(Boolean) };
  }
  if (cond.startsWith("or(") && cond.endsWith(")")) {
    const inner = cond.substring(3, cond.length - 1);
    const parts = splitByComma(inner);
    return { $or: parts.map(parseCondition).filter(Boolean) };
  }
  const match = cond.match(/^([^.]+)\.([^.]+)\.(.*)$/);
  if (!match) return null;
  const [_, field, op, valRaw] = match;
  let val = valRaw;
  if (val.startsWith("\"") && val.endsWith("\"")) val = val.substring(1, val.length - 1);
  let mField = field;
  if (op === "ilike") {
    const regexStr = sqlToRegex(val);
    return { [mField]: { $regex: regexStr, $options: "i" } };
  } else if (op === "eq") {
    return { [mField]: val };
  } else if (op === "is") {
    if (val === "null") return { [mField]: null };
  }
  return null;
};

const allQueryParams = {
  route_no: "eq.05",
  or: "borrowed_route.eq.\"05 - Hà N?i\",and(borrowed_route.is.null,or(license_plate.ilike.29%,license_plate.ilike.30%))"
};
const match = {};

for (const [k, v] of Object.entries(allQueryParams)) {
    if (["limit", "offset", "sort", "order", "count", "select", "plate", "operator", "route", "model", "type", "borrowed_route", "uploader_id", "status", "has_location", "_cb", "_t"].includes(k)) continue;
    
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

