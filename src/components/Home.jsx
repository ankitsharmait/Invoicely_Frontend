import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center bg-gray-100">
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-6">🧾 Invoicely</h1>
      
      <div className="grid grid-cols-1 gap-4 max-w-4xl w-full">
        {/* Bill Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">📋 Bill Section</h2>
          <div className="space-y-3">
            <Link
              to="/generate-bill"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-6 rounded-lg text-base font-medium transition-colors duration-300"
            >
              Generate Bill
            </Link>
            <Link
              to="/all-bills"
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white text-center py-3 px-6 rounded-lg text-base font-medium transition-colors duration-300"
            >
              All Bills
            </Link>
          </div>
        </div>

        {/* Item Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">📦 Item Section</h2>
          <div className="space-y-3">
            <Link
              to="/add-item"
              className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 px-6 rounded-lg text-base font-medium transition-colors duration-300"
            >
              Add Item
            </Link>
            <Link
              to="/all-items"
              className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white text-center py-3 px-6 rounded-lg text-base font-medium transition-colors duration-300"
            >
              All Items
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;  