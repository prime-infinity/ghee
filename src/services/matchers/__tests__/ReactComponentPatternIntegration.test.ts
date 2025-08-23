import { describe, it, expect } from 'vitest';
import { parse } from '@babel/parser';
import { PatternRecognitionEngine } from '../../PatternRecognitionEngine';

describe('React Component Pattern Integration', () => {
  const engine = new PatternRecognitionEngine();

  it('should recognize React functional component with hooks', () => {
    const code = `
      function UserProfile({ userId }) {
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true);
        
        useEffect(() => {
          fetchUser(userId).then(setUser).finally(() => setLoading(false));
        }, [userId]);
        
        if (loading) return <div>Loading...</div>;
        
        return (
          <div>
            <h1>{user?.name}</h1>
            <UserAvatar user={user} />
            <UserDetails user={user} />
          </div>
        );
      }
    `;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const patterns = engine.recognizePatterns(ast.program.body[0], code);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].type).toBe('react-component');
    expect(patterns[0].metadata.componentName).toBe('UserProfile');
    expect(patterns[0].metadata.usesHooks).toBe(true);
    expect(patterns[0].metadata.stateVariables).toContain('user');
    expect(patterns[0].metadata.stateVariables).toContain('loading');
    expect(patterns[0].metadata.effects).toContain('useEffect');
    expect(patterns[0].metadata.props).toContain('userId');
    expect(patterns[0].metadata.childComponents).toContain('UserAvatar');
    expect(patterns[0].metadata.childComponents).toContain('UserDetails');
  });

  it('should recognize React class component', () => {
    const code = `
      class Counter extends React.Component {
        constructor(props) {
          super(props);
          this.state = {
            count: 0,
            step: props.step || 1
          };
        }
        
        componentDidMount() {
          console.log('Counter mounted');
        }
        
        componentDidUpdate(prevProps, prevState) {
          if (prevState.count !== this.state.count) {
            console.log('Count changed to:', this.state.count);
          }
        }
        
        increment = () => {
          this.setState(state => ({ count: state.count + this.state.step }));
        }
        
        render() {
          return (
            <div>
              <span>Count: {this.state.count}</span>
              <button onClick={this.increment}>+{this.state.step}</button>
            </div>
          );
        }
      }
    `;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const patterns = engine.recognizePatterns(ast.program.body[0], code);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].type).toBe('react-component');
    expect(patterns[0].metadata.componentName).toBe('Counter');
    expect(patterns[0].metadata.hasLifecycleMethods).toBe(true);
    expect(patterns[0].metadata.stateVariables).toContain('count');
    expect(patterns[0].metadata.stateVariables).toContain('step');
    expect(patterns[0].metadata.effects).toContain('componentDidMount');
    expect(patterns[0].metadata.effects).toContain('componentDidUpdate');
  });

  it('should generate appropriate visualization nodes and connections', () => {
    const code = `
      function SimpleComponent({ title, onSave }) {
        const [data, setData] = useState('');
        
        useEffect(() => {
          console.log('Data changed:', data);
        }, [data]);
        
        return (
          <div>
            <h1>{title}</h1>
            <input value={data} onChange={e => setData(e.target.value)} />
            <button onClick={() => onSave(data)}>Save</button>
          </div>
        );
      }
    `;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const patterns = engine.recognizePatterns(ast.program.body[0], code);
    
    expect(patterns.length).toBeGreaterThan(0);
    const reactPattern = patterns.find(p => p.type === 'react-component');
    expect(reactPattern).toBeDefined();
    const pattern = reactPattern!;
    
    // Check nodes
    expect(pattern.nodes.length).toBeGreaterThan(0);
    const nodeTypes = pattern.nodes.map(n => n.type);
    expect(nodeTypes).toContain('component');
    
    // Check connections
    expect(pattern.connections.length).toBeGreaterThan(0);
    const connectionTypes = pattern.connections.map(c => c.type);
    expect(connectionTypes.some(type => 
      ['prop-flow', 'state-update', 'effect-trigger', 'control-flow'].includes(type)
    )).toBe(true);
  });
});