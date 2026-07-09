import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

// ── 78-Card Tarot Deck ────────────────────────────────────────────────────────

const MAJOR_ARCANA = [
  { id: 0,  name: 'The Fool',         element: 'Air',   planet: 'Uranus',
    upright:  'New beginnings, innocence, spontaneity, free spirit — a leap of faith into the unknown.',
    reversed: 'Recklessness, taken advantage of, inconsideration — holding back from a necessary leap.',
    keywords: ['beginnings', 'innocence', 'adventure', 'potential'] },
  { id: 1,  name: 'The Magician',     element: 'Air',   planet: 'Mercury',
    upright:  'Manifestation, resourcefulness, power, inspired action — you have all the tools you need.',
    reversed: 'Manipulation, poor planning, untapped talents — skills are present but misused.',
    keywords: ['willpower', 'skill', 'concentration', 'manifestation'] },
  { id: 2,  name: 'The High Priestess', element: 'Water', planet: 'Moon',
    upright:  'Intuition, sacred knowledge, divine feminine, the subconscious — trust your inner voice.',
    reversed: 'Secrets, disconnected from intuition, withdrawal — hidden agendas or repressed feelings.',
    keywords: ['intuition', 'mystery', 'subconscious', 'inner knowledge'] },
  { id: 3,  name: 'The Empress',      element: 'Earth', planet: 'Venus',
    upright:  'Femininity, beauty, nature, abundance, nurturing — creativity and maternal energy flourish.',
    reversed: 'Creative block, dependence on others, emptiness — neglect of self or others.',
    keywords: ['abundance', 'fertility', 'creativity', 'nurturing'] },
  { id: 4,  name: 'The Emperor',      element: 'Fire',  planet: 'Aries',
    upright:  'Authority, structure, protection, father figure — stability through discipline and order.',
    reversed: 'Domination, excessive control, rigidity, inflexibility — abuse of power.',
    keywords: ['authority', 'structure', 'control', 'fatherhood'] },
  { id: 5,  name: 'The Hierophant',   element: 'Earth', planet: 'Taurus',
    upright:  'Spiritual wisdom, tradition, conformity, institutions — guidance from established systems.',
    reversed: 'Personal beliefs, freedom, challenging the status quo — break from convention.',
    keywords: ['tradition', 'conformity', 'morality', 'ethics'] },
  { id: 6,  name: 'The Lovers',       element: 'Air',   planet: 'Gemini',
    upright:  'Love, harmony, relationships, values, alignment — a meaningful union or choice awaits.',
    reversed: 'Disharmony, imbalance, misalignment of values — difficulty with a key decision.',
    keywords: ['love', 'union', 'choices', 'alignment'] },
  { id: 7,  name: 'The Chariot',      element: 'Water', planet: 'Cancer',
    upright:  'Control, willpower, success, action, determination — victory through focused effort.',
    reversed: 'Lack of control, aggression, obstacles — scattered energy or loss of direction.',
    keywords: ['willpower', 'victory', 'control', 'success'] },
  { id: 8,  name: 'Strength',         element: 'Fire',  planet: 'Leo',
    upright:  'Strength, courage, patience, control, compassion — inner power over outer force.',
    reversed: 'Inner strength needed, self-doubt, low energy — courage must be summoned from within.',
    keywords: ['courage', 'persuasion', 'influence', 'compassion'] },
  { id: 9,  name: 'The Hermit',       element: 'Earth', planet: 'Virgo',
    upright:  'Soul-searching, introspection, being alone, inner guidance — seek wisdom within.',
    reversed: 'Isolation, loneliness, withdrawal — excessive solitude or refusing guidance.',
    keywords: ['introspection', 'searching', 'guidance', 'solitude'] },
  { id: 10, name: 'Wheel of Fortune', element: 'Fire',  planet: 'Jupiter',
    upright:  'Good luck, karma, life cycles, destiny, a turning point — fortune turns in your favour.',
    reversed: 'Bad luck, resistance to change, breaking cycles — an unwelcome turn of fate.',
    keywords: ['luck', 'karma', 'destiny', 'cycles'] },
  { id: 11, name: 'Justice',          element: 'Air',   planet: 'Libra',
    upright:  'Justice, fairness, truth, cause and effect, law — balance is restored; truth prevails.',
    reversed: 'Unfairness, lack of accountability, dishonesty — injustice or legal complications.',
    keywords: ['justice', 'fairness', 'truth', 'law'] },
  { id: 12, name: 'The Hanged Man',   element: 'Water', planet: 'Neptune',
    upright:  'Pause, surrender, letting go, new perspectives — a willing sacrifice reveals deeper truth.',
    reversed: 'Delays, resistance, stalling, indecision — unwilling to make a necessary sacrifice.',
    keywords: ['sacrifice', 'release', 'suspension', 'perspective'] },
  { id: 13, name: 'Death',            element: 'Water', planet: 'Scorpio',
    upright:  'Endings, change, transformation, transition — one chapter closes so another may begin.',
    reversed: 'Resistance to change, inability to move on, stagnation — clinging to what must end.',
    keywords: ['endings', 'change', 'transformation', 'transition'] },
  { id: 14, name: 'Temperance',       element: 'Fire',  planet: 'Sagittarius',
    upright:  'Balance, moderation, patience, purpose, meaning — harmony achieved through middle path.',
    reversed: 'Imbalance, excess, lack of long-term vision — extremes creating tension.',
    keywords: ['balance', 'moderation', 'patience', 'purpose'] },
  { id: 15, name: 'The Devil',        element: 'Earth', planet: 'Capricorn',
    upright:  'Shadow self, attachment, addiction, restriction, sexuality — bonds you willingly maintain.',
    reversed: 'Releasing limiting beliefs, exploring dark thoughts, detachment — breaking free.',
    keywords: ['shadow', 'materialism', 'bondage', 'addiction'] },
  { id: 16, name: 'The Tower',        element: 'Fire',  planet: 'Mars',
    upright:  'Sudden change, upheaval, chaos, revelation, awakening — what is false must crumble.',
    reversed: 'Personal transformation, fear of change, averting disaster — a gentler disruption.',
    keywords: ['upheaval', 'chaos', 'revelation', 'awakening'] },
  { id: 17, name: 'The Star',         element: 'Air',   planet: 'Aquarius',
    upright:  'Hope, faith, purpose, renewal, spirituality — after the storm, the stars guide you home.',
    reversed: 'Lack of faith, despair, self-trust issues, disconnection — hope must be reclaimed.',
    keywords: ['hope', 'faith', 'renewal', 'spirituality'] },
  { id: 18, name: 'The Moon',         element: 'Water', planet: 'Pisces',
    upright:  'Illusion, fear, the unconscious, confusion — things are not what they appear; trust instinct.',
    reversed: 'Release of fear, repressed emotion, inner confusion — clarity emerging from fog.',
    keywords: ['illusion', 'fear', 'subconscious', 'confusion'] },
  { id: 19, name: 'The Sun',          element: 'Fire',  planet: 'Sun',
    upright:  'Positivity, fun, warmth, success, vitality — radiant clarity and joyful achievement.',
    reversed: 'Inner child, feeling down, overly optimistic — brilliance temporarily obscured.',
    keywords: ['positivity', 'fun', 'warmth', 'success'] },
  { id: 20, name: 'Judgement',        element: 'Fire',  planet: 'Pluto',
    upright:  'Judgement, rebirth, inner calling, absolution — a profound awakening and fresh start.',
    reversed: 'Self-doubt, inner critic, failure to learn lessons — ignoring the call to transform.',
    keywords: ['rebirth', 'inner calling', 'absolution', 'reflection'] },
  { id: 21, name: 'The World',        element: 'Earth', planet: 'Saturn',
    upright:  'Completion, integration, accomplishment, travel — a cycle fulfilled; wholeness achieved.',
    reversed: 'Incompletion, shortcuts taken, delays — the journey\'s end is near but not yet reached.',
    keywords: ['completion', 'integration', 'accomplishment', 'wholeness'] },
]

