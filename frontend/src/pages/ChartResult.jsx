import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getChart } from '../hooks/useApi'
import { generateAllReadings } from '../utils/lifeReadings'
import Glossary from '../components/Glossary'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

/* ── Interpretation data ─────────────────────────────────── */
const SIGN_INFO_HI = {
  Aries:       { quality: 'साहसी, अग्रणी और कर्मशील', element: 'अग्नि', lord: 'मंगल' },
  Taurus:      { quality: 'स्थिर, धैर्यशील और संवेदनशील', element: 'पृथ्वी', lord: 'शुक्र' },
  Gemini:      { quality: 'जिज्ञासु, संचारकुशल और अनुकूलनीय', element: 'वायु', lord: 'बुध' },
  Cancer:      { quality: 'पोषणशील, सहज और भावनात्मक', element: 'जल', lord: 'चंद्र' },
  Leo:         { quality: 'आत्मविश्वासी, रचनात्मक और नेतृत्वकारी', element: 'अग्नि', lord: 'सूर्य' },
  Virgo:       { quality: 'विश्लेषणात्मक, सेवाभावी और सटीक', element: 'पृथ्वी', lord: 'बुध' },
  Libra:       { quality: 'कूटनीतिक, संतुलन-प्रेमी और संबंध-केंद्रित', element: 'वायु', lord: 'शुक्र' },
  Scorpio:     { quality: 'तीव्र, परिवर्तनकारी और गहरी दृष्टि वाले', element: 'जल', lord: 'मंगल' },
  Sagittarius: { quality: 'दार्शनिक, स्वतंत्रता-प्रेमी और सत्य-साधक', element: 'अग्नि', lord: 'गुरु' },
  Capricorn:   { quality: 'अनुशासित, महत्वाकांक्षी और संरचित', element: 'पृथ्वी', lord: 'शनि' },
  Aquarius:    { quality: 'नवाचारी, मानवतावादी और स्वतंत्र', element: 'वायु', lord: 'शनि' },
  Pisces:      { quality: 'आध्यात्मिक, करुणामय और कल्पनाशील', element: 'जल', lord: 'गुरु' },
}

const SIGN_HI_NAME = {
  Aries:'मेष', Taurus:'वृषभ', Gemini:'मिथुन', Cancer:'कर्क', Leo:'सिंह', Virgo:'कन्या',
  Libra:'तुला', Scorpio:'वृश्चिक', Sagittarius:'धनु', Capricorn:'मकर', Aquarius:'कुंभ', Pisces:'मीन',
}

const DASHA_INFO_HI = {
  Sun:     { theme: 'अधिकार, पहचान और आत्म-अभिव्यक्ति', focus: 'करियर में दृश्यता, सरकारी कार्य, पिता और नेतृत्व। यह काल आत्मविश्वास से आगे बढ़ने का है।', energy: 'तेजस्वी' },
  Moon:    { theme: 'भावनाएं, घर और मानसिक शांति', focus: 'परिवार, यात्रा, सार्वजनिक जीवन और माँ। आंतरिक स्पष्टता विश्राम और भावनात्मक प्रसंस्करण से आती है।', energy: 'चिंतनशील' },
  Mars:    { theme: 'ऊर्जा, संपत्ति और साहस', focus: 'भूमि और अचल संपत्ति, भाई-बहन, शारीरिक शक्ति और निर्णायक कदम। साहस से विवाद हल होते हैं।', energy: 'गतिशील' },
  Rahu:    { theme: 'महत्वाकांक्षा, परिवर्तन और विदेशी संबंध', focus: 'अपरंपरागत मार्ग, प्रौद्योगिकी, विदेशी भूमि और पुराने पैटर्न तोड़ना। जो असंभव लगता था वह संभव होता है।', energy: 'विस्तारशील' },
  Jupiter: { theme: 'ज्ञान, धन और आध्यात्मिक विकास', focus: 'संतान, उच्च शिक्षा, गुरु और समृद्धि। इस काल में ब्रह्मांड धर्मिक कार्यों को पुरस्कृत करता है।', energy: 'शुभ' },
  Saturn:  { theme: 'कर्म, अनुशासन और स्थायी परिणाम', focus: 'करियर पुनर्गठन, सेवा और कठोर परिश्रम जो कुछ स्थायी बनाता है। देरी बाधा नहीं, सीख है।', energy: 'स्थिर' },
  Mercury: { theme: 'संचार, व्यवसाय और बुद्धि', focus: 'लेखन, व्यापार, युवा संबंध और तीव्र सोच। इस काल में विचार आय बन जाते हैं।', energy: 'विश्लेषणात्मक' },
  Ketu:    { theme: 'आध्यात्मिकता, पूर्व-कर्म और वैराग्य', focus: 'आंतरिक खोज, अचानक बदलाव और पुराने आसक्तियों से मुक्ति। रहस्यमय अनुभव और भौतिक मुक्ति।', energy: 'अंतर्मुखी' },
  Venus:   { theme: 'प्रेम, सौंदर्य और प्रचुरता', focus: 'संबंध, विलास, रचनात्मकता और कलात्मक कार्य। साझेदारी फलती है और सुख-सुविधाएं बढ़ती हैं।', energy: 'सौहार्दपूर्ण' },
}

const NAK_MEANING_HI = {
  Ashwini: 'तीव्र शुरुआत', Bharani: 'परिवर्तन और उत्तरदायित्व',
  Krittika: 'तीक्ष्ण ध्यान और शुद्धि', Rohini: 'विकास और उर्वरता',
  Mrigashira: 'खोज और जिज्ञासा', Ardra: 'तीव्रता और तूफान',
  Punarvasu: 'अच्छाई की ओर वापसी', Pushya: 'पोषण और संरक्षण',
  Ashlesha: 'गहरी प्रज्ञा', Magha: 'पूर्वजों की शक्ति और अधिकार',
  'Purva Phalguni': 'आनंद और रचनात्मकता', 'Uttara Phalguni': 'साझेदारी और उदारता',
  Hasta: 'कौशल और शिल्प', Chitra: 'प्रतिभा और सृजन',
  Swati: 'स्वतंत्रता और गतिशीलता', Vishakha: 'उद्देश्यपूर्ण महत्वाकांक्षा',
  Anuradha: 'भक्ति और मित्रता', Jyeshtha: 'वरिष्ठता और संरक्षण',
  Mula: 'जड़ें और गहरी जांच', 'Purva Ashadha': 'अजेयता और शुद्धि',
  'Uttara Ashadha': 'सार्वभौमिक विजय', Shravana: 'सुनना और सीखना',
  Dhanishta: 'धन और संगीत', Shatabhisha: 'उपचार और रहस्य',
  'Purva Bhadrapada': 'अग्नि परिवर्तन', 'Uttara Bhadrapada': 'गहराई और ज्ञान',
  Revati: 'पूर्णता और पोषण',
}

