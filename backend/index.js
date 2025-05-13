const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos (Sequelize)
const db = require("./models");

// Sincroniza modelos con la base de datos
db.sequelize.sync().then(() => {
  console.log("📦 Tablas sincronizadas con PostgreSQL");
});

// Google OAuth2 Client
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
  // En un caso real deberías guardar estos tokens por usuario
  res.json({ message: "Autenticado con éxito", tokens });
});

// Lógica para leer correos del banco y guardar transacciones
app.post("/read-emails", async (req, res) => {
  const { tokens, userEmail } = req.body;

  if (!tokens || !tokens.access_token) {
    return res.status(400).json({ error: "Faltan los tokens de autenticación" });
  }

  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
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
        const amount = parseFloat(gasto[1]);

        // Guarda en PostgreSQL como tipo "expense"
        const saved = await db.Transaction.create({
          userEmail: userEmail || "usuario@gmail.com", // Si no mandan el correo, usa uno genérico
          amount: amount,
          type: "expense",
        });

        result.push({ id: msg.id, monto: amount, saved });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Error leyendo correos o guardando:", err);
    res.status(500).json({ error: "Fallo al procesar correos" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("🚀 Backend corriendo en http://localhost:" + process.env.PORT);
});
