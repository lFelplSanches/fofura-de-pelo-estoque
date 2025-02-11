import React, { useState } from 'react';

function AddProduct() {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    categoria: '',
    especie: '', 
    validade: '',
    preco: '',
    quantidade: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.especie) {
      alert("Por favor, selecione a espécie.");
      return;
    }

    try {
      const API_BASE_URL = "https://fofura-backend.onrender.com"; 
      const token = localStorage.getItem('token');

      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      // ✅ Verificação aprimorada do status da resposta
      if (response.ok) {
        alert('Produto adicionado com sucesso!');
        setFormData({
          nome: '',
          descricao: '',
          tipo: '',
          categoria: '',
          especie: '', 
          validade: '',
          preco: '',
          quantidade: ''
        });
      } else {
        // Se não for JSON válido, captura o erro como texto
        const errorData = await response.text();
        console.error('Erro ao adicionar produto:', errorData);
        alert(`Erro ao adicionar produto: ${errorData}`);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Adicionar Produto</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="text" name="nome" placeholder="Nome do Produto" value={formData.nome} onChange={handleChange} required />
        <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange}></textarea>
        <input type="text" name="tipo" placeholder="Tipo" value={formData.tipo} onChange={handleChange} />
        <input type="text" name="categoria" placeholder="Categoria" value={formData.categoria} onChange={handleChange} />

        <select name="especie" value={formData.especie} onChange={handleChange} required>
          <option value="">Selecione a Espécie</option>
          <option value="cachorro">Cachorro</option>
          <option value="gato">Gato</option>
        </select>

        <input type="date" name="validade" value={formData.validade} onChange={handleChange} />
        <input type="number" name="preco" placeholder="Preço" value={formData.preco} onChange={handleChange} required />
        <input type="number" name="quantidade" placeholder="Quantidade" value={formData.quantidade} onChange={handleChange} />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Adicionar Produto</button>
      </form>
    </div>
  );
}

export default AddProduct;
