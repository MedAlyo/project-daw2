import Image from "next/image";

/**
 * Home page component with monochromatic styling.
 */
export default function Home() {
  return (
    <div className="py-8 md:py-12">
      {/* Darker gray heading */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
        Welcome to LocaShop!
      </h1>
      {/* Medium gray paragraph text */}
      <p className="mb-6 text-lg text-gray-700">
        Find the products you need from shops near you. Enter your location and search for items.
      </p>
      {/* Placeholder content */}
      <div className="mt-10">
        {/* Slightly darker gray for section heading */}
        <p className="text-xl font-semibold text-gray-800">Featured Products:</p>
        {/* Muted gray for placeholder text */}
        <p className="text-gray-500 mt-2">Coming soon...</p>
      </div>
    </div>
  );
}