const SUITS = [
  { name: 'Wands',   element: 'Fire',  domain: 'Career, passion, energy',    color: '#E57C3A' },
  { name: 'Cups',    element: 'Water', domain: 'Emotions, love, intuition',  color: '#90CAF9' },
  { name: 'Swords',  element: 'Air',   domain: 'Intellect, conflict, truth', color: '#78909C' },
  { name: 'Pentacles', element: 'Earth', domain: 'Money, work, material',    color: '#66BB6A' },
]

const COURT_MEANINGS = {
  Page:   { upright: 'Curiosity, new ideas, youthful enthusiasm — a message or student energy arrives.',
             reversed: 'Naivety, lack of direction, hasty decisions — immaturity blocks progress.' },
  Knight: { upright: 'Action, adventure, impulsive but driven — charge forward with focused purpose.',
             reversed: 'Restlessness, impatience, recklessness — scattered energy needs grounding.' },
  Queen:  { upright: 'Nurturing mastery, confidence, warmth — the suit\'s qualities embodied with grace.',
             reversed: 'Insecurity, martyrdom, possessiveness — gifts being withheld or misused.' },
  King:   { upright: 'Mature mastery, authority, leadership — command and wisdom in the suit\'s domain.',
             reversed: 'Authoritarian, controlling, cold — power without compassion.' },
}

