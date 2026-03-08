import { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Trash2, Save } from "lucide-react";
import { ProductosContext } from "../context/ProductosContext";
import { useRealtimeVersion } from "../context/RealtimeContext";

export default function Inventario() {
  const { productos, agregarProducto, actualizarProducto, eliminarProducto } =
    useContext(ProductosContext);

  const location = useLocation();
  const filtroStockBajoInicial = location.state?.filtro === "stockBajo";

  const [filtroStockBajo, setFiltroStockBajo] = useState(filtroStockBajoInicial);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    categoria: "",
    artesano: "",
    precioVenta: "",
    precioArtesano: "",
    stock: "",
  });

  const [busqueda, setBusqueda] = useState("");
  const [editados, setEditados] = useState({});
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const realtimeVersion = useRealtimeVersion();

  useEffect(() => {
    setEditados({});
    setProductoAEliminar(null);
  }, [realtimeVersion]);

  const categoriasUnicas = [
    "todas",
    ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setForm({
      ...form,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const codigoExiste = productos.some((p) => p.codigo === form.codigo);

    if (codigoExiste) {
      alert("⚠️ Este código de barras ya existe.");
      return;
    }

    const utilidad =
      parseFloat(form.precioVenta || 0) -
      parseFloat(form.precioArtesano || 0);

    await agregarProducto({ ...form, utilidad });

    setForm({
      nombre: "",
      codigo: "",
      categoria: "",
      artesano: "",
      precioVenta: "",
      precioArtesano: "",
      stock: "",
    });
  };

  const handleInlineChange = (id, field, value) => {
    setEditados((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Escape") {
      setEditados((prev) => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
    }

    if (e.key === "Enter") {
      e.preventDefault();
      guardarCambios(id);
    }
  };

  const guardarCambios = async (id) => {
    const productoOriginal = productos.find((p) => p._id === id);
    const cambios = editados[id];

    if (!cambios) return;

    if (cambios.codigo) {
      const codigoExiste = productos.some(
        (p) => p.codigo === cambios.codigo && p._id !== id
      );

      if (codigoExiste) {
        alert("⚠️ Este código de barras ya existe.");
        return;
      }
    }

    const actualizado = { ...productoOriginal, ...cambios };

    actualizado.utilidad =
      parseFloat(actualizado.precioVenta || 0) -
      parseFloat(actualizado.precioArtesano || 0);

    await actualizarProducto(id, actualizado);

    setEditados((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  };

  const productosFiltrados = productos
    .filter(
      (p) =>
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo?.includes(busqueda)
    )
    .filter((p) => (filtroStockBajo ? Number(p.stock) <= 3 : true))
    .filter((p) =>
      categoriaFiltro === "todas" ? true : p.categoria === categoriaFiltro
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inventario</h2>
          <p className="text-gray-500 text-sm">
            Gestión y control de productos
          </p>
        </div>

        <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow w-fit">
          Total: {productos.length} productos
        </div>
      </div>

      {filtroStockBajo && (
        <div className="mb-6 flex items-center justify-between bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
          <span>Mostrando solo productos con stock bajo</span>
          <button
            onClick={() => setFiltroStockBajo(false)}
            className="text-sm font-semibold hover:underline"
          >
            Quitar filtro
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10 grid md:grid-cols-4 gap-5"
      >
        {["nombre", "codigo", "categoria", "artesano"].map((campo) => (
          <input
            key={campo}
            name={campo}
            value={form[campo]}
            onChange={handleChange}
            placeholder={campo}
            className="border border-gray-200 p-2.5 rounded-xl outline-none"
            required={campo === "nombre" || campo === "codigo"}
          />
        ))}

        <input
          name="precioVenta"
          type="number"
          value={form.precioVenta}
          onChange={handleChange}
          placeholder="Precio venta"
          className="border border-gray-200 p-2.5 rounded-xl outline-none"
        />
        <input
          name="precioArtesano"
          type="number"
          value={form.precioArtesano}
          onChange={handleChange}
          placeholder="Precio artesano"
          className="border border-gray-200 p-2.5 rounded-xl outline-none"
        />
        <input
          name="stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock"
          className="border border-gray-200 p-2.5 rounded-xl outline-none"
        />

        <button className="md:col-span-4 bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition font-semibold shadow">
          Agregar Producto
        </button>
      </form>

      <input
        type="text"
        placeholder="Buscar por nombre o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-6 border border-gray-200 p-3 rounded-xl w-full outline-none shadow-sm"
      />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-4">Código</th>

                <th className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span>Categoría</span>
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      {categoriasUnicas.map((cat, i) => (
                        <option key={i} value={cat}>
                          {cat === "todas" ? "Todas" : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>

                <th className="px-4 py-4">Nombre</th>
                <th className="px-4 py-4">Artesano $</th>
                <th className="px-4 py-4">Venta</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Artesano</th>
                <th className="px-4 py-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.map((p) => {
                const datosEditados = editados[p._id] || {};
                const productoMostrado = { ...p, ...datosEditados };
                const stockBajo = Number(productoMostrado.stock) <= 3;

                return (
                  <tr
                    key={p._id}
                    className={`border-t hover:bg-gray-50 transition ${
                      stockBajo ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        value={productoMostrado.codigo}
                        onChange={(e) =>
                          handleInlineChange(p._id, "codigo", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={productoMostrado.categoria || ""}
                        onChange={(e) =>
                          handleInlineChange(p._id, "categoria", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={productoMostrado.nombre}
                        onChange={(e) =>
                          handleInlineChange(p._id, "nombre", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={productoMostrado.precioArtesano}
                        onChange={(e) =>
                          handleInlineChange(
                            p._id,
                            "precioArtesano",
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={productoMostrado.precioVenta}
                        onChange={(e) =>
                          handleInlineChange(
                            p._id,
                            "precioVenta",
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={productoMostrado.stock}
                        onChange={(e) =>
                          handleInlineChange(
                            p._id,
                            "stock",
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className={`w-full bg-transparent outline-none font-semibold ${
                          stockBajo ? "text-red-600" : ""
                        }`}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        value={productoMostrado.artesano || ""}
                        onChange={(e) =>
                          handleInlineChange(p._id, "artesano", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, p._id)}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarCambios(p._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                        >
                          <Save size={14} /> Guardar
                        </button>

                        <button
                          onClick={() => setProductoAEliminar(p._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {productosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No se encontraron productos con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productoAEliminar && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm">
            <h3 className="text-lg font-bold mb-2">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductoAEliminar(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await eliminarProducto(productoAEliminar);
                  setProductoAEliminar(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}