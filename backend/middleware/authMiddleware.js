import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) return res.status(401).json({ message: "Usuario no encontrado" });

    req.usuario = usuario;
    next();

  } catch (error) {
    console.error("Error verificarToken:", error);
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const soloAdmin = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ message: "Usuario no autenticado" });
  if (req.usuario.rol !== "admin") return res.status(403).json({ message: "Acceso denegado: solo admin" });
  next();
};

export const adminOSupervisor = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ message: "Usuario no autenticado" });
  if (["admin", "supervisor"].includes(req.usuario.rol)) return next();
  return res.status(403).json({ message: "Acceso denegado: solo admin o supervisor" });
};