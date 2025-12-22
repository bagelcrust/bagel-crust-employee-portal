/**
 * Vision Tab - Business Vision & Strategy
 *
 * Family business vision told as a narrative story.
 * Numbered cards read in chronological order.
 *
 * Card 1: A Decade of Lessons (2015-2025) - What we did and learned
 * Card 2: The Restaurant Path - Growth options if we pursue restaurants
 * Card 3: The Real Estate Path - Alternative wealth-building strategy
 * Card 4: The Vision - End goal and 10-year strategy
 */

import { useState } from 'react'
import { Compass, ChevronDown, ChevronRight } from 'lucide-react'

// Helper to render text with **bold** markers
function renderWithBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Numbered cards telling the family business story
const VISION_SECTIONS = [
  {
    number: 1,
    key: 'decadeOfLessons',
    title: 'A Decade of Lessons',
    subtitle: '2015–2025',
    summary: 'What we built, what we tried, and what we learned',
    intro: 'Ten years ago, there was no Bagel Crust. Today, we have two locations doing $1.5 million in combined annual revenue with ~20 employees. We built the brand, the systems, and the accounting from the ground up. But it wasn\'t just wins—there were experiments that failed, deals we missed, and hard lessons along the way.',
    chapters: [
      {
        title: 'Bagel Crust Calder',
        year: '2014–2015',
        narrative: 'Our flagship location. Uncle Alvaro invented Bagel Crust—Dad (Yuri) helped finance and grow it. In the early years (2015-2018), with Dad running it hands-on every day, the profit margins were high. Today it does $900K–$1M in gross sales annually. It\'s our production hub and the heart of the business.',
        lesson: 'Strong daily leadership drives profitability.'
      },
      {
        title: 'Bagel Crust Beaver',
        year: '2019',
        narrative: 'Our second location, built as a retail satellite. Currently does ~$500K in gross sales. We had actually signed the lease before finishing the Calder experiments—Beaver succeeded because it was part of an already-successful brand.',
        lesson: 'Build on what\'s already working.'
      },
      {
        title: 'The Calder Way Experiments',
        year: '2018–2020',
        narrative: 'We tried multiple concepts under one roof—Barranquero, Touch of Colombia, Patacon King, and finally Pablo\'s. Lost ~$100K total. Bagel Crust\'s success made us assume anything we tried would work.',
        lesson: 'Creating a smash hit is harder than we thought. Success doesn\'t transfer automatically.'
      },
      {
        title: 'The Westerly Deal',
        year: '~2020',
        narrative: 'A chance to buy a store doing ~$600K in sales with room to grow. We would have had it paid off by now. We missed it because we weren\'t unified—no master plan, no quick decision-making.',
        lesson: 'Be ready to move fast. Have a plan before opportunities appear.'
      },
      {
        title: 'Bagel Crust Little',
        year: '~2023',
        narrative: 'A tiny highway shop came up—cheap rent, but the lease was ending soon. It was a short-term, temporary move that was never going to last.',
        lesson: 'Put effort into things with long-term potential.'
      },
      {
        title: 'Susie\'s Tacos',
        year: '~2024',
        narrative: 'We wanted more hours for employees and more sales. The food was good, but a restaurant needs an entire ecosystem—drinks, sides, a full menu. Just because you can make a great taco doesn\'t mean you can run a taco restaurant.',
        lesson: 'Good food alone isn\'t enough. A restaurant is a whole system.'
      }
    ]
  },
  {
    number: 2,
    key: 'restaurantPath',
    title: 'The Restaurant Path',
    subtitle: 'What Growth Looks Like',
    summary: 'If we pursue restaurants, what are our options?',
    intro: 'Let\'s say we want to grow the restaurant business. What does that actually look like? What are all the cards on the table?',
    chapters: [
      {
        title: 'Acquisitions',
        narrative: 'Buy existing businesses that are already working. Find restaurants with proof of sales, proof of market, proof of concept. Either invest startup capital in someone\'s idea and take it over if it works, or buy an underperforming business with existing sales and improve it.',
        keyPoint: 'The lesson from Bagel Crust Calder: it\'s always better to improve something that\'s already working.'
      },
      {
        title: 'Franchising',
        narrative: 'License our brand, systems, and recipes to others. There\'s an initial franchise fee ($20K–$50K) that covers training and setup, plus ongoing royalties (~5% of sales monthly). We provide marketing, training, support, and systems. Franchisees get the freedom to run their own business while we collect fees.',
        keyPoint: 'Franchising is a mutual relationship—we take a risk together. But the key to making money is opening as many franchises as possible. The gap is huge: 10 franchises over 10 years roughly equals running 2 stores for 2 years.'
      },
      {
        title: 'Building Our Own',
        narrative: 'Open new corporate-owned Bagel Crust locations ourselves. Keep all the profits instead of franchise fees. Could create a central factory to supply multiple stores. Could expand into retail—Bagel Crust cream cheese, bagels, coffee in supermarkets.',
        keyPoint: 'The challenge: we don\'t have reliable systems for hiring and managing labor at scale. Our current model (bagel shop + diner hybrid) isn\'t easily duplicatable. Building 4 restaurants in a year needs 4 separate teams and constant attention.'
      },
      {
        title: 'The Economics',
        narrative: 'When Dad ran one store alone (2015-2018), profit margins were high—maybe 20-30%. With two stores, margins drop to ~15%. At 100 locations, margins might be 1-2%—but total profits are still huge. As you scale: margins go down, but revenue goes up. The final number can still be very good.',
        keyPoint: 'There\'s a gap from where we are now (2 locations) to where restaurants become "easy" (~20 locations with managers). We made almost no progress in 10 years. The gap is brutal.'
      }
    ]
  },
  {
    number: 3,
    key: 'realEstatePath',
    title: 'The Real Estate Path',
    subtitle: 'A Different Kind of Growth',
    summary: 'What if we focused on what\'s already working quietly in the background?',
    intro: 'Dad has a saying: "Restaurants are in the clouds, but real estate is legitimate." A restaurant can close tomorrow. A house is still standing. While we\'ve been focused on restaurants, real estate has been sitting in the background—Dad\'s side projects that just keep building value.',
    chapters: [
      {
        title: 'The Method That Works',
        narrative: 'Buy undervalued properties in growing markets. Renovate at low cost. Rent. Hold. This is what Dad knows and is good at. Trout Road was bought with cash, flipped, now rented. Allen Street is being renovated. Kephart Street was acquired in 2024. There\'s even a Florida property now.',
        keyPoint: 'Unlike restaurants where Dad would rather not be, I\'ve seen him come alive doing construction. This matches the skills and interests of our team.'
      },
      {
        title: 'The BRRRR Method',
        narrative: 'Buy, Renovate, Rent, Refinance, Repeat. Use restaurant cash flow to buy properties. Flip with a small team that moves project to project (unlike restaurants where you need separate teams). Build up asset value. Refinance to pull out equity. Buy more properties.',
        keyPoint: 'Real estate keeps the asset. Restaurants are pure cash flow—when they close, you have nothing. With real estate, even if rents are low, you still own the property.'
      },
      {
        title: 'Types of Properties',
        narrative: 'Single-family homes are our current comfort zone. But the sweet spot is small multifamily (4-5 units)—economies of scale with shared systems. Even better: commercial on bottom, apartments on top. The ultimate: larger apartment buildings, though that\'s a different beast.',
        keyPoint: 'Building 4 restaurants in a year is brutal. Flipping 4 houses with the same team moving project to project is actually doable.'
      },
      {
        title: 'Unity and Strength',
        narrative: 'Right now everything is separate—Dad\'s houses, my house, the restaurants. What if we put everything together? Not necessarily legally, but as a thought experiment. How much do we have? What\'s our total asset value? Our total debts? If we combined everything, could we pull $500K–$750K in loans to accelerate growth?',
        keyPoint: 'The cash flow comes from Bagel Crust. The wealth-building comes from real estate. They work together.'
      }
    ]
  },
  {
    number: 4,
    key: 'theVision',
    title: 'The Vision',
    subtitle: 'Where We\'re Going',
    summary: 'The end goal and how we get there',
    intro: 'We\'re at the end of 2025, looking back at 10 years and forward to the next 10. What kind of life do we want? What\'s the strategy to get there?',
    chapters: [
      {
        title: 'The Gap Problem',
        narrative: 'Whether it\'s restaurants or real estate, there\'s a brutal gap. Going from 2 locations to 20 is incredibly hard. Going from 5 properties to 50 is incredibly hard. The gap is where most people get stuck—you\'re too big to be small, too small to be big. We spent 10 years and barely moved.',
        keyPoint: 'The question isn\'t "what\'s the best business?" It\'s "how do we cross the gap?"'
      },
      {
        title: 'The 10-Year Strategy',
        narrative: 'Grow the real estate portfolio. Use restaurant profits (~$150K/year from $1.5M sales) to buy one property per year. That $100K becomes $100K in equity + appreciation + monthly rent. Build an asset-heavy portfolio while using Bagel Crust income for living expenses.',
        keyPoint: 'Real estate builds assets. Restaurants provide cash flow. Don\'t mix them up.'
      },
      {
        title: 'The Big Bet Later',
        narrative: 'Once the real estate portfolio is substantial, we can make a big move on restaurants—backed by real collateral. 10-20 locations in 2 years, with proper managers and systems. The real estate assets provide the foundation to take that risk.',
        keyPoint: 'We\'re not abandoning restaurants. We\'re building the foundation to do them right later.'
      },
      {
        title: 'Family Timeline',
        narrative: 'Allison is 14-15, with 3-4 years until she graduates high school. That will define Dad\'s retirement timeline. I\'m 30 with 35 years of work ahead. We need a business that works for both phases—Dad transitioning out, me building for the long term, and potentially Allison learning to become an executive if she wants.',
        keyPoint: 'This isn\'t just about making money. It\'s about building something that outlasts us.'
      }
    ]
  }
]

