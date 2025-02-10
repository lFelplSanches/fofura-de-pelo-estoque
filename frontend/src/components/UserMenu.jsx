import React from 'react';
import { useNavigate } from 'react-router-dom';

function UserMenu() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Menu do Usuário</h2>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/editar-conta')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exibir Informações da Conta
        </button>

        <button
          onClick={() => navigate('/alterar-senha')}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Alterar Senha
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

export default UserMenu;
