import express from "express";
import UserManager from "../dao/UserManager.js";
import passport from "passport";
import { createHash, passportCall, authorization } from "../../utils.js";
import UserController from "../controllers/userController.js";
import AuthController from "../controllers/authController.js";
import errorHandler from "../middlewares/errorHandler.js";
import sendResetPasswordEmail from "../controllers/resetPasawordController.js";
import bodyParser from "body-parser";
import { userModel } from "../models/user.models.js";

const PRIVATE_KEY = "S3CR3T0";

const router = express.Router();
const UM = new UserManager();
const userController = new UserController();
const authController = new AuthController();

router.post("/login", (req, res, next) => authController.login(req, res, next));

router.post("/register", userController.register.bind(userController));


router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
  async (req, res) => {}
);

router.get(
  "/githubcallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("GitHub Callback Route");
    authController.githubCallback(req, res);
  }
);
router.post("/logout", (req, res) => authController.logout(req, res));

router.get("/current", passportCall("jwt"), authorization("user"), (req, res) => {
  userController.currentUser(req, res);
});

router.use(bodyParser.urlencoded({ extended: true }));

router.post('/restore-password', async (req, res) => {
  const { email } = req.body;

  try {
    await sendResetPasswordEmail(email);
    res.send('Se ha enviado un enlace de restablecimiento de contraseña a tu correo electrónico.');
  } catch (error) {
    console.error('Error in sendResetPasswordEmail:', error);
    res.status(500).send('Hubo un error al procesar tu solicitud de restablecimiento de contraseña. ' + error.message);
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('Las contraseñas no coinciden.');
  }

  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user || (user.resetPasswordExpires && user.resetPasswordExpires < Date.now())) {
      return res.status(400).json({
        message: 'El token de restablecimiento de contraseña es inválido o ha expirado.',
        tokenExpired: true 
      });
    }

    const newHash = createHash(password);

    if (newHash === user.password) {
      return res.status(400).send('La nueva contraseña debe ser diferente a la contraseña actual.');
    }

    user.password = newHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.send('Tu contraseña ha sido actualizada con éxito.');
  } catch (error) {
    console.error('Error al resetear la contraseña:', error);
    res.status(500).send('Error interno del servidor al intentar actualizar la contraseña.');
  }
});


router.use(errorHandler);

export default router;
