import {
  Truck,
  ShieldCheck,
  RefreshCcw,
  BadgePercent
} from "lucide-react";

const FeatureBar = () => {
  const features = [
    {
      icon: <Truck size={30} />,
      title: "Free Shipping",
      desc: "Orders above ₹499"
    },
    {
      icon: <ShieldCheck size={30} />,
      title: "Secure Payment",
      desc: "100% secure checkout"
    },
    {
      icon: <RefreshCcw size={30} />,
      title: "Easy Returns",
      desc: "7 day return policy"
    },
    {
      icon: <BadgePercent size={30} />,
      title: "Best Deals",
      desc: "Exclusive offers"
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-white shadow-sm rounded-2xl p-6 text-center hover:shadow-md transition"
          >
            <div className="flex justify-center text-pink-500">
              {item.icon}
            </div>

            <h3 className="font-semibold mt-4">
              {item.title}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureBar;