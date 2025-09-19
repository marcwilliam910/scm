import {Document, model, ObjectId, Schema} from "mongoose";

interface Chats extends Document {
  __id: ObjectId;
  sentBy: ObjectId;
  text: string;
  viewed: boolean;
  createdAt: Date;
}

interface Conversation extends Document {
  participants: ObjectId[];
  participantsId: string;
  chats: Chats[];
}

const conversationSchema = new Schema<Conversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    participantsId: {
      type: String,
      unique: true,
      required: true,
    },
    chats: [
      {
        sentBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        viewed: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ConversationModel = model("Conversation", conversationSchema);
export default ConversationModel;
