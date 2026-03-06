import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import Producto from "./models/Producto.js";
import ventasRoutes from "./routes/ventas.js";
import authRoutes from "./routes/auth.js";
import usuariosRoutes from "./routes/usuarios.js";
const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   1️⃣ CORS
========================= */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://app-hilos.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

/* =========================
   2️⃣ Middleware JSON
========================= */
app.use(express.json());

/* =========================
   3️⃣ RUTAS
========================= */
// 👥 Usuarios
app.use("/api/usuarios", usuariosRoutes);
// 🔐 Autenticación
app.use("/api/auth", authRoutes);

// 💰 Ventas protegidas
app.use("/api/ventas", ventasRoutes);

// 📦 Productos
app.get("/api/productos", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/productos", async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    const guardado = await nuevoProducto.save();
    res.json(guardado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/productos/:id", async (req, res) => {
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/productos/:id", async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔔 Productos con stock bajo
app.get("/api/productos/stock-bajo", async (req, res) => {
  try {
    const limite = 3;
    const productos = await Producto.find({ stock: { $lte: limite } });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   RUTA RAÍZ
========================= */
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

/* =========================
   4️⃣ CONEXIÓN MONGODB
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🟢 Conectado a MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => console.error("❌ Error MongoDB:", err));