
import re
with open("src/js/00_core.js", "r", encoding="utf-8") as f:
    content = f.read()

broken_str = """    channel(name) {
        return {
            on() { return this; },
            subscribe() { return this; }
        };
    },
    removeChannel() {},
    from(table)"""

# We want to replace the broken one. The broken one is preceded by "app.api."
content = content.replace("app.api." + broken_str, "app.api.from(table)")

with open("src/js/00_core.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done fixing 00_core.js")
