import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateError } from '../helpers.js';
import { createUser, getUserById, getUserByEmail } from '../db/users.js';
import { getReelsByUserId } from '../db/reels.js';

const updateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;
    const existingUser = await getUserById(id);
    
    if (!existingUser) {
      throw generateError('El usuario no existe', 404);
    }

    if (email) {
      existingUser.email = email;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
    }

    await updateUserById(id, existingUser);

    res.send({
      status: 'ok',
      message: 'Usuario actualizado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

const newUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Esto debería ser sustituido por joi
    if (!email || !password) {
      throw generateError('Debes enviar un email y una password', 400);
    }

    const id = await createUser(email, password);

    res.send({
      status: 'ok',
      message: `User created with id: ${id}`,
    });
  } catch (error) {
    next(error);
  }
};

const getUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    res.send({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserReelsController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userReels = await getReelsByUserId(id);

    res.send({
      status: 'ok',
      data: userReels,
    });
  } catch (error) {
    next(error);
  }
};

const getMeController = async (req, res, next) => {
  try {
    const user = await getUserById(req.userId, false);

    res.send({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw generateError('Debes enviar un email y una password', 400);
    }

    // Recojo los datos de la base de datos del usuario con ese mail
    const user = await getUserByEmail(email);

    // Compruebo que las contraseñas coinciden
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw generateError('La contraseña no coincide', 401);
    }

    // Creo el payload del token
    const payload = { id: user.id };

    // Firmo el token
    const token = jwt.sign(payload, process.env.SECRET, {
      expiresIn: '30d',
    });

    // Envío el token
    res.send({
      status: 'ok',
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

export {
  newUserController,
  getUserController,
  getUserReelsController,
  getMeController,
  loginController,
  updateUserController,
};