const PIP_MEANINGS = {
  Wands: {
    1:  { up: 'Creative spark, new venture, inspiration — plant the seed of a bold new idea.',
           rev: 'Delays, lack of motivation, new beginnings blocked — the spark needs fanning.' },
    2:  { up: 'Future planning, progress, discovery — you stand at a crossroads with the world before you.',
           rev: 'Personal goals, inner alignment, fear of the unknown — plan before you act.' },
    3:  { up: 'Expansion, foresight, overseas opportunities — your efforts are beginning to bear fruit.',
           rev: 'Delays, frustration, obstacles abroad — patience is required.' },
    4:  { up: 'Celebration, home, community, harmony — a joyful milestone is reached.',
           rev: 'Personal celebration, lack of support, transition — joy that is quieter or internal.' },
    5:  { up: 'Conflict, competition, tension, disagreement — a challenge that builds resilience.',
           rev: 'Inner conflict, avoiding confrontation, tension release — finding peace after strife.' },
    6:  { up: 'Success, public recognition, progress, self-confidence — a well-earned victory.',
           rev: 'Egotism, private achievement, fall from grace — success without acknowledgement.' },
    7:  { up: 'Perseverance, defensive, maintaining control — hold your position against opposition.',
           rev: 'Giving up, overwhelmed, yielding — stepping back from an unwinnable battle.' },
    8:  { up: 'Rapid action, movement, quick decisions — things accelerate suddenly.',
           rev: 'Delays, frustration, resisting change — messages or plans are stalled.' },
    9:  { up: 'Resilience, grit, last stand, persistence — wounded but still standing.',
           rev: 'Inner resources, struggle, overwhelm — you\'re close to the end; hold on.' },
    10: { up: 'Burden, extra responsibilities, hard work — you carry much but the goal is in sight.',
           rev: 'Doing it all alone, collapse, burned out — set down what is not yours to carry.' },
  },
  Cups: {
    1:  { up: 'New love, emotional awakening, creativity, intuition — the heart overflows.',
           rev: 'Emotional loss, blocked creativity, emptiness — love needs inner tending first.' },
    2:  { up: 'Unified love, partnership, attraction, connection — a meaningful bond deepens.',
           rev: 'Imbalance, broken communication, tension in love — the connection needs honest care.' },
    3:  { up: 'Celebration, friendship, creativity, community — joyful togetherness.',
           rev: 'Gossip, overindulgence, isolation — community that divides rather than unites.' },
    4:  { up: 'Contemplation, apathy, reevaluation — a new possibility is quietly offered.',
           rev: 'Boredom, missed opportunities, sudden awakening — shake off stagnation.' },
    5:  { up: 'Regret, failure, disappointment, pessimism — mourn what is lost, but see what remains.',
           rev: 'Acceptance, moving on, finding peace — grief is beginning to lift.' },
    6:  { up: 'Nostalgia, happy memories, reunion, childhood — the past brings warmth and healing.',
           rev: 'Living in the past, unrealistic fantasy — release nostalgia to embrace the present.' },
    7:  { up: 'Wishful thinking, choices, illusion, fantasy — discern desire from reality.',
           rev: 'Alignment, personal values, willpower — cutting through illusion with clarity.' },
    8:  { up: 'Disappointment, abandonment, withdrawal — walking away from what no longer serves.',
           rev: 'Aimlessness, hopelessness, stagnation — the courage to leave is still needed.' },
    9:  { up: 'Contentment, satisfaction, gratitude, luxury — your wish is granted.',
           rev: 'Inner happiness lacking, materialism, greed — satisfaction must come from within.' },
    10: { up: 'Divine love, blissful relationships, harmony, family — emotional fulfilment in abundance.',
           rev: 'Disconnection, misaligned values, conflict at home — the dream needs nurturing.' },
  },
  Swords: {
    1:  { up: 'Breakthrough, clarity, sharp mind, truth — cut through confusion with a clear mind.',
           rev: 'Confusion, brutality, chaos — mental clarity is blocked or used as a weapon.' },
    2:  { up: 'Difficult choices, indecision, stalemate — you must look beyond the blindfold.',
           rev: 'Lesser of two evils, paralysis, information overload — delayed decision stalls you.' },
    3:  { up: 'Heartbreak, emotional pain, sorrow, grief — a wound must be acknowledged to heal.',
           rev: 'Negative self-talk, releasing pain, optimism — healing is slow but real.' },
    4:  { up: 'Rest, restoration, contemplation, recuperation — the sword is sheathed; rest now.',
           rev: 'Restlessness, burnout, awakening — a period of enforced rest is ending.' },
    5:  { up: 'Unbridled ambition, conflict, defeat — not every battle is worth winning.',
           rev: 'Reconciliation, making amends, past resentment — healing after conflict.' },
    6:  { up: 'Transition, leaving behind, travel, moving on — calmer waters lie ahead.',
           rev: 'Emotional baggage, unfinished business, resistance — the departure is incomplete.' },
    7:  { up: 'Deception, strategy, sneakiness, careful planning — cunning used wisely or unwisely.',
           rev: 'Coming clean, rethinking approach, conscience — a confession or strategy shift.' },
    8:  { up: 'Imprisonment, entrapment, self-victimisation — the bonds are mostly in the mind.',
           rev: 'Self-limiting beliefs, open to new perspectives — you can remove the blindfold.' },
    9:  { up: 'Anxiety, worry, fear, depression, nightmares — the mind tortures itself at 3am.',
           rev: 'Inner turmoil, deep-seated fears, releasing anxiety — dawn follows the darkest hour.' },
    10: { up: 'Painful endings, deep wounds, betrayal, loss — a cycle ends completely and finally.',
           rev: 'Recovery, regeneration, resisting an inevitable end — rise from the ashes.' },
  },
  Pentacles: {
    1:  { up: 'A new financial or career opportunity — plant this seed in fertile ground.',
           rev: 'Lost opportunity, bad investment — the material seed is not yet in the right soil.' },
    2:  { up: 'Multiple priorities, time management, balancing — adaptability is your greatest skill.',
           rev: 'Over-committed, disorganisation, financial imbalance — prioritise ruthlessly.' },
    3:  { up: 'Teamwork, initial fulfilment, collaboration — skilled work earns recognition.',
           rev: 'Lack of teamwork, disorganisation, poor work — ego impedes collaboration.' },
    4:  { up: 'Conservation, security, frugality — holding on to what you have built.',
           rev: 'Greed, stinginess, miserly — release the grip; share your abundance.' },
    5:  { up: 'Financial loss, poverty, lack mindset, insecurity — hard times that shall pass.',
           rev: 'Recovery from financial loss, spiritual poverty — material hardship begins to ease.' },
    6:  { up: 'Giving, receiving, generosity, charity — wealth is shared and flows freely.',
           rev: 'Self-care, unpaid debts, strings attached — examine the true cost of giving or receiving.' },
    7:  { up: 'Long-term view, sustainable results, perseverance — pause and assess what you are growing.',
           rev: 'Lack of long-term vision, limited reward — reassess your investment of energy.' },
    8:  { up: 'Diligence, mastery, skill development — dedicate yourself to the craft completely.',
           rev: 'Self-development, perfectionism, misdirected activity — work smarter, not harder.' },
    9:  { up: 'Abundance, luxury, self-sufficiency — hard work has borne beautiful fruit.',
           rev: 'Self-worth, over-investment in work, superficiality — inner wealth must match outer.' },
    10: { up: 'Wealth, financial security, family, long-term success — a legacy is established.',
           rev: 'The dark side of wealth, financial failure, loss of legacy — examine family dynamics.' },
  },
}

