import {pgTable,serial,integer,varchar,text,timestamp,primaryKey,} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  username: varchar("username", {
    length: 100,
  }).notNull(),

  email: varchar("email", {
    length: 255,
  }).notNull().unique(),

  passwordHash: text("password_hash").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),

  sessionId: varchar("session_id", {
    length: 64,
  }).notNull().unique(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  expiresAt: timestamp("expires_at", {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  content: text("content").notNull(),

  image: text("image"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),

  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, {
      onDelete: "cascade",
    }),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  content: text("content").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const likes = pgTable(
  "likes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.postId],
    }),
  ]
);


export const usersRelations = relations(
  users,
  ({ many }) => ({
    sessions: many(sessions),
    posts: many(posts),
    comments: many(comments),
    likes: many(likes),
  })
);

export const sessionsRelations = relations(
  sessions,
  ({ one }) => ({
    user: one(users, {
      fields: [sessions.userId],
      references: [users.id],
    }),
  })
);

export const postsRelations = relations(
  posts,
  ({ one, many }) => ({
    author: one(users, {
      fields: [posts.userId],
      references: [users.id],
    }),
    comments: many(comments),
    likes: many(likes),
  })
);

export const commentsRelations = relations(
  comments,
  ({ one }) => ({
    post: one(posts, {
      fields: [comments.postId],
      references: [posts.id],
    }),
    author: one(users, {
      fields: [comments.userId],
      references: [users.id],
    }),
  })
);

export const likesRelations = relations(
  likes,
  ({ one }) => ({
    post: one(posts, {
      fields: [likes.postId],
      references: [posts.id],
    }),
    user: one(users, {
      fields: [likes.userId],
      references: [users.id],
    }),
  })
);
