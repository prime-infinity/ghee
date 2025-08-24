/**
 * Test data sets for various code patterns used in comprehensive testing
 */

export const testCodeSamples = {
  counterPatterns: [
    // Basic counter pattern
    `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,

    // Counter with decrement
    `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}`,

    // Multiple counters
    `import React, { useState } from 'react';

function MultiCounter() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  
  return (
    <div>
      <div>
        <p>Counter 1: {count1}</p>
        <button onClick={() => setCount1(count1 + 1)}>Inc 1</button>
      </div>
      <div>
        <p>Counter 2: {count2}</p>
        <button onClick={() => setCount2(count2 + 1)}>Inc 2</button>
      </div>
    </div>
  );
}`
  ],

  apiCallPatterns: [
    // Basic fetch pattern
    `import React, { useState, useEffect } from 'react';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/user')
      .then(response => response.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Hello, {user?.name}</div>;
}`,

    // Axios pattern with error handling
    `import React, { useState } from 'react';
import axios from 'axios';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/data');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      setData(null);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {error && <p>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}`,

    // POST request pattern
    `import React, { useState } from 'react';

function CreateUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });
      
      if (response.ok) {
        alert('User created successfully!');
        setName('');
        setEmail('');
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      alert('Error creating user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}`
  ],

  databasePatterns: [
    // Basic database query
    `const getUserById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  const result = await db.query(query, [id]);
  return result.rows[0];
};`,

    // Database insert with error handling
    `const createUser = async (userData) => {
  const { name, email, age } = userData;
  
  try {
    const query = 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)';
    const result = await db.query(query, [name, email, age]);
    return { success: true, id: result.insertId };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
};`,

    // Complex database operations
    `const updateUserWithHistory = async (userId, updates) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get current user data for history
    const currentUser = await connection.query(
      'SELECT * FROM users WHERE id = ?', 
      [userId]
    );
    
    // Insert into history table
    await connection.query(
      'INSERT INTO user_history (user_id, old_data, updated_at) VALUES (?, ?, NOW())',
      [userId, JSON.stringify(currentUser[0])]
    );
    
    // Update user
    const updateQuery = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    await connection.query(updateQuery, [updates.name, updates.email, userId]);
    
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};`
  ],

  errorHandlingPatterns: [
    // Try-catch with multiple error types
    `const processData = async (data) => {
  try {
    const validated = validateData(data);
    const processed = await processValidatedData(validated);
    return { success: true, result: processed };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: 'Invalid data format' };
    } else if (error instanceof NetworkError) {
      return { success: false, error: 'Network connection failed' };
    } else {
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
};`,

    // Error boundary pattern
    `import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}`,

    // Promise error handling
    `const fetchWithRetry = async (url, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw new Error(\`Failed after \${maxRetries} attempts: \${error.message}\`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};`
  ],

  reactComponentPatterns: [
    // Component with props and state
    `import React, { useState, useEffect } from 'react';

interface UserCardProps {
  userId: string;
  onUserClick: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ userId, onUserClick }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <div onClick={() => onUserClick(user)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};`,

    // Custom hook pattern
    `import { useState, useEffect } from 'react';

const useLocalStorage = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });
  
  const setValue = (value: any) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };
  
  return [storedValue, setValue];
};

const MyComponent = () => {
  const [name, setName] = useLocalStorage('name', '');
  
  return (
    <input 
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Enter your name"
    />
  );
};`,

    // Context pattern
    `import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    theme: 'light',
    notifications: []
  });
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};`
  ],

  complexCombinations: [
    // Full-stack component with multiple patterns
    `import React, { useState, useEffect, useCallback } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch todos on mount
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/todos');
        
        if (!response.ok) {
          throw new Error('Failed to fetch todos');
        }
        
        const todosData = await response.json();
        setTodos(todosData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodos();
  }, []);
  
  // Add new todo
  const addTodo = useCallback(async () => {
    if (!newTodo.trim()) return;
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo.trim() })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create todo');
      }
      
      const newTodoItem = await response.json();
      setTodos(prev => [...prev, newTodoItem]);
      setNewTodo('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  }, [newTodo]);
  
  // Toggle todo completion
  const toggleTodo = useCallback(async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      
      const response = await fetch(\`/api/todos/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
      
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  }, [todos]);
  
  // Delete todo
  const deleteTodo = useCallback(async (id: string) => {
    try {
      const response = await fetch(\`/api/todos/\${id}\`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
      
      setTodos(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  }, []);
  
  if (loading) return <div>Loading todos...</div>;
  
  return (
    <div>
      <h1>Todo App</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}
      
      <div>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ 
              textDecoration: todo.completed ? 'line-through' : 'none' 
            }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};`
  ],

  edgeCases: [
    // Empty code
    '',
    
    // Only comments
    `// This is just a comment
    /* 
     * Multi-line comment
     * with no actual code
     */`,
    
    // Syntax errors
    `function broken() {
      const x = 
      return x;
    }`,
    
    // Very large code sample
    `// Large code sample with many patterns
    import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
    
    const LargeComponent = () => {
      const [state1, setState1] = useState(0);
      const [state2, setState2] = useState('');
      const [state3, setState3] = useState([]);
      const [state4, setState4] = useState({});
      const [state5, setState5] = useState(null);
      
      ${Array.from({ length: 50 }, (_, i) => `
      const handler${i} = useCallback(() => {
        setState${(i % 5) + 1}(prev => prev + ${i});
      }, []);`).join('')}
      
      return (
        <div>
          ${Array.from({ length: 100 }, (_, i) => `
          <button key={${i}} onClick={handler${i % 50}}>
            Button ${i}
          </button>`).join('')}
        </div>
      );
    };`,
    
    // Nested patterns
    `const NestedComponent = () => {
      const [data, setData] = useState(null);
      
      useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch('/api/data');
            const result = await response.json();
            
            if (result.items) {
              const processedItems = result.items.map(item => {
                try {
                  return processItem(item);
                } catch (error) {
                  console.error('Item processing failed:', error);
                  return null;
                }
              }).filter(Boolean);
              
              setData(processedItems);
            }
          } catch (error) {
            try {
              const fallbackData = await fetch('/api/fallback');
              setData(await fallbackData.json());
            } catch (fallbackError) {
              console.error('All data sources failed:', fallbackError);
              setData([]);
            }
          }
        };
        
        fetchData();
      }, []);
      
      return data ? <div>{JSON.stringify(data)}</div> : <div>Loading...</div>;
    };`
  ]
};

