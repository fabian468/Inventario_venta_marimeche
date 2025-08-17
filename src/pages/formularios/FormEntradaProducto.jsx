import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../tools/supabaseConnect";

function FormEntradaProducto() {
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const { register, handleSubmit, reset, watch, setValue } = useForm();

    const tipoCantidad = watch("tipo_cantidad"); // "kg" o "bolsitas"
    const numBolsitas = watch("num_bolsitas");
    const pesoBolsa = watch("peso_bolsa");

    // Calcular cantidad en kg si es por bolsitas
    useEffect(() => {
        if (tipoCantidad === "bolsitas" && numBolsitas && pesoBolsa) {
            const totalKg = parseFloat(numBolsitas) * parseFloat(pesoBolsa);
            setValue("cantidad", totalKg);
        }
    }, [tipoCantidad, numBolsitas, pesoBolsa, setValue]);

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
    // Enviar formulario
    const onSubmit = async (data) => {
        // Extraer solo lo que la tabla necesita
        const datosLimpios = {
            producto_id: data.producto_id,
            proveedor_id: data.proveedor_id || null,
            cantidad: data.cantidad, // siempre en kg
            precio_unitario: data.precio_unitario,
            observaciones: data.observaciones || null,
        };

        const { error } = await supabase.from("entradas_inventario").insert([datosLimpios]);

        if (error) {
            setMensaje("❌ Error: " + error.message);
        } else {
            setMensaje("✅ Entrada registrada correctamente");
            reset();
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

                {/* Selector tipo de cantidad */}
                <div>
                    <select
                        {...register("tipo_cantidad", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Tipo de cantidad --</option>
                        <option value="kg">Kilogramos</option>
                        <option value="bolsitas">Bolsitas</option>
                    </select>
                </div>

                {/* Si selecciona bolsitas */}
                {tipoCantidad === "bolsitas" && (
                    <>
                        <div>
                            <input
                                type="number"
                                placeholder="Número de bolsitas"
                                {...register("num_bolsitas", { required: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                step="0.001"
                                placeholder="Peso por bolsita (kg)"
                                {...register("peso_bolsa", { required: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </>
                )}

                {/* Campo de cantidad en kg (calculado si son bolsitas) */}
                <div>
                    <input
                        type="number"
                        step="0.001"
                        placeholder="Cantidad (kg) ej. 0.01 para 10 gramos"
                        {...register("cantidad", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly={tipoCantidad === "bolsitas"} // Bloqueado si es por bolsitas
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
