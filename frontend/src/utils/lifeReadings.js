/* ── TheBhagya Life Readings Engine — EN + HI ───────────── */

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

const SIGN_LORD = {
  Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon',
  Leo:'Sun', Virgo:'Mercury', Libra:'Venus', Scorpio:'Mars',
  Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter',
}

// Hindi planet names
const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
}

// Hindi sign names
const SIGN_HI = {
  Aries:'मेष', Taurus:'वृषभ', Gemini:'मिथुन', Cancer:'कर्क',
  Leo:'सिंह', Virgo:'कन्या', Libra:'तुला', Scorpio:'वृश्चिक',
  Sagittarius:'धनु', Capricorn:'मकर', Aquarius:'कुंभ', Pisces:'मीन',
}

// House meanings — EN
const HOUSE_MEANING = {
  1:'your personality, health and how the world sees you',
  2:'your savings, family wealth and the way you earn',
  3:'your courage, communication and siblings',
  4:'your home, mother and sense of emotional security',
  5:'your children, creativity and intelligence',
  6:'your daily work, health challenges and obstacles you overcome',
  7:'your marriage, romantic partner and business partnerships',
  8:'deep transformation, secrets, longevity and inherited wealth',
  9:'your luck, spiritual wisdom, father and higher education',
  10:'your career, public reputation and position in society',
  11:'your income, gains from work and your social circle',
  12:'foreign lands, spiritual liberation and expenses',
}

// House meanings — HI
const HOUSE_MEANING_HI = {
  1:'आपके व्यक्तित्व, स्वास्थ्य और समाज में छवि का',
  2:'आपकी बचत, पारिवारिक धन और कमाई के तरीके का',
  3:'आपके साहस, संचार और भाई-बहनों का',
  4:'आपके घर, माँ और भावनात्मक सुरक्षा का',
  5:'आपकी संतान, रचनात्मकता और बुद्धिमत्ता का',
  6:'आपके दैनिक कार्य, स्वास्थ्य चुनौतियों और बाधाओं का',
  7:'आपके विवाह, जीवनसाथी और व्यावसायिक साझेदारी का',
  8:'गहरे परिवर्तन, रहस्यों और दीर्घायु का',
  9:'आपके भाग्य, आध्यात्मिक ज्ञान और उच्च शिक्षा का',
  10:'आपके करियर, सामाजिक प्रतिष्ठा और सार्वजनिक छवि का',
  11:'आपकी आय, लाभ और सामाजिक नेटवर्क का',
  12:'विदेशी भूमि, आध्यात्मिक मुक्ति और व्यय का',
}

// Planet voice — EN
const PLANET_VOICE = {
  Sun:     'the planet of authority, confidence and leadership',
  Moon:    'the planet of emotions, intuition and the mind',
  Mars:    'the planet of energy, courage and action',
  Mercury: 'the planet of intellect, communication and commerce',
  Jupiter: 'the planet of wisdom, expansion and good fortune',
  Venus:   'the planet of love, beauty and material comfort',
  Saturn:  'the planet of discipline, karma and lasting results',
  Rahu:    'the north node — representing ambition, foreign connections and unconventional paths',
  Ketu:    'the south node — representing spirituality, past-life wisdom and detachment',
}

// Dasha period themes — plain English for users
const DASHA_THEME = {
  Sun:     { short:'Authority & Recognition',      plain:'Your career visibility increases. This is a period to step into leadership, deal with government or authority figures, and express your identity boldly.' },
  Moon:    { short:'Emotions & Home Life',         plain:'Family, home and emotional wellbeing are in focus. Travel, public life and your relationship with your mother figure are highlighted.' },
  Mars:    { short:'Energy & Action',              plain:'A high-energy period for taking bold action, resolving conflicts and making moves in property or business. Courage is your asset right now.' },
  Mercury: { short:'Communication & Commerce',     plain:'Business, writing, speaking and intellectual pursuits flourish. Short journeys, new connections and smart decisions define this period.' },
  Jupiter: { short:'Wisdom & Expansion',           plain:'One of the most auspicious periods in the cycle. Wealth grows, children and marriages are blessed, wisdom deepens. The universe rewards good karma now.' },
  Venus:   { short:'Love & Abundance',             plain:'Relationships, beauty, creativity and material comforts expand. A wonderful period for romance, marriage and enjoying life.' },
  Saturn:  { short:'Discipline & Lasting Results', plain:'A period of hard work, patience and karma. What you build now will last. Shortcuts fail — sustained effort succeeds completely.' },
  Rahu:    { short:'Ambition & Transformation',   plain:'An intense, unconventional period. Foreign connections, technology, and breaking old patterns are central themes. What once seemed impossible becomes possible.' },
  Ketu:    { short:'Spirituality & Detachment',    plain:'An introspective period of inner seeking, sudden events and release from old attachments. Mystical experiences and karmic completions are common.' },
}

// Planet voice — HI
const PLANET_VOICE_HI = {
  Sun:     'अधिकार, आत्मविश्वास और नेतृत्व के ग्रह',
  Moon:    'भावनाओं, अंतर्ज्ञान और मन के ग्रह',
  Mars:    'ऊर्जा, साहस और क्रियाशीलता के ग्रह',
  Mercury: 'बुद्धि, संचार और व्यापार के ग्रह',
  Jupiter: 'ज्ञान, विस्तार और सौभाग्य के ग्रह',
  Venus:   'प्रेम, सौंदर्य और भौतिक सुख के ग्रह',
  Saturn:  'अनुशासन, कर्म और स्थायी परिणामों के ग्रह',
  Rahu:    'उत्तर राहु — महत्वाकांक्षा, विदेशी संबंध और अपरंपरागत मार्गों का प्रतीक',
  Ketu:    'दक्षिण केतु — अध्यात्म, पूर्वजन्म की बुद्धि और वैराग्य का प्रतीक',
}

