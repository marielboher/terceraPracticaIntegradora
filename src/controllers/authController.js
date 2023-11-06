import AuthService from "../services/authService.js";
import CustomError from "../services/errors/customError.js";
import EErrors from "../services/errors/errors-enum.js";
import { generateAuthenticationErrorInfo } from "../services/errors/messages/user-auth-error.js";

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await this.authService.login(email, password);
      req.logger.info("User data retrieved:", userData);

      if (!userData || !userData.user) {
        req.logger.error("Invalid credentials");
        const customError = new CustomError({
          name: "Authentication Error",
          message: "Invalid credentials",
          code: 401,
          cause: generateAuthenticationErrorInfo(email), 
        });
        return next(customError);
      }

      if (userData && userData.user) {
        req.session.user = {
            id: userData.user.id || userData.user._id,
            email: userData.user.email,
            first_name: userData.user.firstName || userData.user.first_name,
            last_name: userData.user.lastName || userData.user.last_name,
            age: userData.user.age,
            role: userData.user.role,
            cart: userData.user.cart 
        };
    }

      req.logger.info("Full user data object:", userData.user);

      res.cookie("coderCookieToken", userData.token, {
        httpOnly: true,
        secure: false,
      });
      return res
        .status(200)
        .json({
          status: "success",
          user: userData.user,
          redirect: "/products",
        });
    } catch (error) {
      req.logger.error("An error occurred:", error);
      return next(error);
    }
  }
  async githubCallback(req, res) {
    try {
      if (req.user) {
        req.session.user = req.user;
        req.session.loggedIn = true;
        return res.redirect("/products");
      } else {
        return res.redirect("/login");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return res.redirect("/login");
    }
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/profile");
      }
      return res.redirect("/login");
    });
  }
}

export default AuthController;
