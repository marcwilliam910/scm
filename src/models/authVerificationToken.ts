import {compare, genSalt, hash} from "bcrypt";
import {model, Schema, Document} from "mongoose";

interface AuthVerificationToken extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface AuthVerificationTokenMethods {
  compareToken(token: string): Promise<boolean>;
}

const authVerificationTokenSchema = new Schema<
  AuthVerificationToken,
  {},
  AuthVerificationTokenMethods
>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

authVerificationTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    const salt = await genSalt(10);
    this.token = await hash(this.token, salt);
  }
  next();
});

authVerificationTokenSchema.methods.compareToken = async function (
  token: string
) {
  return compare(token, this.token);
};

const AuthVerificationTokenModel = model(
  "AuthVerificationToken",
  authVerificationTokenSchema
);

export default AuthVerificationTokenModel;
