import React from 'react';
import { useNavigate } from 'react-router-dom';

function UserMenu() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // ✅ Remove o token de autenticação
    navigate('/login'); // ✅ Redireciona para a página de login
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Configurações da Conta</h2>
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
