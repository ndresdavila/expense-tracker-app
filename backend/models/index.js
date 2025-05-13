const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Crear conexión Sequelize a PostgreSQL usando variables del .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // cambia a true si quieres ver las consultas SQL en consola
  }
);

// Probar conexión
sequelize.authenticate()
  .then(() => console.log("✅ Conectado a PostgreSQL con Sequelize"))
  .catch(err => console.error("❌ Error al conectar con PostgreSQL:", err));

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelo Transaction
db.Transaction = require("./Transaction")(sequelize, DataTypes);

module.exports = db;
