const pool = require('../config/db');

// Obter todos os produtos
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Criar novo produto
exports.createProduct = async (req, res) => {
  const { name, quantity } = req.body;
  try {
    await pool.query('INSERT INTO products (name, quantity) VALUES ($1, $2)', [name, quantity]);
    res.status(201).json({ message: 'Produto criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Atualizar produto
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, quantity } = req.body;
  try {
    await pool.query('UPDATE products SET name = $1, quantity = $2 WHERE id = $3', [name, quantity, id]);
    res.json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deletar produto
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Produto deletado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
