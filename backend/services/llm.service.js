// Example using a generic provider interface
// const callLLM = async (systemPrompt, userPrompt) => {
//   try {
//     // Replace with your actual LLM SDK call
//     // Ensure you force JSON output in your prompt/configuration
//     const response = await someLLMSDK.chat({
//       model: "gpt-4-turbo", // or similar high-reasoning model
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: userPrompt }
//       ],
//       response_format: { type: "json_object" }
//     });

//     return JSON.parse(response.choices[0].message.content);
//   } catch (error) {
//     console.error("[llm.service] Error calling LLM:", error);
//     throw error;
//   }
// // };

// module.exports = { callLLM };





// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Ensure your API key is loaded
// const API_KEY = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(API_KEY);

// /**
//  * Calls the Gemini API and ensures a JSON response.
//  */
// const callLLM = async (systemPrompt, userPrompt) => {
//   try {
//     // FIX: Use 'gemini-1.5-flash' or 'gemini-1.5-flash-latest'
//     // Also ensuring we use the standard model retrieval method
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//     const generationConfig = {
//       temperature: 0.1, // Low temperature is better for SQL/JSON generation
//       topP: 0.95,
//       topK: 64,
//       maxOutputTokens: 8192,
//       responseMimeType: "application/json",
//     };

//     // Construct the prompt
//     // For 1.5 models, system instructions can be passed in the generateContent call
//     // or as part of the initial model configuration.
//     const promptParts = [
//       { text: `SYSTEM INSTRUCTIONS: ${systemPrompt}` },
//       { text: `USER REQUEST: ${userPrompt}` },
//     ];

//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: promptParts }],
//       generationConfig,
//     });

//     const response = await result.response;
//     const text = response.text();

//     if (!text) {
//       throw new Error("Empty response from Gemini");
//     }
//     console.log(text);
//     return JSON.parse(text);
//   } catch (error) {
//     console.error("[llm.service] Gemini API Error:", error);

//     // Specific handling for common Gemini errors
//     if (error.status === 404) {
//       console.error("DEBUG: Check if 'gemini-1.5-flash' is available in your region/plan.");
//     }

//     const statusCode = error.status || 500;
//     error.statusCode = statusCode;
//     throw error;
//   }
// };

// module.exports = { callLLM };





// const { Ollama } = require("ollama");
// const ollama = new Ollama({ host: "http://127.0.0.1:11434" });
// /**
//  * Calls local Ollama instance and ensures a JSON response.
//  * Standardized to match the Gemini service interface.
//  */
// const callLLM = async (systemPrompt, userPrompt) => {
//   try {
//     // We use 'llama3' here, but 'mistral' or 'phi3' also work well for JSON
//     const response = await ollama.chat({
//       model: "qwen2.5-coder:7b",
//       messages: [
//         {
//           role: "system",
//           content: `${systemPrompt} \n\n IMPORTANT: You must respond with valid JSON only. Do not include any preamble, explanations, or markdown formatting blocks.`,
//         },
//         {
//           role: "user",
//           content: userPrompt,
//         },
//       ],
//       // This helps newer Llama models strictly follow JSON format
//       format: "json",
//       options: {
//         temperature: 0.1, // Keep it precise for SQL generation
//       },
//     });

//     const content = response.message.content;

//     // Standardize parsing to handle any accidental markdown blocks
//     const cleanJson = content.replace(/```json|```/g, "").trim();

//     console.log(cleanJson);

//     return JSON.parse(cleanJson);
//   } catch (error) {
//     console.error("[llm.service] Ollama Local Error:", error);

//     // Check if Ollama is actually running
//     if (error.code === "ECONNREFUSED") {
//       error.message = "Ollama is not running. Start it with 'ollama serve'.";
//     }

//     error.statusCode = 500;
//     throw error;
//   }
// };

// module.exports = { callLLM };





const OpenAI = require ('openai');

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const callLLM = async (systemPrompt, userPrompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "qwen/qwen3-coder-480b-a35b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      top_p: 0.8,
      max_tokens: 4096,
      stream: false
    });

    console.log(response.choices[0].message.content);
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("[llm.service] Error calling NVIDIA LLM:", error);
    throw error;
  }
};

module.exports = { callLLM };