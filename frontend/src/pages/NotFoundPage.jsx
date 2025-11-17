import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold bg-gradient-instagram bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          Halaman yang Anda cari tidak ditemukan
        </p>
        <Link to="/" className="btn btn-gradient inline-flex items-center gap-2">
          <Home size={20} />
          <span>Kembali ke Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;