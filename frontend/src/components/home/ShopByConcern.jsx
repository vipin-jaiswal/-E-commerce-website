import { useNavigate } from "react-router-dom";

const ShopByConcern = () => {
  const navigate = useNavigate();

  const concerns = [
    {
      name: "Acne",
      image: "/concerns/acne.jpg",
      link: "/products/acne",
    },
    {
      name: "Pigmentation",
      image: "/concerns/pigmentation.jpg",
      link: "/products/pigmentation",
    },
    {
      name: "Hair Fall",
      image: "/concerns/hairfall.jpg",
      link: "/products/hair-fall",
    },
    {
      name: "Dry Skin",
      image: "/concerns/dryskin.jpg",
      link: "/products/dry-skin",
    },
    {
      name: "Dark Circles",
      image: "/concerns/darkcircles.jpg",
      link: "/products/dark-circles",
    },
    {
      name: "Anti Aging",
      image: "/concerns/antiaging.jpg",
      link: "/products/anti-aging",
    },
  ];

  return (
    <section id="shop-by-concern" className="scroll-mt-28 max-w-[1500px] mx-auto px-4 py-16">

      {/* Heading */}
      <div className="text-center mb-12">
        <p className="text-pink-500 uppercase tracking-[4px] text-sm font-semibold mb-2">
          Find Products For
        </p>

        <h2 className="text-4xl font-bold text-gray-800">
          Shop By Concern
        </h2>

        <p className="text-gray-500 mt-3">
          Choose your concern and discover the perfect products.
        </p>
      </div>

      {/* Concern Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

        {concerns.map((concern, index) => (
          <div
            key={index}
            onClick={() => navigate(concern.link)}
            className="
              cursor-pointer
              group
              text-center
            "
          >
            <div className="
              w-32 h-32
              mx-auto
              rounded-full
              overflow-hidden
              shadow-md
              border-4 border-pink-100
              group-hover:border-pink-400
              transition
              duration-300
            ">
              <img
                src={concern.image}
                alt={concern.name}
                className="
                  w-full
                  h-full
                  object-cover
                  group-hover:scale-110
                  transition
                  duration-500
                "
              />
            </div>

            <h3 className="
              mt-4
              font-semibold
              text-gray-700
              group-hover:text-pink-500
              transition
            ">
              {concern.name}
            </h3>
          </div>
        ))}

      </div>

      {/* View All */}
      <div className="flex justify-center mt-12">
        <button
          onClick={() => navigate("/products")}
          className="
            bg-pink-500
            hover:bg-pink-600
            text-white
            px-8
            py-3
            rounded-full
            font-semibold
            transition
          "
        >
          View All Concerns
        </button>
      </div>

    </section>
  );
};

export default ShopByConcern;
