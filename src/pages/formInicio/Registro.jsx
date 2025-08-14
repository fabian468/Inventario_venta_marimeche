import React, { useState } from 'react'
import { supabase } from '../../tools/supabaseConnect'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../../assets/1.png'


export default function Registro() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
        })

        console.log(data, error) // Para depuración

        if (error) {
            setMensaje(`Error: ${error.message}`)
        } else {
            setMensaje('✅ Registro exitoso. Revisa tu correo para confirmar la cuenta.')
            // Opcional: redirigir al login
            setTimeout(() => navigate('/login'), 3000)
        }
    }

    return (
        <div className="max-w-sm mx-auto">
            <img className='w-3/4 m-auto' src={logo} alt="" />
            <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
            <form onSubmit={handleRegister} className="space-y-4">
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
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
                >
                    Registrarse
                </button>
            </form>
            <p className="mt-4 text-sm text-center text-gray-600">{mensaje}</p>
            <p className="mt-4 text-sm text-center">
                ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión aquí</Link>
            </p>
        </div>
    )
}