// Dasha themes — HI
const DASHA_THEME_HI = {
  Sun:     { short:'अधिकार और पहचान',        plain:'करियर में दृश्यता बढ़ती है। नेतृत्व, सरकारी कार्य और आत्म-अभिव्यक्ति पर जोर रहता है। पहचान बनाने का यह उत्तम समय है।' },
  Moon:    { short:'भावनाएं और घरेलू जीवन', plain:'परिवार, घर और मानसिक शांति केंद्र में हैं। यात्रा, सार्वजनिक जीवन और माँ से संबंध प्रमुख रहते हैं।' },
  Mars:    { short:'ऊर्जा और साहसिक कदम',   plain:'साहसिक निर्णय लेने, संपत्ति या व्यापार में कदम बढ़ाने का समय। ऊर्जा और दृढ़ता इस काल की शक्ति है।' },
  Mercury: { short:'संचार और व्यापार',       plain:'व्यापार, लेखन, वाणी और बौद्धिक कार्यों में सफलता मिलती है। नए संपर्क और चतुर निर्णय इस काल की पहचान हैं।' },
  Jupiter: { short:'ज्ञान और समृद्धि',      plain:'120 वर्ष के चक्र में यह सबसे शुभ काल है। धन बढ़ता है, संतान और विवाह का आशीर्वाद मिलता है, ज्ञान गहरा होता है।' },
  Venus:   { short:'प्रेम और वैभव',          plain:'रिश्ते, सौंदर्य, रचनात्मकता और भौतिक सुख का विस्तार होता है। रोमांस, विवाह और जीवन का आनंद लेने का श्रेष्ठ काल।' },
  Saturn:  { short:'कर्म और स्थायी परिणाम',  plain:'मेहनत, धैर्य और कर्म का काल। अभी जो बनाएंगे वह स्थायी रहेगा। शॉर्टकट विफल होंगे — निरंतर प्रयास सफल होगा।' },
  Rahu:    { short:'महत्वाकांक्षा और परिवर्तन', plain:'एक तीव्र, अपरंपरागत काल। विदेशी संबंध, तकनीक और पुराने ढाँचे तोड़ना केंद्रीय विषय हैं। असंभव लगने वाली बातें संभव होती हैं।' },
  Ketu:    { short:'अध्यात्म और वैराग्य',    plain:'आंतरिक खोज, अचानक घटनाएं और पुराने बंधनों से मुक्ति का काल। रहस्यमय अनुभव और कर्मिक समापन सामान्य हैं।' },
}

const BENEFICS = new Set(['Jupiter','Venus','Moon','Mercury'])
const MALEFICS = new Set(['Saturn','Mars','Rahu','Ketu','Sun'])

function houseLord(lagnaSign, h) {
  const idx = (SIGNS.indexOf(lagnaSign) + h - 1) % 12
  return SIGN_LORD[SIGNS[idx]] || ''
}
function inHouse(hm, h) { return hm?.[String(h)] || [] }
function pdata(planets, name) { return planets?.[name] || null }

function quality(occ) {
  if (!occ.length) return 'neutral'
  const b = occ.filter(p => BENEFICS.has(p)).length
  const m = occ.filter(p => MALEFICS.has(p)).length
  return b > m ? 'strong' : m > b ? 'challenged' : 'mixed'
}

// Hindi helper: planet names
function pHi(name) { return PLANET_HI[name] || name }
function sHi(sign) { return SIGN_HI[sign] || sign }

function lordNoteHi(lord, planets, houseNum) {
  const p = pdata(planets, lord)
  if (!p) return ''
  return `यह ${pHi(lord)} (${PLANET_VOICE_HI[lord]}) द्वारा शासित है, जो अभी ${HOUSE_MEANING_HI[p.house]} क्षेत्र में है — वहाँ से अपनी ऊर्जा आपके ${HOUSE_MEANING_HI[houseNum] || 'जीवन'} में लाते हैं।`
}

function qualityDescHi(occ, houseNum) {
  const q = quality(occ)
  const hm = HOUSE_MEANING_HI[houseNum] || 'इस जीवन क्षेत्र'
  if (q === 'strong')    return `यह एक बहुत शुभ योग है — ${hm} आपको सहजता से पुरस्कृत करता है।`
  if (q === 'challenged') return `यह क्षेत्र प्रयास माँगता है — ${hm} मेहनत से मिलता है, लेकिन जो बनता है वह मजबूत और स्थायी होता है।`
  return `एक संतुलित योग — ${hm} में अवसर और समायोजन दोनों हैं।`
}

function lordNote(lord, planets, houseNum) {
  const p = pdata(planets, lord)
  if (!p) return ''
  return `It is governed by ${lord} (${PLANET_VOICE[lord]}), which currently sits in your ${HOUSE_MEANING[p.house]} zone — drawing its energy from there into your ${HOUSE_MEANING[houseNum] || 'life'}.`
}

function qualityDesc(occ, houseNum) {
  const q = quality(occ)
  const hm = HOUSE_MEANING[houseNum] || 'this area of life'
  if (q === 'strong')    return `a very positive combination — ${hm} tends to reward you well and naturally.`
  if (q === 'challenged') return `a placement that requires effort — ${hm} won't come without work, but what you earn here is solid and lasting.`
  return `a balanced placement — ${hm} has both opportunities and adjustments along the way.`
}

