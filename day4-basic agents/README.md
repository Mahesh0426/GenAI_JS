## Final Architecture of gemini open ai compatible

```
User Query
    ↓
[Gemini generates multiple steps in one response]
    ↓
{"step":"START"...}\n{"step":"THINK"...}\n{"step":"TOOL"...}
    ↓
[Store as ONE assistant message]
    ↓
[Process each line]
    ↓
[When TOOL found, execute it]
    ↓
[Send observation as USER message]
    ↓
[Loop continues with proper user/assistant alternation]
```

## OpenAI supports these roles:

```
{ role: "system", content: "..." }     // ✅
{ role: "user", content: "..." }       // ✅
{ role: "assistant", content: "..." }  // ✅
{ role: "developer", content: "..." }  // ✅ (NEW in newer models)
{ role: "tool", content: "..." }       // ✅ (for function calling)
```

## Gemini only supports:

```
{ role: "system", content: "..." }     // ✅
{ role: "user", content: "..." }       // ✅
{ role: "assistant", content: "..." }  // ✅
{ role: "developer", content: "..." }  // ❌ NOT SUPPORTED!
{ role: "tool", content: "..." }       // ❌ NOT SUPPORTED!
```
