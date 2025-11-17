import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PostCard from '../components/post/PostCard';
import { Loader2 } from 'lucide-react';

const HomePage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await api.get('/posts/feed');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Gagal memuat feed</p>
        <button onClick={() => refetch()} className="btn btn-primary mt-4">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feed */}
      <div className="space-y-4 mt-6">
        {data && data.length > 0 ? (
          data.map((post) => <PostCard key={post._id} post={post} onUpdate={refetch} />)
        ) : (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg">
              Belum ada post di feed Anda
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Follow user lain untuk melihat post mereka di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;