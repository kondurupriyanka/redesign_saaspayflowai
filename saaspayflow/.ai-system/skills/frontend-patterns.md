---
name: frontend-patterns
description: React/Next.js component and state management patterns for PayFlow
---

# Frontend Patterns

Best practices for React/Next.js/TypeScript components in PayFlow.

## Component Architecture

**Container vs Presentational**
```typescript
// ✅ Presentational component (reusable, testable)
interface FeatureCardProps {
  title: string;
  description: string;
  onSelect: () => void;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, onSelect }) => {
  return (
    <div className="rounded-lg border border-white/5 bg-[#111] p-6 hover:scale-[1.02]">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <button onClick={onSelect} className="mt-4 btn-primary">Select</button>
    </div>
  );
};

// ✅ Container component (fetches data, manages state)
const FeatureGrid: React.FC = () => {
  const [features, setFeatures] = useState([]);
  useEffect(() => { /* fetch */ }, []);
  return <div>{features.map(f => <FeatureCard {...f} />)}</div>;
};
```

**Custom Hooks for Logic**
```typescript
// ✅ Reusable hook
const useInvoiceAPI = (invoiceId: string) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        setInvoice(await res.json());
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  return { invoice, loading, error };
};
```

## State Management

- **Local state** (useState): Form inputs, UI toggles
- **Server state** (SWR/React Query): Invoices, users, payments
- **Global state** (Zustand/Context): Current user, auth status
- **Never use**: Redux for this project (overkill)

```typescript
// ✅ SWR for server state
import useSWR from 'swr';

const Dashboard = () => {
  const { data: invoices, isLoading } = useSWR('/api/invoices', fetch);
  return isLoading ? <Loading /> : <InvoiceList data={invoices} />;
};
```

## Styling Rules

- Use **Tailwind** utility classes, not CSS-in-JS
- Follow design system in `.ai-system/context/design-tokens.md`
- Responsive: `sm:`, `md:`, `lg:` prefixes
- Dark mode: Use `dark:` for tweaks (app is dark-first)
- **No CSS files** in components — inline Tailwind only

## Testing

```typescript
// ✅ Component test with Vitest + React Testing Library
describe('FeatureCard', () => {
  it('calls onSelect when button clicked', () => {
    const handleSelect = vi.fn();
    render(<FeatureCard title="Test" onSelect={handleSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalled();
  });
});
```

## Form Handling

- Use **React Hook Form** for complex forms
- Validate with **Zod** before submission
- Show inline error messages
- Disable submit during loading

```typescript
const InvoiceForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(invoiceSchema),
  });

  return (
    <form onSubmit={handleSubmit(async (data) => {
      const res = await fetch('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
      // handle response
    })}>
      <input {...register('amount')} type="number" />
      {errors.amount && <span className="text-red-500">{errors.amount.message}</span>}
    </form>
  );
};
```

## Performance

- **Code splitting**: Use `dynamic()` for heavy components
- **Image optimization**: Always use `next/image`
- **Lazy loading**: `loading="lazy"` for below-fold images
- **Memoization**: `useMemo`/`useCallback` for expensive computations, **not** for component re-renders (use `useMemo(() => <Component />, [deps])` if truly needed)

## Patterns to Avoid

- ❌ Redux for simple apps
- ❌ Inline styles
- ❌ `console.log` in production
- ❌ Storing sensitive data (tokens) in localStorage — use httpOnly cookies
- ❌ Rendering lists without keys
- ❌ Props drilling for global state — use Context or Zustand
