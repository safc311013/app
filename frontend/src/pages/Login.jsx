import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

function Login({ setUsuario }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
       const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // 🔐 Guardar token
      localStorage.setItem("token", data.token);

      // 👤 Guardar usuario
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      // 🧠 Actualizar estado global
      if (typeof setUsuario === "function") {
        setUsuario(data.usuario);
      }

      // 🚀 Redirigir al dashboard
      navigate("/");

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-20 object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
          >
            Entrar
          </button>

        </form>

        {error && (
          <p className="mt-4 text-red-600 text-center text-sm">
            {error}
          </p>
        )}

      </div>
    </div>
  );
}

export default Login;