const bcrypt = require('bcrypt'); // Importa o bcrypt para criptografar a senha

async function gerarHash() {
  const senha = 'MariaPietra24$#'; // Aqui está a senha atual que você usa
  const saltRounds = 10; // Define o número de rounds para gerar o "salt" (padrão de segurança)
  
  try {
    const hash = await bcrypt.hash(senha, saltRounds); // Criptografa a senha
    console.log('Senha Criptografada:', hash); // Mostra o hash da senha no terminal
  } catch (error) {
    console.error('Erro ao gerar o hash:', error);
  }
}

gerarHash();
