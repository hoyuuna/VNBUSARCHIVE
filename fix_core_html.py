
import re
with open("_core.html", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("window.sb.from('profiles')", "app.api.from('profiles')")
content = re.sub(r"window\.sb\s*=\s*window\.supabase\.createClient\(.*?\);", "", content)

with open("_core.html", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed _core.html")
