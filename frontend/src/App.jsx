import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Download } from "lucide-react";

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
import { RealtimeProvider, useRealtimeStatus } from "./context/RealtimeContext";

function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function RutaPorRol({ children, rolesPermitidos }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !rolesPermitidos.includes(usuario.rol?.toLowerCase())) {
    return <Navigate to="/pos" replace />;
  }
  return children;
}

function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const instalar = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={instalar}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
    >
      <Download size={16} /> Instalar app
    </button>
  );
}

function RealtimeIndicator() {
  const connected = useRealtimeStatus();

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        connected ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {connected ? "Tiempo real activo" : "Reconectando..."}
    </span>
  );
}

function Layout({ setUsuario }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [menuAbierto, setMenuAbierto] = useState(false);

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
    <div className="min-h-screen bg-gray-100">
      <header className="md:hidden sticky top-0 z-30 bg-gray-900 text-white px-4 py-3 flex justify-between items-center gap-2">
        <button onClick={() => setMenuAbierto((prev) => !prev)} className="p-2 rounded-lg bg-gray-800">
          {menuAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
        <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
        <div className="flex items-center gap-2">
          <RealtimeIndicator />
          <InstallPwaButton />
        </div>
      </header>

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="md:hidden fixed inset-0 z-10 bg-black/40"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-20 w-64 h-screen bg-gray-900 text-white p-6 flex flex-col shadow-xl transition-transform duration-200 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-20 object-contain" />
        </div>

        {usuario && (
          <div className="mb-6 text-sm text-gray-300 text-center border-b border-gray-700 pb-4">
            👤 {usuario.nombre}
            <br />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{usuario.rol}</span>
          </div>
        )}

        <nav className="space-y-2 flex-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.ruta}
              end={item.ruta === "/"}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `relative block px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-0 h-full w-1 bg-blue-400 rounded-r-lg"></span>}
                  <span className="ml-2">{item.nombre}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3">
          <div className="hidden md:flex md:items-center md:justify-between md:gap-2">
            <RealtimeIndicator />
            <InstallPwaButton />
          </div>
          <button
            onClick={cerrarSesion}
            className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="md:ml-64 min-h-screen overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem("usuario")) || null);

  return (
    <RealtimeProvider>
      <ProductosProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login setUsuario={setUsuario} />} />

            <Route
              element={
                <RutaProtegida>
                  <Layout setUsuario={setUsuario} />
                </RutaProtegida>
              }
            >
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
              <Route path="/cotizaciones" element={<Cotizaciones />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ProductosProvider>
    </RealtimeProvider>
  );
}

export default App;