const SIGN_INFO = {
  Aries:       { quality: 'bold, pioneering and action-driven', element: 'Fire',  lord: 'Mars' },
  Taurus:      { quality: 'grounded, patient and deeply sensual', element: 'Earth', lord: 'Venus' },
  Gemini:      { quality: 'curious, communicative and adaptable', element: 'Air',   lord: 'Mercury' },
  Cancer:      { quality: 'nurturing, intuitive and emotionally deep', element: 'Water', lord: 'Moon' },
  Leo:         { quality: 'confident, creative and leadership-oriented', element: 'Fire',  lord: 'Sun' },
  Virgo:       { quality: 'analytical, service-focused and precise', element: 'Earth', lord: 'Mercury' },
  Libra:       { quality: 'diplomatic, harmony-seeking and relationship-focused', element: 'Air',   lord: 'Venus' },
  Scorpio:     { quality: 'intense, transformative and deeply perceptive', element: 'Water', lord: 'Mars' },
  Sagittarius: { quality: 'philosophical, freedom-loving and truth-seeking', element: 'Fire',  lord: 'Jupiter' },
  Capricorn:   { quality: 'disciplined, ambitious and structured', element: 'Earth', lord: 'Saturn' },
  Aquarius:    { quality: 'innovative, humanitarian and independent', element: 'Air',   lord: 'Saturn' },
  Pisces:      { quality: 'spiritual, compassionate and deeply imaginative', element: 'Water', lord: 'Jupiter' },
}

const DASHA_INFO = {
  Sun:     { theme: 'Authority, recognition and self-expression', focus: 'Career visibility, government dealings, father figure, health of eyes and heart. A time to step into leadership.', energy: 'Radiant' },
  Moon:    { theme: 'Emotions, home and mental peace', focus: 'Family matters, travel, public life and the mother. Inner clarity comes through rest and emotional processing.', energy: 'Reflective' },
  Mars:    { theme: 'Energy, property and courage', focus: 'Land and real estate, siblings, physical vitality and taking decisive action. Conflicts resolve through courage.', energy: 'Dynamic' },
  Rahu:    { theme: 'Ambition, transformation and foreign connections', focus: 'Unconventional paths, technology, foreign lands and breaking old patterns. What once seemed impossible becomes possible.', energy: 'Expansive' },
  Jupiter: { theme: 'Wisdom, wealth and spiritual growth', focus: 'Children, higher education, mentors and prosperity. The universe rewards righteous action in this period.', energy: 'Auspicious' },
  Saturn:  { theme: 'Karma, discipline and lasting results', focus: 'Career restructuring, service and hard work that builds something permanent. Delays are lessons, not obstacles.', energy: 'Steady' },
  Mercury: { theme: 'Communication, business and intellect', focus: 'Writing, trade, younger relationships and sharp thinking. Ideas become income in this period.', energy: 'Analytical' },
  Ketu:    { theme: 'Spirituality, past karma and detachment', focus: 'Inner seeking, sudden changes and release from old attachments. Mystical experiences and liberation from the material.', energy: 'Introspective' },
  Venus:   { theme: 'Love, beauty and abundance', focus: 'Relationships, luxury, creativity and artistic pursuits. Partnerships flourish and material comforts increase.', energy: 'Harmonious' },
}

const NAK_MEANING = {
  Ashwini: 'swift beginnings', Bharani: 'transformation and responsibility',
  Krittika: 'sharp focus and purification', Rohini: 'growth and fertility',
  Mrigashira: 'seeking and curiosity', Ardra: 'intensity and storms clearing',
  Punarvasu: 'return to goodness', Pushya: 'nourishment and protection',
  Ashlesha: 'penetrating wisdom', Magha: 'ancestral power and authority',
  'Purva Phalguni': 'pleasure and creativity', 'Uttara Phalguni': 'partnership and generosity',
  Hasta: 'skill and craftsmanship', Chitra: 'brilliance and creation',
  Swati: 'independence and movement', Vishakha: 'purposeful ambition',
  Anuradha: 'devotion and friendship', Jyeshtha: 'seniority and protection',
  Mula: 'roots and deep investigation', 'Purva Ashadha': 'invincibility and purification',
  'Uttara Ashadha': 'universal victory', Shravana: 'listening and learning',
  Dhanishta: 'wealth and music', Shatabhisha: 'healing and mystery',
  'Purva Bhadrapada': 'fiery transformation', 'Uttara Bhadrapada': 'depth and wisdom',
  Revati: 'completion and nourishment',
}

function interpretChart(lagna, planets, currentDasha, lang = 'en') {
  const lagnaSign = lagna?.sign
  const moonSign  = planets?.Moon?.sign
  const sunSign   = planets?.Sun?.sign
  const hi = lang === 'hi'

  if (hi) {
    const lagnaInfo = SIGN_INFO_HI[lagnaSign] || {}
    const moonInfo  = SIGN_INFO_HI[moonSign]  || {}
    const sunInfo   = SIGN_INFO_HI[sunSign]   || {}
    const profile = [
      lagnaSign && `आप ${SIGN_HI_NAME[lagnaSign] || lagnaSign} लग्न हैं — आपका बाहरी स्वरूप ${lagnaInfo.quality} है। ${lagnaInfo.element} तत्व की ऊर्जा यह तय करती है कि दुनिया आपको कैसे देखती है।`,
      moonSign  && `${SIGN_HI_NAME[moonSign] || moonSign} में आपका चंद्र आपकी भावनात्मक दुनिया को ${moonInfo.quality?.split(',')[0]} बनाता है। यहीं आपको घर और आत्मीयता का गहरा अनुभव होता है।`,
      sunSign   && `${SIGN_HI_NAME[sunSign] || sunSign} में सूर्य के साथ आपकी मूल प्रेरणा ${sunInfo.quality?.split(',')[0]} है। यह वह अग्नि है जो आपको भीतर से प्रेरित करती है।`,
    ].filter(Boolean)
    const md = currentDasha?.mahadasha?.lord
    const ad = currentDasha?.antardasha?.lord
    const PNAME_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' }
    const mdInfo = DASHA_INFO_HI[md] || {}
    const adInfo = DASHA_INFO_HI[ad] || {}
    const dashaStory = md ? [
      `आप अभी ${PNAME_HI[md] || md} महादशा में हैं — ${mdInfo.theme} का अध्याय।`,
      mdInfo.focus,
      ad ? `इसके भीतर ${PNAME_HI[ad] || ad} अंतर्दशा सक्रिय है — ${adInfo.theme} — जो आपके दैनिक जीवन में ${adInfo.energy} ऊर्जा जोड़ती है।` : '',
    ].filter(Boolean) : []
    return { profile, dashaStory }
  }

  const lagnaInfo = SIGN_INFO[lagnaSign] || {}
  const moonInfo  = SIGN_INFO[moonSign]  || {}
  const sunInfo   = SIGN_INFO[sunSign]   || {}
  const profile = [
    lagnaSign && `You are a ${lagnaSign} rising — your outer self is ${lagnaInfo.quality}. ${lagnaInfo.element} energy shapes how the world sees you.`,
    moonSign  && `Your Moon in ${moonSign} gives your emotional world a ${moonInfo.quality?.split(',')[0]} quality. This is where you find your deepest sense of home and belonging.`,
    sunSign   && `With Sun in ${sunSign}, your core drive is ${sunInfo.quality?.split(',')[0]}. This is the fire that motivates you from within.`,
  ].filter(Boolean)

  const md = currentDasha?.mahadasha?.lord
  const ad = currentDasha?.antardasha?.lord
  const mdInfo = DASHA_INFO[md] || {}
  const adInfo = DASHA_INFO[ad] || {}
  const dashaStory = md ? [
    `You are currently in your ${md} Mahadasha — a chapter defined by ${mdInfo.theme?.toLowerCase()}.`,
    mdInfo.focus,
    ad ? `Within this, the ${ad} Antardasha activates ${adInfo.theme?.toLowerCase()}, adding a layer of ${adInfo.energy?.toLowerCase()} energy to your days.` : '',
  ].filter(Boolean) : []

  return { profile, dashaStory }
}

