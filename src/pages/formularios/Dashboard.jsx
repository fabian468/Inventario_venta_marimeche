import React, { useEffect, useState } from "react";
import FormRegistroCategorias from "./FormRegistroCategorias";
import FormRegistroProducto from "./FormRegistroProducto";
import FormVentas from "./FormVentas";
import FormEntradaProducto from "./FormEntradaProducto";
import ListaInventarios from "../inventarios/ListaInventarios";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";


function Dashboard() {
    const [activeTab, setActiveTab] = useState("inventario");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // Detecta si el ancho es menor o igual a 768px (móvil/tablet)
        if (window.innerWidth <= 768) {
            const driverObj = driver();
            driverObj.highlight({
                element: '#menu-toggle',
                popover: {
                    title: 'Menu',
                    description: 'Presiona para abrir el menú de opciones',
                },
            });
        }
    }, []);

    const menuItems = [
        { id: "producto", label: "Registrar Producto" },
        { id: "categoria", label: "Registrar Categoría" },
        { id: "venta", label: "Registrar Venta" },
        { id: "compra", label: "Registrar Compra" },
        { id: "inventario", label: "inventario" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <h1 className="text-2xl font-bold text-gray-800">La Marimeche</h1>

                        {/* Botón hamburguesa - visible solo en móvil */}
                        <button
                            id="menu-toggle"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Menú desktop - oculto en móvil */}
                        <div className="hidden md:flex space-x-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === item.id
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menú móvil desplegable */}
                    {isMenuOpen && (
                        <div className="md:hidden pb-4">
                            <div className="space-y-1">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === item.id
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            <section className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === "producto" && <FormRegistroProducto />}
                {activeTab === "categoria" && <FormRegistroCategorias />}
                {activeTab === "venta" && <FormVentas />}
                {activeTab === "compra" && <FormEntradaProducto />}
                {activeTab === "inventario" && <ListaInventarios />}

            </section>
        </div>
    );
}

export default Dashboard;