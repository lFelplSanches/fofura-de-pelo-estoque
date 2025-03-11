import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    categoria: '',
    especie: '',
    validade: '',
    preco: '',
    quantidade: ''
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`  // ✅ Inclui o token JWT
        }
      });
      const data = await response.json();
      console.log('Dados recebidos:', data); // ✅ Verificar o retorno da API

      if (Array.isArray(data)) {
        setProdutos(data); // ✅ Se for um array, define normalmente
      } else if (data.produtos && Array.isArray(data.produtos)) {
        setProdutos(data.produtos); // ✅ Se estiver dentro de um objeto, ajusta
      } else {
        console.error('Formato de dados inesperado:', data);
        setProdutos([]); // ✅ Evita o erro do .map() em caso de dados inválidos
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoProduto({ ...novoProduto, [name]: value });
  };

  const handleSave = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ Token de autenticação não encontrado.');
            alert('Sua sessão expirou. Faça login novamente.');
            return;
        }

        const formData = new FormData();
        formData.append('nome', produtoEditando.nome);
        formData.append('descricao', produtoEditando.descricao);
        formData.append('tipo', produtoEditando.tipo);
        formData.append('categoria', produtoEditando.categoria);
        formData.append('validade', produtoEditando.validade);
        formData.append('preco', produtoEditando.preco);
        formData.append('quantidade', produtoEditando.quantidade);
        if (produtoEditando.imagem instanceof File) {
            formData.append('imagem', produtoEditando.imagem);
        }

        const response = await fetch(`${API_BASE_URL}/api/products/${produtoEditando.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            console.log('✅ Produto atualizado com sucesso!');
            fetchProdutos();
            setProdutoEditando(null);
        } else {
            const errorData = await response.json();
            console.error(`❌ Erro ao atualizar o produto: ${errorData.error}`);
            alert(`Erro ao atualizar: ${errorData.error}`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar o produto:', error);
    }
};

  const handleDelete = async (id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token de autenticação não encontrado.');
            return;
        }

        console.log(`🔍 Tentando excluir o produto com ID: ${id}`);

        const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Produto excluído com sucesso!');
            fetchProdutos();
        } else {
            const errorData = await response.json();
            console.error(`Erro ao excluir produto: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
    }
};

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Produtos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtos.map((produto) => (
          <div key={produto.id} className="border p-4 rounded shadow bg-white">
            <h3 className="text-xl font-semibold">{produto.nome}{produto.imagem && <img src={`${API_BASE_URL}${produto.imagem}`} alt={produto.nome} className="w-full h-32 object-cover mb-2 rounded" />}
            </h3>
            <p><strong>Descrição:</strong> {produto.descricao}</p>
            <p><strong>Tipo:</strong> {produto.tipo}</p>
            <p><strong>Categoria:</strong> {produto.categoria}</p>
            <p><strong>Espécie:</strong> {produto.especie}</p>
            <p><strong>Validade:</strong> {produto.validade}</p>
            <p><strong>Preço:</strong> R$ {Number(produto.preco).toFixed(2)}</p>
            <p><strong>Quantidade:</strong> {produto.quantidade}</p>
            <div className="flex gap-2 mt-2">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={() => setProdutoEditando(produto)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleDelete(produto.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {produtoEditando && (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">
          <h3 className="text-xl font-semibold">Editar Produto</h3>
          <input
            type="text"
            name="nome"
            value={produtoEditando.nome}
            onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
            placeholder="Nome"
            className="border p-2 w-full rounded mb-2"
          />
          <input
            type="text"
            name="descricao"
            value={produtoEditando.descricao}
            onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
            placeholder="Descrição"
            className="border p-2 w-full rounded mb-2"
          />
           <input
            type="text"
            name="tipo"
            value={produtoEditando.tipo}
            onChange={(e) => setProdutoEditando({ ...produtoEditando, tipo: e.target.value })}
            placeholder="Tipo"
            className="border p-2 w-full rounded mb-2"
          />
          <input
           type="text"
           name="categoria"
           value={produtoEditando.categoria}
           onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
           placeholder="Categoria"
           className="border p-2 w-full rounded mb-2"
          />
          <input
           type="date"
           name="validade"
           value={produtoEditando.validade}
           onChange={(e) => setProdutoEditando({ ...produtoEditando, validade: e.target.value })}
           placeholder="Validade"
           className="border p-2 w-full rounded mb-2"
          />          
          <input
            type="text"
            name="preco"
            value={produtoEditando.preco}
            onChange={(e) => setProdutoEditando({ ...produtoEditando, preco: e.target.value })}
            placeholder="Preço"
            className="border p-2 w-full rounded mb-2"
          />
          <input
           type="number"
           name="quantidade"
           value={produtoEditando.quantidade}
           onChange={(e) => setProdutoEditando({ ...produtoEditando, quantidade: e.target.value })}
           placeholder="Quantidade"
           className="border p-2 w-full rounded mb-2"
          />
          <input
           type="file"
           accept="image/*"
           onChange={(e) => setProdutoEditando({ ...produtoEditando, imagem: e.target.files[0] })}
           className="border p-2 w-full rounded mb-2"
           />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}

export default Produtos;