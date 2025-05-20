type Message = {
  text: string;
  sender: 'user' | 'bot';
  references?: Array<{ title: string; url: string }>;
};

type ChatbotBodyProps = {
  messages: Message[];
};

const ChatbotBody = ({ messages }: ChatbotBodyProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-3/4 px-4 py-2 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <div>{message.text}</div>
            
            {message.references && message.references.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="text-xs font-semibold">References:</div>
                <ul className="text-xs mt-1">
                  {message.references.map((ref, idx) => (
                    <li key={idx} className="mt-1">
                      <a 
                        href={ref.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {ref.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatbotBody;