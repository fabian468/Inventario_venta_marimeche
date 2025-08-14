import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../tools/supabaseConnect"; // Ajusta la ruta según tu proyecto

function FormEntradaProducto() {
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const { register, handleSubmit, reset } = useForm();

    // Cargar productos
    useEffect(() => {
        const fetchProductos = async () => {
            const { data, error } = await supabase
                .from("productos")
                .select("id, nombre")
                .order("nombre", { ascending: true });

            if (error) console.error("Error cargando productos:", error);
            else setProductos(data);
        };
        fetchProductos();
    }, []);

    // Cargar proveedores
    useEffect(() => {
        const fetchProveedores = async () => {
            const { data, error } = await supabase
                .from("proveedores")
                .select("id, nombre")
                .order("nombre", { ascending: true });

            if (error) console.error("Error cargando proveedores:", error);
            else setProveedores(data);
        };
        fetchProveedores();
    }, []);

    // Enviar formulario
    const onSubmit = async (data) => {
        const { error } = await supabase.from("entradas_inventario").insert([data]);

        if (error) {
            setMensaje("❌ Error: " + error.message);
        } else {
            setMensaje("✅ Entrada registrada correctamente");
            reset(); // Limpia el formulario
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Entrada de Mercadería</h2>
            <div className="space-y-4">
                <div>
                    <select
                        {...register("producto_id", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Seleccionar producto --</option>
                        {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        {...register("proveedor_id")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Seleccionar proveedor --</option>
                        {proveedores.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                                {prov.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <input
                        type="number"
                        step="0.001"
                        placeholder="Cantidad (kg)"
                        {...register("cantidad", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Precio Unitario ($)"
                        {...register("precio_unitario", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Observaciones"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        {...register("observaciones")}
                    />
                </div>

                <button
                    onClick={handleSubmit(onSubmit)}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Guardar Entrada
                </button>
            </div>

            {mensaje && (
                <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">{mensaje}</p>
                </div>
            )}
        </div>
    );
}

export default FormEntradaProducto;