import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Artesanos from "./pages/Artesanos";
import POS from "./pages/PuntoDeVenta";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Cotizaciones from "./pages/Cotizaciones";
import Ventas from "./pages/Ventas";

import { ProductosProvider } from "./context/ProductosContext";

/* =========================
   🔐 PROTECCIÓN GENERAL
========================= */
function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

/* =========================
   🔐 PROTECCIÓN POR ROLES
========================= */
function RutaPorRol({ children, rolesPermitidos }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !rolesPermitidos.includes(usuario.rol?.toLowerCase())) {
    return <Navigate to="/pos" />;
  }
  return children;
}

/* =========================
   🏗 LAYOUT PRINCIPAL
========================= */
function Layout({ setUsuario }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  const menuConfig = {
    admin: [
      { nombre: "Dashboard", ruta: "/" },
      { nombre: "Inventario", ruta: "/inventario" },
      { nombre: "Artesanos", ruta: "/artesanos" },
      { nombre: "Punto de Venta", ruta: "/pos" },
      { nombre: "Ventas", ruta: "/ventas" },
      { nombre: "Reportes", ruta: "/reportes" },
      { nombre: "Usuarios", ruta: "/usuarios" },
      { nombre: "Cotizaciones", ruta: "/cotizaciones" },
    ],
    supervisor: [
      { nombre: "Dashboard", ruta: "/" },
      { nombre: "Inventario", ruta: "/inventario" },
      { nombre: "Artesanos", ruta: "/artesanos" },
      { nombre: "Punto de Venta", ruta: "/pos" },
      { nombre: "Ventas", ruta: "/ventas" },
      { nombre: "Reportes", ruta: "/reportes" },
      { nombre: "Cotizaciones", ruta: "/cotizaciones" },
    ],
    cajero: [
      { nombre: "Punto de Venta", ruta: "/pos" },
      { nombre: "Cotizaciones", ruta: "/cotizaciones" },
    ],
  };

  const menuItems = menuConfig[usuario?.rol?.toLowerCase()] || [];

  return (
    <div className="h-screen bg-gray-100">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 text-white p-6 flex flex-col shadow-xl">
        
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-20 object-contain" />
        </div>

        {usuario && (
          <div className="mb-6 text-sm text-gray-300 text-center border-b border-gray-700 pb-4">
            👤 {usuario.nombre}
            <br />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {usuario.rol}
            </span>
          </div>
        )}

        <nav className="space-y-2 flex-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.ruta}
              end={item.ruta === "/"}
              className={({ isActive }) =>
                `relative block px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-blue-400 rounded-r-lg"></span>
                  )}
                  <span className="ml-2">{item.nombre}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={cerrarSesion}
          className="mt-6 w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO */}
      <main className="ml-64 h-screen overflow-y-auto p-10">
        <Routes>
          <Route
            path="/"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor"]}>
                <Dashboard />
              </RutaPorRol>
            }
          />

          <Route
            path="/inventario"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor"]}>
                <Inventario />
              </RutaPorRol>
            }
          />

          <Route
            path="/artesanos"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor"]}>
                <Artesanos />
              </RutaPorRol>
            }
          />

          <Route
            path="/pos"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor", "cajero"]}>
                <POS />
              </RutaPorRol>
            }
          />

          <Route
            path="/ventas"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor"]}>
                <Ventas />
              </RutaPorRol>
            }
          />

          <Route
            path="/reportes"
            element={
              <RutaPorRol rolesPermitidos={["admin", "supervisor"]}>
                <Reportes />
              </RutaPorRol>
            }
          />

          <Route
            path="/usuarios"
            element={
              <RutaPorRol rolesPermitidos={["admin"]}>
                <Usuarios />
              </RutaPorRol>
            }
          />

          <Route
            path="/cotizaciones"
            element={<Cotizaciones />}
          />
        </Routes>
      </main>
    </div>
  );
}

/* =========================
   🚀 APP PRINCIPAL
========================= */
function App() {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario")) || null
  );

  return (
    <ProductosProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login setUsuario={setUsuario} />} />

          <Route
            path="/*"
            element={
              <RutaProtegida>
                <Layout setUsuario={setUsuario} />
              </RutaProtegida>
            }
          />
        </Routes>
      </Router>
    </ProductosProvider>
  );
}

export default App;