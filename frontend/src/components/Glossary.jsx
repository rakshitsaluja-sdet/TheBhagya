import { useState } from 'react'

const SECTIONS = [
  {
    id: 'houses',
    title: 'The 12 Houses — Areas of Your Life',
    intro: 'Think of your birth chart as a wheel divided into 12 sections. Each section is called a "house" and governs a specific area of your life. Where the planets sit at the moment of your birth determines how each area of life unfolds for you.',
    items: [
      { label: 'House 1 — You', detail: 'Your physical appearance, personality, how others first see you, and your overall health and vitality. The most important house in the chart — it defines the lens through which you experience everything.' },
      { label: 'House 2 — Wealth & Family', detail: 'Your savings, accumulated wealth, family relationships, the food you eat, and your voice and speech. This house shows how money flows into your life and stays (or doesn\'t).' },
      { label: 'House 3 — Communication & Courage', detail: 'Your courage, communication style, siblings, short trips, writing, media, and hands. A strong 3rd house makes you bold, expressive and good with words.' },
      { label: 'House 4 — Home & Heart', detail: 'Your home, mother, emotional happiness, land and property, vehicles, and your sense of inner peace. This is the foundation of your life — where you feel safe and rooted.' },
      { label: 'House 5 — Children & Creativity', detail: 'Your children, creative expression, intelligence, romantic love, past life merit, and speculative ventures. A blessed 5th house brings joy, artistic gifts and intellectual sharpness.' },
      { label: 'House 6 — Work & Health', detail: 'Your daily work and service, health challenges you overcome, debts, enemies, and competitive situations. Planets here often build great strength through adversity.' },
      { label: 'House 7 — Marriage & Partnerships', detail: 'Your marriage partner, business partnerships, and the public. This house shows who you attract in love and business, and the quality of your most important relationships.' },
      { label: 'House 8 — Transformation', detail: 'Longevity, sudden changes, secrets, inheritance, your partner\'s money, and deep psychological transformation. This house rules the hidden and the profound.' },
      { label: 'House 9 — Fortune & Wisdom', detail: 'Your luck, spiritual wisdom, father, higher education, long journeys, religion and philosophy. A strong 9th house is one of the greatest blessings — it gives a fortunate life and deep wisdom.' },
      { label: 'House 10 — Career & Status', detail: 'Your profession, public reputation, status in society, relationship with authority and government. The most visible house — it shows what you are known for in the world.' },
      { label: 'House 11 — Income & Gains', detail: 'Your income from work, gains and profits, social networks, elder siblings, and the fulfilment of wishes. Planets here indicate multiple income sources and a wide circle of influence.' },
      { label: 'House 12 — Liberation & Foreign', detail: 'Foreign lands, spiritual liberation, expenses, hospitals, losses and endings that lead to new beginnings. A well-placed planet here often indicates a life abroad or deep spiritual attainment.' },
    ]
  },
  {
    id: 'planets',
    title: 'The 9 Planets — Cosmic Forces in Your Chart',
    intro: 'Vedic astrology uses 9 planetary forces (called Grahas, meaning "that which seizes"). Each planet has a distinct personality, rules certain areas of life, and influences the house it sits in.',
    items: [
      { label: 'Sun ☉ — Soul & Authority', detail: 'Represents your soul, ego, father, government and authority figures. The Sun shows where you seek recognition and what gives you confidence. A strong Sun means natural leadership and a bright public image. Rules Leo.' },
      { label: 'Moon ☽ — Mind & Emotions', detail: 'Represents your mind, emotions, mother, the public and water. The Moon is considered the most important planet for day-to-day experience — it governs your emotional world, instincts and mental peace. Rules Cancer.' },
      { label: 'Mars ♂ — Energy & Courage', detail: 'Represents energy, courage, siblings, land, property, blood and conflict. Mars gives drive and ambition. A strong Mars makes you bold and decisive. A difficult Mars can bring aggression or accidents. Rules Aries and Scorpio.' },
      { label: 'Mercury ☿ — Intellect & Commerce', detail: 'Represents intelligence, communication, commerce, mathematics, and younger siblings. Mercury is the planet of the thinking mind — it shapes how you learn, speak, write and do business. Rules Gemini and Virgo.' },
      { label: 'Jupiter ♃ — Wisdom & Grace', detail: 'The great benefic — represents wisdom, wealth, children, spirituality, teachers and expansion. Jupiter\'s placement and movement is one of the most important factors for timing major blessings in life. Rules Sagittarius and Pisces.' },
      { label: 'Venus ♀ — Love & Beauty', detail: 'Represents love, beauty, luxury, creativity, vehicles, and marriage (especially for men). Venus shows what brings you joy, how you love, and your taste in beauty and comfort. Rules Taurus and Libra.' },
      { label: 'Saturn ♄ — Karma & Discipline', detail: 'The great teacher — represents karma, discipline, delay, longevity, servants and the elderly. Saturn\'s influence is slow but permanent. What Saturn builds never falls. Its periods often feel heavy but deliver lasting results. Rules Capricorn and Aquarius.' },
      { label: 'Rahu ☊ — Ambition & The Future', detail: 'The north lunar node — not a physical planet but a powerful mathematical point. Rahu represents your soul\'s direction in this lifetime, ambition, foreign lands, technology and unconventional paths. Its energy is intense and often karmic.' },
      { label: 'Ketu ☋ — Wisdom & The Past', detail: 'The south lunar node — Rahu\'s counterpart. Ketu represents past-life mastery, spirituality, sudden events, detachment and liberation. What Ketu touches tends to be either gifted naturally or taken away, teaching non-attachment.' },
    ]
  },
  {
    id: 'dasha',
    title: 'Vimshottari Dasha — Your Life Chapters',
    intro: 'The Vimshottari Dasha system divides your life into planetary chapters (called Mahadashas) adding up to 120 years. Each chapter is ruled by a planet and colours your experiences for its entire duration. Within each chapter are sub-periods (Antardashas) that change the mood of shorter windows.',
    items: [
      { label: 'Mahadasha — The Major Chapter', detail: 'The main 7–20 year period ruled by one planet. This is the dominant energy shaping your life during that time. Sun Mahadasha = 6 years, Moon = 10, Mars = 7, Rahu = 18, Jupiter = 16, Saturn = 19, Mercury = 17, Ketu = 7, Venus = 20.' },
      { label: 'Antardasha — The Sub-Period', detail: 'Each Mahadasha is subdivided into smaller periods (roughly months to a couple of years) ruled by different planets. The antardasha planet flavours the main chapter. For example, in Rahu Mahadasha, a Jupiter Antardasha brings expansion and wisdom into an otherwise intense period.' },
      { label: 'Pratyantar Dasha — The Micro-Period', detail: 'Sub-divisions within the antardasha (lasting weeks). Used for very precise timing of events. When astrologers predict exact dates, they often look at this level.' },
      { label: 'Why does timing matter?', detail: 'The same planetary combinations in your birth chart will express differently depending on which Mahadasha you are in. A marriage yoga (combination) in your chart may activate only when the relevant planets are running. This is why timing is as important as the chart itself.' },
    ]
  },
  {
    id: 'lagna',
    title: 'Lagna — Your Rising Sign',
    intro: 'The Lagna (Ascendant) is the zodiac sign rising on the eastern horizon at the exact moment of your birth. It is the most important factor in your personal chart — more significant than your Sun sign.',
    items: [
      { label: 'What it reveals', detail: 'Your Lagna reveals your physical body, natural personality, how others instinctively perceive you, and the overall quality of your life. Two people born on the same day with different birth times can have completely different charts because the Lagna changes every ~2 hours.' },
      { label: 'Why it matters more than Sun sign', detail: 'Western astrology focuses on the Sun sign (based on month of birth). Vedic astrology uses the Lagna (based on time and place of birth), which is far more specific and personal. This is why your Bhagya reading requires exact birth time — without it, the Lagna cannot be calculated.' },
      { label: 'Nakshatra of the Lagna', detail: 'Your Lagna falls within one of 27 Nakshatras (lunar mansions). The Nakshatra adds additional texture to your personality — think of the Lagna sign as the broad stroke and the Nakshatra as the fine detail.' },
    ]
  },
  {
    id: 'nakshatra',
    title: 'Nakshatras — The 27 Lunar Mansions',
    intro: 'The zodiac is divided into 27 Nakshatras, each spanning 13°20\'. They are the oldest layer of Vedic astrology, predating even the 12-sign system. Each Nakshatra has a unique personality, ruling deity, symbol and quality.',
    items: [
      { label: 'What they reveal', detail: 'Each Nakshatra gives a much finer reading of a planet\'s energy than the sign alone. A planet in Aries behaves very differently if it\'s in Ashwini Nakshatra (swift, healing, pioneering) versus Bharani (deep, intense, transformative).' },
      { label: 'Pada — The Quarter', detail: 'Each Nakshatra is further divided into 4 quarters (Padas). The Pada your Moon falls in determines your Navamsa position — used for marriage and deep life path readings. This is why birth charts show positions like "Purva Ashadha Pada 3".' },
      { label: 'Moon Nakshatra — Your Janma Nakshatra', detail: 'The Nakshatra your Moon occupies at birth is called your Janma Nakshatra (birth star). In Indian tradition, this is often more important than the Sun sign. Many festivals, auspicious dates and compatibility checks use this as the primary reference.' },
    ]
  },
  {
    id: 'lalkitab',
    title: 'Lal Kitab — The Book of Fate',
    intro: 'Lal Kitab (meaning "Red Book") is a set of five Urdu books written in 19th century Punjab. It takes a uniquely practical approach to astrology — focusing on karmic debts and offering simple, accessible remedies to neutralise difficult planetary energies.',
    items: [
      { label: 'Pucca Ghar — Permanent House', detail: 'In Lal Kitab, every planet has a "permanent house" — a house where it naturally belongs. When a planet is in its Pucca Ghar, it gives its strongest and most reliable results. Saturn in Aquarius (H11), for example, is in Pucca Ghar and delivers excellent income and long-term gains.' },
      { label: 'Foreign Indicator', detail: 'Lal Kitab identifies specific planetary combinations that indicate strong foreign karma — either travel, extended stays, or full relocation abroad. When this indicator is active, the chart is said to have an international dimension built into it.' },
      { label: 'Remedies', detail: 'Lal Kitab is famous for its remedies — simple, practical actions that neutralise difficult planetary placements. These range from feeding animals, donating specific items, planting certain plants, or avoiding particular behaviours. They work on the principle of karmic debt repayment.' },
      { label: 'Rahu-Ketu Axis', detail: 'Lal Kitab pays special attention to the Rahu-Ketu axis — the line between your past (Ketu) and your future (Rahu). The houses these nodes occupy tell the story of your karmic inheritance and the debts your soul came here to resolve.' },
    ]
  },
  {
    id: 'ayanamsa',
    title: 'Ayanamsa & Sidereal Astrology',
    intro: 'Vedic astrology uses the Sidereal zodiac (based on actual star positions) unlike Western astrology which uses the Tropical zodiac (based on seasons). The difference between them is called the Ayanamsa — currently about 23–24 degrees.',
    items: [
      { label: 'Lahiri Ayanamsa', detail: 'Bhagya uses the Lahiri Ayanamsa — the official standard adopted by the Indian government\'s Rashtriya Panchang. This is the most widely used Ayanamsa by Vedic astrologers worldwide and gives planet positions that align with actual sky positions.' },
      { label: 'Why your signs differ from Western astrology', detail: 'If you\'ve looked up your Sun sign online using Western astrology, it may differ from what Bhagya shows. This is because of the ~24° Ayanamsa shift. Neither is wrong — they are different systems with different philosophies. Vedic astrology is generally considered more precise for life events and timing.' },
      { label: 'Swiss Ephemeris', detail: 'Bhagya uses the Swiss Ephemeris — the gold standard for astronomical planet position calculations. Developed by Astrodienst, it is accurate to fractions of a second of arc. This is the same system used by professional astrologers and researchers worldwide.' },
    ]
  },
]