function buildDeck() {
  const deck = [...MAJOR_ARCANA.map(c => ({ ...c, suit: 'Major', type: 'major' }))]
  SUITS.forEach(suit => {
    // Ace–10 (pips)
    for (let n = 1; n <= 10; n++) {
      const label = n === 1 ? 'Ace' : String(n)
      const meanings = PIP_MEANINGS[suit.name]?.[n] || { up: '', rev: '' }
      deck.push({
        id:       deck.length,
        name:     `${label} of ${suit.name}`,
        suit:     suit.name,
        element:  suit.element,
        number:   n,
        type:     'pip',
        color:    suit.color,
        upright:  meanings.up,
        reversed: meanings.rev,
        keywords: [suit.domain],
      })
    }
    // Court
    ;['Page', 'Knight', 'Queen', 'King'].forEach(court => {
      deck.push({
        id:       deck.length,
        name:     `${court} of ${suit.name}`,
        suit:     suit.name,
        element:  suit.element,
        type:     'court',
        color:    suit.color,
        upright:  `${COURT_MEANINGS[court].upright} (${suit.domain.toLowerCase()})`,
        reversed: `${COURT_MEANINGS[court].reversed} (${suit.domain.toLowerCase()})`,
        keywords: [court.toLowerCase(), suit.domain],
      })
    })
  })
  return deck
}

