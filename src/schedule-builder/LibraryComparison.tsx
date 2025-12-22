/**
 * LibraryComparison - Shows the SAME components from MANY UI libraries
 * See everyone's different "default paint"
 */

import { Theme as RadixTheme, Button as RadixButton, Card as RadixCard, TextField as RadixTextField } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { Button as AntButton, Card as AntCard, Input as AntInput } from 'antd'
import { Button } from '@/shared/ui/button'
import { MantineProvider, Button as MantineButton, Card as MantineCard, TextInput as MantineInput } from '@mantine/core'
import '@mantine/core/styles.css'

// === 1. PURE HTML ===
function PureHtmlExample() {
  return (
    <div className="space-y-3">
      <button style={{
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
      }}>
        Button
      </button>
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Card Title</div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>Description text here</div>
      </div>
      <input
        type="text"
        placeholder="Input field"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />
    </div>
  )
}

// === 2. TAILWIND CSS ===
function TailwindExample() {
  return (
    <div className="space-y-3">
      <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium text-sm">
        Button
      </button>
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="font-semibold text-sm">Card Title</div>
        <div className="text-xs text-gray-500 mt-1">Description text here</div>
      </div>
      <input
        type="text"
        placeholder="Input field"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>
  )
}

// === 3. SHADCN/UI ===
function ShadcnExample() {
  return (
    <div className="space-y-3">
      <Button size="sm">Button</Button>
      <div className="p-4 bg-card rounded-lg border shadow-sm">
        <div className="font-semibold text-sm">Card Title</div>
        <div className="text-xs text-muted-foreground mt-1">Description text here</div>
      </div>
      <input
        type="text"
        placeholder="Input field"
        className="w-full px-3 py-2 border rounded-md text-sm"
      />
    </div>
  )
}

// === 4. RADIX THEMES ===
function RadixExample() {
  return (
    <RadixTheme accentColor="blue" radius="medium">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <RadixButton size="2">Button</RadixButton>
        <RadixCard size="2" style={{ padding: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Card Title</div>
          <div style={{ color: 'var(--gray-11)', fontSize: '12px', marginTop: '4px' }}>Description text here</div>
        </RadixCard>
        <RadixTextField.Root size="2" placeholder="Input field" />
      </div>
    </RadixTheme>
  )
}

// === 5. MANTINE ===
function MantineExample() {
  return (
    <MantineProvider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MantineButton size="sm">Button</MantineButton>
        <MantineCard shadow="sm" padding="md" radius="md" withBorder>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Card Title</div>
          <div style={{ color: '#868e96', fontSize: '12px', marginTop: '4px' }}>Description text here</div>
        </MantineCard>
        <MantineInput placeholder="Input field" size="sm" />
      </div>
    </MantineProvider>
  )
}

// === 6. ANT DESIGN ===
function AntExample() {
  return (
    <div className="space-y-3">
      <AntButton type="primary">Button</AntButton>
      <AntCard size="small" styles={{ body: { padding: '16px' } }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Card Title</div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>Description text here</div>
      </AntCard>
      <AntInput placeholder="Input field" />
    </div>
  )
}

// === MAIN COMPARISON ===
export function LibraryComparison() {
  const libraries = [
    { name: 'Pure HTML', desc: 'No library', component: <PureHtmlExample /> },
    { name: 'Tailwind', desc: 'Utility classes', component: <TailwindExample /> },
    { name: 'shadcn/ui', desc: 'Radix + Tailwind', component: <ShadcnExample /> },
    { name: 'Radix Themes', desc: 'Radix styled', component: <RadixExample /> },
    { name: 'Mantine', desc: 'Full library', component: <MantineExample /> },
    { name: 'Ant Design', desc: 'Enterprise UI', component: <AntExample /> },
  ]

  return (
    <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">UI Library Comparison</h2>
        <p className="text-sm text-gray-500 mt-1">
          Same 3 elements from 6 different libraries. Notice how similar they all look.
        </p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {libraries.map((lib) => (
          <div key={lib.name} className="min-w-0">
            <div className="text-xs font-bold text-gray-700 mb-1">{lib.name}</div>
            <div className="text-[10px] text-gray-400 mb-3">{lib.desc}</div>
            <div className="p-3 bg-gray-50 rounded-lg min-h-[200px]">
              {lib.component}
            </div>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>See it now?</strong> They're all basically the same - rounded corners, similar colors,
          same spacing patterns. The differences are subtle (Ant's blue is different, Mantine has more padding, etc.)
          but they're all "modern flat design." None of them will automatically give you that glass effect or unique look.
        </p>
      </div>
    </div>
  )
}
