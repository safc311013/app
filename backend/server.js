import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

import Producto from "./models/Producto.js";
import ventasRoutes from "./routes/Ventas.js";
import authRoutes from "./routes/auth.js";
import usuariosRoutes from "./routes/usuarios.js";

const app = express();
const PORT = process.env.PORT || 5000;

const sseClients = new Set();

const frontendUrl = process.env.FRONTEND_URL?.trim();
const vercelFrontendUrl = process.env.VERCEL_FRONTEND_URL?.trim();

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i,
  "https://app-hilos.netlify.app",
  frontendUrl,
  vercelFrontendUrl,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const byRules = allowedOriginPatterns.some((rule) => {
    if (typeof rule === "string") return rule === origin;
    return rule.test(origin);
  });

  if (byRules) return true;

  if (process.env.VERCEL === "1" && origin.startsWith("https://")) {
    return true;
  }

  return false;
};

const emitRealtimeChange = (resource) => {
  const payload = `data: ${JSON.stringify({
    resource,
    timestamp: Date.now(),
  })}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
};

app.locals.emitRealtimeChange = emitRealtimeChange;

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

/* -------------------------
   Realtime SSE
------------------------- */

app.get("/api/realtime/events", async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    await connectMongo();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o error de conexión",
      error: error.message,
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  res.write(
    `data: ${JSON.stringify({
      resource: "init",
      timestamp: Date.now(),
    })}\n\n`
  );

  sseClients.add(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

/* -------------------------
   Rutas de prueba
------------------------- */

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.get("/api/test", async (req, res) => {
  try {
    await connectMongo();
    res.json({ ok: true, message: "Ruta api funcionando" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error conectando a la base de datos",
      error: error.message,
    });
  }
});

/* -------------------------
   Middleware conexión Mongo
   para rutas API
------------------------- */

app.use("/api", async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error conectando a la base de datos",
      error: error.message,
    });
  }
});

/* -------------------------
   Rutas API
------------------------- */

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ventas", ventasRoutes);

/* -------------------------
   Productos
------------------------- */

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

    emitRealtimeChange("productos");

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

    emitRealtimeChange("productos");

    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/productos/:id", async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);

    emitRealtimeChange("productos");

    res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/productos/stock-bajo", async (req, res) => {
  try {
    const limite = 3;
    const productos = await Producto.find({ stock: { $lte: limite } });

    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   Conexión MongoDB
------------------------- */

let mongoConnectionPromise;

function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (mongoose.connection.readyState === 2) {
    return mongoConnectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI no está configurado en las variables de entorno");
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        return connection;
      })
      .catch((error) => {
        mongoConnectionPromise = undefined;
        throw error;
      });
  }

  return mongoConnectionPromise;
}

if (process.env.VERCEL !== "1") {
  connectMongo()
    .then(() => {
      console.log("🟢 Conectado a MongoDB");

      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      });
    })
    .catch((err) => console.error("❌ Error MongoDB:", err));
}

/* -------------------------
   Manejo de errores
------------------------- */

app.use((err, req, res, next) => {
  console.error("❌ Error no controlado:", err);
  res.status(500).json({
    message: "Error interno del servidor",
    error: err.message,
  });
});

export { app, connectMongo };
export default app;