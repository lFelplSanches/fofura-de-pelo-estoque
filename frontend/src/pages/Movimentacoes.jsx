import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config'; // ✅ Importação da URL da API

function Movimentacoes() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacao, setMovimentacao] = useState({
    produto_id: '',
    tipo_movimentacao: '',
    quantidade: 0,
    responsavel: '',
    observacoes: '',
    tipo_saida: '',
  });

    useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const token = localStorage.getItem('token');  // ✅ Verificação do token
        if (!token) {
          console.error('Token não encontrado. Faça login novamente.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/products`, { // ✅ URL atualizada
          headers: {
            'Authorization': `Bearer ${token}`,  // ✅ Inclusão do token
          },
        });
        const data = await response.json();
        console.log('Produtos recebidos:', data);  // ✅ Debug para verificação do retorno
        setProdutos(Array.isArray(data) ? data : []);  // ✅ Garante que seja um array
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    fetchProdutos();
  }, []);

  useEffect(() => {
    const subscribeToPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
  
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            const VAPID_PUBLIC_KEY = "BPBoEj2dWqS5X8ZFXONejTAEL7o9CPNO_EzJaGSjMuQs8KWhntkaKvbjYHhG98IJd62eHNoKAQl0hdJinpLS4ik";
            const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey // ✅ Correção: chave VAPID corretamente posicionada
            });
          }
  
          await fetch(`${API_BASE_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });
  
          console.log('✅ Inscrição concluída para notificações push!');
        } catch (error) {
          console.error('❌ Erro ao se inscrever para notificações push:', error);
        }
      }
    };
  
    subscribeToPush();
  }, []);
  
  // ✅ Função auxiliar para converter a chave VAPID
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMovimentacao((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (movimentacao.quantidade <= 0) {  // ✅ Validação da quantidade
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/movimentacoes`, { // ✅ URL atualizada
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // ✅ Inclusão do token
        },
        body: JSON.stringify(movimentacao),
      });

      if (response.ok) {
        alert('Movimentação registrada com sucesso!');
        setMovimentacao({
          produto_id: '',
          tipo_movimentacao: '',
          quantidade: 0,
          responsavel: '',
          observacoes: '',
          tipo_saida: '',
        });
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Registrar Movimentação</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Produto:</label>
          <select
            name="produto_id"
            value={movimentacao.produto_id}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          >
            <option value="">Selecione um produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tipo de Movimentação:</label>
          <select
            name="tipo_movimentacao"
            value={movimentacao.tipo_movimentacao}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          >
            <option value="">Selecione</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="venda">Venda</option>
          </select>
        </div>

        {movimentacao.tipo_movimentacao === 'venda' && (
          <div>
            <label>Tipo de Saída:</label>
            <select
              name="tipo_saida"
              value={movimentacao.tipo_saida}
              onChange={handleChange}
              required
              className="border p-2 w-full"
            >
              <option value="">Selecione o tipo de saída</option>
              <option value="venda">Venda</option>
              <option value="troca">Troca</option>
              <option value="devolucao">Devolução</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        )}

        <div>
          <label>Quantidade:</label>
          <input
            type="number"
            name="quantidade"
            value={movimentacao.quantidade}
            onChange={handleChange}
            required
            min="1"
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Responsável:</label>
          <input
            type="text"
            name="responsavel"
            value={movimentacao.responsavel}
            onChange={handleChange}
            className="border p-2 w-full"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label>Observações:</label>
          <textarea
            name="observacoes"
            value={movimentacao.observacoes}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Registrar Movimentação
        </button>
      </form>
    </div>
  );
}

export default Movimentacoes;
