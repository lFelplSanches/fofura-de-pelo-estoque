import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Usuario from './pages/Usuario';
import AddProduct from './pages/AddProduct';
import Movimentacoes from './pages/Movimentacoes';
import Login from './pages/Login';
import EditAccount from './components/EditAccount';
import ChangePassword from './components/ChangePassword';
import UserMenu from './components/UserMenu';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration);

          return registration.pushManager.getSubscription()
            .then(subscription => {
              if (subscription) return subscription;

              const VAPID_PUBLIC_KEY = 'BPBoEj2dWqS5X8ZFXONejTAEL7o9CPNO_EzJaGSjMuQs8KWhntkaKvbjYHhG98IJd62eHNoKAQl0hdJinpLS4ik';
              const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

              return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
              });
            });
        })
        .then(subscription => {
          return fetch('/api/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
          });
        })
        .catch(err => console.error('Erro ao registrar o Service Worker ou inscrever-se:', err));
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <aside className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-2xl font-bold text-center mb-6">Fofura de Pelo</h1>
          <nav className="flex flex-col gap-4">
            <NavLink to="/" className={({ isActive }) => isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'}>Dashboard</NavLink>
            <NavLink to="/produtos" className={({ isActive }) => isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'}>Produtos</NavLink>
            <NavLink to="/relatorios" className={({ isActive }) => isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'}>Relatórios</NavLink>
            <NavLink to="/configuracoes" className={({ isActive }) => isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'}>Configurações</NavLink>
            <NavLink to="/usuario" className={({ isActive }) => isActive ? 'bg-gray-700 p-2 rounded text-white' : 'hover:bg-gray-700 p-2 rounded'}>Usuário</NavLink>
            <NavLink to="/movimentacoes" className={({ isActive }) => isActive ? 'bg-purple-700 p-2 rounded text-white text-center' : 'bg-purple-500 hover:bg-purple-700 p-2 rounded text-white text-center'}>Movimentações</NavLink>
            <NavLink to="/add-product" className="bg-blue-500 hover:bg-blue-700 p-2 rounded text-white text-center">Adicionar Produto</NavLink>
            <NavLink to="/login" className="bg-green-500 hover:bg-green-700 p-2 rounded text-white text-center">Login</NavLink>
          </nav>
        </aside>

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
            <Route path="/login" element={<Login />} />
            <Route path="/editar-conta" element={<EditAccount />} />
            <Route path="/alterar-senha" element={<ChangePassword />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
