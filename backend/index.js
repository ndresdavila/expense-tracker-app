const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Paso 1: Redirigir a Google Login
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  res.redirect(url);
});

// Paso 2: Google redirige aquí con el código
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  // Aquí puedes guardar tokens en BD si lo deseas
  res.json({ message: "Autenticado con éxito", tokens });
});

// Lógica para leer correos del banco
app.get("/read-emails", async (req, res) => {
  oauth2Client.setCredentials(req.body.tokens); // tokens del usuario
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "from:bancaenlinea@produbanco.com newer_than:2d",
  });

  const messages = response.data.messages || [];

  const result = [];
  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const bodyData = Buffer.from(
        detail.data.payload.parts?.[0]?.body?.data || "",
        "base64"
      ).toString("utf8");
      
      // Extrae monto con el formato: Valor: USD 5.50
      const gasto = /Valor:\s*USD\s*(\d+\.\d{2})/i.exec(bodyData);
      
      if (gasto) {
        result.push({ id: msg.id, monto: parseFloat(gasto[1]) });
      }      
  }

  res.json(result);
});

app.listen(process.env.PORT, () => {
  console.log("Backend en http://localhost:" + process.env.PORT);
});
