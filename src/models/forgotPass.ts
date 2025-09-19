import {compare, genSalt, hash} from "bcrypt";
import {model, Schema, Document} from "mongoose";

interface ForgotPassword extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface ForgotPasswordMethods {
  compareToken(token: string): Promise<boolean>;
}

const forgotPasswordSchema = new Schema<
  ForgotPassword,
  {},
  ForgotPasswordMethods
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
    expires: 3600,
  },
});

forgotPasswordSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    const salt = await genSalt(10);
    this.token = await hash(this.token, salt);
  }
  next();
});

forgotPasswordSchema.methods.compareToken = async function (token: string) {
  return compare(token, this.token);
};

const ForgotPasswordModel = model("ForgotPassword", forgotPasswordSchema);

export default ForgotPasswordModel;
