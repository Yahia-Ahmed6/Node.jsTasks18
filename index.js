import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";

import { pagesRouter } from "./routes/pages.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { postRouter } from "./routes/post.routes.js";

const app = express();


app.use((req, res, next) => {
  console.log(new Date().toLocaleString(),req.method,req.url);
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(authRouter);
app.use(postRouter);
app.use("/uploads",express.static(path.resolve("uploads")));
app.use(pagesRouter);

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  return res.status(500).json({
    error: "something went wrong",
  });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
