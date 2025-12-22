/**
 * Training Tab - Employee Training & Reference Materials
 *
 * Three sections:
 * - Getting Started: 5-step onboarding journey for new hires
 * - Quick Reference: Drinks, Opening, Closing, Orders, POS
 * - FAQ: Common questions new employees ask
 *
 * Content sourced from archived mobile-ios-app training system.
 */

import { useState } from 'react'
import {
  BookOpen,
  User,
  Coffee,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

type MainTab = 'start' | 'reference' | 'faq'
type ReferenceView = 'menu' | 'drinks' | 'opening' | 'closing' | 'orders' | 'pos'
type StartView = 'menu' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5'

export function TrainingTab() {
  const [activeTab, setActiveTab] = useState<MainTab>('start')
  const [referenceView, setReferenceView] = useState<ReferenceView>('menu')
  const [startView, setStartView] = useState<StartView>('menu')

  // Reset to menu when switching tabs
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab)
    setReferenceView('menu')
    setStartView('menu')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-blue-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Training
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="flex">
          {[
            { id: 'start' as MainTab, label: 'Getting Started', icon: BookOpen },
            { id: 'reference' as MainTab, label: 'Recipes', icon: Coffee },
            { id: 'faq' as MainTab, label: 'FAQ', icon: User }
          ].map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Getting Started Tab */}
      {activeTab === 'start' && (
        <GettingStartedContent
          view={startView}
          setView={setStartView}
        />
      )}

      {/* Quick Reference Tab */}
      {activeTab === 'reference' && (
        <QuickReferenceContent
          view={referenceView}
          setView={setReferenceView}
        />
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && <FAQContent />}
    </div>
  )
}

// ============================================================================
// GETTING STARTED CONTENT
// ============================================================================
interface GettingStartedContentProps {
  view: StartView
  setView: (view: StartView) => void
}

