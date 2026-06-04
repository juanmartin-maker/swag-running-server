const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

app.post("/crear-preferencia", async (req, res) => {
  const { monto, nombre, email, dni, regId, eventoNombre } = req.body;
  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{ title: eventoNombre, quantity: 1, unit_price: monto, currency_id: "ARS" }],
        payer: { name: nombre, email },
        external_reference: regId,
        back_urls: {
          success: `https://swag-running-hold.vercel.app/confirmacion?id=${regId}`,
          failure: `https://swag-running-hold.vercel.app/?error=1`,
          pending: `https://swag-running-hold.vercel.app/confirmacion?id=${regId}`,
        },
        auto_return: "approved",
        metadata: { dni, regId },
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/capturar-pago", async (req, res) => {
  const { paymentId } = req.body;
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify({ capture: true }),
    });
    res.json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/liberar-hold", async (req, res) => {
  const { paymentId } = req.body;
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify({ status: "cancelled" }),
    });
    res.json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Servidor corriendo"));
