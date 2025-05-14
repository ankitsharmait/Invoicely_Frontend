import { Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import AddItem from "./components/AddItem";
import AllItems from "./components/AllItems";
import GenerateBill from "./components/GenerateBill";
import AllBills from "./components/AllBills";

function App() {
  return (
    <div className="bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-300">
                  🧾 Invoicely
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/all-items" element={<AllItems />} />
          <Route path="/generate-bill" element={<GenerateBill />} />
          <Route path="/all-bills" element={<AllBills />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
