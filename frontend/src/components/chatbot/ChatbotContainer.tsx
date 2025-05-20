import { useState } from 'react';
import ChatbotHeader from './ChatbotHeader';
import ChatbotBody from './ChatbotBody';
import ChatbotInput from './ChatbotInput';
import { sendChatbotQuery } from '../../services/api';  

const ChatbotContainer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'bot'}>>([
    { text: "Hey! I'm Smartie, your personal MadeWithNestlé assistant. Ask me anything, and I'll quickly search the entire site to find the answers you need!", sender: 'bot' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim() === '') return;
    
    // Add user message to the chat
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setIsLoading(true);
    
    try {
      // Use the imported function to send the query
      const data = await sendChatbotQuery(message);
      
      if (data.success) {
        // Add bot response
        setMessages(prev => [...prev, { 
          text: data.response.text, 
          sender: 'bot' 
        }]);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error getting response from chatbot:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again later.", 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button 
          onClick={toggleChatbot}
          className="w-14 h-14 rounded-full bg-blue-800 text-white flex items-center justify-center shadow-lg hover:bg-blue-700"
          aria-label="Open chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl flex flex-col w-80 h-96 max-w-full">
          <ChatbotHeader onClose={toggleChatbot} />
          <ChatbotBody messages={messages} />
          <ChatbotInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};

export default ChatbotContainer;