
import re
with open("src/js/00_core.js", "r", encoding="utf-8") as f:
    content = f.read()

qb_rpc = """
      rpc(name, args) {
          this.query.action = "rpc";
          this.query.rpcName = name;
          this.query.rpcArgs = args;
          return this;
      }
      select"""

content = content.replace("      select", qb_rpc, 1)

with open("src/js/00_core.js", "w", encoding="utf-8") as f:
    f.write(content)
print("QueryBuilder modified.")