/* ── Topic generators — plain English ───────────────────── */

function career(ls, planets, hm, md, ad) {
  const occ = inHouse(hm, 10)
  const lord = houseLord(ls, 10)
  const sun = pdata(planets, 'Sun')
  const sat = pdata(planets, 'Saturn')
  const mdInfo = DASHA_THEME[md] || {}

  return [
    occ.length
      ? `Your career zone in the sky carries ${occ.join(' and ')} — ${qualityDesc(occ, 10)} ${occ.map(p => PLANET_VOICE[p]).join(' and ')} shape your professional life.`
      : `Your career zone is currently unoccupied by planets. ${lordNote(lord, planets, 10)}`,

    md && `Right now you are in your ${md} life chapter — a time of ${mdInfo.short || md}. ${mdInfo.plain || ''} ${(md === 'Saturn' || md === 'Sun' || md === 'Jupiter') ? 'This chapter is directly connected to career milestones.' : 'Career moves during this period are shaped by what ' + md + ' rules in your chart.'}`,

    sun && `${PLANET_VOICE['Sun']} sits in your ${HOUSE_MEANING[sun.house]} zone. This is where you naturally seek recognition and shine — the work you do connected to ${sun.sign} qualities is where you feel most alive professionally.`,

    sat && `${PLANET_VOICE['Saturn']} sits in your ${HOUSE_MEANING[sat.house]} zone. Saturn here means career results in this area come slowly — but they prove permanent. The discipline you invest here is never wasted.`,
  ].filter(Boolean)
}

function wealth(ls, planets, hm, md) {
  const h2occ = inHouse(hm, 2)
  const h11occ = inHouse(hm, 11)
  const jupiter = pdata(planets, 'Jupiter')
  const mdInfo = DASHA_THEME[md] || {}

  return [
    h2occ.length
      ? `Your savings and family wealth zone holds ${h2occ.join(' and ')} — ${qualityDesc(h2occ, 2)}`
      : `Your savings zone is unoccupied by planets. ${lordNote(houseLord(ls,2), planets, 2)}`,

    h11occ.length
      ? `Your income and gains zone holds ${h11occ.join(' and ')} — ${qualityDesc(h11occ, 11)}`
      : `Your income zone is unoccupied. ${lordNote(houseLord(ls,11), planets, 11)}`,

    md && `Your current ${md} life chapter ${(md === 'Venus' || md === 'Jupiter' || md === 'Mercury') ? 'is one of the most financially productive in the entire 120-year planetary cycle. This is the time to invest, grow savings and build wealth.' : 'is not a primary wealth-building chapter, but gains still flow through the active sub-period. Consistency matters more than big moves now.'}`,

    jupiter && `Jupiter — ${PLANET_VOICE['Jupiter']} — sits in your ${HOUSE_MEANING[jupiter.house]} zone. This planet is your financial guardian. It prevents complete collapse and continuously expands the blessings of whichever part of life it touches.`,
  ].filter(Boolean)
}

function marriage(ls, planets, hm, md) {
  const h7occ = inHouse(hm, 7)
  const lord7 = houseLord(ls, 7)
  const venus = pdata(planets, 'Venus')
  const jupiter = pdata(planets, 'Jupiter')
  const mdInfo = DASHA_THEME[md] || {}

  return [
    h7occ.length
      ? `Your marriage and partnership zone carries ${h7occ.join(' and ')} — ${qualityDesc(h7occ, 7)}`
      : `Your marriage zone is unoccupied by planets. ${lordNote(lord7, planets, 7)}`,

    venus && `${PLANET_VOICE['Venus']} sits in your ${HOUSE_MEANING[venus.house]} zone. Venus reveals what you truly seek in a partner — someone who embodies the qualities of ${venus.sign}. Your love style and romantic nature are deeply shaped by this placement.`,

    jupiter && `Jupiter — the planet of expansion and divine timing — sits in your ${HOUSE_MEANING[jupiter.house]} zone. When Jupiter activates your marriage zone through its movement or through the active life chapter, that is when marriage windows open most naturally.`,

    md && `${(md === 'Venus' || md === 'Jupiter') ? `Your current ${md} chapter is traditionally the most auspicious in the entire cycle for marriage and romantic commitment. If marriage is on your mind, this window is significant.` : `Watch for Venus and Jupiter sub-periods within your current ${md} chapter — those are the most common times marriage or serious relationships begin.`}`,
  ].filter(Boolean)
}

function children(ls, planets, hm, md) {
  const h5occ = inHouse(hm, 5)
  const lord5 = houseLord(ls, 5)
  const jupiter = pdata(planets, 'Jupiter')

  return [
    h5occ.length
      ? `Your children, creativity and intelligence zone carries ${h5occ.join(' and ')} — ${qualityDesc(h5occ, 5)}`
      : `Your children and creativity zone is unoccupied. ${lordNote(lord5, planets, 5)}`,

    jupiter && `Jupiter is the most important planet for children in Vedic astrology. It sits in your ${HOUSE_MEANING[jupiter.house]} zone and its positive influence spreads to the areas it looks at — wherever Jupiter casts its gaze, fertility and blessings follow.`,

    md === 'Jupiter'
      ? `You are in Jupiter's chapter right now — traditionally one of the most fertile and auspicious windows for the blessing of children.`
      : `Jupiter's sub-period within your current ${md} chapter is the primary window to watch for children or major creative breakthroughs.`,

    `Your creativity and intelligence (also ruled by this zone) are strongest during Jupiter and Sun sub-periods — these are the best times for creative projects, learning and speculative ventures.`,
  ].filter(Boolean)
}

