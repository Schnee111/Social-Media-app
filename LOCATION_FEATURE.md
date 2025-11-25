# 📍 Location Feature Documentation

## Overview

Fitur lokasi memungkinkan user menambahkan lokasi ke post mereka saat upload, mirip dengan Instagram.

---

## ✅ Features Implemented

### 1. **Add Location to Post (Optional)**

- ✅ Search location by name (e.g., "Bali, Indonesia")
- ✅ Use current GPS location (geolocation API)
- ✅ Display location name di post card
- ✅ Store latitude & longitude coordinates

### 2. **Location Data Structure**

```javascript
{
  location: {
    name: "Bali, Indonesia",
    latitude: -8.4095,
    longitude: 115.0920,
    address: "Full address from geocoding"
  }
}
```

---

## 🔧 Backend Changes

### 1. **Post Model** (`models/Post.js`)

```javascript
location: {
    name: {
        type: String,
        default: null
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    address: {
        type: String,
        default: null
    }
}
```

### 2. **Post Controller** (`controllers/postController.js`)

- Parse `location` dari request body (JSON string)
- Save location data ke database

```javascript
// Parse location if provided
let locationData = null;
if (location) {
  try {
    locationData =
      typeof location === "string" ? JSON.parse(location) : location;
  } catch (e) {
    console.error("Location parse error:", e);
  }
}

const post = new Post({
  userId,
  content: content.trim(),
  media: mediaUrls,
  location: locationData, // NEW
});
```

---

## 🎨 Frontend Changes

### 1. **CreatePostComponent** (`components/creation/CreatePostComponent.jsx`)

#### New State:

```javascript
const [location, setLocation] = useState(null);
const [locationSearch, setLocationSearch] = useState("");
const [isSearchingLocation, setIsSearchingLocation] = useState(false);
```

#### New Functions:

**A. Get Current Location (GPS):**

```javascript
const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    // Reverse geocoding using Nominatim API (Free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();

    setLocation({
      name: data.display_name,
      latitude,
      longitude,
      address: data.display_name,
    });
  });
};
```

**B. Search Location by Name:**

```javascript
const searchLocation = async () => {
  // Geocoding using Nominatim API
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      locationSearch
    )}`
  );
  const data = await response.json();

  if (data && data.length > 0) {
    setLocation({
      name: locationSearch,
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      address: data[0].display_name,
    });
  }
};
```

**C. Remove Location:**

```javascript
const removeLocation = () => {
  setLocation(null);
  setLocationSearch("");
};
```

#### UI Components:

**Search Location Input:**

```jsx
<input
  type="text"
  value={locationSearch}
  onChange={(e) => setLocationSearch(e.target.value)}
  placeholder="Search location (e.g., Bali, Indonesia)"
  className="input"
/>
<button onClick={searchLocation}>Search</button>
```

**Use Current Location Button:**

```jsx
<button onClick={getCurrentLocation}>
  <MapPin size={18} />
  Use Current Location
