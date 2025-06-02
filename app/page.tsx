import Link from 'next/link';
// TODO: Import components for search bar, product cards, shop cards when created

/**
 * Home page component for LocaShop.
 */
export default function Home() {
  return (
    <div className="space-y-12 py-8 md:py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-900">
          Shop Online, Discover Locally with LocaShop
        </h1>
        <p className="mb-8 text-lg text-gray-700 max-w-2xl mx-auto">
          Find everything you need from the comfort of your home or from your favorite neighborhood stores. LocaShop connects you to the best of both worlds.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {/* TODO: Implement a more functional search bar component */}
          <input 
            type="text" 
            placeholder="Search products or shops..." 
            className="px-4 py-2 border border-black bg-white rounded-md w-full sm:w-auto focus:ring-blue-500 focus:border-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md w-full sm:w-auto">
            Search
          </button>
        </div>
        <div className="mt-6 space-x-4">
            <Link href="/products" className="text-blue-600 hover:text-blue-800 font-medium">
                Browse All Products
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/shops" className="text-blue-600 hover:text-blue-800 font-medium">
                Explore Local Shops
            </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
          Featured Products
        </h2>
        {/* TODO: Replace with dynamic product listing component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Placeholder Product Cards - replace with actual ProductCard component */}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="bg-gray-200 h-40 rounded-md mb-3"></div> {/* Placeholder for image */}
              <h3 className="font-semibold text-gray-800">Product Name {item}</h3>
              <p className="text-gray-600 text-sm">Shop Name</p>
              <p className="text-lg font-bold text-gray-900 mt-1">$XX.XX</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/products" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md">
            View All Products
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-10 px-4 rounded-lg">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900">
          How LocaShop Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            {/* TODO: Replace with actual icons */}
            <div className="text-4xl mb-2">🛍️</div> 
            <h3 className="text-xl font-semibold mb-2 text-gray-800">1. Discover</h3>
            <p className="text-gray-700">
              Browse a wide range of products online or search for items available in stores near you.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">🛒</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">2. Choose Your Way</h3>
            <p className="text-gray-700">
              Opt for convenient online delivery or find the closest local shop for quick pickup.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">3. Enjoy</h3>
            <p className="text-gray-700">
              Get your products hassle-free and support local businesses when you shop nearby.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Shops Section (Optional) */}
      {/* TODO: Implement if desired, similar to Featured Products */}

    </div>
  );
}
