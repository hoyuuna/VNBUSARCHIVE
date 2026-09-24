
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
const str = "borrowed_route.eq.\"05 - Hà N?i\",and(borrowed_route.is.null,or(license_plate.ilike.29%,license_plate.ilike.30%))";
const parts = splitByComma(str);
console.log(JSON.stringify(parts.map(parseCondition).filter(Boolean), null, 2));

