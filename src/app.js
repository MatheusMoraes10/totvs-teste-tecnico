import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from "./routes/index.js"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
routes(app);

// Conexão com o MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro de conexão:', error);
  }
};

startServer();
