
import { useForm } from 'react-hook-form'
import { supabase } from "../../tools/supabaseConnect";

function FormRegistroCategorias() {
    const { register, handleSubmit, reset } = useForm()

    const onSubmit = async (data) => {
        const { error } = await supabase
            .from('categorias')
            .insert([{ nombre: data.nombre, descripcion: data.descripcion }])

        if (error) {
            console.error(error)
            alert('Error al registrar la categoría')
        } else {
            alert('Categoría registrada correctamente')
            reset()
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-md mx-auto bg-white p-6 rounded shadow"
        >
            <h2 className="text-xl font-bold mb-4">Registrar Categoría</h2>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Nombre</label>
                <input
                    type="text"
                    {...register('nombre', { required: true })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Ej: Frutos secos"
                />
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Descripción</label>
                <textarea
                    {...register('descripcion')}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Descripción de la categoría"
                ></textarea>
            </div>

            <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Guardar
            </button>
        </form>
    )
}

export default FormRegistroCategorias
