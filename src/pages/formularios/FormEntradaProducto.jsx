import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../tools/supabaseConnect"; // Ajusta la ruta según tu proyecto

function FormEntradaProducto() {
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
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
            console.error("Error guardando entrada:", error);
        } else {
            alert("Entrada registrada correctamente");
            reset(); // Limpia el formulario
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-lg mx-auto bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Entrada de Mercadería</h2>

            <label className="block mb-2">Producto:</label>
            <select
                {...register("producto_id", { required: true })}
                className="w-full border p-2 mb-4"
            >
                <option value="">Seleccione un producto</option>
                {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.nombre}
                    </option>
                ))}
            </select>

            <label className="block mb-2">Proveedor:</label>
            <select
                {...register("proveedor_id")}
                className="w-full border p-2 mb-4"
            >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                    </option>
                ))}
            </select>

            <label className="block mb-2">Cantidad (kg):</label>
            <input
                type="number"
                step="0.001"
                {...register("cantidad", { required: true })}
                className="w-full border p-2 mb-4"
            />

            <label className="block mb-2">Precio Unitario ($):</label>
            <input
                type="number"
                step="0.01"
                {...register("precio_unitario", { required: true })}
                className="w-full border p-2 mb-4"
            />

            <label className="block mb-2">Observaciones:</label>
            <textarea
                {...register("observaciones")}
                className="w-full border p-2 mb-4"
            />

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Guardar Entrada
            </button>
        </form>
    );
}

export default FormEntradaProducto;
