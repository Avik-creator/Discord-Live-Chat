/**
 * Groq language models supported by @ai-sdk/groq (AI SDK v6).
 * See: https://sdk.vercel.ai/providers/ai-sdk-providers/groq
 */

export interface GroqModelOption {
  id: string
  label: string
  badge?: string
}

export const GROQ_MODELS: GroqModelOption[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", badge: "Recommended" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", badge: "Fast" },
  { id: "llama3-70b-8192", label: "Llama 3 70B (8K)" },
  { id: "llama3-8b-8192", label: "Llama 3 8B (8K)" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B IT" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", badge: "32K context" },
  { id: "qwen-2.5-32b", label: "Qwen 2.5 32B" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B", badge: "Reasoning" },
  { id: "qwen-qwq-32b", label: "Qwen QwQ 32B", badge: "Reasoning" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B", badge: "Reasoning" },
  { id: "deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 Distill Qwen 32B", badge: "Reasoning" },
  { id: "moonshotai/kimi-k2-instruct-0905", label: "Moonshot Kimi K2" },
  { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B", badge: "Browser search" },
  { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B", badge: "Browser search" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B", badge: "Image input" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B", badge: "Image input" },
  { id: "meta-llama/llama-guard-4-12b", label: "Llama Guard 4 12B", badge: "Safety" },
  { id: "meta-llama/llama-prompt-guard-2-22m", label: "Llama Prompt Guard 2 22M" },
  { id: "meta-llama/llama-prompt-guard-2-86m", label: "Llama Prompt Guard 2 86M" },
  { id: "llama-guard-3-8b", label: "Llama Guard 3 8B" },
]

export const DEFAULT_GROQ_MODEL_ID = "llama-3.3-70b-versatile"
