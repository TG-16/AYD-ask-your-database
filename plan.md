POST /query
↓
authenticate user
↓
fetch tenant schema
↓
if small schema
    → sqlGenerationPrompt(full schema)
else
    → schemaSelectionPrompt
    → sqlGenerationPrompt(selected schema)
↓
validate SQL
↓
execute query
↓
optional LLM result explanation
↓
return response




==> pick the relevant tables and columns

const schemaSelectionPrompt = `
You are a PostgreSQL schema planner.

Your task is to identify ONLY the relevant tables and columns needed to answer the user's query.

Rules:
1. Return ONLY valid JSON
2. Do NOT generate SQL
3. Choose the minimum number of tables required
4. Include only relevant columns
5. If a join is needed, include both tables
6. Never include unrelated tables

User Query:
"${userQuery}"

Available Schema:
${JSON.stringify(userSchema, null, 2)}

Return format:
{
  "tables": [
    {
      "table_name": "string",
      "columns": ["string"]
    }
  ],
  "reasoning": "short explanation"
}
`;



==> generate safe PostgreSQL SELECT SQL only
# need to be edited all options must be availabel CRUD
const sqlGenerationPrompt = `
You are a PostgreSQL SQL generator.

Generate a valid PostgreSQL SELECT query based on the user's request.

STRICT RULES:
1. Return ONLY valid JSON
2. SQL must be PostgreSQL compatible
3. ONLY generate SELECT queries
4. NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER
5. Use only provided tables and columns
6. If aggregation is required, use GROUP BY properly
7. Use aliases for readability
8. Add LIMIT 100 unless aggregation query

User Query:
"${userQuery}"

Relevant Schema:
${JSON.stringify(selectedSchema, null, 2)}

Return format:
{
  "sql": "SELECT ...",
  "query_type": "filter|aggregation|join",
  "reasoning": "short explanation"
}
`;