const DECK = buildDeck() // 78 cards

// ── Spread definitions ────────────────────────────────────────────────────────
const SPREADS = [
  { id: 'single',    name: 'Single Card',        count: 1,
    positions: ['Your Card for Today'],
    desc: 'A daily card for focus, reflection, or a quick answer.' },
  { id: 'three',     name: 'Past · Present · Future', count: 3,
    positions: ['Past', 'Present', 'Future'],
    desc: 'The classic 3-card spread for context and direction.' },
  { id: 'celtic',    name: 'Celtic Cross',        count: 6,
    positions: ['Present', 'Challenge', 'Past', 'Future', 'Above (Conscious)', 'Below (Unconscious)'],
    desc: 'A 6-card deep dive into situation, influences, and outcome.' },
  { id: 'love',      name: 'Love Spread',         count: 3,
    positions: ['You', 'The Relationship', 'The Other Person'],
    desc: 'Insight into a romantic or close personal connection.' },
  { id: 'career',    name: 'Career Spread',       count: 3,
    positions: ['Current Situation', 'Action to Take', 'Likely Outcome'],
    desc: 'Clarity on your professional path and next steps.' },
  { id: 'yesno',     name: 'Yes / No',            count: 1,
    positions: ['The Answer'],
    desc: 'Upright = Yes, Reversed = No. Ask a direct question.' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function drawCards(count) {
  const shuffled = shuffle(DECK)
  return shuffled.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() < 0.35, // 35% chance reversed
  }))
}

// ── Suit color helper ─────────────────────────────────────────────────────────
function suitColor(suit) {
  return SUITS.find(s => s.name === suit)?.color || GOLD
}

