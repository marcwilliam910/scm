import ConversationModel from "../models/conversation";
import UserModel from "../models/user";
import {RequestHandler} from "express";
import {isValidObjectId} from "mongoose";

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
}
interface ChatType {
  text: string;
  createdAt: string;
  id: string;
  viewed: boolean;
  user: UserProfile;
}
interface Conversation {
  id: string;
  chats: ChatType[];
  peerProfile: {avatar?: string; name: string; id: string};
}

type ChatResponse = {
  _id: string;
  createdAt: string;
  text: string;
  viewed: boolean;
  sentBy: UserProfileResponse;
};

type UserProfileResponse = {
  _id: string;
  name: string;
  avatar?: {
    url: string;
  };
};
type OldChatsResponse = {
  _id: string;
  chats: ChatResponse[];
  participants: UserProfileResponse[];
};

type ConversationResponse = {
  _id: string;
  participants: UserProfileResponse[];
  chats: ChatResponse[];
};

export const getOrCreateConversation: RequestHandler = async (req, res) => {
  const {peerId} = req.params;

  if (!isValidObjectId(peerId))
    return res.status(400).json({message: "Invalid User ID"});

  const user = await UserModel.findById(peerId);

  if (!user) return res.status(400).json({message: "User not found"});

  const participants = [req.body.user.id, peerId];
  const participantsId = participants.sort().join("_");

  const conversation = await ConversationModel.findOneAndUpdate(
    {participantsId},
    {$setOnInsert: {participants, participantsId}},
    {upsert: true, new: true}
  );

  res.status(200).json({conversationId: conversation._id});
};

export const getConversationsWithChats: RequestHandler = async (req, res) => {
  const conversations = await ConversationModel.find({
    participantsId: new RegExp(req.body.user.id),
  })
    .populate({
      path: "participants",
      match: {_id: {$ne: req.body.user.id}}, // exclude self
      select: "name avatar.url _id",
    })
    .select("_id chats participants")
    .sort({updatedAt: -1})
    .limit(20)
    .lean<ConversationResponse[]>();

  const userId = String(req.body.user.id);

  const unreadConversationIds = conversations
    .filter((conversation) =>
      conversation.chats.some((chat) => {
        const senderId = String(chat.sentBy._id);
        return !chat.viewed && senderId !== userId;
      })
    )
    .map((conversation) => conversation._id);

  console.log(conversations[0].chats[0].sentBy);

  const formattedConversation: Conversation[] = conversations.map((conv) => ({
    id: conv._id.toString(),
    chats: conv.chats.map((chat) => ({
      text: chat.text,
      createdAt: chat.createdAt.toString(),
      id: chat._id.toString(),
      viewed: chat.viewed,
      user: {
        id: chat.sentBy.toString(),
        name: chat.sentBy.name,
        avatar: chat.sentBy.avatar?.url,
      },
    })),
    peerProfile: {
      id: conv.participants[0]._id.toString(),
      name: conv.participants[0].name,
      avatar: conv.participants[0].avatar?.url,
    },
  }));

  res.status(200).json({
    conversations: formattedConversation,
    unreadConversations: unreadConversationIds,
  });
};

export const getOldChats: RequestHandler = async (req, res) => {
  const {conversationId} = req.params;

  if (!isValidObjectId(conversationId))
    return res.status(400).json({message: "Invalid Conversation ID"});

  const conversation = await ConversationModel.findById(conversationId)
    .populate({
      path: "participants",
      match: {_id: {$ne: req.body.user.id}}, // exclude self
      select: "name avatar.url _id",
    })
    .populate("chats.sentBy", "name avatar.url _id")
    .sort({updatedAt: -1})
    .lean<OldChatsResponse>();

  if (!conversation)
    return res.status(400).json({message: "Conversation not found"});

  const formattedConversation: Conversation = {
    id: conversation._id.toString(),
    chats: conversation.chats.map((chat) => ({
      text: chat.text,
      createdAt: chat.createdAt.toString(),
      id: chat._id.toString(),
      viewed: chat.viewed,
      user: {
        id: chat.sentBy._id.toString(),
        name: chat.sentBy.name,
        avatar: chat.sentBy.avatar?.url,
      },
    })),
    peerProfile: {
      id: conversation.participants[0]._id.toString(),
      name: conversation.participants[0].name,
      avatar: conversation.participants[0].avatar?.url,
    },
  };
  res.status(200).json({conversation: formattedConversation});
};

export const markAsViewed: RequestHandler = async (req, res) => {
  const {conversationId} = req.params;

  if (!isValidObjectId(conversationId)) {
    return res.status(400).json({message: "Invalid Conversation ID"});
  }

  const updated = await ConversationModel.updateOne(
    {_id: conversationId},
    {
      $set: {"chats.$[elem].viewed": true},
    },
    {
      arrayFilters: [
        {"elem.viewed": false, "elem.sentBy": {$ne: req.body.user.id}},
        // 👆 only unviewed chats NOT sent by the current user
      ],
    }
  );

  if (updated.matchedCount === 0) {
    return res.status(404).json({message: "Conversation not found"});
  }

  res.status(200).json({message: "Unviewed chats marked as viewed"});
};
