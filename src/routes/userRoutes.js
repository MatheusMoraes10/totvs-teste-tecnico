import express from 'express';
import { createUser, getActiveUsersIn2024, getAllUsers, getUserByIdOrName, updateUserIsActive, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/users', createUser);
router.get('/active-2024', getActiveUsersIn2024);
router.get('/users', getAllUsers);
router.get('/users/:identifier', getUserByIdOrName);
router.put('/users/forfalse/:identifier', updateUserIsActive);
router.delete('/users/delete/:identifier', deleteUser);

export default router;
