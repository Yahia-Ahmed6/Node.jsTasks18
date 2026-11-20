import "dotenv/config";
import bcrypt from "bcrypt";
import { db, pool } from "./db/index.js";

import {users,posts,comments,likes} from "./db/schema.js";

import { eq , and } from "drizzle-orm";

async function seed() {
  console.log("Starting database seeding...");

  const passwordHash = await bcrypt.hash("Demo@12345",12);

  await db.transaction(async (tx) => {
    // 1. Create demo users if they don't exist
    const demoUsers = [
      {
        username: "Ahmed",
        email: "ahmed.demo@example.com",
      },
      {
        username: "Sara",
        email: "sara.demo@example.com",
      },
      {
        username: "Omar",
        email: "omar.demo@example.com",
      },
    ];

    const createdUsers = [];

    for (const user of demoUsers) {
      await tx
        .insert(users)
        .values({
          ...user,
          passwordHash,
        })
        .onConflictDoNothing({
          target: users.email,
        });

      const [savedUser] = await tx
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (!savedUser) {
        throw new Error(
          `Failed to find demo user: ${user.email}`
        );
      }

      createdUsers.push(savedUser);
    }

    console.log("Demo users ready");



    // Additional programming users
    const programmingUsers = [
      {
        username: "Youssef",
        email: "youssef.dev@example.com",
        posts: [
          "JavaScript Tip: Use const by default and let when a variable needs reassignment.",
          "Node.js allows us to build scalable backend APIs using JavaScript."
        ]
      },
      {
        username: "Mariam",
        email: "mariam.dev@example.com",
        posts: [
          "Python is a great language for learning algorithms and problem solving.",
          "Binary Search works in O(log n) time when the array is sorted."
        ]
      },
      {
        username: "OmarDev",
        email: "omardev@example.com",
        posts: [
          "Java OOP: Encapsulation protects data by using private fields and public methods.",
          "Polymorphism allows overridden methods to behave differently depending on the actual object."
        ]
      },
      {
        username: "Nour",
        email: "nour.dev@example.com",
        posts: [
          "SQL JOIN helps us combine related data from multiple database tables.",
          "Database normalization reduces redundancy and improves data consistency."
        ]
      }
    ];

    for (const demoUser of programmingUsers) {
      // Insert user only if email does not exist
      await tx
        .insert(users)
        .values({
          username: demoUser.username,
          email: demoUser.email,
          passwordHash,
        })
        .onConflictDoNothing({
          target: users.email,
        });

      const [savedUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, demoUser.email))
        .limit(1);

      // Add each post only once
      for (const content of demoUser.posts) {
        const [existingPost] = await tx
          .select({ id: posts.id })
          .from(posts)
          .where(
            and(
              eq(posts.userId, savedUser.id),
              eq(posts.content, content)
            )
          )
          .limit(1);

        if (!existingPost) {
          await tx.insert(posts).values({
            userId: savedUser.id,
            content,
            image: null,
          });
        }
      }
    }

    console.log("Programming users and posts ready");



    // 2. Define demo posts
    const demoPosts = [
      {
        userId: createdUsers[0].id,
        content: "Welcome to our class blog!",
        image: null,
      },
      {
        userId: createdUsers[1].id,
        content: "Today I learned about Express.js.",
        image: null,
      },
      {
        userId: createdUsers[2].id,
        content: "PostgreSQL is a powerful database.",
        image: null,
      },
      {
        userId: createdUsers[0].id,
        content: "Learning Drizzle ORM step by step.",
        image: null,
      },
    ];

    // Only create demo posts on first seeding
    const [existingDemoPost] = await tx
      .select({ id: posts.id })
      .from(posts)
      .where(
        eq(
          posts.content,
          "Welcome to our class blog!"
        )
      )
      .limit(1);

    if (existingDemoPost) {
      console.log(
        "Demo posts already exist. Skipping posts, comments and likes."
      );
      return;
    }

    const createdPosts = await tx
      .insert(posts)
      .values(demoPosts)
      .returning({
        id: posts.id,
      });

    console.log("Demo posts created");

    // 3. Create demo comments
    await tx.insert(comments).values([
      {
        postId: createdPosts[0].id,
        userId: createdUsers[1].id,
        content: "Great first post!",
      },
      {
        postId: createdPosts[0].id,
        userId: createdUsers[2].id,
        content: "Welcome everyone!",
      },
      {
        postId: createdPosts[1].id,
        userId: createdUsers[0].id,
        content: "Express is really useful.",
      },
      {
        postId: createdPosts[2].id,
        userId: createdUsers[1].id,
        content: "I agree!",
      },
      {
        postId: createdPosts[3].id,
        userId: createdUsers[2].id,
        content: "Nice explanation!",
      },
    ]);

    console.log("Demo comments created");

    // 4. Create demo likes
    await tx.insert(likes).values([
      {
        userId: createdUsers[1].id,
        postId: createdPosts[0].id,
      },
      {
        userId: createdUsers[2].id,
        postId: createdPosts[0].id,
      },
      {
        userId: createdUsers[0].id,
        postId: createdPosts[1].id,
      },
      {
        userId: createdUsers[1].id,
        postId: createdPosts[2].id,
      },
      {
        userId: createdUsers[2].id,
        postId: createdPosts[3].id,
      },
    ]);

    console.log("Demo likes created");
  });

  console.log("Database seeding completed!");
}

try {
  await seed();
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
