import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

export async function findUserByEmail(email) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(data) {
  const [user] = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
    });
  return user;
}

export async function createSession(
  sessionId,
  userId,
  expiresAt
) {
  const [session] = await db
    .insert(sessions)
    .values({
      sessionId,
      userId,
      expiresAt,
    })
    .returning();

  return session;
}

export async function findValidSession(sessionId) {
  const [result] = await db
    .select({
      sessionId: sessions.sessionId,
      userId: users.id,
      username: users.username,
      email: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.sessionId, sessionId),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return result ?? null;
}

export async function deleteSession(sessionId) {
  await db
    .delete(sessions)
    .where(eq(sessions.sessionId, sessionId));
}
