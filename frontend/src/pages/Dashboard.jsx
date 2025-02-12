import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalEstoque: 0,
    valorTotal: 0,
    produtosPorCategoria: [],
    vendasMensais: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token não encontrado. Faça login novamente.');
          return;
        }

        const API_BASE_URL = "https://fofura-backend.onrender.com"; // URL do backend no Render
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // ✅ Verifica se o token está correto
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();  // ✅ Aqui a variável 'data' é inicializada corretamente
        console.log('Dados recebidos do dashboard:', data);

        setStats({
          totalProdutos: data.totalProdutos || 0,
          totalEstoque: data.totalEstoque || 0,
          valorTotal: data.valorTotal || 0,
          produtosPorCategoria: data.produtosPorCategoria || [],
          vendasMensais: data.vendasMensais || [],
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
      }
    };

    fetchStats();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500 text-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Total de Produtos</h3>
          <p className="text-3xl">{stats.totalProdutos}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Total em Estoque</h3>
          <p className="text-3xl">{stats.totalEstoque}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Valor Total</h3>
          <p className="text-3xl">{stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-center mb-2">Produtos por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.produtosPorCategoria}>
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" fill="#8884d8">
                {stats.produtosPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-center mb-2">Vendas Mensais</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.vendasMensais}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${parseFloat(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="total_vendas" fill="#82ca9d">
                {stats.vendasMensais.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
