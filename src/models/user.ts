import {model, Schema, Document} from "mongoose";
import {hash, compare, genSalt} from "bcrypt";

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  tokens: string[];
  avatar?: {url: string; id: string};
}

interface UserMethods {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<User, {}, UserMethods>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    tokens: {
      type: [String],
    },
    avatar: {
      url: {
        type: String,
      },
      id: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return compare(password, this.password);
};

const UserModel = model("User", userSchema);
export default UserModel;
