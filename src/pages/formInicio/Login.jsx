import React, { useState } from 'react'
import { supabase } from '../../tools/supabaseConnect'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../../assets/1.png'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
        })

        if (error) {
            setMensaje(`Error: ${error.message}`)
        } else {
            setMensaje(`✅ Bienvenido ${data.user.email}`)
            // Redirigir a ruta protegida tras login exitoso
            navigate('/dashboard')
        }
    }

    return (
        <div className="max-w-sm mx-auto">
            <img className='w-3/4 m-auto' src={logo} alt="" />
            <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                    Entrar
                </button>
            </form>
            <p className="mt-4 text-sm text-center text-gray-600">{mensaje}</p>
            <p className="mt-4 text-sm text-center">
                ¿No tienes cuenta? <Link to="/registro" className="text-blue-600 hover:underline">Regístrate aquí</Link>
            </p>
        </div>
    )
}