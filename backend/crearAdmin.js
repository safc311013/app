import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Usuario from "./models/Usuario.js";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 Conectado a MongoDB Atlas"))
  .catch(err => console.error("❌ Error conexión:", err));

const crearOActualizarAdmins = async () => {
  try {
    const usuarios = [
      { nombre: "Administrador", email: "admin@hilos.com", password: "Kalito22" },
      
    ];

    for (const usuario of usuarios) {
      const passwordHash = await bcrypt.hash(usuario.password, 10);

      await Usuario.findOneAndUpdate(
        { email: usuario.email },
        {
          nombre: usuario.nombre,
          password: passwordHash,
          rol: "admin"
        },
        { upsert: true, new: true }
      );

      console.log(`✅ ${usuario.email} creado o actualizado`);
    }

    console.log("🎉 Usuarios listos");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit();
  }
};

crearOActualizarAdmins();