</button>
```

**Selected Location Display:**

```jsx
{
  location && (
    <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-lg">
      <MapPin className="text-primary-500" size={20} />
      <div>
        <p className="font-medium">{location.name}</p>
        <p className="text-xs text-gray-400">{location.address}</p>
        <p className="text-xs text-gray-500">
          📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </p>
      </div>
      <button onClick={removeLocation}>
        <X size={18} />
      </button>
    </div>
  );
}
```

**Append to FormData:**

```javascript
if (location) {
  formData.append("location", JSON.stringify(location));
}
```

### 2. **PostCard Component** (`components/post/PostCard.jsx`)

**Display Location:**

```jsx
{
  post.location?.name ? (
    <p className="text-xs text-gray-400 flex items-center gap-1">
      📍 {post.location.name}
    </p>
  ) : (
    <p className="text-xs text-gray-400">{timeAgo}</p>
  );
}
```

---

## 🌍 Geocoding API

### **Nominatim (OpenStreetMap) - FREE**

**Advantages:**
✅ Completely FREE (no API key required)
✅ No rate limiting for reasonable use
✅ Supports worldwide locations
✅ Reverse geocoding (lat/lng → address)
✅ Forward geocoding (address → lat/lng)

**Endpoints:**

1. **Search Location (Forward Geocoding):**

```
GET https://nominatim.openstreetmap.org/search?format=json&q=Bali,Indonesia
```

2. **Reverse Geocoding (Coordinates → Address):**

```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat=-8.4095&lon=115.0920
```

**Response Example:**

```json
{
  "display_name": "Bali, Indonesia",
  "lat": "-8.4095465",
  "lon": "115.0920108",
  "address": {
    "province": "Bali",
    "country": "Indonesia"
  }
}
```

---

## 📱 User Flow

### **Creating Post with Location:**

1. User clicks "Create Post"
2. Upload photos/videos
3. Write caption
4. **Add Location (Optional):**
   - **Option A:** Search by name
     - Type "Bali, Indonesia"
     - Click "Search"
     - Location auto-filled with coordinates
   - **Option B:** Use current GPS
     - Click "Use Current Location"
     - Browser requests permission
     - Auto-fetch address from coordinates
5. Review location (can remove if wrong)
6. Click "Share"
7. Post created with location data

### **Viewing Post with Location:**

1. User sees post in feed
2. Location name displayed below username
3. Shows "📍 Bali, Indonesia"
4. **(Future)** Click location → see all posts from that location

---

## 🔮 Future Enhancements (NOT YET IMPLEMENTED)

### 1. **Explore Posts by Location**

```javascript
GET /api/posts/location/:locationName
GET /api/posts/nearby?lat=-8.4095&lng=115.0920&radius=10000
```

### 2. **Location Map View**

- Interactive map (Leaflet/Mapbox)
- Show pins for posts
- Click pin → view post

### 3. **Trending Locations**

```javascript
GET / api / locations / trending;
// Returns top 20 locations by post count
```

### 4. **Geospatial Indexing**

```javascript
// MongoDB 2dsphere index for nearby queries
postSchema.index({ "location.coordinates": "2dsphere" });
```

### 5. **Location History**

- Track places user has posted from
- "Your Travel Map"

---

## 🧪 Testing

### **Test Create Post with Location:**

**Using Postman:**

```
POST http://localhost:5000/api/posts
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body (form-data):
  content: "Beautiful sunset in Bali! 🌅"
  images: [file.jpg]
  location: {
    "name": "Bali, Indonesia",
    "latitude": -8.4095,
    "longitude": 115.0920,
    "address": "Bali, Indonesia"
  }
```

### **Test Frontend:**

1. Open `http://localhost:5173/create`
2. Upload image
3. Click "Use Current Location" (allow browser permission)
4. Or search "Paris, France"
5. Submit post
6. Check post in feed → location should appear

---

## 📊 Database Example

```javascript
{
  "_id": "691c395a20340ea894175406",
  "userId": "691c395a20340ea894175406",
  "content": "Amazing view from here! 🏔️",
  "media": ["https://azure.blob.com/image1.jpg"],
  "location": {
    "name": "Mount Bromo, East Java",
    "latitude": -7.9425,
    "longitude": 112.9531,
    "address": "Mount Bromo, Probolinggo, East Java, Indonesia"
  },
  "createdAt": "2025-11-25T10:30:00.000Z"
}
```

---

## 🔐 Privacy Considerations

### **User Control:**

✅ Location is **OPTIONAL** (user can skip)
✅ User can **remove location** before posting
✅ No location history tracking (yet)
✅ GPS permission required for "Use Current Location"

### **Security:**

✅ Exact coordinates stored but NOT displayed publicly
✅ Only show location name (city/landmark)
✅ No real-time tracking

---

## 🎯 Summary

**Status:** ✅ **FULLY IMPLEMENTED**

**What Works:**

- ✅ Add location to post (optional)
- ✅ Search location by name
- ✅ Use GPS current location
- ✅ Display location in post card
- ✅ Store coordinates & address

**What's NOT Implemented (Future):**

- ❌ Explore posts by location
- ❌ Map view
- ❌ Nearby posts
- ❌ Trending locations

---

## 🚀 Next Steps

If you want to implement location exploration:

1. **Add route:** `GET /api/posts/location/:locationName`
2. **Add aggregation:** Group posts by location
3. **Add UI:** Location page with grid of posts
4. **Add map:** Integrate Leaflet/Mapbox

**Estimated time:** 2-3 hours

---

**Created:** November 25, 2025
**Version:** 1.0
