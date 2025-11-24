import { useParams } from 'react-router-dom';
import ConversationsList from '../components/message/ConversationsList';
import ChatWindow from '../components/message/ChatWindow';

const MessagesPage = () => {
  const { userId } = useParams();

  // If userId exists, show chat window, otherwise show conversations list
  return userId ? <ChatWindow /> : <ConversationsList />;
};

export default MessagesPage;