function health(ls, planets, hm, md) {
  const h1occ = inHouse(hm, 1)
  const h6occ = inHouse(hm, 6)
  const sun = pdata(planets, 'Sun')

  return [
    h1occ.length
      ? `Your personality and physical vitality zone carries ${h1occ.join(' and ')}. ${h1occ.some(p => BENEFICS.has(p)) ? 'A positive presence here strengthens your immune system and overall constitution naturally.' : 'This gives you a strong, resilient constitution — vitality comes through physical discipline and consistent self-care.'}`
      : `Your vitality zone is clear, which means your physical constitution is shaped primarily by your rising sign and its ruling planet.`,

    h6occ.length
      ? `Your health and daily work zone carries ${h6occ.join(' and ')}. ${h6occ.some(p => MALEFICS.has(p)) ? 'Strong planets here actually build resistance to disease — you tend to fight through health challenges and recover well.' : 'Positive planets here may lower immunity slightly; regular health habits are your best protection.'}`
      : `Your health zone is clear — your body responds well to routine, rest and mindful lifestyle choices.`,

    sun && `${PLANET_VOICE['Sun']} governs your vitality and heart. Its placement in your ${HOUSE_MEANING[sun.house]} zone shapes your overall energy levels and physical strength through life.`,

    `Saturn and Rahu sub-periods are the most common windows when health deserves extra attention. Preventive care, good sleep and regular checkups during those sub-periods is the wisest approach.`,
  ].filter(Boolean)
}

function foreign(ls, planets, hm, md, ad, lk) {
  const h12occ = inHouse(hm, 12)
  const rahu = pdata(planets, 'Rahu')

  return [
    lk?.foreign_indicator
      ? `Your chart carries a clear foreign indicator in the Lal Kitab reading — relocation or sustained work abroad is karmically supported for you. This lifetime has an international dimension written into it.`
      : `Foreign travel is possible in your chart; long-term settlement abroad will need specific planetary activations to unfold fully.`,

    rahu && `${PLANET_VOICE['Rahu']} sits in your ${HOUSE_MEANING[rahu.house]} zone. Rahu is the most powerful planet for foreign connections, immigration and unconventional international paths. ${[9,12,3].includes(rahu.house) ? 'This is a classic placement for living, working or building a life abroad.' : 'When Rahu\'s chapter or sub-period activates, foreign movement becomes possible and often sudden.'}`,

    h12occ.length
      ? `Your foreign lands zone carries ${h12occ.join(' and ')} — ${qualityDesc(h12occ, 12)}`
      : `Your foreign zone is unoccupied. ${lordNote(houseLord(ls,12), planets, 12)}`,

    (md === 'Rahu' || ad === 'Rahu')
      ? `You are currently in Rahu's chapter or sub-period — this is the most powerful window in the cycle for visa approvals, relocation and building an international career. Opportunities abroad deserve serious attention right now.`
      : `When Rahu's sub-period arrives within your current ${md} chapter, that is typically when foreign movement accelerates and visa or relocation matters come to a head.`,
  ].filter(Boolean)
}

function property(ls, planets, hm, md) {
  const h4occ = inHouse(hm, 4)
  const lord4 = houseLord(ls, 4)
  const mars = pdata(planets, 'Mars')

  return [
    h4occ.length
      ? `Your home and property zone carries ${h4occ.join(' and ')} — ${qualityDesc(h4occ, 4)}`
      : `Your home and property zone is unoccupied. ${lordNote(lord4, planets, 4)}`,

    mars && `${PLANET_VOICE['Mars']} — the planet that rules land, property and construction in Vedic astrology — sits in your ${HOUSE_MEANING[mars.house]} zone. ${mars.house === 4 ? 'Mars here is a strong indicator of property ownership, possibly multiple properties over your lifetime.' : 'Property timing often aligns with Mars sub-periods or when Mars activates your home zone through its movement.'}`,

    (md === 'Mars' || md === 'Venus' || md === 'Moon')
      ? `Your current ${md} chapter is well-known for property acquisition — buying, building or inheriting a home often happens during this period.`
      : `Watch for Mars, Venus and Moon sub-periods within your current chapter — these most commonly time home purchases and property events.`,
  ].filter(Boolean)
}

function currentYear(planets, current_dasha) {
  const md = current_dasha?.mahadasha
  const ad = current_dasha?.antardasha
  const yr = new Date().getFullYear()
  const mdInfo = DASHA_THEME[md?.lord] || {}
  const adInfo = DASHA_THEME[ad?.lord] || {}

  return [
    md && `In ${yr}, you are living inside your ${md.lord} chapter (running until ${md.end}). The master theme of this entire period: ${mdInfo.short || md.lord}. ${mdInfo.plain || ''}`,

    ad && `Right now, your active sub-period is ${ad.lord} (until ${ad.end}). Think of this as the mood of your days — ${adInfo.short ? adInfo.short + '. ' : ''}${adInfo.plain || ''}`,

    `Important timing tip: The first 3–6 months of any new sub-period are when the planetary energy is freshest and most potent. Front-load your most important decisions, launches and new beginnings into that window.`,

    `For ${yr} specifically: the universe is actively developing the themes of your ${md?.lord} chapter in your life. Lean into what ${md?.lord} governs rather than swimming against that current.`,
  ].filter(Boolean)
}

