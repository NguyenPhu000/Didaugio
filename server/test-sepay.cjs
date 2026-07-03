const crypto = require("crypto");

const SEPAY_MERCHANT_ID = "SP-TEST-NH63AB24";
const SEPAY_SECRET_KEY = "spsk_test_kUAB9vbAnfDBFwpd1poptav2jFvmcaQb";

const SIGNED_FIELDS = [
  "merchant", "env", "operation", "payment_method", "order_amount", "currency",
  "order_invoice_number", "order_description", "customer_id",
  "success_url", "error_url", "cancel_url", "order_id",
];

const fields = {
  merchant: SEPAY_MERCHANT_ID,
  operation: "PURCHASE",
  payment_method: "BANK_TRANSFER",
  order_invoice_number: "DDGTEST001",
  order_amount: "10000",
  currency: "VND",
  order_description: "Test payment",
  customer_id: "",
  success_url: "https://example.com/success",
  error_url: "https://example.com/error",
  cancel_url: "https://example.com/cancel",
};

// Sign
const parts = [];
for (const field of SIGNED_FIELDS) {
  if (fields[field] === undefined) continue;
  parts.push(`${field}=${fields[field] ?? ""}`);
}
const joined = parts.join(",");
const signature = crypto.createHmac("sha256", SEPAY_SECRET_KEY).update(joined).digest("base64");
fields.signature = signature;

console.log("Signed string:", joined);
console.log("Signature:", signature);
console.log("Fields:", JSON.stringify(fields, null, 2));
console.log("Checkout URL: https://pay-sandbox.sepay.vn/v1/checkout/init");

// Now try POST
const https = require("https");
const postData = new URLSearchParams(fields).toString();
const url = new URL("https://pay-sandbox.sepay.vn/v1/checkout/init");

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("\n--- Response ---");
    console.log("Status:", res.statusCode);
    console.log("Headers:", JSON.stringify(res.headers, null, 2));
    console.log("Body (first 1000 chars):", body.substring(0, 1000));
  });
});

req.on("error", (e) => console.error("Request error:", e.message));
req.write(postData);
req.end();
