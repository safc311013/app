import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProductosContext } from "../context/ProductosContext";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "../context/RealtimeContext";

export default function PuntoDeVenta() {
  const { productos, actualizarProducto } = useContext(ProductosContext);
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [usuario, setUsuario] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const realtimeVersion = useRealtimeVersion();

  const codigoRef = useRef(null);
  const cantidadRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!token) {
      navigate("/login");
    } else {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, [navigate]);


  useEffect(() => {
    setSugerencias([]);
    setCarrito((prev) =>
      prev.map((item) => {
        const productoActualizado = productos.find((p) => p._id === item._id);
        return productoActualizado
          ? { ...item, stock: productoActualizado.stock, precioVenta: productoActualizado.precioVenta }
          : item;
      })
    );
  }, [realtimeVersion, productos]);

  const filtrarSugerencias = (texto) => {
    if (!texto) {
      setSugerencias([]);
      return;
    }

    const matches = productos
      .filter(
        (p) =>
          p.codigo.toLowerCase().includes(texto.toLowerCase()) ||
          p.nombre.toLowerCase().includes(texto.toLowerCase())
      )
      .map((p) => p.codigo);

    setSugerencias(matches);
  };

  const agregarAlCarrito = () => {
    const producto = productos.find((p) => p.codigo === codigo.trim());
    if (!producto) return alert("Producto no encontrado");

    const cantidadNum = Number(cantidadProducto) || 1;

    if (cantidadNum <= 0) return alert("Cantidad inválida");
    if (cantidadNum > producto.stock)
      return alert(`Stock disponible: ${producto.stock}`);

    const existe = carrito.find((p) => p._id === producto._id);

    if (existe) {
      if (existe.cantidad + cantidadNum > producto.stock)
        return alert("No hay más stock disponible");

      setCarrito(
        carrito.map((p) =>
          p._id === producto._id
            ? { ...p, cantidad: p.cantidad + cantidadNum }
            : p
        )
      );
    } else {
      setCarrito([
        ...carrito,
        { ...producto, cantidad: cantidadNum, descuento: "" },
      ]);
    }

    setCodigo("");
    setCantidadProducto("");
    setSugerencias([]);

    setTimeout(() => {
      codigoRef.current.focus();
    }, 100);
  };

  const actualizarCantidad = (item, nuevaCantidad) => {
    if (nuevaCantidad < 1) nuevaCantidad = 1;
    if (nuevaCantidad > item.stock) nuevaCantidad = item.stock;

    setCarrito(
      carrito.map((p) =>
        p._id === item._id ? { ...p, cantidad: nuevaCantidad } : p
      )
    );
  };

  const total = carrito.reduce((acc, item) => {
    const d = Number(item.descuento) || 0;
    const subtotal =
      item.precioVenta * item.cantidad * (1 - d / 100);
    return acc + subtotal;
  }, 0);

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    const venta = {
      productos: carrito.map((item) => ({
        productoId: item._id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta,
        descuento: Number(item.descuento) || 0,
        subtotal:
          item.precioVenta *
          item.cantidad *
          (1 - (Number(item.descuento) || 0) / 100),
      })),
      total: Number(total),
      metodoPago,
    };

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(venta),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error al registrar venta");
        return;
      }

      const ventana = window.open("", "TICKET", "width=400,height=600");
      ventana.document.write(data.ticketHTML);
      ventana.document.close();

      carrito.forEach((item) => {
        actualizarProducto(item._id, {
          ...item,
          stock: item.stock - item.cantidad,
        });
      });

      setCarrito([]);
      alert("Venta registrada correctamente ✅");

      setTimeout(() => {
        codigoRef.current.focus();
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Error al registrar venta");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Punto de Venta</h2>

        {usuario && (
          <div className="text-right">
            <p className="text-sm">
              👤 {usuario.nombre} ({usuario.rol})
            </p>
            <button
              onClick={cerrarSesion}
              className="text-red-500 text-sm underline"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* INPUT PRODUCTO */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-6 flex gap-3 relative">
        <input
          type="text"
          placeholder="Escanea código o escribe nombre..."
          ref={codigoRef}
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value);
            filtrarSugerencias(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              cantidadRef.current.focus();
            }
          }}
          className="border p-3 rounded flex-1"
          autoFocus
        />

        <input
          type="number"
          min="1"
          placeholder="Cantidad"
          ref={cantidadRef}
          value={cantidadProducto}
          onChange={(e) => setCantidadProducto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarAlCarrito();
            }
          }}
          className="border p-3 rounded w-24 text-center"
        />

        <button
          onClick={agregarAlCarrito}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Agregar
        </button>

        {/* SUGERENCIAS */}
        {sugerencias.length > 0 && (
          <div className="absolute left-6 right-40 top-[70px] bg-white border rounded shadow z-20 max-h-40 overflow-y-auto">
            {sugerencias.map((s, i) => (
              <div
                key={i}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setCodigo(s);
                  setSugerencias([]);
                  setTimeout(() => cantidadRef.current.focus(), 50);
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARRITO */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Carrito</h3>

        {carrito.length === 0 && <p>No hay productos</p>}

        {carrito.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-center gap-3 mb-3"
          >
            <span className="flex-1">{item.nombre}</span>

            {/* CANTIDAD */}
            <div className="flex flex-col w-32">
              <label className="text-xs font-semibold mb-1">
                Cantidad
              </label>

              <div className="flex items-center border rounded overflow-hidden">
                <button
                  onClick={() =>
                    actualizarCantidad(item, item.cantidad - 1)
                  }
                  className="px-3 bg-gray-200 hover:bg-gray-300"
                >
                  -
                </button>

                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.cantidad}
                  onChange={(e) =>
                    actualizarCantidad(item, Number(e.target.value))
                  }
                  className="w-full text-center outline-none"
                />

                <button
                  onClick={() =>
                    actualizarCantidad(item, item.cantidad + 1)
                  }
                  className="px-3 bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* DESCUENTO */}
            <div className="flex flex-col w-28">
              <label className="text-xs font-semibold mb-1">
                Descuento %
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={item.descuento}
                onChange={(e) =>
                  setCarrito(
                    carrito.map((p) =>
                      p._id === item._id
                        ? { ...p, descuento: e.target.value }
                        : p
                    )
                  )
                }
                className="border p-1 rounded text-center"
              />
            </div>

            {/* SUBTOTAL */}
            <span className="w-28 text-right font-semibold text-green-600">
              $
              {(
                item.precioVenta *
                item.cantidad *
                (1 - (Number(item.descuento) || 0) / 100)
              ).toFixed(2)}
            </span>

            {/* ELIMINAR */}
            <button
              onClick={() =>
                setCarrito(carrito.filter((p) => p._id !== item._id))
              }
              className="text-red-500 hover:underline text-sm"
            >
              Quitar
            </button>
          </div>
        ))}

        <hr className="my-4" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Método de Pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="border p-2 rounded"
            >
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
              <option>Mixto</option>
            </select>
          </div>

          <h3 className="text-2xl font-bold">
            Total: <span className="text-green-600">${total.toFixed(2)}</span>
          </h3>
        </div>

        <button
          onClick={finalizarVenta}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 text-lg font-semibold"
        >
          Finalizar Venta
        </button>
      </div>
    </div>
  );
}