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
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

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
        alert('Erro ao adicionar produto.');
      }
    } catch (error) {
      console.error('Erro:', error);
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
