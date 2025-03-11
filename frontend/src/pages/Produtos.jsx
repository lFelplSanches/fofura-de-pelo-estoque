import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [imagensProduto, setImagensProduto] = useState([]);
  const [imagemAtualIndex, setImagemAtualIndex] = useState(0);
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

// 📌 Abre o modal e exibe a imagem ampliada
const abrirModal = (imagens, index = 0) => {
  if (!Array.isArray(imagens) || imagens.length === 0) return;
  const imagemCorrigida = imagens[index].startsWith("http") ? imagens[index] : `${API_BASE_URL}${imagens[index]}`;
  setImagensProduto(imagens);
  setImagemAtualIndex(index);
  setImagemSelecionada(imagemCorrigida);
};

// 📌 Fecha o modal
const fecharModal = () => {
  setImagemSelecionada(null);
  setImagensProduto([]);
};

// 📌 Navega para a imagem anterior no modal
const imagemAnterior = () => {
  const novoIndex = (imagemAtualIndex - 1 + imagensProduto.length) % imagensProduto.length;
  setImagemAtualIndex(novoIndex);
  setImagemSelecionada(imagensProduto[novoIndex]);
};

// 📌 Navega para a próxima imagem no modal
const proximaImagem = () => {
  const novoIndex = (imagemAtualIndex + 1) % imagensProduto.length;
  setImagemAtualIndex(novoIndex);
  setImagemSelecionada(imagensProduto[novoIndex]);
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

        // Adiciona a imagem SOMENTE se for um novo arquivo
        if (produtoEditando.imagem && produtoEditando.imagem instanceof File) {
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

//Duplicar produtos
const handleDuplicate = async (id) => {
  try {
      const token = localStorage.getItem('token');
      if (!token) {
          console.error('❌ Token de autenticação não encontrado.');
          alert('Sua sessão expirou. Faça login novamente.');
          return;
      }

      const response = await fetch(`${API_BASE_URL}/api/products/duplicate/${id}`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      if (response.ok) {
          console.log('✅ Produto duplicado com sucesso!');
          fetchProdutos(); // Atualiza a lista de produtos
      } else {
          const errorData = await response.json();
          console.error(`❌ Erro ao duplicar o produto: ${errorData.error}`);
          alert(`Erro ao duplicar: ${errorData.error}`);
      }
  } catch (error) {
      console.error('❌ Erro ao duplicar o produto:', error);
  }
};

return (
  <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => {
              const imagens = produto.imagem ? produto.imagem.split(",").filter(img => img.trim() !== "") : [];

              return (
                  <div key={produto.id} className="bg-white shadow-lg rounded-lg p-4">
                      <h2 className="text-xl font-bold">{produto.nome}</h2>
                      <p><strong>Descrição:</strong> {produto.descricao}</p>
                      <p><strong>Tipo:</strong> {produto.tipo}</p>
                      <p><strong>Categoria:</strong> {produto.categoria}</p>
                      <p><strong>Espécie:</strong> {produto.especie}</p>
                      <p><strong>Validade:</strong> {produto.validade}</p>
                      <p><strong>Preço:</strong> R$ {produto.preco}</p>
                      <p><strong>Quantidade:</strong> {produto.quantidade}</p>

                      {/* Imagem Principal */}
                      {produto.imagem && (
                        <img
                        src={produto.imagem} // Usa a URL direta do banco (Cloudinary)
                        alt={produto.nome}
                        className="w-full h-40 object-cover mt-3 rounded cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => abrirModal([produto.imagem])}
                        />
                        )}

                      {/* Miniaturas */}
                      {imagens.length > 1 && (
                       <div className="flex mt-2 space-x-2">
                       {imagens.map((img, index) => (
                       <img
                       key={index}
                       src={img} // Usa diretamente a URL salva no banco
                       alt={`${produto.nome} ${index + 1}`}
                       className="w-12 h-12 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                       onClick={() => abrirModal(imagens, index)}
                       />
                      ))}
                      </div>
                      )}

<div className="flex gap-2 mt-3">
    <button 
        className="bg-blue-500 text-white px-3 py-1 rounded"
        onClick={() => setProdutoEditando(produto)} // 🛠️ Chama a função de edição
    >
        Editar
    </button>
    
    <button 
        className="bg-yellow-500 text-white px-3 py-1 rounded"
        onClick={() => handleDuplicate(produto.id)} // 🛠️ Chama a função de duplicação
    >
        Duplicar
    </button>
    
    <button 
        className="bg-red-500 text-white px-3 py-1 rounded"
        onClick={() => handleDelete(produto.id)} // 🛠️ Chama a função de exclusão
    >
        Excluir
    </button>
</div>

                  </div>
              );
          })}
      </div>

      {/* Modal de Imagem Ampliada */}
      {imagemSelecionada && (
          <div
              className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50"
              onClick={fecharModal}
          >
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute top-2 right-2 text-white text-xl" onClick={fecharModal}>✖</button>
                  
                  {/* Botão de Anterior */}
                  {imagensProduto.length > 1 && (
                      <button
                          className="absolute left-2 top-1/2 text-white text-3xl bg-gray-800 p-2 rounded-full"
                          onClick={imagemAnterior}
                      >
                          ⬅
                      </button>
                  )}
                  
                  <img src={imagemSelecionada} alt="Produto" className="max-w-screen-md max-h-screen-md rounded-lg shadow-lg" />

                  {/* Botão de Próximo */}
                  {imagensProduto.length > 1 && (
                      <button
                          className="absolute right-2 top-1/2 text-white text-3xl bg-gray-800 p-2 rounded-full"
                          onClick={proximaImagem}
                      >
                          ➡
                      </button>
                  )}
              </div>
          </div>
          )}

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