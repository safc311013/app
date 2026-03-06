import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"]
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    rol: {
      type: String,
      enum: ["admin", "supervisor", "cajero"], // ← agregado supervisor
      default: "cajero"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Usuario", usuarioSchema);