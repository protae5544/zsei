// netlify/functions/glm-proxy.js
/**
 * Netlify Function: glm-proxy
 * Proxy to GLM-4.5 API to keep API keys on server side.
 * Expects JSON body with fields:
 * - prompt
 * - model (optional)
 * - temperature (optional)
 * - max_tokens (optional)
 * - stream (optional)
 * 
 * Env vars:
 * - GLM_BASE_URL
 * - GLM_API_KEY
 * - GLM_ENDPOINT (default /glm/v1/chat/completions)
 * - GLM_MODEL (default glm-4.5)
 * - GLM_TEMPERATURE
 * - GLM_MAX_TOKENS
 */
let fetchImpl = null
