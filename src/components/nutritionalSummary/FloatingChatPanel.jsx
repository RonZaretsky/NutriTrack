import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  ImageIcon,
  Bot,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  X
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-24 left-4 z-50"
    >
      <Card className="glass-effect shadow-2xl w-96 h-[60vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            צ'אט AI תזונתי
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              const structuredData = message.structured_data ? JSON.parse(message.structured_data) : null;
              return (
                <div key={index} className="flex flex-col gap-3">
                  {/* Message Bubble */}
                  <div className={`flex gap-3 w-full ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-green-500 to-blue-500'}`}>
                      {message.sender === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-xs ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                      {message.image_url && <img src={message.image_url} alt="תמונת מזון" className="w-full h-auto object-cover rounded-lg mb-2" />}
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      {message.calories_extracted && <Badge variant="outline" className="mt-2 bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 ml-1" />{message.calories_extracted} קלוריות</Badge>}
                    </div>
                  </div>

                  {/* Nutrition Cards */}
                  {structuredData?.foods && (
                    <div className={`flex flex-col gap-3 ${message.sender === 'user' ? 'items-end' : 'items-start pl-11'}`}>
                      {filteredFoods(structuredData.foods).map((food, foodIndex) => (
                        <NutritionCard key={foodIndex} food={food} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-slate-600">מנתח...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <div className="p-4 border-t">
          {uploadedImage && (
            <div className="mb-2 relative w-24 h-24">
              <img src={uploadedImage} alt="העלאה" className="w-full h-full object-cover rounded-lg" />
              <Button variant="outline" size="sm" className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0" onClick={() => setUploadedImage(null)}>×</Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><ImageIcon className="w-4 h-4" /></Button>
            <Input
              placeholder="תאר מה אכלת..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || (!newMessage.trim() && !uploadedImage)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}