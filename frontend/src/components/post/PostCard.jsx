import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import LikesModal from "./LikesModal";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith("http")) return mediaPath;
  return `${API_URL}${mediaPath}`;
};

const PostCard = ({ post, onUpdate, onOpenModal }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);

  // Guard clause
  if (!post.userId || !post.userId._id) {
    console.warn("⚠️ Post with null user:", post._id);
    return null;
  }

  const isOwnPost = currentUser?._id === post.userId._id;

  // Get all media
  const allMedia = post.media || [];

  const hasMultipleMedia = allMedia.length > 1;

  // Story ring logic
  const storiesFeed = queryClient.getQueryData(["storiesFeed"]);
  const postUserStoryGroup = storiesFeed?.find(
    (group) => group.user._id === post.userId._id
  );
  const hasActiveStory = !!postUserStoryGroup;
  const hasUnviewed = postUserStoryGroup?.hasUnviewed || false;

  const getStoryRingClass = () => {
    if (!hasActiveStory) return "";
    return hasUnviewed
      ? "p-0.5 bg-gradient-instagram"
      : "p-0.5 border-2 border-dark-700";
  };

  const ringClass = getStoryRingClass();

  const handleAvatarClick = (e) => {
    if (hasActiveStory) {
      e.preventDefault();
      navigate(`/stories/${post.userId._id}`);
    }
  };

  // Force cleanup saat media berubah
  useEffect(() => {
    // Pause semua video yang masih playing
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentMediaIndex]);

  // Carousel navigation
  const handlePrevMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) =>
      prev === 0 ? allMedia.length - 1 : prev - 1
    );
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) =>
      prev === allMedia.length - 1 ? 0 : prev + 1
    );
  };

  const isVideo = (url) => {
    return url.toLowerCase().match(/\.(mp4|mov|avi|webm)$/);
  };

  // Mutations
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${post._id}/like`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['feed']);
      const previousFeed = queryClient.getQueryData(['feed']);
      // Optimistic update
      queryClient.setQueryData(['feed'], (old) => {
        if (!old) return old;
        return old.map((p) =>
          p._id === post._id
            ? {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p
        );
      });
      return { previousFeed };
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
      toast.error(error.error || "Gagal like post");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${post._id}/save`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['feed']);
      const previousFeed = queryClient.getQueryData(['feed']);
      // Optimistic update
      queryClient.setQueryData(['feed'], (old) => {
        if (!old) return old;
        return old.map((p) =>
          p._id === post._id
            ? { ...p, isSaved: !p.isSaved }
            : p
        );
      });
      return { previousFeed };
    },
    onSuccess: () => {
      onUpdate();
      queryClient.invalidateQueries(['savedPosts']);
    },
    onError: (error, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
      toast.error(error.error || "Gagal save post");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post._id}`);
    },
    onSuccess: () => {
      toast.success("Post berhasil dihapus");
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.error || "Gagal menghapus post");
    },
  });

  const handleLike = (e) => {
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleSave = (e) => {
    e.stopPropagation();
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm("Yakin ingin menghapus post ini?")) {
      deleteMutation.mutate();
    }
  };

  // Handler untuk open modal - hanya dari button comment
  const handleOpenComments = (e) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal(post._id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: idLocale,
  });

  const renderAvatarContent = () => (
    <>
      {post.userId.avatar ? (
        <img
          src={getMediaUrl(post.userId.avatar)}
          alt={post.userId.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold">
          {post.userId.username.charAt(0).toUpperCase()}
        </span>
      )}
    </>
  );

  // Truncate content for preview
  const MAX_LENGTH = 100;
  const displayContent =
    post.content.length > MAX_LENGTH
      ? post.content.slice(0, MAX_LENGTH) + "..."
      : post.content;

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <Link
          to={`/profile/${post.userId._id}`}
          onClick={handleAvatarClick}
          className="flex items-center gap-3"
        >
          {hasActiveStory ? (
            <div className={`avatar-ring ${ringClass}`}>
              <div className="avatar w-10 h-10 bg-dark-800 border-2 border-black">
                {renderAvatarContent()}
              </div>
            </div>
          ) : (
            <div className="avatar w-10 h-10 bg-dark-800">
              {renderAvatarContent()}
            </div>
          )}

          <div>
            <p className="font-semibold hover:text-gray-300 transition-colors">
              {post.userId.username}
            </p>
            {post.location?.name ? (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin size={14} className="inline-block mr-1" />
                {post.location.name}
              </p>
            ) : (
              <p className="text-xs text-gray-400">{timeAgo}</p>
            )}
          </div>
        </Link>

        {/* Menu - Only for own posts */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="btn-ghost p-2"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-48 card p-2 space-y-1 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenModal && onOpenModal(post._id, "edit");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-blue-500 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    <span>Hapus Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Media Carousel */}
      {allMedia.length > 0 && (
        <div className="relative bg-dark-900 group">
          {/* Current Media */}
          <div className="relative w-full max-h-[600px] flex items-center justify-center bg-black">
            {isVideo(allMedia[currentMediaIndex]) ? (
              <video
                key={`video-${post._id}-${currentMediaIndex}`}
                src={`${getMediaUrl(
                  allMedia[currentMediaIndex]
                )}?t=${Date.now()}`}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[600px] object-contain"
                onLoadedMetadata={(e) => {
                  e.target.currentTime = 0;
                }}
              />
            ) : (
              <img
                key={`image-${post._id}-${currentMediaIndex}`}
                src={getMediaUrl(allMedia[currentMediaIndex])}
                alt={`Post media ${currentMediaIndex + 1}`}
                className="w-full max-h-[600px] object-contain"
              />
            )}
          </div>

          {/* Navigation - Only if multiple media */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={handlePrevMedia}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>

              <button
                onClick={handleNextMedia}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight size={20} className="text-white" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {allMedia.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                    }}
                    className={`transition-all ${
                      index === currentMediaIndex
                        ? "w-2 h-2 bg-primary-500"
                        : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
                    } rounded-full`}
                  />
                ))}
              </div>

              {/* Counter Badge */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium z-10">
                {currentMediaIndex + 1}/{allMedia.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Liked by */}
      {post.likesCount > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowLikesModal(true)}
            className="text-sm hover:opacity-70 transition-opacity text-left"
          >
            {post.firstLikedUser ? (
              <span>
                Liked by{" "}
                <span className="font-semibold">
                  {post.firstLikedUser.username}
                </span>
                {post.likesCount > 1 && (
                  <span>
                    {" "}
                    and{" "}
                    <span className="font-semibold">
                      {post.likesCount - 1}{" "}
                      {post.likesCount === 2 ? "other" : "others"}
                    </span>
                  </span>
                )}
              </span>
            ) : (
              <span className="font-semibold">
                {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`post-action-btn ${post.isLiked ? "text-red-500" : ""}`}
        >
          <Heart
            size={24}
            fill={post.isLiked ? "currentColor" : "none"}
            className="transition-all"
          />
          {post.likesCount > 0 && <span>{post.likesCount}</span>}
        </button>

        {/* ✅ Comment button - triggers modal */}
        <button onClick={handleOpenComments} className="post-action-btn">
          <MessageCircle size={24} />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
        </button>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className={`post-action-btn ml-auto ${
            post.isSaved ? "text-yellow-500" : ""
          }`}
        >
          <Bookmark
            size={24}
            fill={post.isSaved ? "currentColor" : "none"}
            className="transition-all"
          />
        </button>
      </div>

      {/* Content Preview */}
      <div className="post-content pb-2">
        <p className="text-sm break-words">
          <Link
            to={`/profile/${post.userId._id}`}
            className="font-semibold hover:text-gray-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {post.userId.username}
          </Link>{" "}
          <span className="text-gray-300">{displayContent}</span>
          {post.content.length > MAX_LENGTH && (
            <span className="text-gray-400"> ...selengkapnya</span>
          )}
        </p>

        {/* Comments Preview - triggers modal */}
        {post.commentsCount > 0 && (
          <button
            onClick={handleOpenComments}
            className="text-sm text-gray-400 hover:text-gray-300 mt-1 transition-colors"
          >
            Lihat {post.commentsCount} komentar
          </button>
        )}
      </div>

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post._id}
      />
    </div>
  );
};

export default PostCard;