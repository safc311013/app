import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "../context/RealtimeContext";

function Cotizaciones() {
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [productoInput, setProductoInput] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [descuento, setDescuento] = useState("");
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  const productoRef = useRef(null);
  const cantidadRef = useRef(null);
  const descuentoRef = useRef(null);

  const token = localStorage.getItem("token");
  const realtimeVersion = useRealtimeVersion();

  useEffect(() => {
    obtenerInventario();
   }, [realtimeVersion]);

  const fetchConToken = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    return res;
  };

  const obtenerInventario = async () => {
    try {
      const res = await fetchConToken(`${API_URL}/productos`);
      if (!res.ok) throw new Error("Error al obtener inventario");
      const data = await res.json();
      setInventario(data.map(p => ({ ...p, stockDisponible: p.stock })));
    } catch (err) {
      setError(err.message);
    }
  };

  const filtrarSugerencias = (texto) => {
    const matches = inventario
      .filter(p =>
        p.nombre.toLowerCase().includes(texto.toLowerCase())
      )
      .map(p => p.nombre);

    setSugerencias(matches);
  };

  const agregarProducto = () => {
    setError("");

    const productoEncontrado = inventario.find(
      (p) => p.nombre.toLowerCase() === productoInput.toLowerCase()
    );

    if (!productoEncontrado) return setError("Producto no encontrado");

    const cantidadNum = Number(cantidad);
    const descuentoNum = Number(descuento) || 0;

    if (!cantidadNum || cantidadNum <= 0)
      return setError("Cantidad inválida");

    if (descuentoNum < 0)
      return setError("Descuento inválido");

    if (cantidadNum > productoEncontrado.stockDisponible)
      return setError(
        `No hay suficiente stock. Disponible: ${productoEncontrado.stockDisponible}`
      );

    const precioVenta = productoEncontrado.precioVenta || 0;
    const total =
      precioVenta * cantidadNum -
      (precioVenta * cantidadNum * descuentoNum) / 100;

    setProductos([
      ...productos,
      {
        nombre: productoEncontrado.nombre,
        precioVenta,
        cantidad: cantidadNum,
        descuento: descuentoNum,
        total,
      },
    ]);

    setInventario(
      inventario.map((p) =>
        p.nombre === productoEncontrado.nombre
          ? { ...p, stockDisponible: p.stockDisponible - cantidadNum }
          : p
      )
    );

    // 🔥 limpiar y volver al producto
    setProductoInput("");
    setCantidad("");
    setDescuento("");
    setSugerencias([]);

    setTimeout(() => {
      productoRef.current.focus();
    }, 100);
  };

  const eliminarProducto = (index) => {
    const producto = productos[index];

    setProductos(productos.filter((_, i) => i !== index));

    setInventario(
      inventario.map((p) =>
        p.nombre === producto.nombre
          ? { ...p, stockDisponible: p.stockDisponible + producto.cantidad }
          : p
      )
    );
  };

  const totalCotizacion = productos.reduce((acc, p) => acc + p.total, 0);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Cotización Hilos en Nogada", 105, 15, null, null, "center");

    const logoUrl = "http://localhost:5173/logo.png";
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, "PNG", 80, 20, 50, 20);

      autoTable(doc, {
        startY: 50,
        head: [["Producto", "Precio Venta", "Cantidad", "Descuento %", "Total"]],
        body: productos.map((p) => [
          p.nombre,
          `$${p.precioVenta.toFixed(2)}`,
          p.cantidad,
          `${p.descuento}%`,
          `$${p.total.toFixed(2)}`
        ]),
      });

      doc.text(
        `Total: $${totalCotizacion.toFixed(2)}`,
        150,
        doc.lastAutoTable.finalY + 10
      );

      doc.save("cotizacion.pdf");
    };
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Cotizaciones</h1>

      {error && (
        <p className="text-red-600 mb-4 font-semibold">{error}</p>
      )}

      <div className="flex gap-3 mb-6 flex-wrap relative">
        {/* PRODUCTO */}
        <input
          ref={productoRef}
          placeholder="Producto"
          value={productoInput}
          onChange={(e) => {
            setProductoInput(e.target.value);
            filtrarSugerencias(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              cantidadRef.current.focus();
            }
          }}
          className="border p-2 rounded w-64"
          autoFocus
        />

        {sugerencias.length > 0 && (
          <ul className="absolute bg-white border mt-1 max-h-40 overflow-y-auto w-64 z-10 rounded shadow">
            {sugerencias.map((s, idx) => (
              <li
                key={idx}
                className="p-2 cursor-pointer hover:bg-gray-200"
                onClick={() => {
                  setProductoInput(s);
                  setSugerencias([]);
                  cantidadRef.current.focus();
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        {/* CANTIDAD */}
        <input
          type="number"
          min="1"
          placeholder="Cantidad"
          ref={cantidadRef}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              descuentoRef.current.focus();
            }
          }}
          className="border p-2 rounded w-24"
        />

        {/* DESCUENTO */}
        <input
          type="number"
          min="0"
          placeholder="Descuento %"
          ref={descuentoRef}
          value={descuento}
          onChange={(e) => setDescuento(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarProducto();
            }
          }}
          className="border p-2 rounded w-24"
        />

        <button
          onClick={agregarProducto}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Agregar
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Producto</th>
            <th className="border p-2">Precio Venta</th>
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Descuento %</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, idx) => (
            <tr key={idx}>
              <td className="border p-2">{p.nombre}</td>
              <td className="border p-2">${p.precioVenta.toFixed(2)}</td>
              <td className="border p-2">{p.cantidad}</td>
              <td className="border p-2">{p.descuento}%</td>
              <td className="border p-2">${p.total.toFixed(2)}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => eliminarProducto(idx)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end items-center gap-4">
        <p className="font-bold text-lg">
          Total: ${totalCotizacion.toFixed(2)}
        </p>
        <button
          onClick={exportarPDF}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar a PDF
        </button>
      </div>
    </div>
  );
}

export default Cotizaciones;