import React, { useState, useEffect } from "react";
import { supabase } from "../../tools/supabaseConnect";


function ListaInventarios() {
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [movimientosPorProducto, setMovimientosPorProducto] = useState({});
    const [totalesVentasPorProducto, setTotalesVentasPorProducto] = useState({});
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [productosAbiertos, setProductosAbiertos] = useState(new Set());

    // Cargar productos y sus movimientos
    useEffect(() => {

        const fetchData = async () => {
            try {
                // Cargar productos
                const { data: productosData, error: errorProductos } = await supabase
                    .from("productos")
                    .select("id, nombre, stock_actual")
                    .order("nombre", { ascending: true });

                if (errorProductos) throw errorProductos;

                setProductos(productosData);
                setProductosFiltrados(productosData);

                // Cargar totales de ventas para todos los productos
                const totalesVentas = {};

                for (const producto of productosData) {
                    const totalVentas = await calcularTotalVentasDirecto(producto.id);
                    totalesVentas[producto.id] = totalVentas;
                }

                setTotalesVentasPorProducto(totalesVentas);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrar productos basado en la búsqueda
    useEffect(() => {
        if (busqueda.trim() === "") {
            setProductosFiltrados(productos);
        } else {
            const filtered = productos.filter(producto =>
                producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
            setProductosFiltrados(filtered);
        }
    }, [busqueda, productos]);

    // Toggle acordeón de producto
    const toggleProducto = async (productoId) => {
        const nuevosAbiertos = new Set(productosAbiertos);

        if (nuevosAbiertos.has(productoId)) {
            // Si está abierto, cerrarlo
            nuevosAbiertos.delete(productoId);
        } else {
            // Si está cerrado, abrirlo y cargar datos si no existen
            nuevosAbiertos.add(productoId);

            if (!movimientosPorProducto[productoId]) {
                try {
                    const movimientos = await fetchMovimientosProducto(productoId);
                    const movimientosAgrupados = agruparMovimientosPorDia(movimientos);

                    setMovimientosPorProducto(prev => ({
                        ...prev,
                        [productoId]: movimientosAgrupados
                    }));
                } catch (error) {
                    console.error("Error cargando movimientos:", error);
                }
            }
        }

        setProductosAbiertos(nuevosAbiertos);
    };

    const fetchMovimientosProducto = async (productoId) => {
        try {
            // Entradas
            const { data: entradas, error: errEnt } = await supabase
                .from("entradas_inventario")
                .select(`
                    id,
                    cantidad,
                    precio_unitario,
                    fecha,
                    observaciones,
                    proveedores ( id, nombre )
                `)
                .eq("producto_id", productoId);

            if (errEnt) throw errEnt;

            const entradasFmt = entradas.map((e) => ({
                id: `E-${e.id}`,
                tipo: "Entrada",
                cantidad: e.cantidad,
                precio_unitario: e.precio_unitario,
                proveedor: e.proveedores?.nombre || "Sin proveedor",
                fecha: e.fecha,
                observaciones: e.observaciones || "-",
                total: e.cantidad * e.precio_unitario
            }));

            // Ventas desde detalle_ventas
            const { data: ventas, error: errVen } = await supabase
                .from("detalle_ventas")
                .select(`
                    id,
                    cantidad,
                    precio_unitario,
                    ventas (
                        id,
                        fecha,
                        cliente_nombre
                    )
                `)
                .eq("producto_id", productoId);

            if (errVen) throw errVen;

            const ventasFmt = ventas.map((v) => ({
                id: `V-${v.id}`,
                tipo: "Venta",
                cantidad: v.cantidad,
                precio_unitario: v.precio_unitario,
                proveedor: v.ventas?.cliente_nombre || "Cliente",
                fecha: v.ventas?.fecha,
                observaciones: "-",
                total: v.cantidad * v.precio_unitario
            }));

            // Combinar y ordenar por fecha descendente
            return [...entradasFmt, ...ventasFmt].sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha)
            );
        } catch (error) {
            console.error("Error cargando movimientos:", error);
            return [];
        }
    };

    const agruparMovimientosPorDia = (movimientos) => {
        const grupos = {};

        movimientos.forEach(mov => {
            const fecha = new Date(mov.fecha);
            const fechaKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!grupos[fechaKey]) {
                grupos[fechaKey] = {
                    fecha: fechaKey,
                    movimientos: [],
                    totalVentas: 0,
                    totalEntradas: 0
                };
            }

            grupos[fechaKey].movimientos.push(mov);

            if (mov.tipo === "Venta") {
                grupos[fechaKey].totalVentas += mov.total;
            } else if (mov.tipo === "Entrada") {
                grupos[fechaKey].totalEntradas += mov.total;
            }
        });

        // Convertir a array y ordenar por fecha descendente
        return Object.values(grupos).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    };

    const formatearFecha = (fechaStr) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(valor);
    };


    const calcularTotalVentasDirecto = async (productoId) => {
        try {
            const { data: ventas, error } = await supabase
                .from("detalle_ventas")
                .select(`
                    cantidad,
                    precio_unitario,
                    ventas (id, fecha)
                `)
                .eq("producto_id", productoId);

            if (error) throw error;

            return ventas.reduce((total, venta) => {
                return total + (venta.cantidad * venta.precio_unitario);
            }, 0);
        } catch (error) {
            console.error("Error calculando total de ventas:", error);
            return 0;
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-5"></div>
                    <p>Cargando inventario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="text-center mb-6 bg-white p-6 rounded-2xl shadow-lg">
                <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-5">
                    📦 Inventario por Producto
                </h1>

                {/* Buscador */}
                <div className="relative max-w-md mx-auto mb-4">
                    <input
                        type="text"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-full text-base outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Buscar producto por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        🔍
                    </div>
                </div>

                {/* Información de resultados */}
                {busqueda && (
                    <div className="text-gray-500 italic text-sm">
                        {productosFiltrados.length === 0
                            ? `No se encontraron productos que coincidan con "${busqueda}"`
                            : `Se encontraron ${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''} que coinciden con "${busqueda}"`
                        }
                    </div>
                )}
            </div>

            {/* Sin resultados */}
            {productosFiltrados.length === 0 && busqueda ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg mx-1">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">😔 No se encontraron productos</h3>
                    <p className="text-gray-500">Intenta con un término de búsqueda diferente</p>
                </div>
            ) : (
                /* Lista de productos */
                <div className="space-y-5">
                    {productosFiltrados.map((producto) => (
                        <div key={producto.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-200 hover:transform hover:-translate-y-1">
                            {/* Header del producto */}
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 cursor-pointer transition-all duration-300 hover:from-blue-600 hover:to-purple-700"
                                onClick={() => toggleProducto(producto.id)}
                            >
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <span
                                            className={`text-lg transition-transform duration-300 select-none ${productosAbiertos.has(producto.id) ? 'transform rotate-90' : ''}`}
                                        >
                                            ▶
                                        </span>
                                        <h2 className="text-xl font-semibold truncate">{producto.nombre}</h2>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-medium text-sm whitespace-nowrap">
                                            Stock: {producto.stock_actual} unidades
                                        </div>
                                        <div className="bg-green-500 bg-opacity-80 px-3 py-1 rounded-full font-semibold text-sm whitespace-nowrap">
                                            Total ventas: {formatearMoneda(totalesVentasPorProducto[producto.id] || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido desplegable */}
                            {productosAbiertos.has(producto.id) && (
                                <div className="border-t">
                                    {movimientosPorProducto[producto.id]?.length > 0 ? (
                                        movimientosPorProducto[producto.id].map((diaGrupo, index) => (
                                            <div key={diaGrupo.fecha} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                {/* Header del día */}
                                                <div className={`px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'}`}>
                                                    <div className="font-semibold text-gray-700 capitalize text-sm">
                                                        {formatearFecha(diaGrupo.fecha)}
                                                    </div>
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {diaGrupo.totalVentas > 0 && (
                                                            <div className="text-green-600 font-semibold">
                                                                Ventas: {formatearMoneda(diaGrupo.totalVentas)}
                                                            </div>
                                                        )}
                                                        {diaGrupo.totalEntradas > 0 && (
                                                            <div className="text-blue-600 font-semibold">
                                                                Entradas: {formatearMoneda(diaGrupo.totalEntradas)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Tabla de movimientos */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-800 text-white">
                                                                <th className="px-2 py-3 text-left font-medium">Tipo</th>
                                                                <th className="px-2 py-3 text-left font-medium">Cantidad</th>
                                                                <th className="px-2 py-3 text-left font-medium">Precio Unit.</th>
                                                                <th className="px-2 py-3 text-left font-medium">Total</th>
                                                                <th className="px-2 py-3 text-left font-medium">Proveedor/Cliente</th>
                                                                <th className="px-2 py-3 text-left font-medium">Hora</th>
                                                                <th className="px-2 py-3 text-left font-medium hidden sm:table-cell">Observaciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {diaGrupo.movimientos.map((mov) => (
                                                                <tr key={mov.id} className="hover:bg-opacity-50 hover:bg-gray-200 border-b border-gray-100">
                                                                    <td className="px-2 py-3">
                                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${mov.tipo === "Entrada"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-red-100 text-red-800"
                                                                            }`}>
                                                                            {mov.tipo}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-3">{mov.cantidad}</td>
                                                                    <td className="px-2 py-3 font-semibold text-green-600 whitespace-nowrap">
                                                                        {formatearMoneda(mov.precio_unitario)}
                                                                    </td>
                                                                    <td className="px-2 py-3 font-semibold text-green-600 whitespace-nowrap">
                                                                        {formatearMoneda(mov.total)}
                                                                    </td>
                                                                    <td className="px-2 py-3 break-words">{mov.proveedor}</td>
                                                                    <td className="px-2 py-3 whitespace-nowrap">
                                                                        {new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                    </td>
                                                                    <td className="px-2 py-3 break-words hidden sm:table-cell">{mov.observaciones}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 italic">
                                            No hay movimientos registrados para este producto
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ListaInventarios;