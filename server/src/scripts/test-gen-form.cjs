const crypto = require("crypto");
const merchant = "SP-TEST-NH63AB24";
const key = "spsk_test_kUAB9vbAnfDBFwpd1poptav2jFvmcaQb";
const fields = {
  merchant,
  operation: "PURCHASE",
  payment_method: "BANK_TRANSFER",
  order_invoice_number: "DDGTEST002",
  order_amount: "50000",
  currency: "VND",
  order_description: "Test payment 50k",
  customer_id: "",
  success_url: "https://example.com/success",
  error_url: "https://example.com/error",
  cancel_url: "https://example.com/cancel",
};
const signed = ["merchant", "env", "operation", "payment_method", "order_amount", "currency", "order_invoice_number", "order_description", "customer_id", "success_url", "error_url", "cancel_url", "order_id"];
const parts = signed.filter(f => fields[f] !== undefined).map(f => `${f}=${fields[f] ?? ""}`);
fields.signature = crypto.createHmac("sha256", key).update(parts.join(",")).digest("base64");

// Build form HTML
const fieldsHtml = Object.entries(fields)
  .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, "&quot;")}" />`)
  .join("\n  ");

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <form id="f" action="https://pay-sandbox.sepay.vn/v1/checkout/init" method="POST">
    ${fieldsHtml}
    <button type="submit">Pay</button>
  </form>
  <script>document.getElementById("f").submit();</script>
</body>
</html>`;

require("fs").writeFileSync("test-sepay-form.html", html);
console.log("Form saved to test-sepay-form.html");
console.log("Fields:", JSON.stringify(fields, null, 2));
