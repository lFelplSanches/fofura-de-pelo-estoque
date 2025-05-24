const bcrypt = require('bcryptjs');

const senha = 'admin123';

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
  } else {
    console.log('🔐 Hash gerado:', hash);
  }
});
