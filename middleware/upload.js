import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const uploadDirectory = path.resolve("uploads");

await mkdir(uploadDirectory, { recursive: true });

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename(req, file, cb) {
    const extension = allowedTypes.get(file.mimetype);
    cb(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 1,
    fieldSize: 20 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!allowedTypes.has(file.mimetype)) {
      return cb(
        new Error("invalid image type")
      );
    }

    cb(null, true);
  },
});

export function uploadImage(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (error) => {
      if (!error) return next();

      let message = "invalid image upload";

      if (error.code === "LIMIT_FILE_SIZE") {
        message = "image must be smaller than 5MB";
      } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        message = "unexpected image field";
      } else if (error.message === "invalid image type") {
        message = "invalid image type";
      }
      return res.status(422).json({
        errors: {
          image: {
            errors: [message],
          },
        },
      });
    });
  };
}
