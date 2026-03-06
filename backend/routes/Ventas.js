import express from "express";
import Venta from "../models/Venta.js";
import Producto from "../models/Producto.js";
import QRCode from "qrcode";
import { verificarToken, soloAdmin, adminOSupervisor } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   REGISTRAR VENTA
========================= */
router.post("/", verificarToken, async (req, res) => {
  try {
    const { productos, total, metodoPago } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({ message: "No hay productos en la venta" });
    }

    const totalSeguro = Number(total);
    if (isNaN(totalSeguro)) {
      return res.status(400).json({ message: "Total inválido" });
    }

    /* VALIDAR Y DESCONTAR STOCK */
    for (const item of productos) {
      const cantidad = Number(item.cantidad) || 0;
      const producto = await Producto.findById(item.productoId);

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}`,
        });
      }

      producto.stock -= cantidad;
      await producto.save();
    }

    /* GENERAR NUMERO DE TICKET */
    const ultimaVenta = await Venta.findOne().sort({ numeroTicket: -1 });

    const ultimoNumero =
      ultimaVenta && typeof ultimaVenta.numeroTicket === "number"
        ? ultimaVenta.numeroTicket
        : 0;

    const nuevoNumeroTicket = ultimoNumero + 1;

    /* GENERAR LINK WHATSAPP */
    const numeroVendedor = "525653603032";

    const listaProductos = productos
      .map((p) => `• ${p.nombre} x${p.cantidad}`)
      .join("\n");

    const mensajeWhatsApp = `
Hola 👋
Tengo una consulta sobre mi compra.

🧾 Ticket: #${nuevoNumeroTicket}
📦 Productos:
${listaProductos}

💳 Método de pago: ${metodoPago}
💰 Total: $${totalSeguro.toFixed(2)}

¿Me pueden apoyar?
`;

    const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
    const urlWhatsApp = `https://wa.me/${numeroVendedor}?text=${mensajeCodificado}`;

    /* GENERAR QR */
    const codigoQR = await QRCode.toDataURL(urlWhatsApp);

    /* GENERAR HTML DEL TICKET */
    const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Ticket #${nuevoNumeroTicket}</title>
  <style>
    body { font-family: monospace; width: 300px; padding: 10px; margin: 0 auto; color: #000; }
    .logo { display: block; margin: 0 auto 10px auto; width: 160px; }
    h3, p { text-align: center; margin: 4px 0; }
    .line { border-top: 1px dashed #000; margin: 10px 0; }
    .item { display: flex; justify-content: space-between; font-size: 13px; margin: 3px 0; }
    .total { font-weight: bold; font-size: 16px; text-align: right; margin-top: 5px; }
    .footer { text-align: center; font-size: 12px; margin-top: 10px; }
    .qr { display: block; margin: 10px auto; width: 120px; }
  </style>
</head>
<body>

  <img src="http://localhost:5173/logo.png" class="logo" />

  <h3>Ticket #${nuevoNumeroTicket}</h3>
  <p>${new Date().toLocaleString()}</p>

  <div class="line"></div>

  ${productos
    .map((item) => {
      const subtotal = Number(item.subtotal) || 0;
      const cantidad = Number(item.cantidad) || 0;

      return `
      <div class="item">
        <span>${item.nombre} x${cantidad}</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
    `;
    })
    .join("")}

  <div class="line"></div>

  <div class="total">
    TOTAL: $${totalSeguro.toFixed(2)}
  </div>

  <p>Método: ${metodoPago}</p>
  <p>Cajero: ${req.usuario.nombre}</p>

  <div class="line"></div>

  <img src="${codigoQR}" class="qr" />

  <div class="footer">
    Escanea el QR para soporte por WhatsApp<br/>
    Hilos en Nogada
  </div>

</body>
</html>
`;

    const nuevaVenta = new Venta({
      numeroTicket: nuevoNumeroTicket,
      productos,
      total: totalSeguro,
      metodoPago,
      ticketHTML,
      codigoQR,
      linkWhatsApp: urlWhatsApp,
      mensajeWhatsApp,
      usuario: req.usuario.id,
    });

    await nuevaVenta.save();

    res.status(201).json(nuevaVenta);

  } catch (error) {
    console.error("ERROR VENTA:", error);
    res.status(500).json({ message: "Error interno al registrar venta" });
  }
});

/* =========================
   TODAS LAS VENTAS / FILTRO POR FECHA
========================= */
router.get("/", verificarToken, adminOSupervisor, async (req, res) => {
  try {

    const { inicio, fin } = req.query;

    let filtro = {};

    if (inicio && fin) {

      const fechaInicio = new Date(inicio);
      fechaInicio.setHours(0, 0, 0, 0);

      const fechaFin = new Date(fin);
      fechaFin.setHours(23, 59, 59, 999);

      filtro.createdAt = {
        $gte: fechaInicio,
        $lte: fechaFin,
      };

    }

    const ventas = await Venta.find(filtro)
      .sort({ createdAt: -1 })
      .populate("usuario", "nombre rol");

    res.json(ventas);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas" });
  }
});

/* =========================
   BUSCAR POR NUMERO TICKET
========================= */
router.get("/ticket/:numero", verificarToken, adminOSupervisor, async (req, res) => {
  try {

    const numero = Number(req.params.numero);

    const venta = await Venta.findOne({ numeroTicket: numero })
      .populate("usuario", "nombre rol");

    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    res.json(venta);

  } catch (error) {
    res.status(500).json({ message: "Error al buscar venta" });
  }
});

/* =========================
   VENTAS DE HOY
========================= */
router.get("/hoy", verificarToken, adminOSupervisor, async (req, res) => {
  try {

    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const ventas = await Venta.find({
      createdAt: { $gte: inicio, $lte: fin },
    }).populate("usuario", "nombre rol");

    res.json(ventas);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas" });
  }
});

/* =========================
   VENTAS POR USUARIO
========================= */
router.get("/por-usuario/:id", verificarToken, adminOSupervisor, async (req, res) => {
  try {

    const ventas = await Venta.find({ usuario: req.params.id })
      .populate("usuario", "nombre rol");

    res.json(ventas);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas por usuario" });
  }
});

export default router;