export const performanceTestCases = {
  small: testCodeSamples.counterPatterns[0],
  medium: testCodeSamples.complexCombinations[0],
  large: testCodeSamples.edgeCases[3], // The very large code sample
  
  // Specific performance test cases
  manyComponents: `
    ${Array.from({ length: 20 }, (_, i) => `
    const Component${i} = () => {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
    };`).join('\n')}
  `,
  
  deepNesting: `
    const Level1 = () => {
      const [state1, setState1] = useState(0);
      return (
        <div onClick={() => setState1(s => s + 1)}>
          <Level2 />
        </div>
      );
    };
    
    const Level2 = () => {
      const [state2, setState2] = useState(0);
      return (
        <div onClick={() => setState2(s => s + 1)}>
          <Level3 />
        </div>
      );
    };
    
    const Level3 = () => {
      const [state3, setState3] = useState(0);
      return (
        <div onClick={() => setState3(s => s + 1)}>
          <Level4 />
        </div>
      );
    };
    
    const Level4 = () => {
      const [state4, setState4] = useState(0);
      return (
        <div onClick={() => setState4(s => s + 1)}>
          <Level5 />
        </div>
      );
    };
    
    const Level5 = () => {
      const [state5, setState5] = useState(0);
      return <button onClick={() => setState5(s => s + 1)}>Deep: {state5}</button>;
    };
  `
};

export const visualRegressionTestCases = {
  simpleCounter: testCodeSamples.counterPatterns[0],
  apiCall: testCodeSamples.apiCallPatterns[0],
  errorHandling: testCodeSamples.errorHandlingPatterns[0],
  complexFlow: testCodeSamples.complexCombinations[0]
};