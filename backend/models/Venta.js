import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema(
  {
    numeroTicket: {
      type: Number,
      unique: true,
      index: true,
    },

    productos: [
      {
        productoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: true,
        },
        nombre: { type: String, required: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnitario: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],

    total: { type: Number, required: true },

    metodoPago: {
      type: String,
      enum: ["Efectivo", "Transferencia", "Tarjeta", "Otro"],
      default: "Efectivo",
    },

    ticketHTML: { type: String },
    codigoQR: { type: String },

    // 🔥 NUEVO: Link directo a WhatsApp
    linkWhatsApp: { type: String },

    // 🔥 NUEVO: Mensaje generado
    mensajeWhatsApp: { type: String },

    // 🔐 Usuario que realizó la venta
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Venta", ventaSchema);