function cardColor(card) {
  if (card.type === 'major') return VIO
  return suitColor(card.suit)
}

// ── Major arcana symbol ───────────────────────────────────────────────────────
const MAJOR_SYMBOLS = ['☽','✦','☽','♀','♂','♄','♥','⚔','♌','🕯','☸','⚖','♆','💀','♎','♑','⚡','⭐','☾','☀','📯','🌍']

// ── Card visual ───────────────────────────────────────────────────────────────
function CardVisual({ card, size = 'normal' }) {
  const col = cardColor(card)
  const w   = size === 'small' ? 100 : 140
  const h   = size === 'small' ? 160 : 220

  // Roman numerals for major arcana
  const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']
  const symbol = card.type === 'major'
    ? (MAJOR_SYMBOLS[card.id] || '✦')
    : card.suit === 'Wands' ? '🪄'
    : card.suit === 'Cups' ? '🏆'
    : card.suit === 'Swords' ? '⚔'
    : '⬡'

  return (
    <div style={{
      width: w, height: h, borderRadius: 12,
      background: card.isReversed
        ? `linear-gradient(180deg,${col}33,#07060F)`
        : `linear-gradient(160deg,${col}44,${col}11,#07060F)`,
      border: `2px solid ${col}88`,
      boxShadow: `0 0 18px ${col}44, inset 0 0 30px ${col}11`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '0.6rem 0.4rem',
      transform: card.isReversed ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.4s',
      flexShrink: 0,
      cursor: 'default',
    }}>
      {/* Top label */}
      <div style={{ fontSize: size === 'small' ? '0.55rem' : '0.6rem',
        color: `${col}cc`, fontFamily: "'JetBrains Mono',monospace",
        textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
        {card.type === 'major' ? ROMAN[card.id] : card.suit}
      </div>
      {/* Central symbol */}
      <div style={{ fontSize: size === 'small' ? '1.8rem' : '2.4rem',
        filter: `drop-shadow(0 0 8px ${col})` }}>
        {symbol}
      </div>
      {/* Card name */}
      <div style={{ fontSize: size === 'small' ? '0.5rem' : '0.58rem',
        color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3,
        fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
        {card.name}
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 18, padding: '1.4rem 1.6rem', marginBottom: '1rem',
  backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  boxShadow: 'var(--shadow-card)',
}

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${color || GOLD}55,transparent)` }} />
      {children}
      <span style={{ flex: 1, height: 1, background: `linear-gradient(270deg,${color || GOLD}55,transparent)` }} />
    </div>
  )
}

// ── Drawn card detail ─────────────────────────────────────────────────────────
function CardDetail({ drawnCard, position, index }) {
  const [open, setOpen] = useState(true)
  const col     = cardColor(drawnCard)
  const meaning = drawnCard.isReversed ? drawnCard.reversed : drawnCard.upright
  const orientation = drawnCard.isReversed ? 'Reversed' : 'Upright'

  return (
    <div style={{ ...card, border: `1px solid ${col}44`, boxShadow: `0 0 20px ${col}18`,
      marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <CardVisual card={drawnCard} size="small" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: col,
            fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
            letterSpacing: '1.5px', marginBottom: 4 }}>
            {position}
          </div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1.1rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {drawnCard.name}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ background: drawnCard.isReversed ? 'rgba(229,57,53,0.15)' : `${col}22`,
              border: `1px solid ${drawnCard.isReversed ? 'rgba(229,57,53,0.4)' : `${col}55`}`,
              borderRadius: 6, padding: '0.15rem 0.55rem',
              color: drawnCard.isReversed ? '#EF5350' : col,
              fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace" }}>
              {orientation}
            </span>
            {drawnCard.element && (
              <span style={{ background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                padding: '0.15rem 0.55rem', color: 'var(--text-dim)',
                fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace" }}>
                {drawnCard.element}
              </span>
            )}
            {drawnCard.planet && (
              <span style={{ background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                padding: '0.15rem 0.55rem', color: 'var(--text-dim)',
                fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace" }}>
                ♃ {drawnCard.planet}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem',
            lineHeight: 1.65, margin: 0 }}>{meaning}</p>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          alignSelf: 'center' }}>▼</div>
      </div>

      {open && drawnCard.keywords && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem',
          borderTop: `1px solid ${col}22`,
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {drawnCard.keywords.map((kw, i) => (
            <span key={i} style={{ background: `${col}15`,
              border: `1px solid ${col}33`, borderRadius: 20,
              padding: '0.15rem 0.6rem', color: col,
              fontSize: '0.7rem', textTransform: 'capitalize' }}>{kw}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Tarot() {
  const [selectedSpread, setSelectedSpread] = useState(SPREADS[0])
  const [question,       setQuestion]       = useState('')
  const [drawn,          setDrawn]          = useState([])
  const [animating,      setAnimating]      = useState(false)
  const [shuffled,       setShuffled]       = useState(false)

  const handleShuffle = useCallback(() => {
    setAnimating(true)
    setDrawn([])
    setShuffled(false)
    setTimeout(() => {
      setShuffled(true)
      setAnimating(false)
    }, 800)
  }, [])

  const handleDraw = useCallback(() => {
    if (!shuffled) return
    const cards = drawCards(selectedSpread.count)
    setDrawn(cards)
  }, [shuffled, selectedSpread])

  const handleReset = () => {
    setDrawn([])
    setShuffled(false)
    setQuestion('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)',
      padding: '5.5rem 5vw 4rem', maxWidth: 860, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '0.75rem', marginBottom: '1.8rem', color: 'var(--text-dim)',
        fontFamily: "'JetBrains Mono',monospace" }}>
        <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <span style={{ color: VIO }}>Tarot Reading</span>
      </div>

      {/* Page title */}
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.8rem,5vw,2.8rem)',
        fontWeight: 700, background: `linear-gradient(135deg,${VIO},${GOLD_L})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '0.4rem' }}>
        Tarot Reading
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2.2rem' }}>
        Full 78-card deck — Major &amp; Minor Arcana. Choose a spread, hold your question, and draw.
      </p>

      {/* ── Spread selector ── */}
      {!drawn.length && (
        <div style={card}>
          <SectionTitle color={VIO}>Choose Your Spread</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
            gap: '0.6rem', marginBottom: '1.2rem' }}>
            {SPREADS.map(sp => (
              <div key={sp.id}
                onClick={() => { setSelectedSpread(sp); setShuffled(false); setDrawn([]) }}
                style={{ background: selectedSpread.id === sp.id ? `${VIO}22` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${selectedSpread.id === sp.id ? VIO : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '0.8rem 1rem', cursor: 'pointer',
                  transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem',
                  color: selectedSpread.id === sp.id ? GOLD_L : 'var(--text-primary)',
                  marginBottom: 3 }}>{sp.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)',
                  display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: VIO, fontFamily: "'JetBrains Mono',monospace" }}>{sp.count} card{sp.count > 1 ? 's' : ''}</span>
                  · {sp.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Question box */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px',
              textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Your Question (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. What should I focus on this week?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem',
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Deck visual + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
            {/* Deck stack */}
            <div style={{ position: 'relative', width: 140, height: 220 }}>
              {[3, 2, 1, 0].map(offset => (
                <div key={offset} style={{
                  position: 'absolute', top: offset * 2, left: offset * 2,
                  width: 140, height: 220, borderRadius: 12,
                  background: `linear-gradient(160deg,${VIO}33,#07060F)`,
                  border: `2px solid ${VIO}66`,
                  boxShadow: animating ? `0 0 30px ${VIO}88` : `0 0 12px ${VIO}33`,
                  transition: 'box-shadow 0.4s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {offset === 0 && (
                    <div style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 12px ${VIO})`,
                      animation: animating ? 'spin 0.8s linear' : 'none' }}>
                      ✦
                    </div>
                  )}
                </div>
              ))}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>

            {!shuffled ? (
              <button onClick={handleShuffle} disabled={animating} style={{
                background: animating ? 'var(--bg-elevated)' : `linear-gradient(135deg,${VIO},${VIO}88)`,
                border: 'none', borderRadius: 12, padding: '0.85rem 2.2rem',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: animating ? 'wait' : 'pointer', transition: 'opacity 0.2s',
              }}>
                {animating ? 'Shuffling…' : 'Shuffle the Deck'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleDraw} style={{
                  background: `linear-gradient(135deg,${GOLD},${VIO})`,
                  border: 'none', borderRadius: 12, padding: '0.85rem 2.2rem',
                  color: '#07060F', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}>
                  Draw {selectedSpread.count} Card{selectedSpread.count > 1 ? 's' : ''}
                </button>
                <button onClick={handleShuffle} style={{
                  background: 'transparent', border: `1px solid ${VIO}66`,
                  borderRadius: 12, padding: '0.85rem 1.4rem',
                  color: VIO, fontSize: '0.85rem', cursor: 'pointer',
                }}>
                  Reshuffle
                </button>
              </div>
            )}

            {shuffled && !drawn.length && (
              <p style={{ color: VIO, fontSize: '0.8rem', textAlign: 'center',
                fontFamily: "'JetBrains Mono',monospace" }}>
                Deck shuffled ✦ Hold your question in mind, then draw.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Reading result ── */}
      {drawn.length > 0 && (
        <div>
          {/* Reading header */}
          <div style={{ ...card, borderColor: `${VIO}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: '1.3rem', fontWeight: 700,
                  color: GOLD_L, margin: '0 0 0.3rem' }}>{selectedSpread.name}</h2>
                {question && (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0,
                    fontStyle: 'italic' }}>"{question}"</p>
                )}
              </div>
              <button onClick={handleReset} style={{
                background: 'transparent', border: `1px solid ${VIO}55`,
                borderRadius: 10, padding: '0.5rem 1.1rem',
                color: VIO, fontSize: '0.82rem', cursor: 'pointer',
              }}>
                New Reading
              </button>
            </div>
          </div>

          {/* Card visuals strip */}
          <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto',
            padding: '0.5rem 0', marginBottom: '1.25rem',
            justifyContent: drawn.length <= 3 ? 'center' : 'flex-start' }}>
            {drawn.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.4rem', flexShrink: 0 }}>
                <CardVisual card={c} size="normal" />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                  letterSpacing: '1px', textAlign: 'center', maxWidth: 140 }}>
                  {selectedSpread.positions[i]}
                </div>
              </div>
            ))}
          </div>

          {/* Yes/No verdict */}
          {selectedSpread.id === 'yesno' && drawn.length === 1 && (
            <div style={{ ...card, borderColor: drawn[0].isReversed ? 'rgba(229,57,53,0.4)' : `${GOLD}66`,
              textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                {drawn[0].isReversed ? '✗' : '✓'}
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1.8rem', fontWeight: 700,
                color: drawn[0].isReversed ? '#EF5350' : GOLD_L }}>
                {drawn[0].isReversed ? 'No' : 'Yes'}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: 6 }}>
                {drawn[0].name} — {drawn[0].isReversed ? 'Reversed' : 'Upright'}
              </div>
            </div>
          )}

          {/* Card details */}
          <SectionTitle color={VIO}>Your Reading</SectionTitle>
          {drawn.map((c, i) => (
            <CardDetail key={i} drawnCard={c} position={selectedSpread.positions[i]} index={i} />
          ))}

          {/* Synthesis note */}
          <div style={{ ...card, borderColor: `${GOLD}33`, marginTop: '0.5rem' }}>
            <SectionTitle>How to Read These Cards Together</SectionTitle>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.75, margin: 0 }}>
              Read each card in the context of its position — then look for themes across the spread.
              Repeating elements (multiple cards from the same suit, or recurring symbols) amplify that energy.
              Upright cards show active or supportive forces; reversed cards signal inner blocks, delays, or areas
              needing reflection. Trust your first intuitive response to the imagery — that instinct is part of the reading.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