/* ── Styles ──────────────────────────────────────────────── */
const PLANET_SYMBOLS = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋',
}

const s = {
  wrap:       { maxWidth: '960px', margin: '2.5rem auto', padding: '0 1.5rem' },
  backLink:   { color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', textDecoration: 'none' },
  header:     { marginBottom: '2rem' },
  name:       { fontFamily: "'Cinzel', serif", fontSize: '2rem', color: 'var(--gold)' },
  meta:       { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' },

  storyCard:  { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '2rem', marginBottom: '1.5rem' },
  storyTitle: { fontFamily: "'Cinzel', serif", fontSize: '1rem', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '1.25rem' },
  storyText:  { color: 'var(--text-primary)', fontSize: '0.97rem', lineHeight: 1.85, marginBottom: '0.75rem' },

  dashaHighlight: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
    borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
  },
  dashaLabel:  { color: 'var(--gold)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', fontFamily: "'Cinzel', serif" },
  dashaText:   { color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: '0.5rem' },
  dashaSub:    { color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 },

  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' },
  card:      { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' },
  cardTitle: { fontFamily: "'Cinzel', serif", fontSize: '0.82rem', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '1rem', textTransform: 'uppercase' },

  row:          { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0', borderBottom: '1px solid var(--border)' },
  planetName:   { color: 'var(--gold-light)', fontWeight: 500, fontSize: '0.9rem', display: 'flex', gap: '0.4rem', alignItems: 'center' },
  planetSymbol: { fontSize: '1rem', color: 'var(--gold)', width: '1.2rem' },
  planetDetail: { color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'right' },
  pucca:        { color: 'var(--gold)', fontSize: '0.7rem', marginLeft: '0.3rem' },

  lagnaBlock: { textAlign: 'center', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border)' },
  lagnaSign:  { fontFamily: "'Cinzel', serif", fontSize: '1.6rem', color: 'var(--gold)' },
  lagnaDeg:   { color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' },
  lagnaNak:   { color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.15rem' },
  lagnaDesc:  { color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.6, marginTop: '0.75rem', fontStyle: 'italic' },

  houseGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' },
  houseCell: { background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem' },
  houseNum:  { color: 'var(--text-dim)', marginBottom: '0.2rem' },
  houseOcc:  { color: 'var(--text-muted)' },

  mdCard:  { background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' },
  mdLabel: { color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' },
  mdDate:  { color: 'var(--text-muted)', fontSize: '0.8rem' },
  adRow:   { marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' },
  adLabel: { color: 'var(--text-muted)' },
  adDate:  { color: 'var(--text-dim)' },
  mdLight: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.5rem' },

  lkItem:   { display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  lkBullet: { color: 'var(--gold)', flexShrink: 0, marginTop: '2px' },
  lkText:   { color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 },

  loading: { textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)', fontFamily: "'Cinzel', serif", fontSize: '1.2rem' },
  error:   { textAlign: 'center', padding: '4rem', color: '#E05050' },

  sectionDivider: { borderTop: '1px solid var(--border)', margin: '2rem 0 1.5rem', paddingTop: '1.5rem' },
  sectionHead:    { fontFamily: "'Cinzel', serif", fontSize: '1rem', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '1.25rem' },
}

/* ── Sub-components ──────────────────────────────────────── */
function PlanetTable({ planets }) {
  return (
    <div>
      {Object.entries(planets).map(([name, p]) => (
        <div key={name} style={s.row}>
          <span style={s.planetName}>
            <span style={s.planetSymbol}>{PLANET_SYMBOLS[name] || '●'}</span>
            {name}
            {p.lk_pucca  && <span style={s.pucca}>★ Pucca</span>}
            {p.retrograde && <span style={{ color: 'var(--gold-light)', fontSize: '0.7rem', marginLeft: '0.3rem' }}>℞</span>}
          </span>
          <span style={s.planetDetail}>
            {p.sign} {p.degree?.toFixed(1)}° · H{p.house} · {p.nakshatra} P{p.pada}
          </span>
        </div>
      ))}
    </div>
  )
}

function HouseMap({ houseMap }) {
  return (
    <div style={s.houseGrid}>
      {Array.from({ length: 12 }, (_, i) => {
        const h   = String(i + 1)
        const occ = houseMap?.[h] || []
        return (
          <div key={h} style={s.houseCell}>
            <div style={s.houseNum}>H{h}</div>
            <div style={s.houseOcc}>{occ.join(', ') || '—'}</div>
          </div>
        )
      })}
    </div>
  )
}

function DashaTimeline({ dashaTree, currentDasha }) {
  const md = currentDasha?.mahadasha
  const ad = currentDasha?.antardasha
  return (
    <div>
      {md && (
        <div style={s.mdCard}>
          <div style={s.mdLabel}>⊙ {md.lord} Mahadasha — Active Now</div>
          <div style={s.mdDate}>{md.start} → {md.end}</div>
          {ad && (
            <div style={s.adRow}>
              <span style={s.adLabel}>↳ {ad.lord} Antardasha</span>
              <span style={s.adDate}>{ad.start} → {ad.end}</span>
            </div>
          )}
        </div>
      )}
      <div style={{ ...s.cardTitle, marginTop: '1rem', marginBottom: '0.5rem' }}>Upcoming Periods</div>
      {dashaTree?.slice(0, 6).map(md_ => (
        <div key={md_.lord + md_.start} style={s.mdLight}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{md_.lord}</span>
            <span>{md_.start} → {md_.end}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const PLANET_SYMBOLS_LK = { Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋' }

function RemedyDetail({ r }) {
  const [section, setSection] = useState(null)
  const toggle = (e, k) => { e.stopPropagation(); setSection(section === k ? null : k) }

  const subHead = { fontSize:'0.76rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.5rem' }
  const listItem = { color:'var(--text-muted)', fontSize:'0.84rem', lineHeight:1.7, marginBottom:'0.35rem', paddingLeft:'0.25rem' }
  const sectionBox = (active) => ({
    border: `1px solid ${active ? 'rgba(201,147,58,0.4)' : 'var(--border)'}`,
    borderRadius:'8px', marginTop:'0.6rem', overflow:'hidden',
    background: active ? 'rgba(201,147,58,0.04)' : 'transparent',
  })
  const sectionToggle = (active) => ({
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'0.65rem 0.9rem', cursor:'pointer',
    color: active ? 'var(--gold-light)' : 'var(--text-muted)',
    fontSize:'0.83rem', fontWeight:600, userSelect:'none',
  })

  return (
    <div style={{ marginTop:'0.85rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>

      {/* Challenge pill */}
      <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', padding:'0.4rem 0' }}>
        <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:'#E07B39', marginTop:'6px', flexShrink:0 }} />
        <span style={{ color:'var(--text-muted)', fontSize:'0.84rem', lineHeight:1.65 }}>
          <strong style={{ color:'#E07B39' }}>Challenge:</strong> {r.challenge}
        </span>
      </div>

      {/* Specific action */}
      <div style={{ background:'rgba(201,147,58,0.07)', borderRadius:'8px', padding:'0.7rem 1rem', border:'1px solid rgba(201,147,58,0.2)' }}>
        <div style={{ ...subHead, marginBottom:'0.35rem' }}>◈ Lal Kitab Action</div>
        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.7, margin:0 }}>{r.action}</p>
      </div>

      {/* Mantra section */}
      {r.mantra_simple && (
        <div style={sectionBox(section === 'mantra')}>
          <div style={sectionToggle(section === 'mantra')} onClick={(e) => toggle(e, 'mantra')}>
            <span>🕉 Mantra</span>
            <span style={{ fontSize:'0.75rem' }}>{section === 'mantra' ? '▲' : '▼'}</span>
          </div>
          {section === 'mantra' && (
            <div style={{ padding:'0 0.9rem 0.85rem' }}>
              <div style={{ background:'rgba(0,0,0,0.15)', borderRadius:'6px', padding:'0.7rem 1rem', marginBottom:'0.6rem', border:'1px solid rgba(201,147,58,0.15)' }}>
                <div style={{ color:'var(--gold)', fontSize:'1rem', fontWeight:600, letterSpacing:'0.5px', marginBottom:'0.25rem', lineHeight:1.6 }}>{r.mantra_simple}</div>
                <div style={{ color:'var(--text-dim)', fontSize:'0.78rem', fontStyle:'italic' }}>{r.mantra_simple_roman}</div>
              </div>
              {r.mantra_beej && r.mantra_beej !== r.mantra_simple && (
                <div style={{ background:'rgba(0,0,0,0.12)', borderRadius:'6px', padding:'0.65rem 1rem', marginBottom:'0.6rem', border:'1px solid rgba(201,147,58,0.1)' }}>
                  <div style={{ color:'var(--text-dim)', fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'0.25rem' }}>Beej Mantra (Advanced)</div>
                  <div style={{ color:'var(--gold-light)', fontSize:'0.9rem', lineHeight:1.6, marginBottom:'0.2rem' }}>{r.mantra_beej}</div>
                  <div style={{ color:'var(--text-dim)', fontSize:'0.77rem', fontStyle:'italic' }}>{r.mantra_beej_roman}</div>
                </div>
              )}
              <p style={{ ...listItem, color:'var(--text-muted)', marginBottom:'0.3rem' }}>
                <strong style={{ color:'var(--gold-light)' }}>Meaning:</strong> {r.mantra_meaning}
              </p>
              <p style={{ ...listItem, color:'var(--text-dim)' }}>
                <strong>Count:</strong> {r.mantra_count}
              </p>
            </div>
          )}
        </div>
      )}

      {/* How to perform */}
      {r.how_to?.length > 0 && (
        <div style={sectionBox(section === 'howto')}>
          <div style={sectionToggle(section === 'howto')} onClick={(e) => toggle(e, 'howto')}>
            <span>📋 How to Perform</span>
            <span style={{ fontSize:'0.75rem' }}>{section === 'howto' ? '▲' : '▼'}</span>
          </div>
          {section === 'howto' && (
            <ol style={{ margin:0, padding:'0 0.9rem 0.85rem 2.2rem' }}>
              {r.how_to.map((step, i) => (
                <li key={i} style={{ ...listItem, marginBottom:'0.5rem' }}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Rules */}
      {r.rules?.length > 0 && (
        <div style={sectionBox(section === 'rules')}>
          <div style={sectionToggle(section === 'rules')} onClick={(e) => toggle(e, 'rules')}>
            <span>⚖ Rules to Follow</span>
            <span style={{ fontSize:'0.75rem' }}>{section === 'rules' ? '▲' : '▼'}</span>
          </div>
          {section === 'rules' && (
            <ul style={{ margin:0, padding:'0 0.9rem 0.85rem 2.1rem' }}>
              {r.rules.map((rule, i) => (
                <li key={i} style={{ ...listItem, marginBottom:'0.45rem' }}>{rule}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* When to avoid */}
      {r.when_to_avoid?.length > 0 && (
        <div style={sectionBox(section === 'avoid')}>
          <div style={sectionToggle(section === 'avoid')} onClick={(e) => toggle(e, 'avoid')}>
            <span>🚫 When to Avoid</span>
            <span style={{ fontSize:'0.75rem' }}>{section === 'avoid' ? '▲' : '▼'}</span>
          </div>
          {section === 'avoid' && (
            <ul style={{ margin:0, padding:'0 0.9rem 0.85rem 2.1rem' }}>
              {r.when_to_avoid.map((item, i) => (
                <li key={i} style={{ ...listItem, color:'#E07B39', marginBottom:'0.45rem' }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function LalKitabView({ lk }) {
  const [openPlanet, setOpenPlanet] = useState(null)
  if (!lk) return <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Lal Kitab data not available.</p>

  const sectionHead = { fontFamily:"'Cinzel',serif", fontSize:'0.82rem', color:'var(--gold)', letterSpacing:'2px', textTransform:'uppercase', margin:'1.75rem 0 0.9rem', paddingBottom:'0.4rem', borderBottom:'1px solid var(--border)' }
  const pill = (color) => ({ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:color, marginRight:'0.5rem', flexShrink:0 })

  return (
    <div>
      {/* Rahu-Ketu axis */}
      <div style={{ background:'var(--bg-elevated)', borderRadius:'10px', padding:'1.25rem 1.5rem', marginBottom:'1.25rem', border:'1px solid var(--border)' }}>
        <div style={{ color:'var(--gold)', fontWeight:600, fontSize:'0.9rem', marginBottom:'0.6rem' }}>☊ Karmic Axis — {lk.rahu_ketu_axis}</div>
        <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, margin:0 }}>{lk.axis_reading || 'Your Rahu-Ketu axis defines the karmic direction of this lifetime.'}</p>
      </div>

      {/* Foreign + Pucca summary pills */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        <span style={{ padding:'0.3rem 0.9rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600, background: lk.foreign_indicator ? 'rgba(201,147,58,0.15)' : 'rgba(255,255,255,0.05)', color: lk.foreign_indicator ? 'var(--gold)' : 'var(--text-dim)', border:'1px solid var(--border)' }}>
          {lk.foreign_indicator ? '✈ Foreign karma: Active' : '✈ Foreign karma: Mild'}
        </span>
        {lk.pucca_ghar_planets?.map(p => (
          <span key={p.planet} style={{ padding:'0.3rem 0.9rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600, background:'rgba(201,147,58,0.1)', color:'var(--gold)', border:'1px solid rgba(201,147,58,0.25)' }}>
            ★ {p.planet} Pucca H{p.house}
          </span>
        ))}
      </div>

      {/* Benefits */}
      {lk.benefits?.length > 0 && (
        <>
          <div style={sectionHead}>✦ What Works in Your Favour</div>
          {lk.benefits.map((b, i) => (
            <div key={i} style={{ ...s.lkItem, alignItems:'flex-start' }}>
              <span style={{ ...pill('#4CAF50'), marginTop:'6px' }} />
              <span style={s.lkText}>{b}</span>
            </div>
          ))}
        </>
      )}

      {/* Challenges */}
      {lk.challenges?.length > 0 && (
        <>
          <div style={sectionHead}>⚠ Challenges to Be Aware Of</div>
          {lk.challenges.map((c, i) => (
            <div key={i} style={{ ...s.lkItem, alignItems:'flex-start' }}>
              <span style={{ ...pill('#E07B39'), marginTop:'6px' }} />
              <span style={s.lkText}>{c}</span>
            </div>
          ))}
        </>
      )}

      {/* Personalised Remedies — full structured detail */}
      {lk.remedies?.length > 0 && (
        <>
          <div style={sectionHead}>◈ Personalised Lal Kitab Remedies</div>
          <p style={{ color:'var(--text-dim)', fontSize:'0.82rem', marginBottom:'1rem', lineHeight:1.6 }}>
            Each remedy below is specific to your planetary placement. Click to expand the full guide — mantra, how-to steps, rules and when to avoid.
          </p>
          {lk.remedies.map((r, i) => (
            <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:'10px', padding:'0.9rem 1.1rem', marginBottom:'0.75rem', border: openPlanet === i ? '1px solid rgba(201,147,58,0.35)' : '1px solid var(--border)', cursor:'pointer', transition:'border 0.2s' }}
              onClick={() => setOpenPlanet(openPlanet === i ? null : i)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'var(--gold-light)', fontWeight:600, fontSize:'0.9rem' }}>
                  {PLANET_SYMBOLS_LK[r.planet] || '●'} {r.planet} — House {r.house}
                </span>
                <span style={{ color:'var(--text-dim)', fontSize:'0.8rem' }}>{openPlanet === i ? '▲ Close' : '▼ Full Guide'}</span>
              </div>
              {openPlanet === i && <RemedyDetail r={r} />}
            </div>
          ))}
        </>
      )}

      {/* Per-planet detail accordion */}
      {lk.planet_readings?.length > 0 && (
        <>
          <div style={sectionHead}>📋 Full Planet-by-Planet Reading</div>
          <p style={{ color:'var(--text-dim)', fontSize:'0.82rem', marginBottom:'1rem', lineHeight:1.6 }}>
            Every planet in your chart — benefit, challenge, and the complete remedy guide.
          </p>
          {lk.planet_readings.map((pr, i) => {
            const key = `p${i}`
            const guide = pr.remedy_guide || {}
            const remedyForDetail = {
              challenge:          pr.challenge,
              action:             pr.remedy,
              mantra_beej:        guide.mantra_beej || '',
              mantra_beej_roman:  guide.mantra_beej_roman || '',
              mantra_simple:      guide.mantra_simple || '',
              mantra_simple_roman:guide.mantra_simple_roman || '',
              mantra_meaning:     guide.mantra_meaning || '',
              mantra_count:       guide.mantra_count || '',
              how_to:             guide.how_to || [],
              rules:              guide.rules || [],
              when_to_avoid:      guide.when_to_avoid || [],
            }
            return (
              <div key={pr.planet} style={{ background:'var(--bg-elevated)', borderRadius:'10px', padding:'0.9rem 1.1rem', marginBottom:'0.5rem', border: openPlanet === key ? '1px solid rgba(201,147,58,0.3)' : '1px solid var(--border)', cursor:'pointer', transition:'border 0.2s' }}
                onClick={() => setOpenPlanet(openPlanet === key ? null : key)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'var(--gold-light)', fontWeight:600, fontSize:'0.88rem' }}>
                    {PLANET_SYMBOLS_LK[pr.planet] || '●'} {pr.planet} · House {pr.house}
                    {pr.pucca && <span style={{ color:'var(--gold)', fontSize:'0.72rem', marginLeft:'0.5rem' }}>★ Pucca</span>}
                    {pr.retrograde && <span style={{ color:'var(--text-muted)', fontSize:'0.72rem', marginLeft:'0.4rem' }}>℞</span>}
                  </span>
                  <span style={{ color:'var(--text-dim)', fontSize:'0.8rem' }}>{openPlanet === key ? '▲' : '▼'}</span>
                </div>
                {openPlanet === key && (
                  <div style={{ marginTop:'0.75rem' }}>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                      <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:'#4CAF50', marginTop:'6px', flexShrink:0 }} />
                      <span style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.65 }}>
                        <strong style={{ color:'#4CAF50' }}>Benefit:</strong> {pr.benefit}
                      </span>
                    </div>
                    <RemedyDetail r={remedyForDetail} />
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ── Life Readings Component ─────────────────────────────── */
function LifeReadingsView({ readings }) {
  const [open, setOpen] = useState(readings[0]?.id || '')

  const gridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.75rem', marginBottom: '1.5rem',
  }
  const chipBase = {
    padding: '0.65rem 1rem', borderRadius: '10px', cursor: 'pointer',
    border: '1px solid', textAlign: 'center', transition: 'all 0.18s',
    fontSize: '0.85rem', fontWeight: 500,
  }

  const activeReading = readings.find(r => r.id === open)

  return (
    <div>
      {/* Topic grid */}
      <div style={gridStyle}>
        {readings.map(r => (
          <div key={r.id}
            style={{
              ...chipBase,
              background: open === r.id ? 'var(--gold)' : 'var(--bg-card)',
              color:      open === r.id ? '#1A1000' : 'var(--text-muted)',
              borderColor: open === r.id ? 'var(--gold)' : 'var(--border)',
              transform:  open === r.id ? 'translateY(-2px)' : 'none',
            }}
            onClick={() => setOpen(r.id)}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{r.icon}</div>
            {r.title}
          </div>
        ))}
      </div>

      {/* Reading panel */}
      {activeReading && (
        <div style={{ ...s.storyCard, borderColor: 'var(--border-hover)' }}>
          <div style={s.storyTitle}>
            {activeReading.icon} {activeReading.title.toUpperCase()}
          </div>
          {activeReading.lines.map((line, i) => (
            <p key={i} style={{
              ...s.storyText,
              color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: i === 0 ? '0.97rem' : '0.92rem',
              marginBottom: i < activeReading.lines.length - 1 ? '0.9rem' : 0,
            }}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function SignInPrompt() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--gold)' }}>✦</div>
      <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
        Sign In to Read Your Stars
      </h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 1.75rem', lineHeight: 1.65, fontSize: '0.92rem' }}>
        Create a free account to unlock your cosmic profile, life readings, dasha timeline and Lal Kitab analysis.
      </p>
      <Link to="/login" style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #C9933A, #8B6020)',
        color: '#FFF8EC', padding: '0.75rem 2rem', borderRadius: '8px',
        fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem',
      }}>Sign In Free →</Link>
      <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        The <strong style={{ color: 'var(--text-primary)' }}>Chart Details</strong> tab is always free.
      </p>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */
export default function ChartResult() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { lang, isHindi } = useLanguage()
  const { isLoggedIn, canUse } = useAuth()
  const [chart, setChart]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const focus = searchParams.get('focus') || 'vedic'
  const [tab, setTab] = useState(focus === 'lalkitab' ? 'lalkitab' : 'story')

  useEffect(() => {
    getChart(id).then(setChart).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={s.loading}>{isHindi ? '✦ सितारे पढ़ रहे हैं...' : '✦ Reading the stars...'}</div>
  if (error)   return <div style={s.error}>{error}<br /><Link to="/" style={{ color: 'var(--gold)' }}>← {isHindi ? 'होम पर जाएं' : 'Go home'}</Link></div>
  if (!chart)  return null

  const { lagna, planets, house_map, dasha_tree, current_dasha, lal_kitab, ayanamsa } = chart

  // ── Age detection ──────────────────────────────────────────
  const ageYears = chart.dob
    ? Math.floor((Date.now() - new Date(chart.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : 30
  const isChild   = ageYears < 18
  const isInfant  = ageYears < 5

  const { profile, dashaStory } = interpretChart(lagna, planets, current_dasha, lang)

  const moonSign = planets?.Moon?.sign
  const moonNak  = planets?.Moon?.nakshatra
  const md       = current_dasha?.mahadasha?.lord
  const ad       = current_dasha?.antardasha?.lord
  const mdInfo   = isHindi ? (DASHA_INFO_HI[md] || {}) : (DASHA_INFO[md] || {})
  const PNAME_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' }
  const pName = (p) => isHindi ? (PNAME_HI[p] || p) : p

  // ── Tabs — when Lal Kitab focus, show it first ────────────
  const allTabs = [
    { id: 'story',    label: isHindi ? 'आपकी कहानी'  : (isChild ? 'Life Blueprint' : 'Your Story') },
    { id: 'life',     label: isHindi ? 'जीवन पठन'     : (isChild ? 'Future Potential' : 'Life Readings') },
    { id: 'chart',    label: isHindi ? 'कुंडली विवरण' : 'Chart Details' },
    { id: 'dasha',    label: isHindi ? 'दशा काल'       : 'Dasha Timeline' },
    { id: 'lalkitab', label: 'Lal Kitab' },
    { id: 'learn',    label: isHindi ? '📖 जानें'      : '📖 Learn' },
  ]
  // Put Lal Kitab first when that's the entry focus
  const TABS = focus === 'lalkitab'
    ? [allTabs[4], ...allTabs.filter(t => t.id !== 'lalkitab')]
    : allTabs

  const lifeReadings = generateAllReadings(lagna, planets, house_map, current_dasha, lal_kitab, lang)

  // Tabs that require sign-in ('chart' tab is always free)
  const GATED_TABS = ['story', 'life', 'dasha', 'lalkitab', 'learn']

  const handleTabClick = (t) => {
    setTab(t)
  }

  return (
    <div style={s.wrap}>
      <Link to="/my-charts" style={s.backLink}>← {isHindi ? 'सभी कुंडलियाँ' : 'All Charts'}</Link>

      <div style={{ ...s.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={s.name}>{chart.label || 'Your Chart'}</h1>
          <p style={s.meta}>
            {chart.dob} · {chart.tob} · {chart.place_name || chart.timezone}
            {ayanamsa && ` · Ayanamsa: ${ayanamsa.toFixed(4)}° (Lahiri)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
          {/* PDF — requires login + pro/jyotish plan */}
          {isLoggedIn && canUse('pdf') ? (
            <a
              href={`/v1/charts/${id}/pdf`}
              download
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: 'var(--gold-light)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', transition: 'border-color 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              title={isHindi ? 'PDF रिपोर्ट डाउनलोड करें' : 'Download PDF Report'}
            >
              ↓ {isHindi ? 'PDF' : 'PDF Report'}
            </a>
          ) : (
            <Link
              to={isLoggedIn ? '/pricing' : '/login'}
              state={isLoggedIn ? { upgradeFor: 'pdf' } : { from: `/chart/${id}` }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', opacity: 0.65 }}
              title={isLoggedIn ? 'Upgrade to download PDF' : 'Sign in to download PDF'}
            >
              ↓ {isHindi ? 'PDF' : 'PDF Report'} 🔒
            </Link>
          )}
          {/* Ask Bhagya — requires login + chat plan */}
          {isLoggedIn && canUse('chat') ? (
            <Link
              to={`/destiny-chat?chart=${id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(201,147,58,0.1)', border: '1px solid rgba(201,147,58,0.3)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
              title={isHindi ? 'इस चार्ट के बारे में AI से पूछें' : 'Ask AI about this chart'}
            >
              ◎ {isHindi ? 'भाग्य चैट' : 'Ask Bhagya'}
            </Link>
          ) : (
            <Link
              to={isLoggedIn ? '/pricing' : '/login'}
              state={isLoggedIn ? { upgradeFor: 'chat' } : { from: `/chart/${id}` }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(201,147,58,0.05)', border: '1px solid rgba(201,147,58,0.15)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', opacity: 0.65 }}
              title={isLoggedIn ? 'Upgrade to chat' : 'Sign in to chat'}
            >
              ◎ {isHindi ? 'भाग्य चैट' : 'Ask Bhagya'} 🔒
            </Link>
          )}
        </div>
      </div>

      {/* ── Age context banner ── */}
      {isChild && (
        <div style={{ background: 'linear-gradient(135deg, rgba(201,147,58,0.12), rgba(201,147,58,0.05))', border: '1px solid rgba(201,147,58,0.3)', borderRadius: '10px', padding: '0.9rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>✦</span>
          <div>
            <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
              {isInfant ? `Karmic Blueprint Reading — Age ${ageYears < 1 ? 'under 1' : ageYears}` : `Life Blueprint Reading — Age ${ageYears}`}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.65, margin: 0 }}>
              {isInfant
                ? `This reading reveals the cosmic blueprint this soul brought into the world — their innate gifts, life purpose, karmic themes and the life chapters that will unfold as they grow. All readings describe potential, not current circumstances.`
                : `This person is ${ageYears} years old. The readings below describe what is unfolding now and what is ahead — tailored to their current life stage. Themes relevant to adulthood will activate in the years to come.`
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Lal Kitab focus banner ── */}
      {focus === 'lalkitab' && (
        <div style={{ background: 'rgba(201,147,58,0.08)', border: '1px solid rgba(201,147,58,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ color: 'var(--gold)', fontSize: '1rem' }}>◈</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--gold-light)' }}>Lal Kitab Reading</strong> — you are viewing this chart through the Lal Kitab lens. The Lal Kitab tab is shown first. All other tabs are available for the full Vedic picture.
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button key={t.id}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
                fontWeight: 500, border: '1px solid',
                background: isActive ? 'var(--gold)' : 'transparent',
                color:      isActive ? '#1A1000' : 'var(--text-muted)',
                borderColor: isActive ? 'var(--gold)' : 'var(--border)',
                transition: 'all 0.2s',
              }}
              onClick={() => handleTabClick(t.id)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Sign-in gate — shown instead of gated tab content when not logged in */}
      {!isLoggedIn && GATED_TABS.includes(tab) && <SignInPrompt />}

      {/* ── YOUR STORY TAB ── */}
      {tab === 'story' && isLoggedIn && (
        <>
          {/* Cosmic Profile */}
          <div style={s.storyCard}>
            <div style={s.storyTitle}>✦ {isHindi ? 'आपका ब्रह्मांडीय स्वरूप' : (isChild ? 'THIS SOUL\'S COSMIC BLUEPRINT' : 'YOUR COSMIC PROFILE')}</div>
            {profile.map((line, i) => (
              <p key={i} style={s.storyText}>{line}</p>
            ))}
            {moonNak && (
              <p style={{ ...s.storyText, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {isHindi
                  ? <><strong style={{ color: 'var(--gold-light)' }}>{moonNak}</strong> नक्षत्र में आपका चंद्र विराजित है — {NAK_MEANING_HI[moonNak] || 'गहरे ब्रह्मांडीय उद्देश्य'} की ऊर्जा। यह आपकी सहज प्रवृत्तियों, सपनों और भावनात्मक ग्रहणशीलता को आकार देता है।</>
                  : <>Your Moon rests in <strong style={{ color: 'var(--gold-light)' }}>{moonNak}</strong> nakshatra — the energy of {NAK_MEANING[moonNak] || 'deep cosmic purpose'}. This shapes your instincts, your dreams, and how you receive the world emotionally.</>
                }
              </p>
            )}
          </div>

          {/* Current Dasha */}
          {dashaStory.length > 0 && (
            <div style={s.dashaHighlight}>
              <div style={s.dashaLabel}>
                {isHindi
                  ? `⊙ वर्तमान अध्याय — ${pName(md)} महादशा${ad ? ` / ${pName(ad)} अंतर्दशा` : ''}`
                  : isChild
                    ? `⊙ Opening Life Chapter — ${md} Mahadasha${ad ? ` / ${ad} Antardasha` : ''}`
                    : `⊙ Current Chapter — ${md} Mahadasha${ad ? ` / ${ad} Antardasha` : ''}`
                }
              </div>
              {isChild && (
                <p style={{ ...s.dashaSub, color: 'var(--gold)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  ✦ This life chapter shapes the early years and sets the foundation for who this person becomes.
                </p>
              )}
              {dashaStory.map((line, i) => (
                <p key={i} style={i === 0 ? s.dashaText : s.dashaSub}>{line}</p>
              ))}
              <p style={{ ...s.dashaSub, marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                {isHindi ? 'काल:' : 'Period:'} {current_dasha?.mahadasha?.start} → {current_dasha?.mahadasha?.end}
                {current_dasha?.antardasha && (isHindi ? ` · उप-काल समाप्ति: ${current_dasha.antardasha.end}` : ` · Sub-period ends ${current_dasha.antardasha.end}`)}
              </p>
            </div>
          )}

          {/* Key themes */}
          <div style={s.storyCard}>
            <div style={s.storyTitle}>✦ {isHindi ? 'आपकी कुंडली के प्रमुख विषय' : 'KEY THEMES IN YOUR CHART'}</div>
            {lagna?.sign && (
              <div style={s.lkItem}>
                <span style={s.lkBullet}>◈</span>
                <span style={s.lkText}>
                  <strong style={{ color: 'var(--gold-light)' }}>{isHindi ? 'व्यक्तित्व और रूप:' : 'Personality & Appearance:'}</strong>{' '}
                  {isHindi
                    ? `${SIGN_HI_NAME[lagna.sign] || lagna.sign} लग्न, ${lagna.nakshatra} नक्षत्र, पद ${lagna.pada} — आप स्वाभाविक रूप से ${SIGN_INFO_HI[lagna.sign]?.quality} हैं। लोग आपको ${SIGN_INFO_HI[lagna.sign]?.element} तत्व की उपस्थिति के रूप में देखते हैं।`
                    : `Your ${lagna.sign} Lagna in ${lagna.nakshatra} (Pada ${lagna.pada}) makes you naturally ${SIGN_INFO[lagna.sign]?.quality}. People see you as a ${SIGN_INFO[lagna.sign]?.element} sign presence.`
                  }
                </span>
              </div>
            )}
            {lal_kitab?.foreign_indicator && (
              <div style={s.lkItem}>
                <span style={s.lkBullet}>✈</span>
                <span style={s.lkText}>
                  <strong style={{ color: 'var(--gold-light)' }}>{isHindi ? 'विदेश संबंध:' : 'Foreign Connections:'}</strong>{' '}
                  {isHindi
                    ? 'लाल किताब मजबूत विदेशी कर्म की पुष्टि करती है। इस कुंडली में विदेश बसावट या कार्य पूर्णतः समर्थित है।'
                    : 'Lal Kitab confirms strong foreign karma. Relocation or sustained work abroad is supported by this chart.'
                  }
                </span>
              </div>
            )}
            {planets?.Rahu && (
              <div style={s.lkItem}>
                <span style={s.lkBullet}>☊</span>
                <span style={s.lkText}>
                  <strong style={{ color: 'var(--gold-light)' }}>{isHindi ? 'आत्मा की उत्तर दिशा (राहु):' : "Soul's North Direction (Rahu):"}</strong>{' '}
                  {isHindi
                    ? `राहु ${SIGN_HI_NAME[planets.Rahu.sign] || planets.Rahu.sign} में (भाव ${planets.Rahu.house}) — आपको अपरंपरागत उपलब्धि की ओर धकेलते हैं, विशेषतः भाव ${planets.Rahu.house} के क्षेत्रों में।`
                    : `Rahu in ${planets.Rahu.sign} (H${planets.Rahu.house}) pushes you toward unconventional achievement, especially in the areas governed by House ${planets.Rahu.house}.`
                  }
                </span>
              </div>
            )}
            {planets?.Saturn && (
              <div style={s.lkItem}>
                <span style={s.lkBullet}>♄</span>
                <span style={s.lkText}>
                  <strong style={{ color: 'var(--gold-light)' }}>{isHindi ? 'कर्म और अनुशासन (शनि):' : 'Karma & Discipline (Saturn):'}</strong>{' '}
                  {isHindi
                    ? `शनि ${SIGN_HI_NAME[planets.Saturn.sign] || planets.Saturn.sign} में (भाव ${planets.Saturn.house}) — यहाँ लगाई मेहनत समय के साथ चक्रवृद्धि परिणाम देती है। इस भाव में धैर्य आपकी महाशक्ति है।`
                    : `Saturn in ${planets.Saturn.sign} (H${planets.Saturn.house}) — effort invested here returns compound results over time. Patience in this house is your superpower.`
                  }
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LIFE READINGS TAB ── */}
      {tab === 'life' && isLoggedIn && (
        <>
          {isChild && (
            <div style={{ background: 'rgba(201,147,58,0.08)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1.2rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: 'var(--gold-light)' }}>Reading these as Future Potential</strong> — this person is {ageYears < 1 ? 'under 1 year' : `${ageYears} years`} old. Each section below describes the karmic blueprint for that area of life — what will naturally unfold as they grow into adulthood. Current dasha timing applies to early childhood experiences.
              </p>
            </div>
          )}
          <LifeReadingsView readings={lifeReadings} />
        </>
      )}

      {/* ── CHART DETAILS TAB ── */}
      {tab === 'chart' && (
        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardTitle}>{isHindi ? 'लग्न (Ascendant)' : 'Ascendant (Lagna)'}</div>
            {lagna && (
              <>
                <div style={s.lagnaBlock}>
                  <div style={s.lagnaSign}>{lagna.sign}</div>
                  <div style={s.lagnaDeg}>{lagna.degree?.toFixed(2)}°</div>
                  <div style={s.lagnaNak}>{lagna.nakshatra} · Pada {lagna.pada}</div>
                </div>
                {SIGN_INFO[lagna.sign] && (
                  <p style={s.lagnaDesc}>{SIGN_INFO[lagna.sign].quality} · ruled by {SIGN_INFO[lagna.sign].lord}</p>
                )}
              </>
            )}
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>{isHindi ? 'ग्रह स्थिति' : 'Planetary Positions'}</div>
            {planets && <PlanetTable planets={planets} />}
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>{isHindi ? 'भाव मानचित्र' : 'House Map'}</div>
            <HouseMap houseMap={house_map} />
          </div>
        </div>
      )}

      {/* ── DASHA TIMELINE TAB ── */}
      {tab === 'dasha' && isLoggedIn && (
        <div style={s.card}>
          <div style={s.cardTitle}>{isHindi ? 'विंशोत्तरी दशा — जीवन के अध्याय' : 'Vimshottari Dasha — Your Life Chapters'}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            {isHindi
              ? 'प्रत्येक महादशा जीवन का एक अलग अध्याय है, जिसे एक ग्रहीय ऊर्जा शासित करती है। यह ऊर्जा अपनी पूरी अवधि तक आपके अनुभवों, निर्णयों और अवसरों को रंगती है।'
              : 'Each Mahadasha is a distinct chapter of life, ruled by a planetary energy that colours your experiences, decisions and opportunities for its entire duration.'
            }
          </p>
          <DashaTimeline dashaTree={dasha_tree} currentDasha={current_dasha} />
        </div>
      )}

      {/* ── LAL KITAB TAB ── */}
      {tab === 'lalkitab' && isLoggedIn && (
        <div style={s.card}>
          <div style={s.cardTitle}>{isHindi ? 'लाल किताब पठन' : 'Lal Kitab Reading'}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            {isHindi
              ? 'लाल किताब एक 19वीं सदी का उर्दू ग्रंथ है जो एक अनूठी भाव-पद्धति से कर्म को पढ़ता है और ग्रह-ऋण को निष्क्रिय करने के व्यावहारिक उपाय सुझाता है।'
              : 'Lal Kitab is a 19th-century Urdu text that reads karma through a unique house system and prescribes practical remedies to neutralise planetary debts.'
            }
          </p>
          <LalKitabView lk={lal_kitab} />
        </div>
      )}

      {/* ── LEARN TAB ── */}
      {tab === 'learn' && isLoggedIn && <Glossary />}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/chart/new" className="btn-outline">+ {isHindi ? 'नई कुंडली' : 'New Chart'}</Link>
      </div>
    </div>
  )
}
