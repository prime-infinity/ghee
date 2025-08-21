import { useState } from "react";
import { Code, Play } from "lucide-react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Code className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">ghee</h1>
        </div>

        <p className="text-xl text-gray-600 mb-8">
          Transform code into intuitive visual diagrams
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Project Setup Complete!
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>React + TypeScript</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Vite Build Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Lucide React Icons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>@babel/parser</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>React Flow</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCount((count) => count + 1)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          Test Counter: {count}
        </button>
      </div>
    </div>
  );
}

export default App;
