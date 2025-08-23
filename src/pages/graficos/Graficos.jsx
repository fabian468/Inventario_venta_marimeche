import React from 'react'

function Graficos() {
    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Gráfico</th>
                        <th>Descrição</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gráfico de Barras</td>
                        <td>Utilizado para comparar diferentes categorias ou grupos.</td>
                    </tr>
                    <tr>
                        <td>Gráfico de Linhas</td>
                        <td>Ideal para mostrar tendências ao longo do tempo.</td>
                    </tr>
                    <tr>
                        <td>Gráfico de Pizza</td>
                        <td>Usado para representar proporções de um todo.</td>
                    </tr>
                    <tr>
                        <td>Gráfico de Dispersão</td>
                        <td>Mostra a relação entre duas variáveis.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Graficos