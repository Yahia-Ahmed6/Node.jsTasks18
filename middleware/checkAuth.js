import { findValidSession } from "../queries/auth.queries.js";

export async function checkAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.blog_session;
    if (!sessionId) {
      return res.status(401).json({
        error: "invalid session",
      });
    }
    const session = await findValidSession(sessionId);

    if (!session) {
      return res.status(401).json({
        error: "invalid session",
      });
    }

    req.user = {
      id: session.userId,
      username: session.username,
      email: session.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}
