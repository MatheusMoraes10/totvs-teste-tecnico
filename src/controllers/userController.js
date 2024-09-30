import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fetchConfigFromJson } from '../app.js';

// Função para obter a configuração
const getConfig = async () => {
  const config = await fetchConfigFromJson();
  return config; // Retorna a configuração obtida
};

// Lógica para ler apiConfig Localmente na raiz
// const configPath = path.join(process.cwd(), 'apiConfig.json'); // Caminho para o arquivo de configuração
// let config;

// try {
//   // Lê o arquivo de configuração uma vez para ser utilizado nas funções
//   const configData = fs.readFileSync(configPath, 'utf-8');
//   config = JSON.parse(configData);
// } catch (error) {
//   console.error('Erro ao ler as configurações:', error);
// }

// Função para obter todos os usuários
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error });
  }
};

// Função para criar novo usuário
export const createUser = async (req, res) => {
  const config = await getConfig();

  if (!config || !config.canInclude) {
    return res.status(403).json({ message: 'Inclusão não permitida pelas configurações' });
  }

  try {
    const userData = req.body;

    // Verifique se environments não está vazio e se contém o formato correto
    if (userData.environments && userData.environments.length > 0) {
      const user = await User.create(userData);
      res.status(201).json(user);
    } else {
      return res.status(400).json({ message: 'É necessário incluir ao menos um ambiente.' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar usuário', error });
  }
};

// Função para adicionar ambiente a usuário por id ou nome
export const addEnvironmentToUser = async (req, res) => {
  const { identifier } = req.params; // Pode ser o UUID ou o nome
  const newEnvironment = req.body; 
  const config = await getConfig(); // Obtém as configurações do arquivo externo

  if (!config || !config.canInclude) {
    return res.status(403).json({ message: 'Inclusão de ambientes não permitida pelas configurações' });
  }

  try {
    // Localiza o usuário pelo uuid ou pelo nome
    const user = await User.findOne({
      $or: [{ uuid: identifier }, { name: new RegExp(identifier, 'i') }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Conta quantos ambientes ativos o usuário já tem
    const activeEnvironmentsCount = user.environments.filter(env => env.active).length;

    // Verifica se o usuário já atingiu o limite de ambientes ativos
    if (activeEnvironmentsCount >= config.maxActiveEnv && newEnvironment.active !== false) {
      return res.status(400).json({
        message: `Usuário já possui o máximo de ${config.maxActiveEnv} ambientes ativos. Não é possível adicionar mais ambientes ativos.`
      });
    }

    // Adiciona o novo ambiente
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { environments: newEnvironment } },
      { new: true, runValidators: true } // Retorna o usuário atualizado e valida o novo ambiente
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao adicionar ambiente', error });
  }
};

export const getActiveUsersIn2024 = async (req, res) => {
  try {
    // Define as datas de início e fim do ano de 2024
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');

    // Faz a consulta por usuários ativos e com ambientes que expiram em 2024
    const users = await User.find({
      active: true,
      $or: [
        { lastSession: { $gte: startOf2024, $lte: endOf2024 } },  // Usuários com lastSession em 2024
        { 'environments.expirationDate': { $gte: startOf2024, $lte: endOf2024 } }  // Usuários com ambientes expirando em 2024
      ]
    });

    // Verifica se encontrou usuários
    if (users.length === 0) {
      return res.status(404).json({ message: 'Nenhum usuário ativo encontrado em 2024' });
    }

    // Retorna os usuários encontrados
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao buscar usuários ativos em 2024', error });
  }
};

// Função para consultar um usuário específico pelo UUID ou nome
export const getUserByIdOrName = async (req, res) => {
  const { identifier } = req.params; // Pode ser o UUID ou o nome

  try {
    const user = await User.findOne({
      $or: [{ uuid: identifier }, { name: new RegExp(identifier, 'i') }] // Busca pelo UUID ou nome, insensível a maiúsculas/minúsculas
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error });
  }
};

// Função para atualizar o campo 'active' de um usuário específico para false
export const updateUserIsActive = async (req, res) => {
  const { identifier } = req.params; // Pode ser o UUID ou o nome
  const config = await getConfig();

  if (!config || !config.canUpdate) {
    return res.status(403).json({ message: 'Atualização não permitida pelas configurações' });
  }

  try {
    // Busca por UUID ou nome e atualiza o campo 'active' para false
    const user = await User.findOneAndUpdate(
      { $or: [{ uuid: identifier }, { name: new RegExp(identifier, 'i') }] },
      { active: false },
      { new: true } // Retorna o documento atualizado
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso', user });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar o usuário', error });
  }
};

// Função para retornar as 5 áreas com maior número de ambientes ativos
export const getTopAreasWithActiveEnvironments = async (req, res) => {
  try {
    const topAreas = await User.aggregate([
      // Desagregação dos ambientes
      { $unwind: "$environments" },
      // Filtragem para ambientes ativos
      { $match: { "environments.active": true } },
      // Agrupamento por área (squad) e contagem de ambientes ativos
      {
        $group: {
          _id: "$squad", // Agrupa por área
          totalActiveEnvironments: { $sum: 1 } // Conta o total de ambientes ativos
        }
      },
      // Ordenação decrescente pelo número de ambientes ativos
      { $sort: { totalActiveEnvironments: -1 } },
      // Limita os resultados às 5 áreas
      { $limit: 5 }
    ]);

    // Retorna as áreas encontradas
    res.status(200).json(topAreas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar áreas com ambientes ativos', error });
  }
};

// Função para deletar um usuário
export const deleteUser = async (req, res) => {
  const { identifier } = req.params; // Pode ser o UUID ou o nome
  const config = await getConfig();

  if (!config || !config.canDelete) {
    return res.status(403).json({ message: 'Deleção não permitida pelas configurações' });
  }

  try {
    // Tenta deletar o usuário
    const user = await User.findOneAndDelete(
      { $or: [{ uuid: identifier }, { name: new RegExp(identifier, 'i') }] } // Busca por UUID ou nome
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar o usuário', error });
  }
};
