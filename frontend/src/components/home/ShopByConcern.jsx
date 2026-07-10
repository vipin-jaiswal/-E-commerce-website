import { useNavigate } from "react-router-dom";
import { ALL_CONCERNS } from "../../utils/concerns";

const ShopByConcern = () => {
  const navigate = useNavigate();

  const concerns = ALL_CONCERNS.slice(0, 6);

  return (
    <section id="shop-by-concern" className="scroll-mt-28 max-w-[1500px] mx-auto px-4 py-16">

      {/* Heading */}
      <div className="text-center mb-12">
        <p className="text-pink-500 uppercase tracking-[4px] text-sm font-semibold mb-2">
          Find Products For
        </p>

        <h2 className="text-4xl font-bold text-gray-800 dark:text-slate-100">
          Shop By Concern
        </h2>

        <p className="text-gray-500 dark:text-slate-400 mt-3">
          Choose your concern and discover the perfect products.
        </p>
      </div>

      {/* Concern Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

        {concerns.map((concern) => (
          <div
            key={concern.name}
            onClick={() => navigate(`/products?q=${concern.query}`)}
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
              text-gray-700 dark:text-slate-300
              group-hover:text-pink-500 dark:group-hover:text-pink-400
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
          onClick={() => navigate("/concerns")}
          className="
            bg-pink-500
            hover:bg-pink-600
            text-white
            px-6 py-2 sm:px-8 sm:py-3 text-sm sm:text-base
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
