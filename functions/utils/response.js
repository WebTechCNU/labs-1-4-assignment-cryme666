const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function success(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

function error(statusCode, message, details) {
  const body = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: "",
  };
}

module.exports = { success, error, handleOptions };
