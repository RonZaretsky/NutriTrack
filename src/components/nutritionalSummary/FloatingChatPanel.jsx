import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  ImageIcon,
  Bot,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  X,
  Smile
} from "lucide-react";
import NutritionCard from "@/components/nutritionalSummary/NutritionCard";

export default function FloatingChatPanel({
  onClose,
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  uploadedImage,
  setUploadedImage,
  handleSendMessage,
  handleFileUpload,
  filteredFoods,
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <Card className="w-full max-w-sm h-[70vh] flex flex-col rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <CardHeader className="relative flex items-center p-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-white" />
            <CardTitle className="text-white">צ'אט תזונתי</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto px-4 py-3 space-y-4">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((message, idx) => {
                const data = message.structured_data ? JSON.parse(message.structured_data) : null;
                const isUser = message.sender === "user";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>  
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                          ${isUser ? "bg-blue-500" : "bg-gradient-to-br from-green-500 to-blue-500"}`
                      }
                      >
                        {isUser ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                      <div
                        className={`relative p-4 rounded-2xl max-w-[75%] break-words
                          ${isUser ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"}`
                      }
                      >
                        {message.image_url && (
                          <div className="relative mb-3">
                            <img src={message.image_url} alt="תמונת מזון" className="w-full h-auto rounded-lg object-cover" />
                            <button
                              onClick={() => setUploadedImage(null)}
                              className="absolute top-1 right-1 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full"
                            >
                              <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                        {message.calories_extracted && (
                          <Badge variant="outline" className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            {message.calories_extracted} קלוריות
                          </Badge>
                        )}
                        <time className="block text-[10px] mt-1 text-gray-500 dark:text-gray-400 text-right">
                          {new Date(message.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </div>
                    </div>
                    {data?.foods && (
                      <div className={`flex flex-col ${isUser ? "items-end" : "items-start pl-11"} space-y-2`}>                      
                        {filteredFoods(data.foods).map((food, i) => (
                          <NutritionCard key={i} food={food} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">מנתח...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {uploadedImage && (
            <div className="mb-3 relative w-24 h-24">
              <img src={uploadedImage} alt="העלאה" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-1 right-1 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full"
              >
                <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                /* handle emoji picker open */
              }}
              disabled={isLoading}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Input
              as="textarea"
              rows={1}
              placeholder="תאר מה אכלת..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 resize-none overflow-hidden bg-gray-100 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!newMessage.trim() && !uploadedImage)}
              className="flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}