import express from 'express';
import { addEnvironmentToUser, addEnvironmentToUserByName, getTopAreasWithActiveEnvironments } from '../controllers/userController.js';

const router = express.Router();

router.post('/environments/:uuid', addEnvironmentToUser);
router.post('/environments/:name', addEnvironmentToUserByName);
router.get('/environments/top-areas-active', getTopAreasWithActiveEnvironments);

export default router;
