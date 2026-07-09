import { useState, useRef, useCallback } from 'react'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

// ── Style objects (match Varshphal.jsx exactly) ────────────────────────────────
const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 18, padding: '1.4rem 1.6rem', marginBottom: '1rem',
  backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  boxShadow: 'var(--shadow-card)',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
}
const inp = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}

// ── Categories ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Animals', 'Nature', 'People & Body', 'Objects', 'Actions', 'Places', 'Emotions', 'Spiritual']

// ── Dream symbol data ──────────────────────────────────────────────────────────
const DREAMS = [
  // ANIMALS
  { id:1, symbol:'Snake', category:'Animals', icon:'🐍',
    brief:'Transformation, hidden fears, or Kundalini energy rising.',
    vedic:'The serpent (Naga) is sacred — represents Kundalini shakti, divine protection, and rebirth. Dreaming of a snake often signals a spiritual awakening or a major life transformation.',
    psych:'Represents repressed desires, fears, or a threatening situation. Carl Jung saw it as the shadow self.',
    positive:'Healing, spiritual power, shedding the old self, protection from enemies.',
    negative:'Hidden betrayal, health warning, suppressed anger, deception by someone close.',
    related:['Water','Pit','Cave','Temple'] },
  { id:2, symbol:'Dog', category:'Animals', icon:'🐕',
    brief:'Loyalty, friendship, or protection.',
    vedic:'Dogs are associated with Bhairava (a form of Shiva). A friendly dog signals divine protection; an angry dog warns of an enemy.',
    psych:'Represents loyalty, friendship, or the instinct to protect and serve.',
    positive:'Faithful friends, a loyal ally, protection, companionship.',
    negative:'Betrayal by a trusted friend, aggression, feeling threatened.',
    related:['House','Guardian','Chase'] },
  { id:3, symbol:'Cat', category:'Animals', icon:'🐈',
    brief:'Intuition, independence, mystery, or feminine energy.',
    vedic:'Cats are linked to Maya (illusion) and the goddess energy. A black cat may signal hidden forces at work.',
    psych:'Represents feminine energy, independence, and intuitive knowing.',
    positive:'Heightened intuition, creative freedom, self-sufficiency.',
    negative:'Deception, illusion, something hidden from view.',
    related:['Night','Moon','Shadow'] },
  { id:4, symbol:'Elephant', category:'Animals', icon:'🐘',
    brief:"Ganesha's blessings, wisdom, power, and obstacle removal.",
    vedic:'The elephant is Ganesha himself — a dream of an elephant is one of the most auspicious in Vedic tradition, signalling the removal of obstacles and divine grace.',
    psych:'Represents memory, strength, endurance, and wisdom.',
    positive:'Major obstacles removed, wisdom, success, blessings from elders.',
    negative:'Feeling overwhelmed by a situation that requires patience.',
    related:['Temple','Forest','River'] },
  { id:5, symbol:'Bird', category:'Animals', icon:'🐦',
    brief:'Freedom, messages from the divine, or the soul in flight.',
    vedic:"Birds are messengers of the gods. Garuda (eagle) represents Vishnu's power. A bird flying freely indicates liberation; a caged bird signals restriction.",
    psych:'Represents the desire for freedom, transcendence, or spiritual aspiration.',
    positive:'Freedom, divine messages, good news, spiritual elevation.',
    negative:'Trapped aspirations, communication blocked, soul restlessness.',
    related:['Sky','Flight','Cage','Tree'] },
  { id:6, symbol:'Cow', category:'Animals', icon:'🐄',
    brief:'Prosperity, nourishment, divine motherhood (Kamadhenu).',
    vedic:'The cow is Kamadhenu — the wish-fulfilling divine mother. A dream of a healthy cow brings abundance and maternal blessings.',
    psych:'Nourishment, generosity, patience, and maternal care.',
    positive:'Wealth, abundance, maternal love, contentment.',
    negative:"Neglecting one's duties or health; feeling drained.",
    related:['Farm','Milk','Mother'] },
  { id:7, symbol:'Lion', category:'Animals', icon:'🦁',
    brief:'Courage, royalty, ego, or a powerful authority figure.',
    vedic:'The lion is the vehicle (vahana) of Goddess Durga — power, courage, and divine protection. Dreaming of riding a lion is extremely auspicious.',
    psych:'Represents authority, pride, raw power, or the ego.',
    positive:'Leadership, courage, victory over enemies, royal status.',
    negative:'Arrogance, being dominated, fear of a powerful person.',
    related:['Jungle','Throne','Battle'] },
  { id:8, symbol:'Fish', category:'Animals', icon:'🐟',
    brief:'Abundance, fertility, the subconscious, spiritual merit.',
    vedic:"Fish (Matsya) is Vishnu's first avatar. Fish in water signals abundance, fertility, and spiritual reward. Two fish together is Revati nakshatra's symbol.",
    psych:'The depths of the unconscious, fertility, and emotional richness.',
    positive:'Financial gain, fertility, emotional depth, spiritual blessing.',
    negative:'Feeling out of your depth, something slipping away.',
    related:['Water','Ocean','River','Net'] },
  { id:9, symbol:'Horse', category:'Animals', icon:'🐎',
    brief:'Speed, power, vitality, journey, or sexual energy.',
    vedic:'The horse (Ashwa) symbolises solar energy, speed, and royal power. Ashwini nakshatras are the twin horse-headed healers. A white horse in dreams is highly auspicious.',
    psych:'Vitality, libido, freedom, and the drive to move forward.',
    positive:'Journey ahead, vitality, swift success, freedom.',
    negative:'Uncontrolled desires, recklessness, aggression.',
    related:['Race','Journey','White'] },

  // NATURE
  { id:10, symbol:'Water', category:'Nature', icon:'💧',
    brief:'Emotions, the subconscious, purification, or spiritual flow.',
    vedic:'Water (Jal) is one of the Pancha Bhutas. Sacred rivers like Ganga represent liberation. Clear water is auspicious; turbulent water signals emotional storms.',
    psych:'Represents the unconscious mind, emotions, and the depths of the psyche.',
    positive:'Emotional healing, purification, clarity, spiritual flow.',
    negative:'Emotional overwhelm, drowning in feelings, repressed trauma.',
    related:['River','Ocean','Rain','Well'] },
  { id:11, symbol:'Fire', category:'Nature', icon:'🔥',
    brief:'Transformation, purification, passion, or destruction.',
    vedic:'Agni is the divine fire, witness of all sacred rites. Fire in dreams signals transformation, divine presence, or a powerful inner force seeking expression.',
    psych:'Passion, creativity, anger, or the drive to transform and destroy the old.',
    positive:'Purification, spiritual fire, creative energy, power.',
    negative:'Uncontrolled rage, destruction, burnout, aggression.',
    related:['Sun','Torch','Lamp','Ash'] },
  { id:12, symbol:'Rain', category:'Nature', icon:'🌧️',
    brief:'Blessings from above, emotional release, or purification.',
    vedic:"Rain is Indra's gift — a highly auspicious symbol of divine blessing, abundance, and the answering of prayers.",
    psych:'Emotional release, cleansing, sadness washing away, renewal.',
    positive:'Abundance, blessing, emotional release, fresh start.',
    negative:'Depression, feeling overwhelmed, unshed grief.',
    related:['Water','Cloud','Rainbow','Flood'] },
  { id:13, symbol:'Mountain', category:'Nature', icon:'⛰️',
    brief:'Spiritual aspiration, obstacles, or a great challenge ahead.',
    vedic:'Mountains (Parvata) are the abode of the gods — Kailash for Shiva, Meru for the cosmos. Climbing a mountain signals spiritual ascent.',
    psych:'Ambition, a major challenge, or an obstacle that must be overcome.',
    positive:'Spiritual growth, ambition fulfilled, stability, divine connection.',
    negative:'Feeling blocked, an overwhelming obstacle, isolation.',
    related:['Climbing','Cave','Snow','Temple'] },
  { id:14, symbol:'Tree', category:'Nature', icon:'🌳',
    brief:'Life, family lineage, stability, or spiritual shelter.',
    vedic:'The Ashvattha (Peepal) tree is sacred to Vishnu. A lush tree signals family prosperity; a withered tree signals a health concern for an elder.',
    psych:'The family tree, personal growth, the self rooted in the unconscious.',
    positive:'Family harmony, personal growth, shelter, long life.',
    negative:'Family conflict, uprooting, loss of stability.',
    related:['Forest','Roots','Fruit','Shadow'] },
  { id:15, symbol:'Sun', category:'Nature', icon:'☀️',
    brief:'Consciousness, authority, father, vitality, or divine grace.',
    vedic:'Surya is the visible deity — consciousness, truth, and the father principle. A bright sun in dreams signals fame, authority, and vitality.',
    psych:'The ego, consciousness, authority figures, and the father.',
    positive:'Recognition, vitality, clarity, paternal blessing.',
    negative:'Ego inflation, harsh authority, overbearing father energy.',
    related:['Light','Dawn','Gold','Fire'] },
  { id:16, symbol:'Moon', category:'Nature', icon:'🌙',
    brief:'Emotions, the mother, intuition, cycles, or the subconscious.',
    vedic:'Chandra governs the mind, emotions, and the mother. A full moon is auspicious; a new moon signals introspection and new beginnings.',
    psych:'The unconscious, feminine principle, emotional cycles, and intuition.',
    positive:'Emotional healing, intuition, feminine power, inner peace.',
    negative:'Emotional instability, illusion, mental disturbance.',
    related:['Night','Ocean','Silver','Star'] },
  { id:17, symbol:'Ocean', category:'Nature', icon:'🌊',
    brief:'The vastness of the unconscious, infinite potential, or overwhelm.',
    vedic:'The cosmic ocean (Kshirasagara) is where Vishnu rests — infinite potential and the source of creation. Dreaming of a calm ocean is deeply auspicious.',
    psych:'The collective unconscious, emotional depth, and infinite potential.',
    positive:'Spiritual vastness, abundance, liberation, deep peace.',
    negative:'Feeling lost, overwhelmed by emotions, fear of the unknown.',
    related:['Water','Ship','Drowning','Fish'] },
  { id:18, symbol:'Flower', category:'Nature', icon:'🌸',
    brief:'Beauty, purity, devotion, new beginnings, or fleeting joy.',
    vedic:'Lotus (Padma) is the symbol of purity and enlightenment — Lakshmi, Brahma, and Saraswati are seated on it. Any flower in a dream signals beauty and auspiciousness.',
    psych:'Blossoming potential, beauty, sexuality, and the ephemeral nature of life.',
    positive:'New beginnings, beauty, love, devotion, divine grace.',
    negative:'Fleeting happiness, impermanence, wasted potential.',
    related:['Garden','Lotus','Gift','Spring'] },

  // PEOPLE & BODY
  { id:19, symbol:'Mother', category:'People & Body', icon:'👩',
    brief:'Nurturing, unconditional love, home, or the divine feminine.',
    vedic:'The mother is Devi herself — a dream of your mother is a sign of divine protection and care. If she is distressed, attend to her wellbeing in waking life.',
    psych:'The nurturing principle, emotional security, early childhood, and unconditional love.',
    positive:'Divine protection, emotional security, love, home.',
    negative:'Unresolved mother issues, guilt, need for nurturing.',
    related:['Home','Child','Moon','Food'] },
  { id:20, symbol:'Father', category:'People & Body', icon:'👨',
    brief:'Authority, discipline, protection, or the conscious mind.',
    vedic:'The father is linked to Surya (Sun) — authority, discipline, and dharma. A dream of a deceased father often carries ancestral wisdom.',
    psych:'The authority principle, the superego, rules, and the father complex.',
    positive:'Guidance, protection, wisdom, blessing from elders.',
    negative:'Harsh authority, unresolved conflict, need for approval.',
    related:['Sun','Work','Rule','Ancestor'] },
  { id:21, symbol:'Baby / Child', category:'People & Body', icon:'👶',
    brief:'New beginnings, innocence, a new project, or vulnerability.',
    vedic:'A healthy baby in dreams is extremely auspicious — signals new ventures, fertility, and divine blessing. Baby Krishna represents pure divine consciousness.',
    psych:'The inner child, new projects, innocence, or a vulnerable part of yourself.',
    positive:'New beginning, creativity, fertility, joy, fresh start.',
    negative:'Feeling helpless, an unfinished project, vulnerability.',
    related:['Birth','Family','Innocence','Future'] },
  { id:22, symbol:'Dead Person / Ancestor', category:'People & Body', icon:'👴',
    brief:'Ancestral messages, unfinished karma, or inner wisdom.',
    vedic:'Pitru (ancestors) communicate through dreams. A deceased relative appearing peacefully signals their blessing; appearing distressed signals unpaid karmic debts requiring Pitru Tarpan.',
    psych:'The shadow self, unresolved grief, messages from the unconscious.',
    positive:'Ancestral blessing, guidance, karmic resolution, wisdom.',
    negative:'Unresolved grief, karmic debt, warning from beyond.',
    related:['Temple','River','Night','Ancestor'] },
  { id:23, symbol:'Teeth Falling', category:'People & Body', icon:'🦷',
    brief:'Anxiety about appearance, loss of power, or life change.',
    vedic:'Teeth represent vitality and speech. Falling teeth in dreams can signal health concerns for a family member or a significant life transition.',
    psych:'One of the most universal dream symbols — anxiety, loss of control, fear of ageing.',
    positive:'Shedding the old to make way for growth (rare, context-dependent).',
    negative:'Anxiety, loss of power, health concerns, fear of embarrassment.',
    related:['Mouth','Mirror','Falling','Face'] },
  { id:24, symbol:'Hair', category:'People & Body', icon:'💇',
    brief:'Strength, identity, spiritual power, or social status.',
    vedic:"Hair (Kesh) represents life force — Shiva's matted locks hold the Ganga. Cutting hair in dreams may signal loss of power or a significant transition.",
    psych:'Identity, personal power, sexuality, and social presentation.',
    positive:'Spiritual power, personal strength, abundant vitality.',
    negative:'Loss of identity, powerlessness, grief (many traditions cut hair in mourning).',
    related:['Head','Scissors','Crown','Strength'] },

  // OBJECTS
  { id:25, symbol:'Gold', category:'Objects', icon:'🥇',
    brief:'Wealth, divine energy, purity, or solar power.',
    vedic:"Gold (Suvarna) is Lakshmi's element — wealth, purity, and divine grace. Dreaming of gold is highly auspicious for financial matters.",
    psych:'The highest value, achievement, the Self (Jung), and potential.',
    positive:'Financial gain, recognition, spiritual gold, achieving your potential.',
    negative:"Greed, materialism, fool's gold — something that glitters but misleads.",
    related:['Temple','Sun','Treasure','Lakshmi'] },
  { id:26, symbol:'Key', category:'Objects', icon:'🔑',
    brief:'Access, solution, hidden knowledge, or authority.',
    vedic:'Keys represent the unlocking of divine mysteries. A golden key signals access to spiritual knowledge; a broken key signals a blocked opportunity.',
    psych:'The solution to a problem, access to a new life chapter, or repressed knowledge.',
    positive:'Opportunity unlocked, solution found, access to power.',
    negative:'Locked doors, missing opportunities, secrets withheld.',
    related:['Door','Lock','House','Secret'] },
  { id:27, symbol:'Mirror', category:'Objects', icon:'🪞',
    brief:'Self-reflection, truth, identity, or illusion.',
    vedic:'The mirror reveals Maya (illusion) — what you see in a mirror in dreams may show your true spiritual state rather than your physical one.',
    psych:'Self-image, narcissism, the desire to know oneself, or the persona.',
    positive:'Self-knowledge, honest reflection, clarity about identity.',
    negative:'Vanity, distorted self-image, fear of the truth.',
    related:['Face','Water','Shadow','Reflection'] },
  { id:28, symbol:'Sword', category:'Objects', icon:'⚔️',
    brief:'Discrimination, truth, conflict, or cutting through illusion.',
    vedic:'The sword (Khadga) is wielded by Durga and Kali — it cuts through ignorance and evil. A sword in dreams signals the power of discernment.',
    psych:'Aggression, the power to cut through problems, conflict.',
    positive:'Clarity, cutting through confusion, victory, protection.',
    negative:'Conflict, aggression, a battle ahead.',
    related:['Battle','Fire','Power','Enemy'] },
  { id:29, symbol:'Temple / Church', category:'Objects', icon:'🛕',
    brief:'Divine connection, spiritual sanctuary, or inner sacred space.',
    vedic:'A temple in dreams is highly auspicious — the presence of the divine in your life. Entering a clean, bright temple signals answered prayers.',
    psych:'The inner sanctuary, spiritual values, the need for meaning.',
    positive:'Divine blessing, spiritual peace, answered prayers.',
    negative:'Feeling unworthy, spiritual disconnection, religious guilt.',
    related:['God','Prayer','Mountain','Light'] },
  { id:30, symbol:'Money', category:'Objects', icon:'💰',
    brief:'Value, security, power, or worldly concerns.',
    vedic:"Money in dreams reflects your relationship with Lakshmi's energy. Finding money is auspicious; losing money signals caution in financial dealings.",
    psych:"Self-worth, power, security, and the ego's relationship with the material world.",
    positive:'Financial improvement, feeling valued, abundance incoming.',
    negative:'Financial anxiety, greed, feeling undervalued.',
    related:['Gold','Work','Lakshmi','Store'] },

  // ACTIONS
  { id:31, symbol:'Flying', category:'Actions', icon:'🦅',
    brief:'Freedom, transcendence, spiritual elevation, or escapism.',
    vedic:'Flying in dreams (Akasha Gaman) is a sign of spiritual advancement — the soul briefly touching liberation. Associated with yogic siddhis.',
    psych:'Desire for freedom, transcendence of problems, or inflation of the ego.',
    positive:'Spiritual freedom, transcendence, liberation, rising above problems.',
    negative:'Escapism, avoiding ground reality, disconnection from body.',
    related:['Bird','Sky','Cloud','Freedom'] },
  { id:32, symbol:'Falling', category:'Actions', icon:'⬇️',
    brief:'Loss of control, anxiety, or the need to let go and surrender.',
    vedic:'Falling dreams often accompany major life transitions or signal a need to release attachment.',
    psych:'One of the most universal dreams — anxiety, loss of status, fear of failure.',
    positive:'Surrender, letting go, releasing what no longer serves.',
    negative:'Fear of failure, loss of control, anxiety about falling from grace.',
    related:['Height','Fear','Ground','Surrender'] },
  { id:33, symbol:'Running', category:'Actions', icon:'🏃',
    brief:'Pursuit, escape, ambition, or urgent life movement.',
    vedic:'Running toward something signals ambition and divine favour; running away signals avoidance of karma.',
    psych:'Ambition (running toward) or avoidance (running away).',
    positive:'Drive, ambition, momentum, pursuing goals.',
    negative:'Avoidance, running from problems, fear.',
    related:['Chase','Speed','Fear','Goal'] },
  { id:34, symbol:'Swimming', category:'Actions', icon:'🏊',
    brief:'Navigating emotions, moving through the unconscious, or effort.',
    vedic:'Swimming in clear water signals spiritual progress; muddy water signals emotional confusion.',
    psych:"Navigating the unconscious, emotional effort, or moving through life's currents.",
    positive:'Emotional skill, navigating challenges with grace.',
    negative:'Struggling with emotions, feeling out of depth.',
    related:['Water','Ocean','River','Breath'] },
  { id:35, symbol:'Eating', category:'Actions', icon:'🍽️',
    brief:'Nourishment, desire, absorption of knowledge, or greed.',
    vedic:'Eating in dreams reflects what you are absorbing spiritually. Eating sweet food is auspicious; bitter food signals upcoming challenges.',
    psych:'Desire, oral satisfaction, absorbing new ideas, or greed.',
    positive:'Nourishment, satisfaction, abundance, absorbing wisdom.',
    negative:'Greed, overconsumption, emotional eating patterns.',
    related:['Food','Feast','Mother','Hunger'] },

  // PLACES
  { id:36, symbol:'House / Home', category:'Places', icon:'🏠',
    brief:'The self, family, security, or different aspects of your personality.',
    vedic:'The house represents your physical life and family karma. Different rooms represent different aspects of your life.',
    psych:'The psyche itself — different rooms represent different aspects of personality (attic = superego, basement = unconscious).',
    positive:'Security, family harmony, self-knowledge, shelter.',
    negative:'Family conflict, feeling trapped, something hidden in the home.',
    related:['Room','Family','Door','Foundation'] },
  { id:37, symbol:'Forest / Jungle', category:'Places', icon:'🌲',
    brief:'The unconscious, mystery, spiritual testing, or getting lost.',
    vedic:'The forest (Aranya) is the dwelling place of sages and the space of spiritual testing. Many Vedic heroes were tested in the forest.',
    psych:'The unconscious mind, the shadow, or a complex situation requiring navigation.',
    positive:'Spiritual growth, wisdom from solitude, discovery.',
    negative:'Confusion, feeling lost, fear of the unknown.',
    related:['Tree','Animal','Path','Night'] },
  { id:38, symbol:'School / Exam', category:'Places', icon:'🏫',
    brief:'Learning, judgment, performance anxiety, or unfinished lessons.',
    vedic:'School dreams reflect Guru-Shishya (teacher-student) karma — lessons still to be learned.',
    psych:'Performance anxiety, feeling judged, unfinished learning from the past.',
    positive:'Growth, mastery, completing karmic lessons.',
    negative:'Anxiety, unfinished business, feeling unprepared for life.',
    related:['Teacher','Test','Knowledge','Failure'] },
  { id:39, symbol:'Road / Path', category:'Places', icon:'🛣️',
    brief:"Life's journey, direction, choices, or the dharmic path.",
    vedic:'The road in dreams represents your dharma — a clear road signals alignment; a blocked or forked road signals a key decision ahead.',
    psych:"Life's direction, choices, and the journey of the self.",
    positive:'Clear direction, moving forward, dharmic alignment.',
    negative:'Lost direction, blocked path, difficult choice ahead.',
    related:['Journey','Crossroads','Vehicle','Map'] },

  // EMOTIONS
  { id:40, symbol:'Fear', category:'Emotions', icon:'😨',
    brief:'Unprocessed anxiety, shadow material, or a warning signal.',
    vedic:'Fear in dreams often signals a shadow (kali energy) needing to be faced and integrated rather than avoided.',
    psych:'The shadow, repressed material, anxiety, or a survival-level warning.',
    positive:'A call to face your shadow and integrate it.',
    negative:'Unresolved trauma, avoidance, anxiety spiralling.',
    related:['Dark','Chase','Monster','Night'] },
  { id:41, symbol:'Joy / Happiness', category:'Emotions', icon:'😊',
    brief:'Alignment, divine grace, inner wholeness, or wish fulfilment.',
    vedic:'Ananda (bliss) in dreams is a direct taste of the divine — one of the most auspicious experiences.',
    psych:'Integration, wish fulfilment, peak experiences, or the Self communicating.',
    positive:'Spiritual alignment, inner wholeness, joy incoming.',
    negative:'Rare — sometimes signals avoidance of shadow through forced positivity.',
    related:['Light','Sun','Celebration','Love'] },
  { id:42, symbol:'Anger', category:'Emotions', icon:'😡',
    brief:'Blocked energy, injustice, or repressed Martian/fire energy.',
    vedic:'Krodha (anger) in dreams is Mars energy uncontrolled — a signal to channel your drive constructively.',
    psych:'Repressed frustration, violated boundaries, or aggressive shadow energy.',
    positive:'Energy to take action, assert boundaries, fight for justice.',
    negative:'Uncontrolled rage, destructive impulses.',
    related:['Fire','Battle','Injustice','Control'] },

  // SPIRITUAL
  { id:43, symbol:'God / Deity', category:'Spiritual', icon:'🙏',
    brief:'Divine guidance, grace, spiritual protection, or a direct blessing.',
    vedic:'Seeing a deity in dreams (Devata Darshan) is one of the most sacred experiences — a direct message of grace and protection from the divine.',
    psych:'The archetype of the Self, inner wisdom, or a higher guiding principle.',
    positive:'Divine protection, answered prayers, spiritual breakthrough.',
    negative:'Unmet spiritual obligations; a call to deepen practice.',
    related:['Temple','Light','Prayer','Ancestor'] },
  { id:44, symbol:'Lotus', category:'Spiritual', icon:'🪷',
    brief:'Enlightenment, purity, divine beauty rising from darkness.',
    vedic:'The lotus (Padma) is the highest spiritual symbol — purity untouched by the mud. Lakshmi, Brahma, and the chakras are depicted as lotuses.',
    psych:'The Self in Jungian psychology, spiritual individuation, untouched wholeness.',
    positive:'Spiritual awakening, purity, divine grace, enlightenment.',
    negative:'Extremely rare negative meaning — perhaps spirituality used as escapism.',
    related:['Water','Deity','Meditation','Light'] },
  { id:45, symbol:'Light / Radiance', category:'Spiritual', icon:'✨',
    brief:'Consciousness, divine presence, truth, or spiritual awakening.',
    vedic:'Jyoti (divine light) — the presence of the Atman. A blinding light in dreams often signals a moment of samadhi or spiritual breakthrough.',
    psych:'Consciousness, insight, the Self, or an illuminating realisation.',
    positive:'Spiritual breakthrough, clarity, divine presence, truth revealed.',
    negative:'Extremely rare — blinding light without warmth may signal ego inflation.',
    related:['Sun','Candle','Temple','God'] },
  { id:46, symbol:'Meditation', category:'Spiritual', icon:'🧘',
    brief:'Inner peace, spiritual practice, or the call to go within.',
    vedic:'Dreaming of meditation (Dhyana) is a call from your higher self to deepen your practice. Sages appearing in dreams are guides to your inner work.',
    psych:'Integration, the need for stillness, or the call to individuation.',
    positive:'Spiritual depth, inner peace, alignment with higher self.',
    negative:'Avoidance of outer life through excessive inwardness.',
    related:['Sage','Temple','Silence','Light'] },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem',
    }}>{children}</div>
  )
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
        letterSpacing: '2px', textTransform: 'uppercase',
        color: color || GOLD, marginBottom: '0.25rem',
      }}>{label}</div>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>{value}</p>
    </div>
  )
}

