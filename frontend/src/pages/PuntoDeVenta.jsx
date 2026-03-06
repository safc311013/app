import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProductosContext } from "../context/ProductosContext";

export default function PuntoDeVenta() {
  const { productos, actualizarProducto } = useContext(ProductosContext);
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [usuario, setUsuario] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);

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

      const res = await fetch("http://localhost:5000/api/ventas", {
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
                    actualizarCantidad(
                      item,
                      Number(e.target.value)
                    )
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
                Descuento (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={item.descuento}
                placeholder="%"
                onChange={(e) => {
                  let valor = e.target.value;

                  if (valor === "") {
                    setCarrito(
                      carrito.map((p) =>
                        p._id === item._id
                          ? { ...p, descuento: "" }
                          : p
                      )
                    );
                    return;
                  }

                  valor = Number(valor);
                  if (valor < 0) valor = 0;
                  if (valor > 100) valor = 100;

                  setCarrito(
                    carrito.map((p) =>
                      p._id === item._id
                        ? { ...p, descuento: valor }
                        : p
                    )
                  );
                }}
                className="border p-1 rounded text-center"
              />
            </div>

            <span className="font-semibold">
              $
              {(
                item.precioVenta *
                item.cantidad *
                (1 - (Number(item.descuento) || 0) / 100)
              ).toFixed(2)}
            </span>

            <button
              onClick={() =>
                setCarrito(
                  carrito.filter((p) => p._id !== item._id)
                )
              }
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              X
            </button>
          </div>
        ))}

        <hr className="my-4" />

        <div className="flex justify-between font-bold text-xl">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-semibold">
            Método de Pago
          </label>

          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>

        <button
          onClick={finalizarVenta}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          Finalizar Venta
        </button>
      </div>
    </div>
  );
}