function education(ls, planets, hm) {
  const h5occ = inHouse(hm, 5)
  const mercury = pdata(planets, 'Mercury')
  const jupiter = pdata(planets, 'Jupiter')

  return [
    h5occ.length
      ? `Your intelligence and education zone carries ${h5occ.join(' and ')} — ${qualityDesc(h5occ, 5)}`
      : `Your intelligence zone is unoccupied. ${lordNote(houseLord(ls,5), planets, 5)}`,

    mercury && `${PLANET_VOICE['Mercury']} sits in your ${HOUSE_MEANING[mercury.house]} zone. Mercury shapes how your mind processes information, how you communicate and how you learn. ${['Gemini','Virgo'].includes(mercury.sign) ? 'In its own sign, Mercury gives exceptional analytical sharpness and the ability to communicate complex ideas simply.' : `Your thinking adapts ${mercury.sign} qualities — you learn and communicate through that lens.`}`,

    jupiter && `Jupiter — ${PLANET_VOICE['Jupiter']} — casts its blessing wherever it looks in your chart. Where Jupiter sends its positive gaze, knowledge, wisdom and growth flow naturally.`,

    `Mercury and Jupiter sub-periods are the best windows for formal education, certifications, writing projects and intellectual growth. These are the times when your mind is sharpest and learning sticks.`,
  ].filter(Boolean)
}

function dharma(lagna, planets, hm) {
  const ketu = pdata(planets, 'Ketu')
  const rahu = pdata(planets, 'Rahu')
  const h9occ = inHouse(hm, 9)
  const jupiter = pdata(planets, 'Jupiter')

  return [
    `Your rising sign — ${lagna?.sign} — is the soul's chosen way of experiencing life this time around. The qualities of ${lagna?.sign} are both your greatest natural gifts and the lessons your soul came here to deepen.`,

    rahu && ketu && `Your soul's axis runs between two points: ${PLANET_VOICE['Ketu']} sits in your ${HOUSE_MEANING[ketu.house]} zone — this represents what your soul has already mastered in past lifetimes. It comes naturally to you, almost effortlessly. The other end, ${PLANET_VOICE['Rahu']}, sits in your ${HOUSE_MEANING[rahu.house]} zone — this is what your soul came here to grow into. It may feel unfamiliar or even uncomfortable, but moving toward it is moving toward your highest purpose.`,

    h9occ.length
      ? `Your zone of fortune, wisdom and higher purpose carries ${h9occ.join(' and ')} — a significant placement that shapes your spiritual philosophy, relationship with teachers and father figures, and your underlying sense of meaning.`
      : `Your fortune and wisdom zone is unoccupied, which means your life philosophy and spiritual path express themselves through the planet that governs this zone and through Jupiter.`,

    jupiter && `Jupiter — ${PLANET_VOICE['Jupiter']} — sits in your ${HOUSE_MEANING[jupiter.house]} zone. This is your wisdom anchor in life. The themes of this house are where grace, abundance and meaning flow most naturally — lean into it.`,
  ].filter(Boolean)
}

/* ── Hindi generators ────────────────────────────────────── */

function careerHi(ls, planets, hm, md, ad) {
  const occ = inHouse(hm, 10); const lord = houseLord(ls, 10)
  const sun = pdata(planets, 'Sun'); const sat = pdata(planets, 'Saturn')
  const mdInfo = DASHA_THEME_HI[md] || {}
  const occHi = occ.map(pHi)
  return [
    occ.length
      ? `आपके करियर क्षेत्र में ${occHi.join(' और ')} हैं — ${qualityDescHi(occ, 10)} ${occ.map(p => PLANET_VOICE_HI[p]).join(' और ')} आपके पेशेवर जीवन को आकार देते हैं।`
      : `आपका करियर क्षेत्र खाली है। ${lordNoteHi(lord, planets, 10)}`,
    md && `अभी आप ${pHi(md)} की महादशा में हैं — ${mdInfo.short || md} का काल। ${mdInfo.plain || ''} ${(md === 'Saturn' || md === 'Sun' || md === 'Jupiter') ? 'यह काल सीधे करियर की उन्नति से जुड़ा है।' : `करियर में बदलाव ${pHi(md)} के प्रभाव से अप्रत्यक्ष रूप से आते हैं।`}`,
    sun && `${PLANET_VOICE_HI['Sun']} आपके ${HOUSE_MEANING_HI[sun.house]} क्षेत्र में हैं। यहीं आप स्वाभाविक रूप से चमकते और पहचाने जाते हैं।`,
    sat && `${PLANET_VOICE_HI['Saturn']} ${HOUSE_MEANING_HI[sat.house]} क्षेत्र में हैं। शनि यहाँ धीरे-धीरे लेकिन स्थायी परिणाम देता है — यहाँ लगाई मेहनत कभी व्यर्थ नहीं जाती।`,
  ].filter(Boolean)
}

function wealthHi(ls, planets, hm, md) {
  const h2occ = inHouse(hm, 2); const h11occ = inHouse(hm, 11)
  const jupiter = pdata(planets, 'Jupiter'); const mdInfo = DASHA_THEME_HI[md] || {}
  return [
    h2occ.length ? `आपके धन-संचय क्षेत्र में ${h2occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h2occ, 2)}` : `धन-संचय क्षेत्र खाली है। ${lordNoteHi(houseLord(ls,2), planets, 2)}`,
    h11occ.length ? `आपकी आय-लाभ क्षेत्र में ${h11occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h11occ, 11)}` : `आय-लाभ क्षेत्र खाली है। ${lordNoteHi(houseLord(ls,11), planets, 11)}`,
    md && `${(md === 'Venus' || md === 'Jupiter' || md === 'Mercury') ? `आपकी ${pHi(md)} महादशा 120 वर्ष के चक्र में सबसे अधिक आर्थिक उत्पादक काल है — निवेश करें, बचत बढ़ाएं और अभी धन बनाएं।` : `${pHi(md)} महादशा मुख्य धन-काल नहीं है, लेकिन सक्रिय अंतर्दशा से लाभ मिलता रहता है।`}`,
    jupiter && `${PLANET_VOICE_HI['Jupiter']} आपके ${HOUSE_MEANING_HI[jupiter.house]} क्षेत्र में हैं — यह आपके जीवन के वित्तीय संरक्षक हैं। गुरु जहाँ भी दृष्टि डालते हैं, वहाँ समृद्धि का आशीर्वाद रहता है।`,
  ].filter(Boolean)
}

