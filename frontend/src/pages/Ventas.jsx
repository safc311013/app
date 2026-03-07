import { useEffect, useState } from "react";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,
  FaQuestionCircle,
  FaSearch,
  FaReceipt,
  FaEye,
  FaTimes,
  FaCalendarAlt,
  FaFilter
} from "react-icons/fa";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "../context/RealtimeContext";

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const token = localStorage.getItem("token");
  const realtimeVersion = useRealtimeVersion();

  useEffect(() => {
    obtenerVentas();
  }, [realtimeVersion]);

  /* CERRAR MODAL CON ESC */
  useEffect(() => {
    const cerrarConEsc = (e) => {
      if (e.key === "Escape") {
        setTicketSeleccionado(null);
      }
    };

    window.addEventListener("keydown", cerrarConEsc);

    return () => {
      window.removeEventListener("keydown", cerrarConEsc);
    };
  }, []);

  const obtenerVentas = async () => {
    try {
      const res = await fetch(`${API_URL}/ventas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setVentas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const buscarPorTicket = async () => {
    if (!busqueda) return;

    try {
      const res = await fetch(
        `${API_URL}/ventas/ticket/${busqueda}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        alert("Venta no encontrada");
        return;
      }

      const data = await res.json();
      setTicketSeleccionado(data);
    } catch (error) {
      console.error(error);
    }
  };

  const filtrarPorFecha = async () => {
    try {
      let url = `${API_URL}/ventas`;

      if (fechaInicio && fechaFin) {
        url += `?inicio=${fechaInicio}&fin=${fechaFin}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setVentas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const limpiarFiltro = () => {
    setFechaInicio("");
    setFechaFin("");
    obtenerVentas();
  };

  const abrirTicket = async (numeroTicket) => {
    try {
      const res = await fetch(
        `${API_URL}/ventas/ticket/${numeroTicket}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setTicketSeleccionado(data);
    } catch (error) {
      console.error(error);
    }
  };

  const manejarEnter = (e) => {
    if (e.key === "Enter") {
      buscarPorTicket();
    }
  };

  const iconoPago = (metodo) => {
    switch (metodo) {
      case "Efectivo":
        return <FaMoneyBillWave className="text-green-600" />;
      case "Tarjeta":
        return <FaCreditCard className="text-blue-600" />;
      case "Transferencia":
        return <FaUniversity className="text-purple-600" />;
      default:
        return <FaQuestionCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* TITULO */}
      <div className="flex items-center gap-3">
        <FaReceipt className="text-3xl text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-800">
          Ventas
        </h2>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-5 rounded-2xl shadow-md flex gap-3 items-center">
        <FaSearch className="text-gray-400" />

        <input
          type="number"
          placeholder="Buscar por número de ticket..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={manejarEnter}
          className="border p-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={buscarPorTicket}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </div>

      {/* FILTRO FECHA */}
      <div className="bg-white p-5 rounded-2xl shadow-md flex flex-wrap items-center gap-3">

        <FaCalendarAlt className="text-gray-500" />

        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border p-2 rounded-lg"
        />

        <span className="text-gray-500">a</span>

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border p-2 rounded-lg"
        />

        <button
          onClick={filtrarPorFecha}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <FaFilter />
          Filtrar
        </button>

        <button
          onClick={limpiarFiltro}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Limpiar
        </button>

      </div>

      {/* LISTA */}
      <div className="bg-white p-6 rounded-2xl shadow-md">

        <h3 className="text-xl font-semibold mb-6 text-gray-700">
          Todas las Ventas
        </h3>

        {ventas.length === 0 && (
          <p className="text-gray-500">
            No hay ventas registradas
          </p>
        )}

        <div className="grid grid-cols-5 text-sm font-semibold text-gray-500 border-b pb-2 mb-3">
          <span>Ticket</span>
          <span>Fecha</span>
          <span>Método</span>
          <span className="text-right">Total</span>
          <span className="text-right">Acción</span>
        </div>

        <div className="space-y-2">

          {ventas.map((venta) => (
            <div
              key={venta._id}
              className="grid grid-cols-5 items-center bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition"
            >

              <span className="font-semibold text-gray-700">
                #{venta.numeroTicket}
              </span>

              <span className="text-sm text-gray-500">
                {new Date(venta.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                {iconoPago(venta.metodoPago)}
                {venta.metodoPago}
              </div>

              <span className="font-bold text-green-600 text-right">
                ${venta.total}
              </span>

              <div className="flex justify-end">
                <button
                  onClick={() => abrirTicket(venta.numeroTicket)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <FaEye />
                  Ver
                </button>
              </div>

            </div>
          ))}

        </div>
      </div>

      {/* MODAL */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-5">

              <h3 className="text-xl font-bold text-gray-800">
                Ticket #{ticketSeleccionado.numeroTicket}
              </h3>

              <button
                onClick={() => setTicketSeleccionado(null)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                <FaTimes />
              </button>

            </div>

            {/* INFO TICKET */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">

              <div>
                <p className="text-gray-500">Fecha</p>
                <p>
                  {new Date(ticketSeleccionado.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Cajero</p>
                <p>{ticketSeleccionado.usuario?.nombre}</p>
              </div>

              <div>
                <p className="text-gray-500">Método de pago</p>
                <div className="flex items-center gap-2">
                  {iconoPago(ticketSeleccionado.metodoPago)}
                  {ticketSeleccionado.metodoPago}
                </div>
              </div>

              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-bold text-green-600">
                  ${ticketSeleccionado.total}
                </p>
              </div>

            </div>

            {/* PRODUCTOS */}
            <h4 className="font-semibold mb-3 text-gray-700">
              Productos vendidos
            </h4>

            <div className="space-y-2">

              {ticketSeleccionado.productos?.map((prod, index) => (
                <div
                  key={index}
                  className="flex justify-between bg-gray-50 p-3 rounded-lg"
                >

                  <div>
                    <p className="font-medium">
                      {prod.nombre}
                    </p>

                    <p className="text-sm text-gray-500">
                      Cantidad: {prod.cantidad}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-sm">
                      ${prod.precioUnitario}
                    </p>

                    <p className="font-semibold text-green-600">
                      ${prod.subtotal}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}