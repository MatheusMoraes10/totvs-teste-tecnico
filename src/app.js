import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from "./routes/index.js";
import User from './models/User.js'; // Importa o modelo de usuário
import axios from 'axios'; // Para realizar a requisição ao arquivo JSON externo

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Função para buscar as configurações do JSON externo
export const fetchConfigFromJson = async () => {
  try {
    const response = await axios.get('https://manifest.engpro.totvs.com.br/apiConfig.json');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar configurações do JSON:', error);
    return null;
  }
};

routes(app);

// Função para buscar os dados do JSON externo
const fetchDataFromJson = async () => {
  try {
    const response = await axios.get('https://manifest.engpro.totvs.com.br/apiData.json');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados do JSON:', error);
    return null;
  }
};

// Função para povoar o banco de dados
const populateDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('Nenhum usuário encontrado, iniciando povoamento do banco de dados...');
      
      const usersData = await fetchDataFromJson();
      
      if (usersData) {
        await User.insertMany(usersData);
        console.log('Banco de dados populado com sucesso.');
      } else {
        console.error('Falha ao obter os dados de usuários.');
      }
    } else {
      console.log('Banco de dados já possui usuários, não é necessário povoamento.');
    }
  } catch (error) {
    console.error('Erro ao povoar banco de dados:', error);
  }
};

// Conexão com o MongoDB e inicialização do servidor
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Povoar o banco de dados caso não tenha usuários
    await populateDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro de conexão:', error);
  }
};

startServer();
