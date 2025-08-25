#!/usr/bin/env bash
set -euo pipefail

echo "Setup GLM proxy on Netlify - automatic"
echo "คุณจะถูกถามสำหรับข้อมูล env ที่จริง (ไม่ควรเผยข้อมูลในที่สาธารณะ)"
read -rp "SITE_ID (Netlify Site ID) : " SITE_ID
read -rp "GLM_BASE_URL (เช่น https://api.yourglm-provider.com)  : " GLM_BASE_URL
read -rp "GLM_API_KEY (API Key ของคุณ) : " GLM_API_KEY
echo
read -rp "GLM_ENDPOINT (เช่น /glm/v1/chat/completions) : " GLM_ENDPOINT
read -rp "GLM_MODEL (เช่น glm-4.5) : " GLM_MODEL
read -rp "GLM_TEMPERATURE (eg 0.7) : " GLM_TEMPERATURE
read -rp "GLM_MAX_TOKENS (eg 2000) : " GLM_MAX_TOKENS
echo

DIR="$(pwd)"

echo "Creating files..."
cat > "$DIR/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Z AI GLM-4.5 Proxy on Netlify</title>
  <style>/* styles omitted for brevity in this snippet; use full content from main file */</style>
</head>
<body>
  <!-- content copied from the index.html provided earlier -->
</body>
</html>
HTML

cat > "$DIR/netlify.toml" <<'TOML'
[build]
  command = "npm install"
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
TOML

mkdir -p "$DIR/netlify/functions"
cat > "$DIR/netlify/functions/glm-proxy.js" <<'JS'
const fetch = require('node-fetch');
exports.handler = async (event) => { /* content as provided earlier */ };
JS

cat > "$DIR/package.json" <<'JSON'
{ "name": "zsei-netlify-glm-proxy", "version": "1.0.0", "private": true, "scripts": { "start": "netlify dev", "build": "echo no build step needed for static UI" }, "dependencies": { "node-fetch": "^2.6.7" } }
JSON

echo "Setting env vars via Netlify CLI (ถ้า CLI ติดตั้งแล้วและคุณได้ล็อกอินแล้ว)"
if command -v netlify >/dev/null 2>&1; then
  echo "Setting environment variables for SITE_ID=$SITE_ID"
  netlify env:set GLM_BASE_URL "$GLM_BASE_URL" --site "$SITE_ID" || true
  netlify env:set GLM_API_KEY "$GLM_API_KEY" --site "$SITE_ID" || true
  netlify env:set GLM_ENDPOINT "$GLM_ENDPOINT" --site "$SITE_ID" || true
  netlify env:set GLM_MODEL "$GLM_MODEL" --site "$SITE_ID" || true
  netlify env:set GLM_TEMPERATURE "$GLM_TEMPERATURE" --site "$SITE_ID" || true
  netlify env:set GLM_MAX_TOKENS "$GLM_MAX_TOKENS" --site "$SITE_ID" || true

  echo "Deploying prod..."
  netlify deploy --prod --site "$SITE_ID" || true
else
  echo "Netlify CLI not found. Install and run manually:
  npm i -g netlify-cli
  netlify login
  netlify link --site <SITE_ID>
  netlify env:set GLM_BASE_URL \"$GLM_BASE_URL\" --site <SITE_ID>
  netlify env:set GLM_API_KEY \"$GLM_API_KEY\" --site <SITE_ID>
  netlify env:set GLM_ENDPOINT \"$GLM_ENDPOINT\" --site <SITE_ID>
  netlify env:set GLM_MODEL \"$GLM_MODEL\" --site <SITE_ID>
  netlify env:set GLM_TEMPERATURE \"$GLM_TEMPERATURE\" --site <SITE_ID>
  netlify env:set GLM_MAX_TOKENS \"$GLM_MAX_TOKENS\" --site <SITE_ID>
  netlify deploy --prod
"
fi

echo "Done"
