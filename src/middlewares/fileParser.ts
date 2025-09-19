import {RequestHandler} from "express";
import formidable from "formidable";

export const fileParser: RequestHandler = async (req, res, next) => {
  const form = formidable();

  const [fields, files] = await form.parse(req);

  // Initialize req.body properties
  req.body.fields = {};
  req.body.files = {};

  for (const key in fields) {
    req.body.fields[key] = fields[key]![0];
  }

  for (let key in files) {
    const actualFiles = files[key];
    if (!actualFiles) continue;

    if (actualFiles.length > 1) {
      req.body.files[key] = actualFiles;
    } else {
      req.body.files[key] = actualFiles[0];
    }
  }

  next();
};
