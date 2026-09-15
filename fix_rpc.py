
import re
with open("src/js/00_core.js", "r", encoding="utf-8") as f:
    content = f.read()

rpc_code = """
    rpc(name, args) {
        return new QueryBuilder(null).rpc(name, args);
    },
    from(table)"""

content = content.replace("    from(table)", rpc_code)

with open("src/js/00_core.js", "w", encoding="utf-8") as f:
    f.write(content)

with open("functions/api/query.js", "r", encoding="utf-8") as f:
    backend_content = f.read()
print("functions/api/query.js contains rpc?:", "rpc" in backend_content)
