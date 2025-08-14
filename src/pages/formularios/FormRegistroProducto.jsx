import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { supabase } from "../../tools/supabaseConnect";

function FormRegistroProducto() {
    const { register, handleSubmit, reset } = useForm();
    const [mensaje, setMensaje] = useState("");
    const [categorias, setCategorias] = useState([]);

    // Cargar categorías al montar el componente
    useEffect(() => {
        const fetchCategorias = async () => {
            const { data, error } = await supabase
                .from("categorias")
                .select("id, nombre")
                .order("nombre", { ascending: true });

            if (error) {
                console.error("Error cargando categorías:", error);
            } else {
                setCategorias(data);
            }
        };

        fetchCategorias();
    }, []);

    const onSubmit = async (data) => {
        const payload = {
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            categoria_id: data.categoria_id ? parseInt(data.categoria_id) : null,
        };

        const { error } = await supabase.from("productos").insert([payload]);

        if (error) {
            setMensaje("❌ Error: " + error.message);
        } else {
            setMensaje("✅ Producto guardado con éxito");
            reset();
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Registro de Producto</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <input
                        placeholder="Nombre del producto"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register("nombre", { required: true })}
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Descripción"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        {...register("descripcion")}
                    />
                </div>

                <div>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register("categoria_id", { required: true })}
                    >
                        <option value="">-- Seleccionar categoría --</option>
                        {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Guardar
                </button>
            </form>

            {mensaje && (
                <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">{mensaje}</p>
                </div>
            )}
        </div>
    );
}

export default FormRegistroProducto;