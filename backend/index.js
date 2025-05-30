// index.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // atualizado para bcrypt puro
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const webpush = require('web-push');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
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

// 📌 Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 📌 Configuração do Multer para usar o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
      folder: "fofura_de_pelo", // Nome da pasta no Cloudinary
      format: async (req, file) => 'png', // Salva as imagens em PNG
      public_id: (req, file) => Date.now() + '-' + file.originalname.replace(/\s/g, "_") // Nome do arquivo
  }
});

const upload = multer({ storage: storage });

// Configuração do VAPID para notificações push
webpush.setVapidDetails(
  'mailto:admin@fofuradepelo.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log('🚨 Token não fornecido!');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.log('🚨 Token inválido ou expirado!');
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    console.log('✅ Token validado com sucesso!');
    next();
  });
};

// Armazenar assinaturas (idealmente em um banco de dados)
let subscriptions = [];

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Assinatura salva com sucesso!' });
});

// Função para enviar notificação
const sendNotification = async (message) => {
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(message));
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }
};

// Registrar movimentação de estoque
app.post('/api/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const { produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida } = req.body;

    const produtoResult = await pool.query('SELECT nome, preco, quantidade AS estoque_atual FROM produtos WHERE id = $1', [produto_id]);
    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const { nome, preco, estoque_atual } = produtoResult.rows[0];
    let valor_total = preco * quantidade;

    if ((tipo_movimentacao === 'venda' || tipo_movimentacao === 'saida') && estoque_atual < quantidade) {
      return res.status(400).json({ error: 'Estoque insuficiente para a movimentação.' });
    }

    const result = await pool.query(
      'INSERT INTO movimentacoes (produto_id, tipo_movimentacao, quantidade, responsavel, observacoes, tipo_saida, valor_total, empresa_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [produto_id, tipo_movimentacao, quantidade, responsavel || 'Não informado', observacoes || '', tipo_saida || null, valor_total, req.user.empresa_id]
    );

    const updateQuery = tipo_movimentacao === 'entrada'
      ? 'UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2'
      : 'UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2';

    await pool.query(updateQuery, [quantidade, produto_id]);

    res.status(201).json(result.rows[0]);

    // Enviar notificação
    sendNotification({
      title: '📦 Movimentação de Estoque',
      body: `Produto: ${nome}\nMovimentação: ${tipo_movimentacao}\nQuantidade: ${quantidade}\nResponsável: ${responsavel || 'Não informado'}`,
    });

  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ mensagem: 'Usuário não encontrado' });
    }
    const user = result.rows[0];
    console.log('🔑 Tentativa de login');
console.log('📧 Email recebido:', email);
console.log('🔐 Hash no banco:', user.senha);
console.log('🧪 Senha digitada:', senha.trim());

const passwordMatch = await bcrypt.compare(senha.trim(), user.senha);
console.log('✅ Resultado da comparação:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ mensagem: 'Senha incorreta' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, empresa_id: user.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({
      mensagem: 'Login bem-sucedido',
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        empresa_id: user.empresa_id
      }
    });
  } catch (erro) {
    console.error('Erro interno no login:', erro);
    res.status(500).json({ mensagem: 'Erro interno no servidor' });
  }
});

// 🚧 Rota temporária para gerar hash com bcryptjs (remova após uso)
app.get('/api/hash', async (req, res) => {
  const senha = 'agro123';
  const hash = await bcrypt.hash(senha, 10);
  console.log('🔐 Hash gerado via /api/hash:', hash);
  res.send({ senha, hash });
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

// Atualizar um produto existente
app.put('/api/products/:id', authenticateToken, upload.single('imagem'), async (req, res) => {
  try {
      const { id } = req.params;
      const { nome, descricao, tipo, categoria, validade, preco, quantidade } = req.body;

      let imagem = req.file ? req.file.path : null; // URL da nova imagem no Cloudinary

      // Se nenhuma imagem nova for enviada, mantém a imagem atual do produto
      if (!imagem) {
          const produtoAtual = await pool.query('SELECT imagem FROM produtos WHERE id = $1', [id]);
          if (produtoAtual.rows.length > 0) {
              imagem = produtoAtual.rows[0].imagem;
          }
      }

      const result = await pool.query(
          'UPDATE produtos SET nome = $1, descricao = $2, tipo = $3, categoria = $4, validade = $5, preco = $6, quantidade = $7, imagem = $8 WHERE id = $9 RETURNING *',
          [nome, descricao, tipo, categoria, validade, preco, quantidade, imagem, id]
      );

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

    // Verifica se o produto existe antes de excluir
    const produtoExistente = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);

    if (produtoExistente.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verifica se há movimentações associadas ao produto
    const movimentacoes = await pool.query('SELECT * FROM movimentacoes WHERE produto_id = $1', [id]);

    if (movimentacoes.rowCount > 0) {
      return res.status(400).json({ error: 'Não é possível excluir o produto porque há movimentações associadas.' });
    }

    // Exclui o produto
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);

    res.status(200).json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Duplicar produtos
app.post('/api/products/duplicate/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o produto original no banco de dados
    const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const produto = result.rows[0];

    // Criar um novo produto com os mesmos dados (exceto o ID)
    const novoProduto = await pool.query(
      `INSERT INTO produtos (nome, descricao, tipo, categoria, especie, validade, preco, quantidade, imagem, empresa_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        produto.nome + ' (Cópia)', // Nome diferente para evitar conflito
        produto.descricao,
        produto.tipo,
        produto.categoria,
        produto.especie,
        produto.validade,
        produto.preco,
        produto.quantidade,
        produto.imagem,
        req.user.empresa_id
      ]
    );

    res.status(201).json(novoProduto.rows[0]);

  } catch (error) {
    console.error('Erro ao duplicar produto:', error);
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

// Excluir uma movimentação existente
app.delete('/api/movimentacoes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se a movimentação existe antes de excluir
    const result = await pool.query('DELETE FROM movimentacoes WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Movimentação não encontrada' });
    }

    res.json({ message: 'Movimentação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Adicionar um novo produto
app.post('/api/products', authenticateToken, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, tipo, categoria, especie, validade, preco, quantidade } = req.body;
    const imagem = req.file ? req.file.path : null; // URL do Cloudinary

    // Verificação básica de campos obrigatórios
    if (!nome || !preco || !especie) {
      return res.status(400).json({ error: 'Nome, preço e espécie são obrigatórios.' });
    }

    const result = await pool.query(
      'INSERT INTO produtos (nome, descricao, tipo, categoria, especie, validade, preco, quantidade, imagem, empresa_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [nome, descricao, tipo, categoria, especie, validade, preco, quantidade || 0, imagem, req.user.empresa_id]
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
