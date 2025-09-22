import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { supabase } from "../../tools/supabaseConnect";

function Graficos() {
    const [loading, setLoading] = useState(true);
    const [datosVentas, setDatosVentas] = useState([]);
    const [datosStock, setDatosStock] = useState([]);
    const [datosVentasMensuales, setDatosVentasMensuales] = useState([]);
    const [topProductos, setTopProductos] = useState([]);
    const [movimientosDiarios, setMovimientosDiarios] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Cargar productos con stock
                await cargarProductosConVentas();

                // Cargar ventas mensuales
                await cargarVentasMensuales();

                // Cargar movimientos diarios
                await cargarMovimientosDiarios();

            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    const cargarProductosConVentas = async () => {
        try {
            // Obtener productos
            const { data: productos, error: errorProductos } = await supabase
                .from("productos")
                .select("id, nombre, stock_actual")
                .order("nombre", { ascending: true });

            if (errorProductos) throw errorProductos;

            // Calcular ventas por producto
            const productosConVentas = [];

            for (const producto of productos) {
                const { data: ventas, error: errorVentas } = await supabase
                    .from("detalle_ventas")
                    .select(`
            cantidad,
            precio_unitario,
            ventas (id, fecha)
          `)
                    .eq("producto_id", producto.id);

                if (errorVentas) throw errorVentas;

                const totalVentas = ventas.reduce((total, venta) => {
                    return total + (venta.cantidad * venta.precio_unitario);
                }, 0);

                productosConVentas.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    stock: producto.stock_actual,
                    ventas: totalVentas
                });
            }

            // Ordenar por ventas descendente
            productosConVentas.sort((a, b) => b.ventas - a.ventas);

            setDatosVentas(productosConVentas);
            setDatosStock(productosConVentas);
            setTopProductos(productosConVentas.slice(0, 5)); // Top 5 productos

        } catch (error) {
            console.error('Error cargando productos con ventas:', error);
        }
    };

    const cargarVentasMensuales = async () => {
        try {
            // Obtener ventas de los últimos 6 meses
            const fechaInicio = new Date();
            fechaInicio.setMonth(fechaInicio.getMonth() - 6);

            // Ventas por mes
            const { data: ventas, error: errorVentas } = await supabase
                .from("ventas")
                .select(`
          fecha,
          detalle_ventas (
            cantidad,
            precio_unitario
          )
        `)
                .gte('fecha', fechaInicio.toISOString().split('T')[0])
                .order('fecha', { ascending: true });

            if (errorVentas) throw errorVentas;

            // Entradas por mes
            const { data: entradas, error: errorEntradas } = await supabase
                .from("entradas_inventario")
                .select("fecha, cantidad, precio_unitario")
                .gte('fecha', fechaInicio.toISOString().split('T')[0])
                .order('fecha', { ascending: true });

            if (errorEntradas) throw errorEntradas;

            // Agrupar por mes
            const ventasPorMes = {};
            const entradasPorMes = {};

            // Procesar ventas
            ventas.forEach(venta => {
                const fecha = new Date(venta.fecha);
                const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });

                if (!ventasPorMes[mesKey]) {
                    ventasPorMes[mesKey] = { mes: mesNombre, total: 0 };
                }

                const totalVenta = venta.detalle_ventas.reduce((sum, detalle) => {
                    return sum + (detalle.cantidad * detalle.precio_unitario);
                }, 0);

                ventasPorMes[mesKey].total += totalVenta;
            });

            // Procesar entradas
            entradas.forEach(entrada => {
                const fecha = new Date(entrada.fecha);
                const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });

                if (!entradasPorMes[mesKey]) {
                    entradasPorMes[mesKey] = { mes: mesNombre, total: 0 };
                }

                entradasPorMes[mesKey].total += (entrada.cantidad * entrada.precio_unitario);
            });

            // Combinar datos
            const mesesUnicos = new Set([...Object.keys(ventasPorMes), ...Object.keys(entradasPorMes)]);
            const datosCombinados = Array.from(mesesUnicos).map(mesKey => {
                const ventas = ventasPorMes[mesKey]?.total || 0;
                const entradas = entradasPorMes[mesKey]?.total || 0;
                const mes = ventasPorMes[mesKey]?.mes || entradasPorMes[mesKey]?.mes || 'Sin datos';

                return {
                    mes,
                    ventas,
                    entradas
                };
            });

            setDatosVentasMensuales(datosCombinados);

        } catch (error) {
            console.error('Error cargando ventas mensuales:', error);
        }
    };

    const cargarMovimientosDiarios = async () => {
        try {
            // Obtener movimientos de los últimos 7 días
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - 7);

            // Entradas diarias
            const { data: entradas, error: errorEntradas } = await supabase
                .from("entradas_inventario")
                .select("fecha, cantidad")
                .gte('fecha', fechaInicio.toISOString().split('T')[0])
                .order('fecha', { ascending: true });

            if (errorEntradas) throw errorEntradas;

            // Salidas diarias (ventas)
            const { data: ventas, error: errorVentas } = await supabase
                .from("ventas")
                .select(`
          fecha,
          detalle_ventas (cantidad)
        `)
                .gte('fecha', fechaInicio.toISOString().split('T')[0])
                .order('fecha', { ascending: true });

            if (errorVentas) throw errorVentas;

            // Agrupar por día
            const movimientosPorDia = {};

            // Procesar entradas
            entradas.forEach(entrada => {
                const fechaKey = entrada.fecha;
                if (!movimientosPorDia[fechaKey]) {
                    movimientosPorDia[fechaKey] = { fecha: fechaKey, entradas: 0, salidas: 0 };
                }
                movimientosPorDia[fechaKey].entradas += entrada.cantidad;
            });

            // Procesar salidas (ventas)
            ventas.forEach(venta => {
                const fechaKey = venta.fecha;
                if (!movimientosPorDia[fechaKey]) {
                    movimientosPorDia[fechaKey] = { fecha: fechaKey, entradas: 0, salidas: 0 };
                }

                const totalCantidad = venta.detalle_ventas.reduce((sum, detalle) => sum + detalle.cantidad, 0);
                movimientosPorDia[fechaKey].salidas += totalCantidad;
            });

            const datosMovimientos = Object.values(movimientosPorDia).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            setMovimientosDiarios(datosMovimientos);

        } catch (error) {
            console.error('Error cargando movimientos diarios:', error);
        }
    };

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(valor);
    };

    const coloresPie = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-5"></div>
                    <p>Cargando gráficos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="text-center mb-8 bg-white p-6 rounded-2xl shadow-lg">
                <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-2">
                    📊 Análisis de Inventario
                </h1>
                <p className="text-gray-600">Visualización de datos y tendencias del inventario</p>
            </div>

            {/* Grid de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gráfico de Barras - Ventas por Producto */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        📈 Ventas por Producto
                    </h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datosVentas}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                                <Tooltip formatter={(value) => [formatearMoneda(value), 'Ventas']} />
                                <Bar dataKey="ventas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Líneas - Tendencia Mensual */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        📉 Tendencia Mensual
                    </h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={datosVentasMensuales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes" />
                                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                                <Tooltip formatter={(value, name) => [formatearMoneda(value), name === 'ventas' ? 'Ventas' : 'Entradas']} />
                                <Legend />
                                <Line type="monotone" dataKey="ventas" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} />
                                <Line type="monotone" dataKey="entradas" stroke="#82ca9d" strokeWidth={3} dot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pizza - Top Productos */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        🥧 Distribución de Ventas
                    </h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topProductos}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ nombre, percent }) => `${nombre} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="ventas"
                                >
                                    {topProductos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={coloresPie[index % coloresPie.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [formatearMoneda(value), 'Ventas']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Área - Movimientos Diarios */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        📦 Movimientos Diarios
                    </h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={movimientosDiarios}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="fecha"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                                    formatter={(value, name) => [value, name === 'entradas' ? 'Entradas' : 'Salidas']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="entradas" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="salidas" stackId="2" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Gráfico de Stock Actual - Ancho completo */}
            <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📊 Stock Actual vs Ventas
                </h2>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosStock}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                            <YAxis yAxisId="left" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                                formatter={(value, name) => [
                                    name === 'ventas' ? formatearMoneda(value) : `${value} unidades`,
                                    name === 'ventas' ? 'Ventas' : 'Stock'
                                ]}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="ventas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="stock" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold">
                        {formatearMoneda(datosVentasMensuales.reduce((acc, curr) => acc + curr.ventas, 0))}
                    </div>
                    <div className="text-blue-100 text-sm mt-1">Ventas Totales</div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold">
                        {datosStock.reduce((acc, curr) => acc + curr.stock, 0)}
                    </div>
                    <div className="text-green-100 text-sm mt-1">Unidades en Stock</div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold">
                        {datosStock.length}
                    </div>
                    <div className="text-purple-100 text-sm mt-1">Productos Activos</div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold">
                        {movimientosDiarios.reduce((acc, curr) => acc + curr.entradas + curr.salidas, 0)}
                    </div>
                    <div className="text-orange-100 text-sm mt-1">Movimientos Totales</div>
                </div>
            </div>

        </div>
    );
}

export default Graficos;