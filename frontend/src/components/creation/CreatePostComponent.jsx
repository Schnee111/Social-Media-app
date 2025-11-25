// front/src/components/creation/CreatePostComponent.jsx

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  X,
  Loader2,
  Upload,
  Film,
  Plus,
  Image as ImageIcon,
  MapPin,
  Search,
} from "lucide-react";

const CreatePostComponent = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const fileInputRef = useRef(null);

  // Cleanup function: Membersihkan URL Object saat unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url && !preview.url.startsWith("http")) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  const createPostMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Post created successfully!");
      // Reset form
      setContent("");
      setSelectedFiles([]);
      setPreviews([]);
      setLocation(null);
      setLocationSearch("");
      onPostCreated();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to create post");
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 10 media files
    if (selectedFiles.length + files.length > 10) {
      toast.error("Maximum 10 media files per post");
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name} is not an image or video file`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB
        toast.error(`${file.name} is too large (max 100MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
    }));

    setSelectedFiles([...selectedFiles, ...validFiles]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    // Revoke URL Object
    if (previews[index].url && !previews[index].url.startsWith("http")) {
      URL.revokeObjectURL(previews[index].url);
    }

    setPreviews(previews.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setIsSearchingLocation(true);
    toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding menggunakan Nominatim (OpenStreetMap) - Free API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();

          const locationName =
            data.display_name?.split(",").slice(0, 3).join(",") ||
            "Unknown Location";

          setLocation({
            name: locationName,
            latitude,
            longitude,
            address: data.display_name,
          });

          setLocationSearch(locationName);
          toast.dismiss();
          toast.success("Location added!");
        } catch (error) {
          console.error("Geocoding error:", error);
          setLocation({
            name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
            address: null,
          });
          toast.dismiss();
          toast.success("Location coordinates added!");
        } finally {
          setIsSearchingLocation(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        toast.dismiss();
        toast.error("Could not get your location");
        setIsSearchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchLocation = async () => {
    if (!locationSearch.trim()) {
      toast.error("Please enter a location");
      return;
    }

    setIsSearchingLocation(true);

    try {
      // Geocoding using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationSearch
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        setLocation({
          name: locationSearch,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
        });
        toast.success("Location added!");
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search location");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const removeLocation = () => {
    setLocation(null);
    setLocationSearch("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi media wajib
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image or video");
      return;
    }

    // Validasi caption wajib
    if (!content.trim()) {
      toast.error("Please write a caption");
      return;
    }

    const formData = new FormData();
    formData.append("content", content.trim());

    // Append all files dengan field name 'images'
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    // Append location if provided
    if (location) {
      formData.append("location", JSON.stringify(location));
    }

    // Debug log
    console.log("📤 Uploading post with files:", selectedFiles.length);
    if (location) console.log("📍 Location:", location.name);

    createPostMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="avatar-ring">
          <div className="avatar w-12 h-12 bg-dark-800">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="font-semibold">{user?.username}</p>
          <p className="text-sm text-gray-400">Create new post</p>
        </div>
      </div>

      {/* Image/Video Upload - WAJIB */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Photos/Videos <span className="text-red-500">*</span>
          {previews.length > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              ({previews.length}/10 selected)
            </span>
          )}
        </label>

        {previews.length === 0 ? (
          // Empty state - upload prompt
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-dark-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-12 h-12 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag &
                drop
              </p>
              <p className="text-xs text-gray-500">
                Multiple images/videos supported (PNG, JPG, GIF, MP4, MOV)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MAX. 100MB per file • Up to 10 files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={createPostMutation.isPending}
              multiple
              required
            />
          </label>
        ) : (
          // Preview Grid
          <div
            className={`grid gap-2 ${
              previews.length === 1
                ? "grid-cols-1"
                : previews.length === 2
                ? "grid-cols-2"
                : previews.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden bg-dark-900 aspect-square"
              >
                {preview.type === "video" ? (
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                  disabled={createPostMutation.isPending}
                >
                  <X size={16} />
                </button>

                {/* Index badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                  {index + 1}/{previews.length}
                </div>

                {/* Video badge */}
                {preview.type === "video" && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Film size={12} />
                    <span>Video</span>
                  </div>
                )}

                {/* Hover overlay with filename */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{preview.name}</p>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {previews.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-dark-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-dark-800/50 transition-all"
                disabled={createPostMutation.isPending}
              >
                <Plus size={32} className="text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">
                  Add More
                </span>
                <span className="text-xs text-gray-600">
                  {10 - previews.length} left
                </span>
              </button>
            )}

            {/* Hidden file input for "Add More" button */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={createPostMutation.isPending}
              multiple
            />
          </div>
        )}
      </div>

      {/* Caption - WAJIB */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Caption <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a caption for your post..."
          className="textarea min-h-[120px]"
          disabled={createPostMutation.isPending}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Share your thoughts about{" "}
          {previews.length > 1 ? "these photos/videos" : "this photo/video"}
        </p>
      </div>

      {/* Add Location - OPTIONAL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add Location (Optional)
        </label>

        {!location ? (
          <div className="space-y-2">
            {/* Search Location */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), searchLocation())
                  }
                  placeholder="Search location (e.g., Bali, Indonesia)"
                  className="input pr-10"
                  disabled={createPostMutation.isPending || isSearchingLocation}
                />
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
              </div>
              <button
                type="button"
                onClick={searchLocation}
                disabled={
                  !locationSearch.trim() ||
                  isSearchingLocation ||
                  createPostMutation.isPending
                }
                className="btn btn-secondary px-4 whitespace-nowrap"
              >
                {isSearchingLocation ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Use Current Location */}
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isSearchingLocation || createPostMutation.isPending}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              <span>Use Current Location</span>
            </button>
          </div>
        ) : (
          // Selected Location Display
          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700">
            <MapPin
              className="text-primary-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{location.name}</p>
              {location.address && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {location.address}
                </p>
              )}
              {location.latitude && location.longitude && (
                <p className="text-xs text-gray-500 mt-1">
                  📍 {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={removeLocation}
              disabled={createPostMutation.isPending}
              className="p-1 hover:bg-dark-700 rounded transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
        <button
          type="button"
          onClick={() => onPostCreated()}
          className="btn btn-secondary flex-1"
          disabled={createPostMutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            selectedFiles.length === 0 ||
            !content.trim() ||
            createPostMutation.isPending
          }
          className="btn btn-gradient flex-1 flex items-center justify-center gap-2"
        >
          {createPostMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <ImageIcon size={18} />
              <span>Share {previews.length > 1 && `(${previews.length})`}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreatePostComponent;
