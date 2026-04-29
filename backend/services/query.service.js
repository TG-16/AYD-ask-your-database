const plannerService = require("./planner.service");
const llmService = require("./llm.service");
const embeddingService = require("./embedding.service");
const schemaService = require("./schema.service"); // Reusing your existing READ APIs
const dataService = require("./data.service");
const { validateSQL } = require("../validators/sql.Validator");
const queryModel = require("../models/query.model");

const executeNLQuery = async (workspaceId, prompt) => {
  // 1. Fetch full schema for this tenant
  const fullSchema = await dataService.listWorkspaceColumns(workspaceId);

  // 2. Hybrid Routing Logic
  const totalTables = fullSchema.length;
  const totalColumns = fullSchema.reduce((sum, t) => sum + t.columns.length, 0);
  const maxCols = Math.max(...fullSchema.map(t => t.columns.length));

  let relevantSchema = fullSchema;
  let strategy = "small_schema_direct";

  if (totalTables > 10 || maxCols > 20 || totalColumns > 100) {
    relevantSchema = await plannerService.selectRelevantSchemas(fullSchema, prompt);
    strategy = "large_schema_planner";
  }

  // 3. Generate SQL via Query LLM
  const querySystemPrompt = `
    You are a PostgreSQL expert. Generate a parameterized SELECT query.
    Rules:
    - Use tenant_<workspaceId>_tableName (workspaceId: ${workspaceId.replace(/-/g, "_")})
      EXAMPLE:
        workspaceId = 853ae44c-0d47-4f55-b18a-3372aaa5806d
        tableName = products

        CORRECT:
        tenant_853ae44c_0d47_4f55_b18a_3372aaa5806d_products
    - Use placeholders ($1, $2) and return dynamicInputs array.
    - If "similar to" is asked, use vector columns with <-> operator.
    - Return JSON: { "queryType": "sql|vector|hybrid", "sql": "...", "dynamicInputs": [...] }
      EXAMPLE:
        {
         "queryType": "sql" | "vector" | "hybrid",
         "sql": "SELECT * FROM tenant_<workspaceId>_products WHERE price < $3 ORDER BY product_name_vector <-> $1, brand_vector <-> $2 LIMIT 5",
         "dynamicInputs": [
            {
               "placeholder": "$1",
               "type": "embedding",
               "value": "laptop"
            },
            {
               "placeholder": "$2",
               "type": "embedding",
               "value": "macbook"
            },
            {
               "placeholder": "$3",
               "type": "number",
               "value": 30000
            }
         ]
      }
  `;

  // const querySystemPrompt = `Role: PostgreSQL query generator.

  //   Generate a parameterized SELECT query using the provided request, workspaceId, and schemas.

  //   Rules:
  //   - JSON only
  //   - SELECT only
  //   - use tenant_<workspaceId>_<tableName>
  //   - use placeholders ($1, $2, ...)
  //   - never inline values
  //   - use vector columns with <-> when semantic similarity is needed

  //   Return:
  //   {
  //     "queryType": "sql|vector|hybrid",
  //     "sql": "SELECT ...",
  //     "dynamicInputs": []
  //   }`;

  const llmResult = await llmService.callLLM(querySystemPrompt, `Request: ${prompt} \nSchema: ${JSON.stringify(relevantSchema)}`);

  // 4. Validate SQL Security
  validateSQL(llmResult.sql, workspaceId);

  // 5. Resolve Dynamic Inputs (Embeddings vs Primitives)
  const resolvedParams = [];
  const embeddingCache = new Map();

  for (const input of llmResult.dynamicInputs) {
    console.log("input", input);
    if (input.type === "embedding") {
      if (embeddingCache.has(input.value)) {
        resolvedParams.push(embeddingCache.get(input.value));
      } else {
        const vector = await embeddingService.generateSingle(input.value);
        const vectorString = `[${vector.join(",")}]`;
        embeddingCache.set(input.value, vectorString);
        resolvedParams.push(vectorString);
      }
    } else {
      resolvedParams.push(input.value);
    }
  }

  // 6. Execute
  // const results = await queryModel.executeSafeQuery(llmResult.sql, resolvedParams);


  // 1. Execute the query
  const rawResults = await queryModel.executeSafeQuery(llmResult.sql, resolvedParams);

  // 2. SCRUBBER: Remove all vector columns from the final JSON
  // Even if the LLM wrote "SELECT * " or explicitly named vector columns,
  // this loop ensures they never reach the client.
  const cleanedResults = rawResults.map(row => {
    const cleanRow = { ...row };
    
    Object.keys(cleanRow).forEach(columnName => {
      // Standardize check for your '_vector' naming convention
      if (columnName.endsWith('_vector')) {
        delete cleanRow[columnName];
      }
    });

    return cleanRow;
  });
  console.log("results",cleanedResults);

  return {
    strategy,
    queryType: llmResult.queryType,
    generatedSql: llmResult.sql,
    dynamicInputs: llmResult.dynamicInputs,
    cleanedResults
  };
};

module.exports = { executeNLQuery };