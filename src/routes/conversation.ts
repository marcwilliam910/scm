import {
  getConversationsWithChats,
  getOrCreateConversation,
  getOldChats,
  markAsViewed,
} from "@/controllers/conversation";
import {Router} from "express";

const router = Router();

router.get("/with/:peerId", getOrCreateConversation);
router.get("/messages", getConversationsWithChats);
router.get("/old-chat/:conversationId", getOldChats);
router.post("/mark-as-viewed/:conversationId", markAsViewed);

export default router;
