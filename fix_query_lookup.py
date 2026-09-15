
import re
with open("functions/api/query.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from: \"profiles\"", "from: \"users\"")
content = content.replace("db.collection(\"profiles\")", "db.collection(\"users\")")

with open("functions/api/query.js", "w", encoding="utf-8") as f:
    f.write(content)
print("query.js lookups modified.")
