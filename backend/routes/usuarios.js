import express from "express";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";
import { verificarToken, soloAdmin, adminOSupervisor } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   OBTENER USUARIOS (ADMIN O SUPERVISOR)
========================= */
router.get("/", verificarToken, adminOSupervisor, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-password");
    res.json(usuarios);
  } catch (error) {
    console.error("Error GET usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

/* =========================
   CREAR USUARIO (ADMIN O SUPERVISOR)
========================= */
router.post("/", verificarToken, adminOSupervisor, async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y password son obligatorios" });
    }

    email = email.toLowerCase();
    const rolesValidos = ["admin", "supervisor", "cajero"];
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ message: "El email ya está registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({ nombre, email, password: passwordHash, rol: rol || "cajero" });

    const usuarioSinPassword = nuevoUsuario.toObject();
    delete usuarioSinPassword.password;

    req.app.locals.emitRealtimeChange?.("usuarios");

    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error("Error POST usuario:", error);
    res.status(500).json({ message: "Error interno al crear usuario" });
  }
});

/* =========================
   ACTUALIZAR USUARIO (SOLO ADMIN)
========================= */
router.put("/:id", verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, rol, password } = req.body;
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // Validación de rol
    const rolesValidos = ["admin", "supervisor", "cajero"];
    if (rol && !rolesValidos.includes(rol)) return res.status(400).json({ message: "Rol inválido" });

    // Actualizar campos solo si vienen
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email.toLowerCase();
    if (rol) usuario.rol = rol;
    if (password && password.trim() !== "") {
      const passwordHash = await bcrypt.hash(password, 10);
      usuario.password = passwordHash;
    }

    await usuario.save();

    const usuarioSinPassword = usuario.toObject();
    delete usuarioSinPassword.password;
req.app.locals.emitRealtimeChange?.("usuarios");
    res.json(usuarioSinPassword);
  } catch (error) {
    console.error("Error PUT usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
});

/* =========================
   ELIMINAR USUARIO (SOLO ADMIN)
========================= */
router.delete("/:id", verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // NO permitir eliminar el último admin
    if (usuario.rol === "admin") {
      const totalAdmins = await Usuario.countDocuments({ rol: "admin" });
      if (totalAdmins <= 1) return res.status(400).json({ message: "No puedes eliminar el último admin" });
    }

    await Usuario.findByIdAndDelete(req.params.id);
    req.app.locals.emitRealtimeChange?.("usuarios");
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error DELETE usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
});

export default router;