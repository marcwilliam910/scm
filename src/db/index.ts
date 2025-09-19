import {connect} from "mongoose";

const uri = process.env.MONGODB_URI!;

connect(uri)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Database connection failed " + err));