export default function Glossary() {
  const [open, setOpen] = useState(SECTIONS[0].id)
  const [expanded, setExpanded] = useState({})

  const toggleItem = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }))

  const s = {
    wrap: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' },
    sidebar: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.75rem', position: 'sticky', top: '100px' },
    sideBtn: (active) => ({
      display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem',
      borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
      border: 'none', transition: 'all 0.15s',
      background: active ? 'var(--gold)' : 'transparent',
      color: active ? '#1A1000' : 'var(--text-muted)',
      marginBottom: '0.25rem',
    }),
    content: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem' },
    sectionTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '0.75rem' },
    intro: { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' },
    item: { borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' },
    itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.4rem 0' },
    itemLabel: { color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.92rem' },
    chevron: (exp) => ({ color: 'var(--gold)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: exp ? 'rotate(180deg)' : 'none' }),
    itemDetail: { color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.75, marginTop: '0.5rem', paddingLeft: '0.5rem' },
  }

  const activeSection = SECTIONS.find(s => s.id === open)

  return (
    <div style={s.wrap}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        {SECTIONS.map(sec => (
          <button key={sec.id} style={s.sideBtn(open === sec.id)} onClick={() => setOpen(sec.id)}>
            {sec.title.split(' — ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={s.content}>
        {activeSection && (
          <>
            <div style={s.sectionTitle}>{activeSection.title}</div>
            <p style={s.intro}>{activeSection.intro}</p>
            {activeSection.items.map((item, i) => {
              const key = `${activeSection.id}-${i}`
              const isOpen = expanded[key]
              return (
                <div key={key} style={s.item}>
                  <div style={s.itemHeader} onClick={() => toggleItem(key)}>
                    <span style={s.itemLabel}>{item.label}</span>
                    <span style={s.chevron(isOpen)}>▼</span>
                  </div>
                  {isOpen && <p style={s.itemDetail}>{item.detail}</p>}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
