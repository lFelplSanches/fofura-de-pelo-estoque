import React, { useState, useEffect } from 'react';

function EditAccount() {
  const [user, setUser] = useState({ nome: '', email: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => setUser(data))
        .catch(error => console.error('Erro ao buscar informações do usuário:', error));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await fetch('http://localhost:5000/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Editar Informações da Conta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Nome:</label>
          <input
            type="text"
            name="nome"
            value={user.nome}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={user.email}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}

export default EditAccount;
