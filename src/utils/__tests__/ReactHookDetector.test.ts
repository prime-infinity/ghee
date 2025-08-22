import { describe, it, expect, beforeEach } from 'vitest';
import { ReactHookDetector } from '../ReactHookDetector';
import { ASTParserService } from '../../services/ASTParserService';
// import * as t from '@babel/types';

describe('ReactHookDetector', () => {
  let astParser: ASTParserService;

  beforeEach(() => {
    astParser = new ASTParserService();
  });

  describe('findAllHooks', () => {
    it('should find useState hooks', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');
          return <div>{count} {name}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const hooks = ReactHookDetector.findAllHooks(parseResult.ast);

      expect(hooks).toHaveLength(2);
      expect(hooks[0].hookName).toBe('useState');
      expect(hooks[1].hookName).toBe('useState');
    });

    it('should find useEffect hooks', async () => {
      const code = `
        function Component() {
          useEffect(() => {
            console.log('mounted');
          }, []);
          
          useEffect(() => {
            console.log('updated');
          });
          
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const hooks = ReactHookDetector.findAllHooks(parseResult.ast);

      expect(hooks).toHaveLength(2);
      expect(hooks[0].hookName).toBe('useEffect');
      expect(hooks[1].hookName).toBe('useEffect');
    });

    it('should find custom hooks', async () => {
      const code = `
        function Component() {
          const data = useCustomHook();
          const { value, setValue } = useAnotherHook(initialValue);
          return <div>{data} {value}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const hooks = ReactHookDetector.findAllHooks(parseResult.ast);

      expect(hooks).toHaveLength(2);
      expect(hooks[0].hookName).toBe('useCustomHook');
      expect(hooks[1].hookName).toBe('useAnotherHook');
    });

    it('should not find non-hook function calls', async () => {
      const code = `
        function Component() {
          const result = regularFunction();
          const data = someUtility();
          return <div>{result} {data}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const hooks = ReactHookDetector.findAllHooks(parseResult.ast);

      expect(hooks).toHaveLength(0);
    });
  });

  describe('findUseStateHooks', () => {
    it('should extract useState information correctly', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('John');
          const [isVisible, setIsVisible] = useState(true);
          const [items, setItems] = useState([]);
          const [user, setUser] = useState({});
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(5);

      // Test numeric state
      const countHook = useStateHooks.find(hook => hook.stateName === 'count');
      expect(countHook).toBeDefined();
      expect(countHook!.setterName).toBe('setCount');
      expect(countHook!.isNumeric).toBe(true);
      expect(countHook!.isString).toBe(false);
      expect(countHook!.isBoolean).toBe(false);

      // Test string state
      const nameHook = useStateHooks.find(hook => hook.stateName === 'name');
      expect(nameHook).toBeDefined();
      expect(nameHook!.setterName).toBe('setName');
      expect(nameHook!.isString).toBe(true);
      expect(nameHook!.isNumeric).toBe(false);

      // Test boolean state
      const visibilityHook = useStateHooks.find(hook => hook.stateName === 'isVisible');
      expect(visibilityHook).toBeDefined();
      expect(visibilityHook!.setterName).toBe('setIsVisible');
      expect(visibilityHook!.isBoolean).toBe(true);
      expect(visibilityHook!.isNumeric).toBe(false);

      // Test array state
      const itemsHook = useStateHooks.find(hook => hook.stateName === 'items');
      expect(itemsHook).toBeDefined();
      expect(itemsHook!.setterName).toBe('setItems');
      expect(itemsHook!.isArray).toBe(true);
      expect(itemsHook!.isObject).toBe(false);

      // Test object state
      const userHook = useStateHooks.find(hook => hook.stateName === 'user');
      expect(userHook).toBeDefined();
      expect(userHook!.setterName).toBe('setUser');
      expect(userHook!.isObject).toBe(true);
      expect(userHook!.isArray).toBe(false);
    });

    it('should handle negative numbers', async () => {
      const code = `
        function Component() {
          const [temperature, setTemperature] = useState(-10);
          return <div>{temperature}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(1);
      expect(useStateHooks[0].isNumeric).toBe(true);
      expect(useStateHooks[0].stateName).toBe('temperature');
    });

    it('should handle useState without initial value', async () => {
      const code = `
        function Component() {
          const [data, setData] = useState();
          return <div>{data}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(1);
      expect(useStateHooks[0].initialValue).toBeNull();
      expect(useStateHooks[0].isNumeric).toBe(false);
      expect(useStateHooks[0].isString).toBe(false);
      expect(useStateHooks[0].isBoolean).toBe(false);
    });
  });

  describe('findUseEffectHooks', () => {
    it('should detect useEffect with dependencies', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log('count changed');
          }, [count]);
          
          return <div>{count}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useEffectHooks = ReactHookDetector.findUseEffectHooks(parseResult.ast);

      expect(useEffectHooks).toHaveLength(1);
      expect(useEffectHooks[0].dependencies).toHaveLength(1);
      expect(useEffectHooks[0].runsOnce).toBe(false);
      expect(useEffectHooks[0].hasCleanup).toBe(false);
    });

    it('should detect useEffect that runs once', async () => {
      const code = `
        function Component() {
          useEffect(() => {
            console.log('mounted');
          }, []);
          
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useEffectHooks = ReactHookDetector.findUseEffectHooks(parseResult.ast);

      expect(useEffectHooks).toHaveLength(1);
      expect(useEffectHooks[0].dependencies).toHaveLength(0);
      expect(useEffectHooks[0].runsOnce).toBe(true);
      expect(useEffectHooks[0].hasCleanup).toBe(false);
    });

    it('should detect useEffect with cleanup', async () => {
      const code = `
        function Component() {
          useEffect(() => {
            const timer = setInterval(() => {
              console.log('tick');
            }, 1000);
            
            return () => {
              clearInterval(timer);
            };
          }, []);
          
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useEffectHooks = ReactHookDetector.findUseEffectHooks(parseResult.ast);

      expect(useEffectHooks).toHaveLength(1);
      expect(useEffectHooks[0].hasCleanup).toBe(true);
      expect(useEffectHooks[0].runsOnce).toBe(true);
    });

    it('should detect useEffect without dependencies', async () => {
      const code = `
        function Component() {
          useEffect(() => {
            console.log('runs on every render');
          });
          
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useEffectHooks = ReactHookDetector.findUseEffectHooks(parseResult.ast);

      expect(useEffectHooks).toHaveLength(1);
      expect(useEffectHooks[0].dependencies).toBeNull();
      expect(useEffectHooks[0].runsOnce).toBe(false);
      expect(useEffectHooks[0].hasCleanup).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should detect if node has hooks', async () => {
      const codeWithHooks = `
        function Component() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const codeWithoutHooks = `
        function Component() {
          const count = 0;
          return <div>{count}</div>;
        }
      `;

      const parseResultWithHooks = await astParser.parseCode(codeWithHooks);
      const parseResultWithoutHooks = await astParser.parseCode(codeWithoutHooks);

      expect(ReactHookDetector.hasHooks(parseResultWithHooks.ast)).toBe(true);
      expect(ReactHookDetector.hasHooks(parseResultWithoutHooks.ast)).toBe(false);
    });

    it('should get hook names', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');
          
          useEffect(() => {
            console.log('effect');
          }, [count]);
          
          const data = useCustomHook();
          
          return <div>{count} {name} {data}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const hookNames = ReactHookDetector.getHookNames(parseResult.ast);

      expect(hookNames).toContain('useState');
      expect(hookNames).toContain('useEffect');
      expect(hookNames).toContain('useCustomHook');
      expect(hookNames).toHaveLength(3); // Should deduplicate useState
    });

    it('should check if specific hook is used', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log('effect');
          }, []);
          
          return <div>{count}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);

      expect(ReactHookDetector.usesHook(parseResult.ast, 'useState')).toBe(true);
      expect(ReactHookDetector.usesHook(parseResult.ast, 'useEffect')).toBe(true);
      expect(ReactHookDetector.usesHook(parseResult.ast, 'useContext')).toBe(false);
      expect(ReactHookDetector.usesHook(parseResult.ast, 'useCustomHook')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed useState calls', async () => {
      const code = `
        function Component() {
          const result = useState(0); // Not destructured
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      // Should still detect the hook but with default names
      expect(useStateHooks).toHaveLength(1);
      expect(useStateHooks[0].stateName).toBe('state');
      expect(useStateHooks[0].setterName).toBe('setState');
    });

    it('should handle partial destructuring', async () => {
      const code = `
        function Component() {
          const [count] = useState(0); // Only state, no setter
          return <div>{count}</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(1);
      expect(useStateHooks[0].stateName).toBe('count');
      expect(useStateHooks[0].setterName).toBe('setState'); // Default
    });

    it('should handle complex initial values', async () => {
      const code = `
        function Component() {
          const [user, setUser] = useState(() => ({ name: 'John', age: 30 }));
          const [items, setItems] = useState(() => [1, 2, 3]);
          return <div>Component</div>;
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(2);
      // Initial values are functions, so they won't be detected as specific types
      expect(useStateHooks[0].isObject).toBe(false);
      expect(useStateHooks[1].isArray).toBe(false);
    });

    it('should handle nested components', async () => {
      const code = `
        function ParentComponent() {
          const [parentState, setParentState] = useState(0);
          
          function ChildComponent() {
            const [childState, setChildState] = useState('child');
            return <div>{childState}</div>;
          }
          
          return (
            <div>
              {parentState}
              <ChildComponent />
            </div>
          );
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const useStateHooks = ReactHookDetector.findUseStateHooks(parseResult.ast);

      expect(useStateHooks).toHaveLength(2);
      
      const parentHook = useStateHooks.find(hook => hook.stateName === 'parentState');
      const childHook = useStateHooks.find(hook => hook.stateName === 'childState');
      
      expect(parentHook).toBeDefined();
      expect(childHook).toBeDefined();
      expect(parentHook!.isNumeric).toBe(true);
      expect(childHook!.isString).toBe(true);
    });
  });
});