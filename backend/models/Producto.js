import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true 
  },

  codigo: { 
    type: String, 
    required: true,
    unique: true,          // 🔥 No permite duplicados
    trim: true             // Elimina espacios accidentales
  },

  categoria: String,
  tipo: String,
  artesano: String,

  precioVenta: { 
    type: Number, 
    required: true 
  },

  precioArtesano: { 
    type: Number, 
    default: 0 
  },

  stock: { 
    type: Number, 
    default: 0 
  },

  utilidad: { 
    type: Number, 
    default: 0 
  }

}, {
  timestamps: true
});

export default mongoose.model("Producto", productoSchema);