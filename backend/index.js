// index.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET = process.env.JWT_SECRET;

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Registro de novos petshops (Apenas Admin)
app.post('/api/register', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { nome, email, senha, empresa_id } = req.body;
  const hashedPassword = await bcrypt.hash(senha, 10);

  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, role, empresa_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, email, hashedPassword, 'petshop', empresa_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário', details: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    console.log('Tentativa de login para o e-mail:', email); 

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log('❌ Usuário não encontrado.');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    console.log('✅ Usuário encontrado:', user); 
    console.log('Senha digitada:', senha); 
    console.log('Hash da senha no banco:', user.senha); 

    const passwordMatch = await bcrypt.compare(senha, user.senha); // Verificação de senha
    if (!passwordMatch) {
      console.log('❌ Senha incorreta.');
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, empresa_id: user.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Login bem-sucedido.');
    res.json({ token });
  } catch (error) {
    console.error('❌ Erro interno no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Dashboard com restrição por empresa
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const totalProdutos = await pool.query('SELECT COUNT(*) FROM produtos WHERE empresa_id = $1;', [req.user.empresa_id]);
    const totalEstoque = await pool.query('SELECT COALESCE(SUM(quantidade), 0) AS total FROM produtos WHERE empresa_id = $1;', [req.user.empresa_id]);
    const valorTotal = await pool.query('SELECT COALESCE(SUM(preco * quantidade), 0) AS valor_total FROM produtos WHERE empresa_id = $1;', [req.user.empresa_id]);

    const produtosPorCategoria = await pool.query(
      'SELECT categoria, COUNT(*) AS quantidade FROM produtos WHERE empresa_id = $1 GROUP BY categoria;',
      [req.user.empresa_id]
    );

    const vendasMensais = await pool.query(
      `SELECT TO_CHAR(data_movimentacao, 'YYYY-MM') AS mes, SUM(valor_total) AS total_vendas
       FROM movimentacoes WHERE tipo_movimentacao = 'venda' AND empresa_id = $1
       GROUP BY mes ORDER BY mes;`,
      [req.user.empresa_id]
    );

    res.json({
      totalProdutos: parseInt(totalProdutos.rows[0].count, 10),
      totalEstoque: parseInt(totalEstoque.rows[0].total, 10),
      valorTotal: parseFloat(valorTotal.rows[0].valor_total),
      produtosPorCategoria: produtosPorCategoria.rows,
      vendasMensais: vendasMensais.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota protegida para produtos
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM produtos';
    const params = [];

    if (req.user.role === 'petshop') {
      query += ' WHERE empresa_id = $1';
      params.push(req.user.empresa_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Registrar movimentação de estoque
app.post('/api/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const { produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida } = req.body;
    if (!produto_id || !quantidade || quantidade <= 0 || !tipo_movimentacao) {
      return res.status(400).json({ error: 'Dados inválidos para movimentação.' });
    }

    const produtoResult = await pool.query('SELECT preco, quantidade AS estoque_atual FROM produtos WHERE id = $1', [produto_id]);
    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const { preco, estoque_atual } = produtoResult.rows[0];
    let valor_total = 0;

    if (tipo_movimentacao === 'venda') {
      if (estoque_atual < quantidade) {
        return res.status(400).json({ error: 'Estoque insuficiente para a venda.' });
      }
      valor_total = preco * quantidade;
    }

    const result = await pool.query(
      'INSERT INTO movimentacoes (produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida, valor_total) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [produto_id, tipo_movimentacao, quantidade, responsavel || 'Não informado', observacoes || '', tipo_saida || null, valor_total]
    );

    await pool.query('UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2', [quantidade, produto_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Atualizar um produto existente
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, tipo, categoria, especie, validade, preco, quantidade } = req.body;

    const result = await pool.query(
      'UPDATE produtos SET nome = $1, descricao = $2, tipo = $3, categoria = $4, especie = $5, validade = $6, preco = $7, quantidade = $8 WHERE id = $9 RETURNING *',
      [nome, descricao, tipo, categoria, especie, validade, preco, quantidade, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Excluir um produto
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *;', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Consultar o histórico de movimentações
app.get('/api/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movimentacoes WHERE empresa_id = $1 ORDER BY data_movimentacao DESC;', [req.user.empresa_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