export function VisionTab() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleCard = (key: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedCards(newExpanded)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="w-7 h-7 text-indigo-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Vision
        </h2>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[10px] p-6 text-white shadow-lg">
        <h3 className="text-2xl font-bold mb-2">The Bagel Crust Vision</h3>
        <p className="text-indigo-100 text-sm leading-relaxed">
          A decade of lessons. Two paths forward. One family legacy.
        </p>
      </div>

      {/* Numbered Cards */}
      <div className="space-y-3">
        {VISION_SECTIONS.map((section) => {
          const isExpanded = expandedCards.has(section.key)

          return (
            <div
              key={section.key}
              className={`bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border overflow-hidden transition-colors ${
                isExpanded ? 'border-indigo-200' : 'border-white/50'
              }`}
            >
              <button
                onClick={() => toggleCard(section.key)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  isExpanded ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Number Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {section.number}
                  </div>
                  <div>
                    <div className={`font-bold ${isExpanded ? 'text-indigo-900' : 'text-gray-800'}`}>
                      {section.title}
                    </div>
                    <div className="text-xs text-gray-500">{section.subtitle} — {section.summary}</div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown size={20} className="text-indigo-600 flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-indigo-100">
                  {/* Intro paragraph */}
                  <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                    {section.intro}
                  </p>

                  {/* Chapters */}
                  <div className="space-y-4">
                    {section.chapters.map((chapter, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-200 pl-4">
                        <h4 className="font-semibold text-gray-800 text-base">
                          {chapter.title}
                          {'year' in chapter && (
                            <span className="text-gray-400 font-normal text-sm ml-2">
                              ({chapter.year})
                            </span>
                          )}
                        </h4>
                        <p className="text-[15px] text-gray-600 leading-relaxed mt-1">
                          {chapter.narrative}
                        </p>
                        {'lesson' in chapter && (
                          <p className="text-[14px] text-indigo-700 font-medium mt-2 bg-indigo-50 px-3 py-2 rounded-md">
                            Lesson: {chapter.lesson}
                          </p>
                        )}
                        {'keyPoint' in chapter && (
                          <p className="text-[14px] text-indigo-700 font-medium mt-2 bg-indigo-50 px-3 py-2 rounded-md">
                            {renderWithBold(chapter.keyPoint)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Note */}
      <div className="bg-amber-50 rounded-[10px] p-4 border border-amber-200">
        <p className="text-amber-800 text-sm">
          <span className="font-semibold">Living Document:</span> This vision was drafted December 2024.
          The numbers, timelines, and strategies will evolve as we learn more.
        </p>
      </div>
    </div>
  )
}