function marriageHi(ls, planets, hm, md) {
  const h7occ = inHouse(hm, 7); const lord7 = houseLord(ls, 7)
  const venus = pdata(planets, 'Venus'); const jupiter = pdata(planets, 'Jupiter')
  return [
    h7occ.length
      ? `आपके विवाह और साझेदारी क्षेत्र में ${h7occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h7occ, 7)}`
      : `विवाह क्षेत्र खाली है — ${pHi(lord7)} इसे शासित करते हैं। ${lordNoteHi(lord7, planets, 7)}`,
    venus && `${PLANET_VOICE_HI['Venus']} आपके ${HOUSE_MEANING_HI[venus.house]} क्षेत्र में हैं। शुक्र बताता है कि आप जीवनसाथी में क्या खोजते हैं — ${sHi(venus.sign)} के गुण वाला साथी आपको आकर्षित करता है।`,
    jupiter && `${PLANET_VOICE_HI['Jupiter']} आपके ${HOUSE_MEANING_HI[jupiter.house]} क्षेत्र में हैं। जब गुरु अपनी महादशा या अंतर्दशा में विवाह क्षेत्र को सक्रिय करते हैं, तब विवाह का सबसे स्पष्ट अवसर बनता है।`,
    (md === 'Venus' || md === 'Jupiter') ? `आपकी ${pHi(md)} महादशा विवाह और गहरे प्रेम संबंध के लिए परंपरागत रूप से सबसे शुभ काल है।` : `${pHi(md)} महादशा में शुक्र और गुरु की अंतर्दशा देखें — ये विवाह का समय निर्धारित करती हैं।`,
  ].filter(Boolean)
}

function childrenHi(ls, planets, hm, md) {
  const h5occ = inHouse(hm, 5); const lord5 = houseLord(ls, 5)
  const jupiter = pdata(planets, 'Jupiter')
  return [
    h5occ.length ? `आपके संतान, रचनात्मकता और बुद्धि क्षेत्र में ${h5occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h5occ, 5)}` : `यह क्षेत्र खाली है। ${lordNoteHi(lord5, planets, 5)}`,
    jupiter && `${PLANET_VOICE_HI['Jupiter']} वैदिक ज्योतिष में संतान के लिए सबसे महत्वपूर्ण ग्रह हैं। वे आपके ${HOUSE_MEANING_HI[jupiter.house]} क्षेत्र में हैं — उनकी दृष्टि जहाँ भी जाती है, वहाँ प्रजनन शक्ति और आशीर्वाद आता है।`,
    md === 'Jupiter' ? `आप अभी गुरु की महादशा में हैं — यह संतान के आशीर्वाद के लिए सबसे उपयुक्त काल है।` : `${pHi(md)} महादशा में गुरु की अंतर्दशा संतान के लिए प्रमुख समय-संकेत देती है।`,
    `आपकी रचनात्मकता और बुद्धिमत्ता गुरु और सूर्य की अंतर्दशाओं में सबसे अधिक प्रकाशित होती है।`,
  ].filter(Boolean)
}

function healthHi(ls, planets, hm, md) {
  const h1occ = inHouse(hm, 1); const h6occ = inHouse(hm, 6)
  const sun = pdata(planets, 'Sun')
  return [
    h1occ.length
      ? `आपके व्यक्तित्व और शारीरिक ऊर्जा क्षेत्र में ${h1occ.map(pHi).join(' और ')} हैं। ${h1occ.some(p => BENEFICS.has(p)) ? 'यहाँ शुभ ग्रह की उपस्थिति आपकी रोग प्रतिरोधक क्षमता और शरीर को प्राकृतिक रूप से मजबूत बनाती है।' : 'यह प्रबल संविधान देता है — अनुशासित जीवनशैली आपकी सबसे बड़ी स्वास्थ्य शक्ति है।'}`
      : `लग्न स्वच्छ है — शरीर की संरचना मुख्यतः लग्न राशि और उसके स्वामी से देखी जाती है।`,
    h6occ.length ? `रोग-बाधा क्षेत्र में ${h6occ.map(pHi).join(' और ')} हैं। ${h6occ.some(p => MALEFICS.has(p)) ? 'यहाँ क्रूर ग्रह वास्तव में रोग प्रतिरोधक शक्ति बढ़ाते हैं — आप चुनौतियों से उबरने में सक्षम हैं।' : 'शुभ ग्रह यहाँ हों तो नियमित स्वास्थ्य देखभाल विशेष रूप से महत्वपूर्ण है।'}` : '',
    sun && `${PLANET_VOICE_HI['Sun']} आपके ${HOUSE_MEANING_HI[sun.house]} क्षेत्र में हैं। सूर्य जीवन शक्ति और हृदय को नियंत्रित करते हैं।`,
    `शनि और राहु की अंतर्दशाओं में स्वास्थ्य पर विशेष ध्यान दें — नियमित जाँच और सतर्क जीवनशैली इन समयों में सबसे बुद्धिमानी है।`,
  ].filter(Boolean)
}

