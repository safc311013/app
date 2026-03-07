import { createContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "./RealtimeContext";

export const ProductosContext = createContext();

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const realtimeVersion = useRealtimeVersion();

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/productos`);
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [realtimeVersion]);

  const agregarProducto = async (nuevoProducto) => {
    try {
      const res = await fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });

      if (!res.ok) throw new Error("Error al agregar producto");
    } catch (error) {
      console.error(error);
    }
  };

  const actualizarProducto = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Error al actualizar producto");
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarProducto = async (id) => {
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar producto");

      setProductos((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ProductosContext.Provider
      value={{
        productos,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}