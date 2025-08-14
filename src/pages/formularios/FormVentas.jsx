import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "../../tools/supabaseConnect";

function FormVentas() {
    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            cliente_nombre: "",
            items: [{ producto_id: "", cantidad: 1, precio_unitario: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const [productos, setProductos] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const fetchProductos = async () => {
            const { data, error } = await supabase
                .from("productos")
                .select("id, nombre, stock_actual")
                .order("nombre", { ascending: true });
            if (!error) setProductos(data);
        };
        fetchProductos();
    }, []);

    const items = watch("items");

    const calcularSubtotal = (index) => {
        const cantidad = parseFloat(items[index]?.cantidad) || 0;
        const precio = parseFloat(items[index]?.precio_unitario) || 0;
        return cantidad * precio;
    };

    const totalVenta = items.reduce(
        (acc, _, idx) => acc + calcularSubtotal(idx),
        0
    ).toFixed(2);

    const onSubmit = async (data) => {
        if (data.items.length === 0) {
            setMensaje("Agrega al menos un producto a la venta");
            return;
        }
        if (totalVenta <= 0) {
            setMensaje("El total de la venta debe ser mayor a 0");
            return;
        }

        // Insertar venta
        const { data: ventaInsertada, error: errorVenta } = await supabase
            .from("ventas")
            .insert([{
                cliente_nombre: data.cliente_nombre,
                total: parseFloat(totalVenta),
            }])
            .select()
            .single();

        if (errorVenta) {
            setMensaje("Error al guardar la venta: " + errorVenta.message);
            return;
        }

        // Insertar detalles de venta
        const detalles = data.items.map((item) => ({
            venta_id: ventaInsertada.id,
            producto_id: parseInt(item.producto_id),
            cantidad: parseFloat(item.cantidad),
            precio_unitario: parseFloat(item.precio_unitario),
            subtotal: parseFloat(item.precio_unitario) * parseFloat(item.cantidad),
        }));

        const { error: errorDetalle } = await supabase
            .from("detalle_ventas")
            .insert(detalles);

        if (errorDetalle) {
            setMensaje("Error al guardar detalles: " + errorDetalle.message);
            return;
        }

        setMensaje("✅ Venta registrada correctamente");
        reset();
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Venta</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Cliente</label>
                    <input
                        type="text"
                        placeholder="Nombre del cliente"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...register("cliente_nombre", { required: true })}
                    />
                    {errors.cliente_nombre && <p className="mt-1 text-sm text-red-600">Este campo es obligatorio</p>}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos</h3>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <select
                                        className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        {...register(`items.${index}.producto_id`, { required: true })}
                                    >
                                        <option value="">-- Selecciona producto --</option>
                                        {productos.map((p) => (
                                            <option key={p.id} value={p.id} disabled={p.stock_actual <= 0}>
                                                {p.nombre} (stock: {p.stock_actual})
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        placeholder="Cantidad"
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        {...register(`items.${index}.cantidad`, { required: true, min: 0.001 })}
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Precio unitario"
                                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        {...register(`items.${index}.precio_unitario`, { required: true, min: 0 })}
                                    />

                                    <span className="text-sm font-medium text-gray-700 min-w-20">
                                        Subtotal: ${calcularSubtotal(index).toFixed(2)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => append({ producto_id: "", cantidad: 1, precio_unitario: "" })}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                >
                    Agregar producto
                </button>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800">Total: ${totalVenta}</h3>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                    Guardar Venta
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

export default FormVentas;