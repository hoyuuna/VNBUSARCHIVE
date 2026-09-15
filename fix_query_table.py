
import re

with open("functions/api/query.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const col = db.collection(table);", """let targetTable = table;
        if (targetTable === "profiles") targetTable = "users";
        const col = db.collection(targetTable);""")

with open("functions/api/query.js", "w", encoding="utf-8") as f:
    f.write(content)
print("query.js table alias modified.")
