import React, { useEffect, useState } from 'react';

function ListProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Lista de Produtos</h2>
      <table className="min-w-full bg-white border rounded shadow-md">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Nome</th>
            <th className="border px-4 py-2">Espécie</th>
            <th className="border px-4 py-2">Preço (R$)</th>
            <th className="border px-4 py-2">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="border px-4 py-2">{product.id}</td>
              <td className="border px-4 py-2">{product.nome}</td>
              <td className="border px-4 py-2">{product.especie}</td>
              <td className="border px-4 py-2">{parseFloat(product.preco).toFixed(2)}</td>
              <td className="border px-4 py-2">{product.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListProducts;
