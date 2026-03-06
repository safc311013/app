import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductosContext } from "../context/ProductosContext";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "../context/RealtimeContext";

export default function Dashboard() {
  const { productos } = useContext(ProductosContext);
  const navigate = useNavigate();
    const realtimeVersion = useRealtimeVersion();

  const [ventasHoy, setVentasHoy] = useState([]);
  const [ingresoHoy, setIngresoHoy] = useState(0);

  const totalProductos = productos.length;

  const stockBajoCount = productos.filter(
    (p) => Number(p.stock) <= 3
  ).length;

  const utilidadTotal = productos.reduce(
    (sum, p) =>
      sum +
      (Number(p.utilidad) || 0) *
      (Number(p.stock) || 0),
    0
  );

  const artesanosActivos = [
    ...new Set(productos.map((p) => p.artesano).filter(Boolean)),
  ].length;

  /* =========================
     FETCH CON TOKEN
  ========================= */
  const fetchConToken = async (url) => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return null;
    }

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
      return null;
    }

    return res;
  };

  /* =========================
     OBTENER VENTAS DE HOY
  ========================= */
  const obtenerVentasHoy = async () => {
    try {
      const res = await fetchConToken(
        `${API_URL}/ventas/hoy`
      );

      if (!res) return;

      const data = await res.json();
      setVentasHoy(data);

      const total = data.reduce(
        (sum, venta) => sum + (Number(venta.total) || 0),
        0
      );

      setIngresoHoy(total);

    } catch (error) {
      console.error("Error al cargar ventas del día", error);
    }
  };

  useEffect(() => {
    obtenerVentasHoy();
  }, [realtimeVersion]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Productos Totales</h3>
          <p className="text-2xl font-bold mt-2">{totalProductos}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Stock Bajo</h3>
          <p className="text-2xl font-bold mt-2 text-red-600">
            {stockBajoCount}
          </p>

          <button
            onClick={() =>
              navigate("/inventario", {
                state: { filtro: "stockBajo" },
              })
            }
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Ver Productos
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Artesanos Activos</h3>
          <p className="text-2xl font-bold mt-2">
            {artesanosActivos}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Ventas Hoy</h3>
          <p className="text-2xl font-bold mt-2">
            {ventasHoy.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Ingreso Hoy</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">
            ${ingresoHoy.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-gray-500">Utilidad Potencial</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">
            ${utilidadTotal.toFixed(2)}
          </p>
        </div>

      </div>
    </div>
  );
}