function SymbolCard({ dream, isExpanded, isHighlighted, onToggle, cardRef }) {
  return (
    <div
      ref={cardRef}
      style={{
        ...card,
        marginBottom: 0,
        cursor: 'pointer',
        border: isHighlighted
          ? `1px solid ${GOLD}`
          : isExpanded
          ? `1px solid rgba(139,111,232,0.5)`
          : '1px solid var(--border)',
        boxShadow: isHighlighted
          ? `0 0 24px rgba(223,168,79,0.35), var(--shadow-card)`
          : isExpanded
          ? `0 0 20px rgba(139,111,232,0.15), var(--shadow-card)`
          : 'var(--shadow-card)',
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
        transform: isHighlighted ? 'scale(1.025)' : 'none',
        padding: '1.2rem 1.4rem',
      }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{dream.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: '1rem', fontWeight: 600,
              color: 'var(--text-primary)', lineHeight: 1.2,
            }}>{dream.symbol}</div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.56rem',
              letterSpacing: '1.5px', textTransform: 'uppercase', flexShrink: 0,
              color: isExpanded ? VIO : GOLD,
              border: `1px solid ${isExpanded ? `${VIO}40` : `${GOLD}30`}`,
              background: isExpanded ? `${VIO}0D` : `${GOLD}0D`,
              borderRadius: 999, padding: '0.2rem 0.55rem',
            }}>{dream.category}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{dream.brief}</p>
        </div>
        <span style={{
          fontSize: '0.65rem', color: isExpanded ? VIO : 'var(--text-dim)',
          transition: 'transform 0.2s, color 0.2s', flexShrink: 0,
          transform: isExpanded ? 'rotate(180deg)' : 'none',
          marginTop: '0.1rem',
        }}>▼</span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{
            marginTop: '1.1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            animation: 'dream-expand 0.22s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{
              background: `${GOLD}08`, border: `1px solid ${GOLD}20`,
              borderRadius: 12, padding: '0.75rem 0.9rem',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Positive Context</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{dream.positive}</p>
            </div>
            <div style={{
              background: 'rgba(232,111,111,0.06)', border: '1px solid rgba(232,111,111,0.2)',
              borderRadius: 12, padding: '0.75rem 0.9rem',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: '#E86F6F', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Negative Context</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{dream.negative}</p>
            </div>
          </div>

          <DetailRow label="Vedic / Spiritual Meaning" value={dream.vedic} color={GOLD} />
          <DetailRow label="Psychological Meaning" value={dream.psych} color={VIO} />

          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
              letterSpacing: '2px', textTransform: 'uppercase',
              color: 'var(--text-dim)', marginBottom: '0.4rem',
            }}>Related Symbols</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {dream.related.map(r => (
                <span key={r} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
                  letterSpacing: '0.5px', color: GOLD_L,
                  background: `${GOLD}10`, border: `1px solid ${GOLD}25`,
                  borderRadius: 8, padding: '0.25rem 0.6rem',
                }}>{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DreamInterpretation() {
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const cardRefs = useRef({})

  // Filter
  const filtered = DREAMS.filter(d => {
    const matchSearch = d.symbol.toLowerCase().includes(search.toLowerCase())
    const matchCat    = category === 'All' || d.category === category
    return matchSearch && matchCat
  })

  const handleToggle = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const handleRandom = () => {
    const pick = DREAMS[Math.floor(Math.random() * DREAMS.length)]
    setSearch('')
    setCategory('All')
    setExpandedId(pick.id)
    setHighlightId(pick.id)
    setTimeout(() => {
      cardRefs.current[pick.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    setTimeout(() => setHighlightId(null), 2200)
  }

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic &middot; Spiritual &middot; Psychological
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Dream Interpretation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
          46 symbols decoded through Vedic Jyotisha, Jungian psychology, and ancient spiritual wisdom.
          Search a symbol, filter by category, or let chance guide you.
        </p>
      </div>

      {/* Search + Random */}
      <div className="bh-fade-up-1" style={{ ...card, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={lbl}>Search Dream Symbol</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="e.g. snake, water, flying…"
            style={inp}
          />
        </div>
        <button
          onClick={handleRandom}
          style={{
            background: `linear-gradient(135deg, ${VIO}CC 0%, ${VIO} 100%)`,
            color: '#fff', border: 'none', borderRadius: 999,
            padding: '0.8rem 1.5rem', fontSize: '0.88rem', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: `0 6px 22px ${VIO}30`,
            transition: 'transform 0.18s, filter 0.18s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
        >
          💤 Random Dream
        </button>
      </div>

      {/* Category filters */}
      <div className="bh-fade-up-1" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.5rem' }}>
        {CATEGORIES.map(cat => {
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem', letterSpacing: '1px', fontWeight: active ? 600 : 400,
                padding: '0.45rem 1rem', borderRadius: 999, cursor: 'pointer',
                border: active ? `1px solid ${GOLD}80` : '1px solid var(--border)',
                background: active ? `${GOLD}18` : 'var(--bg-card)',
                color: active ? GOLD_L : 'var(--text-muted)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.color = GOLD } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            >
              {cat}
            </button>
          )
        })}
        <div style={{
          marginLeft: 'auto', alignSelf: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem',
          color: 'var(--text-dim)', letterSpacing: '1.5px',
        }}>
          {filtered.length} symbol{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div style={{
          ...card, textAlign: 'center', padding: '3rem 1.5rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔮</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No symbols found</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
            Try a different search term or select "All" from the category filter.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '0.85rem',
        }}>
          {filtered.map(dream => (
            <SymbolCard
              key={dream.id}
              dream={dream}
              isExpanded={expandedId === dream.id}
              isHighlighted={highlightId === dream.id}
              onToggle={() => handleToggle(dream.id)}
              cardRef={el => { cardRefs.current[dream.id] = el }}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{ ...card, marginTop: '2rem', padding: '1rem 1.3rem' }}>
        <SectionTitle>About Dream Interpretation</SectionTitle>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
          Vedic dream interpretation (Svapna Shastra) is an ancient science — the Brihat Samhita, Atharva Veda, and classical Jyotisha texts all classify dreams as meaningful messages from the subconscious and the divine. Each symbol is analysed across three lenses: <strong style={{ color: GOLD_L }}>Vedic/spiritual</strong> (what the ancient texts say), <strong style={{ color: VIO }}>psychological</strong> (Jungian and modern depth psychology), and <strong style={{ color: GOLD }}>contextual</strong> (positive vs. negative dream circumstances). Use this as a guide for reflection — the true meaning always depends on your personal context and emotional tone within the dream.
        </p>
      </div>

      {/* Scoped animation */}
      <style>{`
        @keyframes dream-expand {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .dream-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
