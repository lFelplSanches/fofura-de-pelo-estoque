import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Usuario from './pages/Usuario';
import AddProduct from './pages/AddProduct';
import Movimentacoes from './pages/Movimentacoes';
import Login from './pages/Login'; // ✅ Importação da página de Login
import PrivateRoute from './components/PrivateRoute';
import EditAccount from './components/EditAccount'; // ✅ Importação do componente EditAccount
import ChangePassword from './components/ChangePassword'; // ✅ Importação do componente ChangePassword
import UserMenu from './components/UserMenu'; // ✅ Importação do componente UserMenu

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-2xl font-bold text-center mb-6">Fofura de Pelo</h1>
          <nav className="flex flex-col gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/produtos"
              className={({ isActive }) =>
                isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'
              }
            >
              Produtos
            </NavLink>
            <NavLink
              to="/relatorios"
              className={({ isActive }) =>
                isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'
              }
            >
              Relatórios
            </NavLink>
            <NavLink
              to="/configuracoes"
              className={({ isActive }) =>
                isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'
              }
            >
              Configurações
            </NavLink>
            <NavLink
              to="/usuario"
              className={({ isActive }) =>
                isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'
              }
            >
              Usuário
            </NavLink>

            {/* ✅ Botão de Movimentações */}
            <NavLink
              to="/movimentacoes"
              className={({ isActive }) =>
                isActive
                  ? 'bg-purple-700 p-2 rounded text-white text-center'
                  : 'bg-purple-500 hover:bg-purple-700 p-2 rounded text-white text-center'
              }
            >
              Movimentações
            </NavLink>

            {/* ✅ Botão de Adicionar Produto */}
            <NavLink
              to="/add-product"
              className="bg-blue-500 hover:bg-blue-700 p-2 rounded text-white text-center"
            >
              Adicionar Produto
            </NavLink>

            {/* ✅ Botão de Login */}
            <NavLink
              to="/login"
              className="bg-green-500 hover:bg-green-700 p-2 rounded text-white text-center"
            >
              Login
            </NavLink>
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/usuario" element={<Usuario />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/login" element={<Login />} /> {/* ✅ Nova rota para Login */}
            <Route path="/editar-conta" element={<EditAccount />} /> {/* ✅ Rota para Editar Conta */}
            <Route path="/alterar-senha" element={<ChangePassword />} /> {/* ✅ Rota para Alterar Senha */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
