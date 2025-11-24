// front/src/pages/CreatePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import CreatePostComponent from '../components/creation/CreatePostComponent';
import CreateStoryComponent from '../components/creation/CreateStoryComponent';
import { BookOpen, Film } from 'lucide-react';

const CreatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    const urlParams = new URLSearchParams(location.search);
    const initialTab = urlParams.get('tab') === 'story' ? 'story' : 'post';
    
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleCreationSuccess = () => {
        // Invalidate queries untuk trigger refetch
        if (activeTab === 'post') {
            // Invalidate feed dan explore posts
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['explorePosts'] });
            queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        } else {
            // Invalidate stories feed
            queryClient.invalidateQueries({ queryKey: ['storiesFeed'] });
            queryClient.invalidateQueries({ queryKey: ['userStories'] });
        }
        
        // Navigasi kembali ke home setelah post/story berhasil
        navigate('/'); 
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="card p-6">
                <h1 className="text-2xl font-bold mb-6">{activeTab === 'post' ? 'Buat Post Baru' : 'Buat Story Baru (24 Jam)'}</h1>

                {/* Tab Switcher */}
                <div className="flex bg-dark-800 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setActiveTab('post')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-semibold ${
                            activeTab === 'post' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <BookOpen size={18} />
                        <span>Post</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('story')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-semibold ${
                            activeTab === 'story' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Film size={18} />
                        <span>Story</span>
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'post' ? (
                    <CreatePostComponent onPostCreated={handleCreationSuccess} />
                ) : (
                    <CreateStoryComponent onStoryCreated={handleCreationSuccess} />
                )}
            </div>
        </div>
    );
};

export default CreatePage;