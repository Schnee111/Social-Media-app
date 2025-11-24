import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConversationsList from '../components/message/ConversationsList';
import ChatWindow from '../components/message/ChatWindow';
import { MessageCircle } from 'lucide-react';

const MessagesPage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="h-screen flex bg-dark-950">
      {/* Conversations List - Hidden on mobile when chat is open */}
      <div className={`${
        userId ? 'hidden lg:flex' : 'flex'
      } w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-dark-800 bg-dark-900`}>
        <ConversationsList />
      </div>

      {/* Chat Window - Hidden on mobile when no chat selected */}
      <div className={`${
        userId ? 'flex' : 'hidden lg:flex'
      } flex-1 bg-dark-950 min-w-0`}>
        {userId ? (
          <ChatWindow />
        ) : (
          // Empty state for desktop
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-6">
              <MessageCircle size={48} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-gray-400 max-w-sm">
              Select a conversation from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;