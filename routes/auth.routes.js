import express from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { validateBody } from "../middleware/validateBody.js";
import { checkAuth } from "../middleware/checkAuth.js";
import {registerSchema,loginSchema,} from "../validation-schemas/auth.js";
import {findUserByEmail,createUser,createSession,deleteSession,} from "../queries/auth.queries.js";
export const authRouter = express.Router();


const COOKIE_NAME = "blog_session";

const SESSION_DURATION =7 * 24 * 60 * 60 * 1000;

const isProduction =process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};


authRouter.post("/auth/register",validateBody(registerSchema),async (req, res) => {
    const {username,email,password,} = req.body;

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(422).json({
        errors: {
          email: {
            errors: ["email already in use"],
          },
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      await createUser({
        username,
        email,
        passwordHash,
      });
    } catch (error) {
      if (error.code === "23505" ||error.cause?.code === "23505") {
        return res.status(422).json({
          errors: {
            email: {
              errors: ["email already in use"],
            },
          },
        });
      }
      throw error;
    }

    return res.status(201).json({
      message: "register successful, you can now login",
    });
  }
);

authRouter.post("/auth/login",validateBody(loginSchema),async (req, res) => {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    const validPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !validPassword) {
      return res.status(401).json({
        error: "invalid email or password",
      });
    }

    const sessionId = randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION
    );

    await createSession(
      sessionId,
      user.id,
      expiresAt
    );

    res.cookie(COOKIE_NAME, sessionId, {
      ...cookieOptions,
      maxAge: SESSION_DURATION,
    });

    return res.status(200).json({
      message: "login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
    });
  }
);

authRouter.get("/auth/me",checkAuth,(req, res) => {
    return res.status(200).json({
      data: {
        user: req.user,
      },
    });
  }
);

authRouter.post("/auth/logout",async (req, res) => {
    const sessionId = req.cookies?.blog_session;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    res.clearCookie(COOKIE_NAME, cookieOptions);

    return res.status(200).json({
      message: "logout successful",
    });
  }
);
