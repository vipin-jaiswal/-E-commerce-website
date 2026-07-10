
import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ReviewForm({ productId, onReviewAdded }) {
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async (e) => {
    e.preventDefault();

    if (!userName || !comment) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);

      const response = await api.post("/reviews", {
        productId,
        userName,
        rating,
        comment,
      });

      toast.success("Review submitted successfully");

      setUserName("");
      setRating(5);
      setComment("");

      if (onReviewAdded) {
        onReviewAdded(response.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitReview} className="space-y-4">
      <input
        type="text"
        placeholder="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="w-full border rounded-xl p-3 outline-none focus:border-pink-500"
      />

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full border rounded-xl p-3 outline-none focus:border-pink-500"
      >
        <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
        <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
        <option value={3}>⭐⭐⭐ 3 Stars</option>
        <option value={2}>⭐⭐ 2 Stars</option>
        <option value={1}>⭐ 1 Star</option>
      </select>

      <textarea
        rows="4"
        placeholder="Write your review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded-xl p-3 outline-none focus:border-pink-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold transition"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}