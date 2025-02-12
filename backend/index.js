// index.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const webpush = require('web-push');
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

// Configuração do VAPID para notificações push
webpush.setVapidDetails(
  'mailto:admin@fofuradepelo.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

// Rota para registrar assinaturas de notificação
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  res.status(201).json({});

  const payload = JSON.stringify({ title: 'Bem-vindo!', body: 'Agora você receberá notificações.' });

  webpush.sendNotification(subscription, payload).catch(error => console.error(error));
});

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
    console.log(`Tentativa de login para o e-mail: ${email}`);

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log('❌ Usuário não encontrado no banco de dados.');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    console.log('✅ Usuário encontrado:', user);
    console.log('🔑 Senha fornecida:', senha);
    console.log('🔐 Hash da senha no banco:', user.senha);

    const passwordMatch = await bcrypt.compare(senha, user.senha);
    console.log('🔍 Comparação da senha:', passwordMatch);

    if (!passwordMatch) {
      console.log('❌ Senha incorreta.');
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, empresa_id: user.empresa_id },
      SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Login bem-sucedido. Token gerado:', token);
    res.json({ token });
  } catch (error) {
    console.error('❌ Erro interno no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Dashboard com restrição por empresa
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    let condition = '';
    let params = [];

    if (req.user.role !== 'admin') {
      condition = 'WHERE empresa_id = $1';
      params = [req.user.empresa_id];
    }

    const totalProdutos = await pool.query(`SELECT COUNT(*) FROM produtos ${condition};`, params);
    const totalEstoque = await pool.query(`SELECT COALESCE(SUM(quantidade), 0) AS total FROM produtos ${condition};`, params);
    
    const valorTotalQuery = `
      SELECT COALESCE(SUM(preco * quantidade), 0) AS valor_total
      FROM produtos
      ${req.user.role !== 'admin' ? 'WHERE empresa_id = $1' : ''};
    `;
    const valorTotal = await pool.query(`
      SELECT COALESCE(SUM(preco * quantidade), 0) AS valor_total
      FROM produtos
      ${req.user.role !== 'admin' ? 'WHERE empresa_id = $1' : ''};
    `, params);

    const produtosPorCategoria = await pool.query(
      `SELECT categoria, COUNT(*) AS quantidade FROM produtos ${condition} GROUP BY categoria;`,
      params
    );

    const vendasMensaisQuery = `
      SELECT TO_CHAR(data_movimentacao, 'YYYY-MM') AS mes, 
             COALESCE(SUM(valor_total), 0) AS total_vendas
      FROM movimentacoes
      ${req.user.role !== 'admin' ? 'WHERE empresa_id = $1 AND tipo_movimentacao = \'venda\'' : 'WHERE tipo_movimentacao = \'venda\''}
      GROUP BY mes
      ORDER BY mes;
    `;

    const vendasMensais = await pool.query(vendasMensaisQuery, params);

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

// 📦 Rota protegida para produtos
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM produtos';
    const params = [];

    // 🚀 Se o usuário for 'petshop', mostra apenas os produtos da empresa dele
    if (req.user.role === 'petshop') {
      query += ' WHERE empresa_id = $1';
      params.push(req.user.empresa_id);
    }

    // ✅ Para o 'admin', mostra todos os produtos sem filtro
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

    const produtoResult = await pool.query('SELECT nome FROM produtos WHERE id = $1', [produto_id]);

    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const produto = produtoResult.rows[0].nome;

    const result = await pool.query(
      'INSERT INTO movimentacoes (produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida]
    );

 // ✅ Envio de notificação após a movimentação
 const payload = JSON.stringify({
  title: 'Movimentação de Estoque',
  body: `Uma nova movimentação do tipo ${tipo_movimentacao} foi registrada para o produto ${produto}.`
});

subscriptions.forEach(subscription => {
  webpush.sendNotification(subscription, payload).catch(error => console.error(error));
});

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
    const { nome, descricao, preco, quantidade } = req.body;

    const result = await pool.query(
      'UPDATE produtos SET nome = $1, descricao = $2, preco = $3, quantidade = $4 WHERE id = $5 RETURNING *',
      [nome, descricao, preco, quantidade, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Excluir um produto
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Consultar o histórico de movimentações
app.get('/api/movimentacoes', authenticateToken, async (req, res) => {
  try {
    let query;
    const params = [];

    if (req.user.role === 'admin') {
      // ✅ Admin acessa todas as movimentações
      query = 'SELECT * FROM movimentacoes ORDER BY data_movimentacao DESC';
    } else {
      // ✅ Petshop acessa apenas suas movimentações
      query = 'SELECT * FROM movimentacoes WHERE empresa_id = $1 ORDER BY data_movimentacao DESC';
      params.push(req.user.empresa_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Adicionar um novo produto
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { nome, descricao, tipo, categoria, especie, validade, preco, quantidade } = req.body;

    // Verificação básica de campos obrigatórios
    if (!nome || !preco || !especie) {
      return res.status(400).json({ error: 'Nome, preço e espécie são obrigatórios.' });
    }

    const result = await pool.query(
      'INSERT INTO produtos (nome, descricao, tipo, categoria, especie, validade, preco, quantidade, empresa_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [nome, descricao, tipo, categoria, especie, validade, preco, quantidade || 0, req.user.empresa_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Nova rota para obter informações do usuário autenticado
app.get('/api/usuario', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT nome, email FROM usuarios WHERE id = $1', [req.user.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configuração do Web Push
const VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:admin@fofuradepelo.com', // Coloque seu email
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

// Armazenar assinaturas (idealmente em um banco de dados)
let subscriptions = [];

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Assinatura salva com sucesso!' });
});

const sendNotification = (payload) => {
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => console.error(err));
  });
};

// Exemplo de trigger de notificação após movimentação
app.post('/api/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const { produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida } = req.body;

    const produtoResult = await pool.query('SELECT nome FROM produtos WHERE id = $1', [produto_id]);

    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const produto = produtoResult.rows[0].nome;

    const result = await pool.query(
      'INSERT INTO movimentacoes (produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida]
    );

    // Enviar notificação
    sendNotification({
      title: 'Nova Movimentação de Estoque',
      body: `Movimentação de ${quantidade} unidade(s) do produto ${produto}.`
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
