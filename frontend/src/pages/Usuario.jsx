import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config'; // ✅ Importação da URL da API

function UserMenu() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ nome: '', email: '' });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token não encontrado. Faça login novamente.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/usuario`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
        } else {
          console.error('Erro ao buscar informações do usuário.');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // ✅ Remove o token de autenticação
    navigate('/login'); // ✅ Redireciona para a página de login
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Configurações da Conta</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded shadow">
        <h3 className="text-lg font-semibold">Informações do Usuário</h3>
        <p><strong>Nome:</strong> {userInfo.nome}</p>
        <p><strong>Email:</strong> {userInfo.email}</p>
      </div>

      <div className="space-y-4">
        <button
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/editar-conta')}
        >
          Editar Informações da Conta
        </button>

        <button
          className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/alterar-senha')}
        >
          Alterar Senha
        </button>

        <button
          className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleLogout}
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

export default UserMenu;
