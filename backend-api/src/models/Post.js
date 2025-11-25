const mongoose = require("mongoose");
const { Schema } = mongoose;

const PostSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: [true, "Content wajib diisi"],
    maxlength: [2200, "Postingan tidak boleh lebih dari 2200 karakter"],
  },
  media: [
    {
      type: String,
      required: false,
    },
  ],
  location: {
    name: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtuals
PostSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

PostSchema.virtual("commentsCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

PostSchema.virtual("savedCount", {
  ref: "SavedPost",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

PostSchema.set("toJSON", { virtuals: true });
PostSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Post", PostSchema);
