import express from 'express';
import { addEnvironmentToUser, getTopAreasWithActiveEnvironments } from '../controllers/userController.js';

const router = express.Router();

router.post('/environments/:identifier', addEnvironmentToUser);
router.get('/environments/top-areas-active', getTopAreasWithActiveEnvironments);

export default router;
