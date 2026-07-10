import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONCERNS_DATA, ALL_CONCERNS } from "../utils/concerns";

const ConcernCard = ({ concern }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/products?q=${concern.query}`)}
      className="cursor-pointer group text-center"
    >
      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-md border-4 border-pink-100 group-hover:border-pink-400 transition duration-300">
        <img
          src={concern.image}
          alt={concern.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
      <h3 className="mt-4 font-semibold text-gray-700 dark:text-gray-300 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition">
        {concern.name}
      </h3>
    </div>
  );
};

const AllConcernsPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Concerns" },
    { id: "skin", label: "Skin Concerns" },
    { id: "hair", label: "Hair Concerns" },
  ];

  const getVisibleConcerns = () => {
    switch (activeTab) {
      case "skin":
        return CONCERNS_DATA.skin;
      case "hair":
        return CONCERNS_DATA.hair;
      case "all":
      default:
        return ALL_CONCERNS;
    }
  };

  const visibleConcerns = getVisibleConcerns();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Shop by Concern
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3">
          Find the perfect products for your skin and hair needs.
        </p>
      </div>

      <div className="flex justify-center mb-10 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold text-lg transition-colors duration-300 ${
              activeTab === tab.id
                ? "border-b-2 border-pink-500 text-pink-500"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {visibleConcerns.map((concern) => (
          <ConcernCard key={concern.name} concern={concern} />
        ))}
      </div>
    </main>
  );
};

export default AllConcernsPage;