function GettingStartedContent({ view, setView }: GettingStartedContentProps) {
  // Show detail views
  if (view === 'step1') return <Step1Content onBack={() => setView('menu')} />
  if (view === 'step2') return <Step2Content onBack={() => setView('menu')} />
  if (view === 'step3') return <Step3Content onBack={() => setView('menu')} />
  if (view === 'step4') return <Step4Content onBack={() => setView('menu')} />
  if (view === 'step5') return <Step5Content onBack={() => setView('menu')} />

  // Menu view - clickable step cards
  const steps = [
    {
      id: 'step1' as StartView,
      step: 1,
      title: 'Welcome & Culture',
      description: 'Learn about Bagel Crust values and what makes us special',
      icon: '👋',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 'step2' as StartView,
      step: 2,
      title: 'Your First Day',
      description: "What to expect, who you'll meet, and how your first shift works",
      icon: '🌅',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'step3' as StartView,
      step: 3,
      title: 'Store Layout & Basics',
      description: 'Tour of the space, equipment, and where everything is',
      icon: '🏪',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'step4' as StartView,
      step: 4,
      title: 'Your Role Training',
      description: 'Role-specific skills and daily responsibilities',
      icon: '📋',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'step5' as StartView,
      step: 5,
      title: 'Questions & Resources',
      description: 'Where to get help, who to ask, and ongoing support',
      icon: '❓',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <div className="space-y-3">
      {steps.map((item) => (
        <button
          key={item.step}
          onClick={() => setView(item.id)}
          className={`w-full text-left ${item.bgColor} ${item.borderColor} border-2 rounded-[10px] p-4 transition-all active:scale-[0.98]`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-blue-600">
                  STEP {item.step}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500">
                {item.description}
              </p>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// STEP DETAIL VIEWS
// ============================================================================
function Step1Content({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3">
      <BackButton onBack={onBack} title="Welcome & Culture" />

      <ReferenceCard title="Welcome to Bagel Crust!">
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          We're so glad you're here! Bagel Crust is more than just a bagel shop - we're a community.
        </p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• We make fresh bagels every day</li>
          <li>• We treat customers like neighbors</li>
          <li>• We support each other as a team</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Our Values">
        <ul className="space-y-2 text-xs text-gray-600">
          <li><strong>Quality First:</strong> Fresh ingredients, made right</li>
          <li><strong>Friendly Service:</strong> Everyone gets a warm welcome</li>
          <li><strong>Teamwork:</strong> We help each other succeed</li>
          <li><strong>Reliability:</strong> Show up, communicate, follow through</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="What Makes Us Special">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Family-owned and operated</li>
          <li>• Part of the local community</li>
          <li>• We care about our employees</li>
          <li>• Growth opportunities for those who work hard</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

function Step2Content({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3">
      <BackButton onBack={onBack} title="Your First Day" />

      <ReferenceCard title="What to Bring">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Closed-toe, non-slip shoes</li>
          <li>• Dark pants or jeans</li>
          <li>• Hair tie if you have long hair</li>
          <li>• Positive attitude!</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="When You Arrive">
        <ol className="space-y-1 text-xs text-gray-600">
          <li>1. Come in through the front door</li>
          <li>2. Find your manager or trainer</li>
          <li>3. They'll give you a Bagel Crust shirt</li>
          <li>4. You'll get a quick tour of the store</li>
          <li>5. Training starts right away!</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Who You'll Meet">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Manager:</strong> Oversees everything, go to them with questions</li>
          <li>• <strong>Your Trainer:</strong> Will show you the ropes</li>
          <li>• <strong>Team Members:</strong> Your coworkers - everyone helps out</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="First Shift Tips">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Ask questions! No question is dumb</li>
          <li>• Watch and learn from experienced staff</li>
          <li>• Take notes if it helps you remember</li>
          <li>• It's okay to make mistakes - that's how you learn</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

function Step3Content({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3">
      <BackButton onBack={onBack} title="Store Layout & Basics" />

      <ReferenceCard title="Front of House">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Register/POS:</strong> Where you take orders and payments</li>
          <li>• <strong>Display Case:</strong> Shows bagels and baked goods</li>
          <li>• <strong>Coffee Station:</strong> Hot coffee, cold brew, espresso</li>
          <li>• <strong>Pickup Area:</strong> Where customers get their orders</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Back of House">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Prep Area:</strong> Where food is prepared</li>
          <li>• <strong>Toaster/Oven:</strong> For toasting bagels</li>
          <li>• <strong>Walk-in Fridge:</strong> Cold storage for ingredients</li>
          <li>• <strong>Dish Area:</strong> Where dishes get washed</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Important Locations">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Break Area:</strong> Where you can take breaks</li>
          <li>• <strong>Bathroom:</strong> Keep it clean for customers</li>
          <li>• <strong>Storage:</strong> Extra supplies and inventory</li>
          <li>• <strong>Emergency Exits:</strong> Know where they are!</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

function Step4Content({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3">
      <BackButton onBack={onBack} title="Your Role Training" />

      <ReferenceCard title="Cashier Responsibilities">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Greet every customer warmly</li>
          <li>• Take orders accurately</li>
          <li>• Handle payments (cash, card, mobile)</li>
          <li>• Answer phone and take phone orders</li>
          <li>• Keep front area clean and stocked</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Food Prep Basics">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Always wash hands before handling food</li>
          <li>• Use gloves when required</li>
          <li>• Follow recipes exactly</li>
          <li>• Keep work area clean</li>
          <li>• Check expiration dates</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Coffee & Drinks">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Learn all drink recipes (see Reference tab)</li>
          <li>• Keep coffee fresh - brew new batches regularly</li>
          <li>• Know how to use espresso machine</li>
          <li>• Clean equipment between uses</li>
        </ul>
      </ReferenceCard>

      <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-4">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Check the "Reference" tab for detailed guides on drinks, opening, closing, and more!
        </p>
      </div>
    </div>
  )
}

function Step5Content({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-3">
      <BackButton onBack={onBack} title="Questions & Resources" />

      <ReferenceCard title="Who to Ask">
        <ol className="space-y-1 text-xs text-gray-600">
          <li>1. <strong>Your Trainer:</strong> First person to ask during training</li>
          <li>2. <strong>Experienced Coworker:</strong> They've been through it</li>
          <li>3. <strong>Shift Supervisor:</strong> Can help with bigger issues</li>
          <li>4. <strong>Manager:</strong> For serious questions or problems</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="This App">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• <strong>Schedule:</strong> See your upcoming shifts</li>
          <li>• <strong>Time Off:</strong> Request days off</li>
          <li>• <strong>Hours:</strong> Track your worked hours</li>
          <li>• <strong>Training:</strong> Reference guides (you're here!)</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Communication">
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Running late? Text/call your manager ASAP</li>
          <li>• Need to call out? Give as much notice as possible</li>
          <li>• Have a problem? Talk to your manager privately</li>
          <li>• Shift swap? Get manager approval first</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="You've Got This!">
        <p className="text-xs text-gray-600 leading-relaxed">
          Everyone was new once. Ask questions, learn from mistakes, and don't be afraid to ask for help.
          We're all here to support each other. Welcome to the team!
        </p>
      </ReferenceCard>
    </div>
  )
}

// ============================================================================
// QUICK REFERENCE CONTENT
// ============================================================================
interface QuickReferenceContentProps {
  view: ReferenceView
  setView: (view: ReferenceView) => void
}

function QuickReferenceContent({ view, setView }: QuickReferenceContentProps) {
  if (view === 'drinks') return <DrinksReference onBack={() => setView('menu')} />
  if (view === 'opening') return <OpeningReference onBack={() => setView('menu')} />
  if (view === 'closing') return <ClosingReference onBack={() => setView('menu')} />
  if (view === 'orders') return <OrdersReference onBack={() => setView('menu')} />
  if (view === 'pos') return <POSReference onBack={() => setView('menu')} />

  // Recipe menu - cookbook style
  return (
    <div className="space-y-4">
      {/* Drinks Section */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Drinks
        </h3>
        <button
          onClick={() => setView('drinks')}
          className="w-full text-left bg-white rounded-[10px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 active:bg-gray-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-gray-800">Coffee & Drinks</h4>
              <p className="text-xs text-gray-500 mt-0.5">Hot coffee, cold brew, lattes, smoothies</p>
            </div>
            <ChevronRight className="text-gray-300" size={20} />
          </div>
        </button>
      </div>

      {/* Procedures Section */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Procedures
        </h3>
        <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 divide-y divide-gray-100">
          <button
            onClick={() => setView('opening')}
            className="w-full text-left p-4 active:bg-gray-50 first:rounded-t-[10px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-800">Opening</h4>
                <p className="text-xs text-gray-500 mt-0.5">Start of day checklist</p>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </div>
          </button>
          <button
            onClick={() => setView('closing')}
            className="w-full text-left p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-800">Closing</h4>
                <p className="text-xs text-gray-500 mt-0.5">End of day checklist</p>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </div>
          </button>
          <button
            onClick={() => setView('orders')}
            className="w-full text-left p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-800">Orders</h4>
                <p className="text-xs text-gray-500 mt-0.5">Fulfillment & bagging</p>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </div>
          </button>
          <button
            onClick={() => setView('pos')}
            className="w-full text-left p-4 active:bg-gray-50 last:rounded-b-[10px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-800">Register</h4>
                <p className="text-xs text-gray-500 mt-0.5">POS, payments, phone orders</p>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DRINKS REFERENCE
// ============================================================================
function DrinksReference({ onBack }: { onBack: () => void }) {
  const drinks = [
    {
      name: "Hot Coffee",
      recipe: [
        "Grab hot coffee cup and sleeve",
        "Pour hot coffee",
        "Add 2 sugar packets (unless customer wants different)",
        "Add 1-2 oz milk (splash) if ordered",
        "Mix well!"
      ]
    },
    {
      name: "Cold Brew",
      recipe: [
        "Get cup (small or large)",
        "Add sugar/sweetener FIRST if ordered (2-3 pumps syrup)",
        "Fill with ice",
        "Add cold brew (fill most of cup)",
        "Top with milk if ordered",
        "Mix well!"
      ]
    },
    {
      name: "Iced Latte",
      recipe: [
        "Make espresso (grind, compress, brew into metal cup)",
        "Add 3 pumps syrup if ordered",
        "Fill metal cup with milk (less than full)",
        "Pour everything into large cup of ice",
        "Mix"
      ]
    },
    {
      name: "Hot Latte",
      recipe: [
        "Make espresso (grind, compress, brew into metal cup)",
        "Add syrup if ordered",
        "Fill metal cup with milk to bend line",
        "Steam milk (nozzle in milk, tap side to check temp)",
        "Pour all into hot to-go cup",
        "Mix with long metal spoon"
      ]
    },
    {
      name: "Smoothie",
      recipe: [
        "Get frozen fruit (strawberry or mango)",
        "Add banana (use peel, don't touch inside)",
        "Add orange juice",
        "Put all in small cup, then blender",
        "Blend, put back in small cup"
      ]
    }
  ]

  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} title="Coffee & Drinks" />

      {drinks.map((drink, index) => (
        <div key={index} className="bg-white rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">{drink.name}</h3>
          <ul className="space-y-2">
            {drink.recipe.map((step, stepIndex) => (
              <li key={stepIndex} className="text-base text-gray-700 flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// OPENING REFERENCE
// ============================================================================
function OpeningReference({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} title="Opening" />

      <ReferenceCard title="Basic Setup">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Take sign outside</li>
          <li>• Turn lights on</li>
          <li>• Turn music on ("it's alt good" station, low-medium volume)</li>
          <li>• Turn on Square (set iPad Auto-Lock to "Never")</li>
          <li>• Turn on Kiosk</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Brew Hot Coffee">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Put filter in funnel</li>
          <li>2. Choose grind size (usually medium)</li>
          <li>3. Put funnel in brewer</li>
          <li>4. Select brew size (must match grind size!)</li>
          <li>5. Brew</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Turn On Cold Brew">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Open cold brew fridge</li>
          <li>2. Locate nitrogen tank</li>
          <li>3. Turn tank valve counter clockwise (half turn till you hear gas)</li>
          <li>4. Locate gas keg line</li>
          <li>5. Turn valve right</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Espresso & Syrups">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Fill espresso machine with beans</li>
          <li>2. Locate pumps and syrups</li>
          <li>3. Consolidate any partial syrups</li>
          <li>4. Flush pumps (3 pumps in water, 3 in air)</li>
          <li>5. Screw pumps onto syrups</li>
          <li>6. Save caps (don't throw away!)</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Prep Bathroom">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Locate key, take out holder</li>
          <li>• Replace paper (rolls face out)</li>
          <li>• Put back holder and key</li>
          <li>• Clean mirrors with Windex</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Restock">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Napkins, forks, straws</li>
          <li>• Cups and lids</li>
          <li>• Check all customer areas</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

// ============================================================================
// CLOSING REFERENCE
// ============================================================================
function ClosingReference({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} title="Closing" />

      <ReferenceCard title="Put Away Coffee">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Bring sign inside</li>
          <li>• Dump leftover hot coffee in sink</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Turn Off Cold Brew">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Turn tank valve clockwise</li>
          <li>2. Turn gas keg line left</li>
          <li>3. Clean drip tray</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Put Syrup Pumps Away">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Unscrew pumps, shake out remaining syrup</li>
          <li>2. Put upside down in cup of clean water</li>
          <li>3. Put lids on syrup bottles</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Clean Espresso Machine">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-base text-red-700 font-medium">⚠️ Top of machine is HOT!</p>
        </div>
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Get coffee off top of grinder (use towel)</li>
          <li>2. Remove grinder tray and wash</li>
          <li>3. Brush top of espresso machine</li>
          <li>4. Use damp towel to clean</li>
          <li>5. Remove espresso tray and wash</li>
          <li>6. Wash accessories</li>
          <li>7. Put back trays, leave to dry</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Clean Surfaces">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-base text-blue-700"><strong>Sanitizer:</strong> Tiny amount in spray bottle + water. Should be light pink.</p>
        </div>
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Wipe all customer tables</li>
          <li>• Wipe POS table (careful with screens!)</li>
          <li>• Wipe metal work surfaces</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Turn Everything Off">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Square: Settings → Auto-Lock → "2 minutes"</li>
          <li>• Pause the music</li>
          <li>• Turn off all lights</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

// ============================================================================
// ORDERS REFERENCE
// ============================================================================
function OrdersReference({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} title="Orders" />

      <ReferenceCard title="Ticket Types">
        <ul className="space-y-2 text-base text-gray-700">
          <li><strong>White ticket:</strong> In-store order</li>
          <li><strong>Yellow ticket:</strong> Phone/online order</li>
          <li><strong>Pink ticket:</strong> Catering order</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Bagging Orders">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Read ticket carefully - check all items</li>
          <li>2. Grab correct size bag</li>
          <li>3. Add napkins (2-3 per order)</li>
          <li>4. Include utensils if needed (cream cheese = knife)</li>
          <li>5. Fold bag neatly</li>
          <li>6. Staple ticket to bag</li>
          <li>7. Call out customer name</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Quality Check">
        <ul className="space-y-2 text-base text-gray-700">
          <li>• Double-check order matches ticket</li>
          <li>• Make sure bagels are fresh (not hard/stale)</li>
          <li>• Cream cheese spread evenly</li>
          <li>• Sandwiches wrapped properly</li>
          <li>• Drinks capped securely</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

// ============================================================================
// POS REFERENCE
// ============================================================================
function POSReference({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} title="Register" />

      <ReferenceCard title="Taking an Order">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Greet customer warmly</li>
          <li>2. Listen to full order before entering</li>
          <li>3. Enter items in Square</li>
          <li>4. Read back order to confirm</li>
          <li>5. Ask "For here or to go?"</li>
          <li>6. Tell them the total</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Payment Types">
        <ul className="space-y-2 text-base text-gray-700">
          <li><strong>Card:</strong> Tap, insert, or swipe</li>
          <li><strong>Apple/Google Pay:</strong> Hold phone near reader</li>
          <li><strong>Cash:</strong> Count change carefully, count back to customer</li>
        </ul>
      </ReferenceCard>

      <ReferenceCard title="Phone Orders">
        <ol className="space-y-2 text-base text-gray-700">
          <li>1. Answer: "Bagel Crust, how can I help you?"</li>
          <li>2. Write down order on paper first</li>
          <li>3. Get customer name and phone number</li>
          <li>4. Ask pickup time</li>
          <li>5. Enter in Square as phone order</li>
          <li>6. Read back order and total</li>
          <li>7. Put ticket in phone order area</li>
        </ol>
      </ReferenceCard>

      <ReferenceCard title="Common Issues">
        <ul className="space-y-2 text-base text-gray-700">
          <li><strong>Card declined:</strong> Ask if they have another card or cash</li>
          <li><strong>Wrong order:</strong> Apologize, fix immediately, no charge for remake</li>
          <li><strong>Refund needed:</strong> Get manager approval first</li>
        </ul>
      </ReferenceCard>
    </div>
  )
}

// ============================================================================
// FAQ CONTENT
// ============================================================================
function FAQContent() {
  const faqs = [
    {
      question: "When do I get paid?",
      answer: "Payroll runs every two weeks on Fridays. Your first paycheck will arrive two weeks after your start date.",
      category: "Pay & Benefits"
    },
    {
      question: "What should I wear to work?",
      answer: "Clean, closed-toe shoes (non-slip preferred), dark pants or jeans, and a Bagel Crust t-shirt (provided). Hair should be tied back if long.",
      category: "Dress Code"
    },
    {
      question: "Can I request time off?",
      answer: "Yes! Use the Time Off tab in this app to request time off. Give at least 2 weeks notice for planned time off when possible.",
      category: "Scheduling"
    },
    {
      question: "What if I'm running late or need to call out?",
      answer: "Text or call your manager ASAP. Don't just not show up - communication is key to helping the team adjust.",
      category: "Attendance"
    },
    {
      question: "Who do I ask if I have questions during my shift?",
      answer: "Always ask! Your trainer first, then any experienced team member, then the shift supervisor or manager. Everyone wants to help you succeed.",
      category: "Getting Help"
    },
    {
      question: "How do tips work?",
      answer: "Tips are pooled and split among all front-of-house staff working that shift. Tips are distributed at the end of each shift.",
      category: "Pay & Benefits"
    }
  ]

  return (
    <div className="space-y-2.5">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-white/90 backdrop-blur-md rounded-[10px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
          <div className="mb-1.5">
            <span className="text-[10px] font-medium text-blue-600">
              {faq.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            {faq.question}
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function BackButton({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-gray-600 mb-2"
    >
      <ArrowLeft size={18} />
      <span className="text-sm font-medium">{title}</span>
    </button>
  )
}

function ReferenceCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}
