# AGENT INSTRUCTIONS & WORKSPACE PROTOCOLS

## 🚨 MANDATORY INITIALIZATION PROTOCOL (MUST RUN ON SESSION START)

Before interacting with the user, analyzing tasks, or executing any code modifications, the AI Agent MUST strictly perform the following initialization sequence:

1. **Scan the `.agents/` Directory**:
   Run `list_dir` on `.agents/` to inspect all available instruction modules.

2. **Read ALL Instruction Files**:
   Execute `view_file` on EVERY `.md` file inside `.agents/` (including `security.md`, `js_map.md`, and any additional rules).

3. **Enforce Context & Rules**:
   Apply all UI invariants, security protocols, API payload flows, and architecture maps loaded from those documents to every subsequent action in this session.

---

## ⚡ CLAUDE CODE CLI OPTIMIZATIONS & EXECUTION DIRECTIVES

To maintain context efficiency, minimize token overhead, and protect system integrity, strictly adhere to the following execution rules:

* **Token-Efficient Output**: Keep conversational responses minimal. Focus on executable fixes and direct output unless explicitly asked for technical explanations.
* **Pre-Execution Reading**: Always read target source files before making modifications (`src/js/`, `_core.html`, etc.). Do not guess file structures.
* **Build Invariant**: Any change to `src/js/` or `_core.html` MUST be immediately followed by executing `node build-core.js`. Never edit `functions/api/_core.js` manually.
* **Theme Synchronization**: Any UI tweak MUST be applied synchronously to both Light Mode (`_core.html`/JS) and Dark Mode (`public/css/dark.css`).
* **Safe Error Handling**: Never expose raw stack traces or internal environment variables in API responses.