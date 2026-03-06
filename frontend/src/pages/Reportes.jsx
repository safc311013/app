import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API = "https://app-backend-s07g.onrender.com/api";

export default function Reportes() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalIngreso: 0,
    totalProductos: 0,
  });

  const formatearFecha = (fecha) => {
    const fechaFormateada = new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return fechaFormateada.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const generarReporte = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Selecciona ambas fechas");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Sesión expirada. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(
        `${API}/ventas/rango?inicio=${fechaInicio}&fin=${fechaFin}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 401) {
        alert("No autorizado. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Error al obtener datos");

      const data = await res.json();
      setVentas(data);

      let totalIngreso = 0;
      let totalProductos = 0;

      data.forEach((venta) => {
        totalIngreso += venta.total;
        venta.productos.forEach((p) => {
          totalProductos += p.cantidad;
        });
      });

      setResumen({
        totalVentas: data.length,
        totalIngreso,
        totalProductos,
      });

    } catch (error) {
      console.error(error);
      alert("Error generando reporte");
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas", 14, 15);
    doc.text(
      `Desde: ${formatearFecha(fechaInicio)}  Hasta: ${formatearFecha(fechaFin)}`,
      14,
      22
    );

    const tabla = ventas.map((v) => [
      `#${v.numeroTicket}`,
      formatearFecha(v.createdAt),
      v.metodoPago,
      v.productos.reduce((acc, p) => acc + p.cantidad, 0),
      `$${v.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Ticket", "Fecha", "Método Pago", "Unidades", "Total"]],
      body: tabla,
    });

    doc.save("reporte_ventas.pdf");
  };

  const exportarExcel = () => {
    const datos = ventas.map((v) => ({
      Ticket: v.numeroTicket,
      Fecha: formatearFecha(v.createdAt),
      MetodoPago: v.metodoPago,
      Unidades: v.productos.reduce((acc, p) => acc + p.cantidad, 0),
      Total: v.total,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "reporte_ventas.xlsx");
  };

  const verTicket = (ticketHTML) => {
    const ventana = window.open("", "TICKET", "width=400,height=600");
    ventana.document.write(ticketHTML);
    ventana.document.close();
    ventana.focus();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Reportes</h2>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-500">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={generarReporte}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Generar Reporte
        </button>
      </div>

      {ventas.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-gray-500">Ventas</p>
              <p className="text-xl font-bold">{resumen.totalVentas}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-gray-500">Ingreso Total</p>
              <p className="text-xl font-bold text-green-600">
                ${resumen.totalIngreso.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-gray-500">Productos Vendidos</p>
              <p className="text-xl font-bold">{resumen.totalProductos}</p>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={exportarPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Exportar PDF
            </button>

            <button
              onClick={exportarExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Exportar Excel
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th>Ticket</th>
                  <th>Fecha</th>
                  <th>Método Pago</th>
                  <th>Unidades</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v._id} className="border-b">
                    <td className="font-bold">#{v.numeroTicket}</td>
                    <td>{formatearFecha(v.createdAt)}</td>
                    <td>{v.metodoPago}</td>
                    <td>{v.productos.reduce((acc, p) => acc + p.cantidad, 0)}</td>
                    <td className="font-bold text-green-600">
                      ${v.total.toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => verTicket(v.ticketHTML)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}