function foreignHi(ls, planets, hm, md, ad, lk) {
  const h12occ = inHouse(hm, 12); const rahu = pdata(planets, 'Rahu')
  return [
    lk?.foreign_indicator ? `आपकी कुंडली में लाल किताब के अनुसार विदेश का स्पष्ट संकेत है — इस जन्म में विदेश में रहना या काम करना कर्मिक रूप से समर्थित है।` : `विदेश यात्रा संभव है; स्थायी बसावट के लिए विशेष ग्रहीय योग की आवश्यकता होगी।`,
    rahu && `${PLANET_VOICE_HI['Rahu']} आपके ${HOUSE_MEANING_HI[rahu.house]} क्षेत्र में हैं। राहु विदेशी संबंधों और अप्रत्याशित अंतरराष्ट्रीय अवसरों का सबसे शक्तिशाली ग्रह है। ${[9,12,3].includes(rahu.house) ? 'यह स्थान विदेश में जीवन के लिए एक क्लासिक संकेत है।' : 'राहु की महादशा या अंतर्दशा में विदेशी अवसर अचानक और तीव्रता से आते हैं।'}`,
    h12occ.length ? `विदेश-मुक्ति क्षेत्र में ${h12occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h12occ, 12)}` : `यह क्षेत्र खाली है। ${lordNoteHi(houseLord(ls,12), planets, 12)}`,
    (md === 'Rahu' || ad === 'Rahu') ? `आप अभी राहु की महादशा/अंतर्दशा में हैं — वीजा, विदेश बसावट और अंतरराष्ट्रीय करियर के लिए यह सबसे शक्तिशाली खिड़की है।` : `${pHi(md)} महादशा में जब राहु की अंतर्दशा आएगी, तब विदेशी अवसर तेज गति से बढ़ेंगे।`,
  ].filter(Boolean)
}

function propertyHi(ls, planets, hm, md) {
  const h4occ = inHouse(hm, 4); const lord4 = houseLord(ls, 4)
  const mars = pdata(planets, 'Mars')
  return [
    h4occ.length ? `आपके घर और संपत्ति क्षेत्र में ${h4occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h4occ, 4)}` : `यह क्षेत्र खाली है। ${lordNoteHi(lord4, planets, 4)}`,
    mars && `${PLANET_VOICE_HI['Mars']} — भूमि और संपत्ति के कारक ग्रह — आपके ${HOUSE_MEANING_HI[mars.house]} क्षेत्र में हैं। ${mars.house === 4 ? 'मंगल यहाँ स्वयं संपत्ति का बलशाली संकेत है — जीवन में एक से अधिक संपत्ति की संभावना है।' : 'संपत्ति का समय प्रायः मंगल की अंतर्दशा या मंगल के गृह क्षेत्र पर गोचर से तय होता है।'}`,
    (md === 'Mars' || md === 'Venus' || md === 'Moon') ? `${pHi(md)} महादशा संपत्ति खरीद और घर बसाने के लिए जानी जाती है।` : `मंगल, शुक्र और चंद्र की अंतर्दशाएं घर-खरीद की घटनाओं को सबसे अधिक समय देती हैं।`,
  ].filter(Boolean)
}

function currentYearHi(planets, current_dasha) {
  const md = current_dasha?.mahadasha; const ad = current_dasha?.antardasha
  const yr = new Date().getFullYear()
  const mdInfo = DASHA_THEME_HI[md?.lord] || {}; const adInfo = DASHA_THEME_HI[ad?.lord] || {}
  return [
    md && `${yr} में आप ${pHi(md.lord)} महादशा में हैं (${md.end} तक)। इस पूरे काल का मुख्य विषय: ${mdInfo.short || md.lord}। ${mdInfo.plain || ''}`,
    ad && `अभी सक्रिय अंतर्दशा: ${pHi(ad.lord)} (${ad.end} तक)। यह आपके दैनिक जीवन की भावना है — ${adInfo.short ? adInfo.short + '। ' : ''}${adInfo.plain || ''}`,
    `महत्वपूर्ण समय-संकेत: किसी भी नई अंतर्दशा के पहले 3-6 महीने सबसे ऊर्जावान होते हैं। बड़े निर्णय और नई शुरुआत उसी खिड़की में करें।`,
    `${yr} में ब्रह्मांड आपके ${pHi(md?.lord)} महादशा के विषयों को विकसित कर रहा है — उस प्रवाह के साथ चलें, उसके विरुद्ध नहीं।`,
  ].filter(Boolean)
}

function educationHi(ls, planets, hm) {
  const h5occ = inHouse(hm, 5); const mercury = pdata(planets, 'Mercury'); const jupiter = pdata(planets, 'Jupiter')
  return [
    h5occ.length ? `बुद्धि और शिक्षा क्षेत्र में ${h5occ.map(pHi).join(' और ')} हैं — ${qualityDescHi(h5occ, 5)}` : `यह क्षेत्र खाली है। ${lordNoteHi(houseLord(ls,5), planets, 5)}`,
    mercury && `${PLANET_VOICE_HI['Mercury']} आपके ${HOUSE_MEANING_HI[mercury.house]} क्षेत्र में हैं। बुध यह बताता है कि आप कैसे सोचते, सीखते और संवाद करते हैं। ${['Gemini','Virgo'].includes(mercury.sign) ? 'अपनी राशि में बुध — असाधारण विश्लेषण और संचार क्षमता।' : `आपका मन ${sHi(mercury.sign)} के गुणों को सीखने और संवाद में लागू करता है।`}`,
    jupiter && `${PLANET_VOICE_HI['Jupiter']} अपनी दृष्टि से जहाँ भी देखते हैं, वहाँ ज्ञान और विकास का आशीर्वाद बरसाते हैं।`,
    `बुध और गुरु की अंतर्दशाएं औपचारिक शिक्षा, प्रमाणपत्र, लेखन और बौद्धिक विकास के लिए सर्वश्रेष्ठ समय हैं।`,
  ].filter(Boolean)
}

