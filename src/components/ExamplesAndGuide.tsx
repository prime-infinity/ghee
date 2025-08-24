import React, { useState } from "react";
import {
  Code,
  Play,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";

interface ExampleCode {
  id: string;
  title: string;
  description: string;
  code: string;
  category: "react" | "javascript" | "api" | "database";
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface ExamplesAndGuideProps {
  onExampleSelect: (code: string) => void;
  className?: string;
}

const EXAMPLE_CODES: ExampleCode[] = [
  {
    id: "counter",
    title: "React Counter",
    description: "A simple counter with useState hook",
    category: "react",
    difficulty: "beginner",
    code: `function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  );
}`,
  },
  {
    id: "api-fetch",
    title: "API Data Fetching",
    description: "Fetch data from an API with error handling",
    category: "api",
    difficulty: "intermediate",
    code: `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}`,
  },
  {
    id: "todo-list",
    title: "Todo List Component",
    description: "A todo list with add, remove, and toggle functionality",
    category: "react",
    difficulty: "intermediate",
    code: `function TodoList() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue,
        completed: false
      }]);
      setInputValue('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Add a todo..."
      />
      <button onClick={addTodo}>Add</button>
      
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
        </div>
      ))}
    </div>
  );
}`,
  },
  {
    id: "database-operations",
    title: "Database Operations",
    description: "CRUD operations with a database",
    category: "database",
    difficulty: "advanced",
    code: `class UserService {
  async createUser(userData) {
    try {
      const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const result = await db.execute(query, [userData.name, userData.email]);
      return { id: result.insertId, ...userData };
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }
  
  async getUserById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user');
    }
  }
  
  async updateUser(id, updates) {
    try {
      const query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
      await db.execute(query, [updates.name, updates.email, id]);
      return this.getUserById(id);
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }
}`,
  },
  {
    id: "form-validation",
    title: "Form with Validation",
    description: "A form component with input validation",
    category: "react",
    difficulty: "intermediate",
    code: `function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
      />
      {errors.message && <span className="error">{errors.message}</span>}
      
      <button type="submit">Send Message</button>
    </form>
  );
}`,
  },
];

const GETTING_STARTED_STEPS = [
  {
    title: "Paste Your Code",
    description:
      "Copy and paste your JavaScript or TypeScript code into the input area above.",
    icon: Code,
  },
  {
    title: "Click Visualize",
    description:
      "Press the 'Visualize Code' button or use Ctrl+Enter to start the analysis.",
    icon: Play,
  },
  {
    title: "Explore the Diagram",
    description:
      "Click on nodes and arrows to see detailed explanations of what each part does.",
    icon: BookOpen,
  },
];

export const ExamplesAndGuide: React.FC<ExamplesAndGuideProps> = ({
  onExampleSelect,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"examples" | "guide">("examples");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Examples" },
    { id: "react", label: "React" },
    { id: "javascript", label: "JavaScript" },
    { id: "api", label: "API Calls" },
    { id: "database", label: "Database" },
  ];

  const filteredExamples =
    selectedCategory === "all"
      ? EXAMPLE_CODES
      : EXAMPLE_CODES.filter(
          (example) => example.category === selectedCategory
        );

  const handleCopyExample = async (code: string, exampleId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedExample(exampleId);
      setTimeout(() => setCopiedExample(null), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-50";
      case "intermediate":
        return "text-yellow-600 bg-yellow-50";
      case "advanced":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "examples"}
            aria-controls="examples-panel"
            onClick={() => setActiveTab("examples")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors-smooth ${
              activeTab === "examples"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Lightbulb className="w-4 h-4 inline-block mr-2" />
            Code Examples
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "guide"}
            aria-controls="guide-panel"
            onClick={() => setActiveTab("guide")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors-smooth ${
              activeTab === "guide"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-2" />
            Getting Started
          </button>
        </nav>
      </div>

      {/* Examples Tab */}
      {activeTab === "examples" && (
        <div
          id="examples-panel"
          role="tabpanel"
          aria-labelledby="examples-tab"
          className="p-6 animate-fade-in"
        >
          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Choose an Example
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors-smooth ${
                    selectedCategory === category.id
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExamples.map((example, index) => (
              <div
                key={example.id}
                className="border border-gray-200 rounded-lg p-4 hover-lift transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {example.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {example.description}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        example.difficulty
                      )}`}
                    >
                      {example.difficulty}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-3 mb-3">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    <code>{example.code.slice(0, 150)}...</code>
                  </pre>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onExampleSelect(example.code)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors-smooth text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Try This Example
                  </button>
                  <button
                    onClick={() => handleCopyExample(example.code, example.id)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors-smooth"
                    title="Copy code to clipboard"
                  >
                    {copiedExample === example.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started Tab */}
      {activeTab === "guide" && (
        <div
          id="guide-panel"
          role="tabpanel"
          aria-labelledby="guide-tab"
          className="p-6 animate-fade-in"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            How to Use Ghee Code Visualizer
          </h3>

          <div className="space-y-6">
            {GETTING_STARTED_STEPS.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 animate-slide-in-left"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Pro Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Use{" "}
                <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">
                  Ctrl+Enter
                </kbd>{" "}
                to quickly visualize your code
              </li>
              <li>• Click on diagram nodes to see detailed explanations</li>
              <li>• Try the examples above to see different code patterns</li>
              <li>
                • The visualizer works best with React components and JavaScript
                functions
              </li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setActiveTab("examples")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors-smooth font-medium"
            >
              Try an Example
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
