import React, { useState, useEffect } from 'react';

function Movimentacoes() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacao, setMovimentacao] = useState({
    produto_id: '',
    tipo_movimentacao: '',
    quantidade: 0,
    responsavel: '',
    observacoes: '',
    tipo_saida: '',
  });

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const token = localStorage.getItem('token');  // ✅ Verificação do token
        if (!token) {
          console.error('Token não encontrado. Faça login novamente.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,  // ✅ Inclusão do token
          },
        });
        const data = await response.json();
        console.log('Produtos recebidos:', data);  // ✅ Debug para verificação do retorno
        setProdutos(Array.isArray(data) ? data : []);  // ✅ Garante que seja um array
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    fetchProdutos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMovimentacao((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (movimentacao.quantidade <= 0) {  // ✅ Validação da quantidade
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // ✅ Inclusão do token
        },
        body: JSON.stringify(movimentacao),
      });

      if (response.ok) {
        alert('Movimentação registrada com sucesso!');
        setMovimentacao({
          produto_id: '',
          tipo_movimentacao: '',
          quantidade: 0,
          responsavel: '',
          observacoes: '',
          tipo_saida: '',
        });
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Registrar Movimentação</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Produto:</label>
          <select
            name="produto_id"
            value={movimentacao.produto_id}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          >
            <option value="">Selecione um produto</option>
            {Array.isArray(produtos) && produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tipo de Movimentação:</label>
          <select
            name="tipo_movimentacao"
            value={movimentacao.tipo_movimentacao}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          >
            <option value="">Selecione</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="venda">Venda</option>
          </select>
        </div>

        {movimentacao.tipo_movimentacao === 'venda' && (
          <div>
            <label>Tipo de Saída:</label>
            <select
              name="tipo_saida"
              value={movimentacao.tipo_saida}
              onChange={handleChange}
              required
              className="border p-2 w-full"
            >
              <option value="">Selecione o tipo de saída</option>
              <option value="venda">Venda</option>
              <option value="troca">Troca</option>
              <option value="devolucao">Devolução</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        )}

        <div>
          <label>Quantidade:</label>
          <input
            type="number"
            name="quantidade"
            value={movimentacao.quantidade}
            onChange={handleChange}
            required
            min="1"  // ✅ Validação mínima
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Responsável:</label>
          <input
            type="text"
            name="responsavel"
            value={movimentacao.responsavel}
            onChange={handleChange}
            className="border p-2 w-full"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label>Observações:</label>
          <textarea
            name="observacoes"
            value={movimentacao.observacoes}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Registrar Movimentação
        </button>
      </form>
    </div>
  );
}

export default Movimentacoes;
