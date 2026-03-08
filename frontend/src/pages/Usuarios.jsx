import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { useRealtimeVersion } from "../context/RealtimeContext";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [loadingLista, setLoadingLista] = useState(true);
  const [cargaInicialCompleta, setCargaInicialCompleta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "cajero",
  });

  const navigate = useNavigate();
  const realtimeVersion = useRealtimeVersion();

  const usuarioLogueado = JSON.parse(localStorage.getItem("usuario") || "null");
  const token = localStorage.getItem("token");

  const fetchConToken = useCallback(
    async (url, options = {}) => {
      const tokenActual = localStorage.getItem("token");

      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenActual}`,
          ...(options.headers || {}),
        },
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate("/login");
        return null;
      }

      return res;
    },
    [navigate]
  );

  const obtenerUsuarios = useCallback(
    async ({ silencioso = false } = {}) => {
      try {
        if (!silencioso && !cargaInicialCompleta) {
          setLoadingLista(true);
        }

        setError("");

        const res = await fetchConToken(`${API_URL}/usuarios`);
        if (!res) return;

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Error al obtener usuarios");
        }

        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Error al cargar usuarios");
      } finally {
        setLoadingLista(false);
        setCargaInicialCompleta(true);
      }
    },
    [fetchConToken, cargaInicialCompleta]
  );

  useEffect(() => {
    if (!usuarioLogueado || !token) {
      navigate("/login");
      return;
    }

    obtenerUsuarios({ silencioso: cargaInicialCompleta });
  }, [navigate, obtenerUsuarios, realtimeVersion, usuarioLogueado, token, cargaInicialCompleta]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setEditId(null);
        setEditData({});
        setShowPassword(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const crearUsuario = async (e) => {
    e.preventDefault();
    setError("");

    if (!nuevo.nombre.trim() || !nuevo.email.trim() || !nuevo.password.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetchConToken(`${API_URL}/usuarios`, {
        method: "POST",
        body: JSON.stringify(nuevo),
      });

      if (!res) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear usuario");

      setNuevo({ nombre: "", email: "", password: "", rol: "cajero" });
      await obtenerUsuarios({ silencioso: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const actualizarUsuario = async (id) => {
    try {
      setSubmitting(true);

      const payload = { ...editData };
      if (!payload.password) delete payload.password;

      const res = await fetchConToken(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar usuario");

      setEditId(null);
      setEditData({});
      setShowPassword(false);
      await obtenerUsuarios({ silencioso: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;

    if (id === usuarioLogueado?._id) {
      setError("No puedes eliminar tu propio usuario.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetchConToken(`${API_URL}/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!res) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar usuario");

      await obtenerUsuarios({ silencioso: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Administrar Usuarios</h1>

      {error && <p className="text-red-600 mb-4 font-semibold">{error}</p>}

      <form onSubmit={crearUsuario} className="mb-8 flex gap-3 flex-wrap">
        <input
          placeholder="Nombre"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={nuevo.email}
          onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={nuevo.password}
          onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <select
          value={nuevo.rol}
          onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="cajero">Usuario</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-4 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {submitting ? "Procesando..." : "Crear"}
        </button>
      </form>

      {loadingLista && !cargaInicialCompleta && (
        <p className="text-gray-500 mb-4">Cargando usuarios...</p>
      )}

      {!loadingLista && usuarios.length === 0 && (
        <p className="text-gray-500 mb-4">No hay usuarios registrados.</p>
      )}

      <div className="space-y-3 min-h-[220px]">
        {usuarios.map((u) => {
          const isEditing = editId === u._id;
          const hasChanges =
            isEditing &&
            (editData.nombre !== u.nombre ||
              editData.email !== u.email ||
              editData.rol !== u.rol ||
              (editData.password && editData.password !== ""));

          return (
            <div
              key={u._id}
              className={`flex justify-between items-center border p-3 rounded transition-colors ${
                isEditing ? "bg-blue-50 border-blue-400" : "bg-white"
              }`}
            >
              <div className="flex gap-3 items-center">
                {isEditing ? (
                  <>
                    <input
                      className="border-2 border-blue-400 p-1 rounded w-32"
                      value={editData.nombre}
                      onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    />
                    <input
                      className="border-2 border-blue-400 p-1 rounded w-40"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="border-2 border-blue-400 p-1 rounded w-32"
                      value={editData.password || ""}
                      onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-2 py-1 text-sm border rounded bg-gray-100"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                    <select
                      className="border-2 border-blue-400 p-1 rounded"
                      value={editData.rol}
                      onChange={(e) => setEditData({ ...editData, rol: e.target.value })}
                    >
                      <option value="cajero">Usuario</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{u.nombre}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-sm font-medium ml-2">{u.rol}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {u._id !== usuarioLogueado?._id && (
                  <>
                    {isEditing ? (
                      <button
                        disabled={!hasChanges || submitting}
                        onClick={() => actualizarUsuario(u._id)}
                        className={`px-3 py-1 rounded text-white ${
                          hasChanges
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditId(u._id);
                          setEditData({
                            nombre: u.nombre,
                            email: u.email,
                            rol: u.rol,
                            password: "",
                          });
                          setShowPassword(false);
                        }}
                        className="px-1 py-1 text-yellow-500 hover:text-yellow-700 rounded transition"
                        style={{ background: "none" }}
                      >
                        ✏️
                      </button>
                    )}

                    <button
                      onClick={() => eliminarUsuario(u._id)}
                      disabled={submitting}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Usuarios;