const { callLLM } = require("./llm.service");

const selectRelevantSchemas = async (fullSchema, userPrompt) => {
  const systemPrompt = `
    You are a Database Architect. Given a massive database schema and a user request, 
    identify only the relevant tables and columns needed to answer the request.
    Return JSON only: { "relevantSchemas": [...] }
      EXAMPLE:
        {
           "relevantSchemas": [
              {
                 "tableName": "products",
                 "columns": ["product_name", "price", "stock"]
              }
           ]
        }
  `;

  // const systemPrompt = `Role: Database schema planner.

  //   Task:
  //   From the provided database schemas and user request, return ONLY the tables and columns required to answer the request.
    
  //   Rules:
  //   - Return JSON only
  //   - No explanation
  //   - No markdown
  //   - Select only relevant tables and columns
  //   - Preserve exact table and column names
    
  //   Output format:
  //   {
  //     "relevantSchemas": [
  //       {
  //         "tableName": "string",
  //         "columns": ["column1", "column2"]
  //       }
  //     ]
  //   }`;
  
  const userContext = `
    User Request: "${userPrompt}"
    Full Schema: ${JSON.stringify(fullSchema)}
  `;

  const result = await callLLM(systemPrompt, userContext);
  return result.relevantSchemas;
};

module.exports = { selectRelevantSchemas };