function dharmaHi(lagna, planets, hm) {
  const ketu = pdata(planets, 'Ketu'); const rahu = pdata(planets, 'Rahu')
  const h9occ = inHouse(hm, 9); const jupiter = pdata(planets, 'Jupiter')
  return [
    `आपकी ${sHi(lagna?.sign)} लग्न इस जन्म में आत्मा का चुना हुआ मार्ग है। ${sHi(lagna?.sign)} के गुण आपकी सबसे बड़ी प्राकृतिक शक्तियाँ और आत्मा के इस जन्म के पाठ दोनों हैं।`,
    rahu && ketu && `आपकी आत्मा का अक्ष: ${PLANET_VOICE_HI['Ketu']} ${HOUSE_MEANING_HI[ketu.house]} क्षेत्र में हैं — यह पूर्वजन्म की महारत है जो सहजता से आती है। ${PLANET_VOICE_HI['Rahu']} ${HOUSE_MEANING_HI[rahu.house]} क्षेत्र में हैं — यह इस जन्म का विकास-मार्ग है। भले ही अपरिचित लगे, इस दिशा में बढ़ना ही आपका सर्वोच्च उद्देश्य है।`,
    h9occ.length ? `भाग्य, ज्ञान और उच्च उद्देश्य क्षेत्र में ${h9occ.map(pHi).join(' और ')} हैं — यह आपके जीवन दर्शन और गुरुओं से संबंध को गहराई से आकार देता है।` : `यह क्षेत्र खाली है — आपका धर्म नवम स्वामी की यात्रा और गुरु के माध्यम से व्यक्त होता है।`,
    jupiter && `${PLANET_VOICE_HI['Jupiter']} आपके ${HOUSE_MEANING_HI[jupiter.house]} क्षेत्र में हैं — यह आपके जीवन का ज्ञान-आधार है। इस घर के विषयों में कृपा, अर्थ और विस्तार सबसे स्वाभाविक रूप से प्रवाहित होते हैं।`,
  ].filter(Boolean)
}

/* ── Main export ─────────────────────────────────────────── */
export function generateAllReadings(lagna, planets, house_map, current_dasha, lal_kitab, lang = 'en') {
  const ls = lagna?.sign || 'Aries'
  const md = current_dasha?.mahadasha?.lord
  const ad = current_dasha?.antardasha?.lord
  const hi = lang === 'hi'

  const topics = hi ? [
    { id:'career',    icon:'⚡', title:'करियर और व्यवसाय',          lines: careerHi(ls, planets, house_map, md, ad) },
    { id:'wealth',    icon:'◎', title:'धन और आर्थिक लाभ',           lines: wealthHi(ls, planets, house_map, md) },
    { id:'marriage',  icon:'♥', title:'प्रेम और विवाह',              lines: marriageHi(ls, planets, house_map, md) },
    { id:'children',  icon:'✦', title:'संतान और रचनात्मकता',         lines: childrenHi(ls, planets, house_map, md) },
    { id:'health',    icon:'◑', title:'स्वास्थ्य और जीवन शक्ति',    lines: healthHi(ls, planets, house_map, md) },
    { id:'foreign',   icon:'✈', title:'विदेश यात्रा और बसावट',       lines: foreignHi(ls, planets, house_map, md, ad, lal_kitab) },
    { id:'property',  icon:'⌂', title:'संपत्ति और घर',               lines: propertyHi(ls, planets, house_map, md) },
    { id:'year',      icon:'◷', title:`${new Date().getFullYear()} भविष्यवाणी`, lines: currentYearHi(planets, current_dasha) },
    { id:'education', icon:'◈', title:'शिक्षा और बुद्धि',            lines: educationHi(ls, planets, house_map) },
    { id:'dharma',    icon:'∞', title:'जीवन उद्देश्य और धर्म',       lines: dharmaHi(lagna, planets, house_map) },
  ] : [
    { id:'career',    icon:'⚡', title:'Career & Profession',        lines: career(ls, planets, house_map, md, ad) },
    { id:'wealth',    icon:'◎', title:'Wealth & Financial Gains',    lines: wealth(ls, planets, house_map, md) },
    { id:'marriage',  icon:'♥', title:'Love & Marriage',             lines: marriage(ls, planets, house_map, md) },
    { id:'children',  icon:'✦', title:'Children & Creativity',       lines: children(ls, planets, house_map, md) },
    { id:'health',    icon:'◑', title:'Health & Vitality',           lines: health(ls, planets, house_map, md) },
    { id:'foreign',   icon:'✈', title:'Foreign Travel & Settlement', lines: foreign(ls, planets, house_map, md, ad, lal_kitab) },
    { id:'property',  icon:'⌂', title:'Property & Home',             lines: property(ls, planets, house_map, md) },
    { id:'year',      icon:'◷', title:`${new Date().getFullYear()} Forecast`, lines: currentYear(planets, current_dasha) },
    { id:'education', icon:'◈', title:'Education & Intelligence',    lines: education(ls, planets, house_map) },
    { id:'dharma',    icon:'∞', title:'Life Purpose & Dharma',       lines: dharma(lagna, planets, house_map) },
  ]

 
  return topics
}
