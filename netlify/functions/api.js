// netlify/functions/api.js
const glmProxy = require('./glm-proxy.js');

exports.handler = async (event) => {
  return glmProxy.handler(event);
};
