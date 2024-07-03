import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see "Set up your API key" above)

// ...

// For text-only input, use the gemini-pro model

// ...
export async function run(prompts) {
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const prompt = prompts

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
 return text;
}

