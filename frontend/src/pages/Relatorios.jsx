import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config';

function Relatorios() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    fetchMovimentacoes();
  }, []); // ✅ Correção: Removido o uso de uma variável inexistente

  const fetchMovimentacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/movimentacoes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const produtosResponse = await fetch(`${API_BASE_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!produtosResponse.ok) {
        throw new Error(`Erro ${produtosResponse.status}: ${produtosResponse.statusText}`);
      }

      const produtosData = await produtosResponse.json();
      console.log('Produtos recebidos:', produtosData);

      const produtos = Array.isArray(produtosData) ? produtosData : [];

      const movimentacoesComNomeProduto = data.map(mov => {
        const produto = produtos.find(p => p.id === mov.produto_id);
        return { ...mov, nome_produto: produto ? produto.nome : 'Produto Desconhecido' };
      });

      setMovimentacoes(movimentacoesComNomeProduto);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token de autenticação não encontrado.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/movimentacoes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchMovimentacoes(); // ✅ Atualiza a lista após a exclusão
      } else {
        const errorData = await response.json();
        console.error(`Erro ao excluir movimentação: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Relatório de Movimentações</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Nome do Produto</th>
              <th className="py-2 px-4 border-b">Tipo de Movimentação</th>
              <th className="py-2 px-4 border-b">Quantidade</th>
              <th className="py-2 px-4 border-b">Responsável</th>
              <th className="py-2 px-4 border-b">Observações</th>
              <th className="py-2 px-4 border-b">Data da Movimentação</th>
              <th className="py-2 px-4 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.map((mov) => (
              <tr key={mov.id}>
                <td className="py-2 px-4 border-b text-center">{mov.nome_produto}</td>
                <td className="py-2 px-4 border-b text-center">{mov.tipo_movimentacao}</td>
                <td className="py-2 px-4 border-b text-center">{mov.quantidade}</td>
                <td className="py-2 px-4 border-b text-center">{mov.responsavel}</td>
                <td className="py-2 px-4 border-b text-center">{mov.observacoes}</td>
                <td className="py-2 px-4 border-b text-center">
                  {mov.data_movimentacao
                    ? new Date(mov.data_movimentacao).toLocaleDateString()
                    : 'Data não disponível'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                    onClick={() => handleDelete(mov.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Relatorios;
