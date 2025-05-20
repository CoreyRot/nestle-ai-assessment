import ChatbotContainer from './components/chatbot/ChatbotContainer';

function App() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Website screenshot background */}
      <div className="w-full h-full">
        <img 
          src="../public/images/Screenshot 2025-05-19 111739.png" 
          alt="Made with Nestlé Website" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Chatbot component positioned in the right corner */}
      <ChatbotContainer />
    </section>
  );
}

export default App;