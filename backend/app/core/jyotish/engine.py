"""
backend/app/core/jyotish/engine.py

JyotishEngine — pyswisseph wrapper for BhagyaAI.
Computes full sidereal natal chart using Lahiri ayanamsa.

Usage:
    engine = JyotishEngine()
    chart  = engine.compute_chart(
        dob="1992-05-20",
        tob="17:13",
        timezone="Asia/Kolkata",
        lat=26.4499,
        lon=80.3319,
        label="Rakshit Saluja",
    )
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone as tz
from typing import Optional

import pytz
import swisseph as swe

from .nakshatra import (
    SIGNS,
    get_nakshatra_info,
    get_sign_info,
    house_from_lagna,
)
from .dasha import compute_dasha_tree, current_dasha

logger = logging.getLogger(__name__)

# ── Planet IDs ────────────────────────────────────────────────────────────
PLANET_IDS: dict[str, int] = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus":   swe.VENUS,
    "Mars":    swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn":  swe.SATURN,
}

# Rahu/Ketu use the mean lunar node
RAHU_ID = swe.MEAN_NODE   # Rahu (north node)

# Lal Kitab pucca ghar (permanent house) reference
LK_PUCCA_GHAR: dict[str, list[int]] = {
    "Sun":     [1],
    "Moon":    [4],
    "Mars":    [3, 8],
    "Mercury": [7, 10],
    "Jupiter": [2, 9],
    "Venus":   [7],
    "Saturn":  [8],
    "Rahu":    [6, 12],
    "Ketu":    [12],
}


class JyotishEngine:
    """
    Computes Vedic (Jyotish) natal charts using Swiss Ephemeris
    with sidereal zodiac and Lahiri ayanamsa.
    """

    def __init__(self, ephe_path: str = ""):
        """
        Args:
            ephe_path: Path to Swiss Ephemeris data files.
                       Empty string = use built-in Moshier ephemeris
                       (accurate for 1800–2100, no file download needed).
        """
        if ephe_path:
            swe.set_ephe_path(ephe_path)
        # Lahiri ayanamsa — standard for Vedic / KP astrology in India
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        logger.info("JyotishEngine initialised — Lahiri ayanamsa, sidereal mode")

    # ── Public API ────────────────────────────────────────────────────────

    def compute_chart(
        self,
        dob: str,
        tob: str,
        timezone: str,
        lat: float,
        lon: float,
        label: str = "",
        place_name: str = "",
        dasha_levels: int = 2,
    ) -> dict:
        """
        Compute a full sidereal natal chart.

        Args:
            dob:          Date of birth — "YYYY-MM-DD"
            tob:          Time of birth (local) — "HH:MM" or "HH:MM:SS"
            timezone:     pytz timezone string e.g. "Asia/Kolkata"
            lat:          Birth latitude  (positive = North)
            lon:          Birth longitude (positive = East)
            label:        Optional display name for this chart
            place_name:   Optional place name for display
            dasha_levels: 1 = MD only, 2 = MD + AD (default), 3 = + PAD

        Returns:
            Full chart dict with planets, lagna, houses, dasha tree, LK map.
        """
        jd_ut = self._to_julian_day(dob, tob, timezone)
        ayanamsa = swe.get_ayanamsa(jd_ut)

        # ── Ascendant (Lagna) ──────────────────────────────────────────
        lagna = self._compute_lagna(jd_ut, lat, lon, ayanamsa)

        # ── Planets ────────────────────────────────────────────────────
        planets = self._compute_planets(jd_ut, lagna["sign_index"])

        # ── Rahu / Ketu ────────────────────────────────────────────────
        rahu_ketu = self._compute_rahu_ketu(jd_ut, lagna["sign_index"])
        planets["Rahu"] = rahu_ketu["Rahu"]
        planets["Ketu"] = rahu_ketu["Ketu"]

        # ── House occupants map ────────────────────────────────────────
        house_map = self._build_house_map(planets, lagna)

        # ── Vimshottari Dasha tree ─────────────────────────────────────
        moon_lon   = planets["Moon"]["longitude"]
        birth_date = date.fromisoformat(dob)
        dasha_tree = compute_dasha_tree(moon_lon, birth_date, levels=dasha_levels)
        active     = current_dasha(dasha_tree)

        # ── Lal Kitab overlay ─────────────────────────────────────────
        lk = self._lal_kitab_overlay(planets)

        chart = {
            "label":         label,
            "place_name":    place_name,
            "dob":           dob,
            "tob":           tob,
            "timezone":      timezone,
            "lat":           lat,
            "lon":           lon,
            "julian_day_ut": round(jd_ut, 6),
            "ayanamsa":      round(ayanamsa, 4),
            "lagna":         lagna,
            "planets":       planets,
            "house_map":     house_map,
            "dasha_tree":    dasha_tree,
            "current_dasha": active,
            "lal_kitab":     lk,
        }
        return chart

    # ── Private helpers ───────────────────────────────────────────────────

    def _to_julian_day(self, dob: str, tob: str, timezone_str: str) -> float:
        """Convert local birth date+time to Julian Day (UT)."""
        tz_obj = pytz.timezone(timezone_str)

        # Parse time — support HH:MM and HH:MM:SS
        parts = tob.split(":")
        hour   = int(parts[0])
        minute = int(parts[1])
        second = int(parts[2]) if len(parts) > 2 else 0

        d = date.fromisoformat(dob)
        local_dt = datetime(d.year, d.month, d.day, hour, minute, second)
        local_dt = tz_obj.localize(local_dt)
        utc_dt   = local_dt.astimezone(pytz.utc)

        jd = swe.julday(
            utc_dt.year,
            utc_dt.month,
            utc_dt.day,
            utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
        )
        return jd

    def _compute_lagna(self, jd_ut: float, lat: float, lon: float, ayanamsa: float) -> dict:
        """Compute sidereal Ascendant using Placidus house system."""
        # houses_ex returns tropical cusps; we subtract ayanamsa for sidereal
        houses, ascmc = swe.houses_ex(jd_ut, lat, lon, b"P", swe.FLG_SIDEREAL | swe.FLG_SPEED)
        asc_lon = ascmc[0] % 360.0

        sign_info = get_sign_info(asc_lon)
        nak_info  = get_nakshatra_info(asc_lon)

        return {
            "longitude":  round(asc_lon, 4),
            "sign":       sign_info["sign"],
            "sign_index": sign_info["sign_index"],
            "degree":     sign_info["degree"],
            "nakshatra":  nak_info["nakshatra"],
            "nak_lord":   nak_info["lord"],
            "pada":       nak_info["pada"],
        }

    def _compute_planets(self, jd_ut: float, lagna_sign_idx: int) -> dict:
        """Compute positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn."""
        result: dict = {}

        for name, pid in PLANET_IDS.items():
            pos, ret_flags = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL | swe.FLG_SPEED)
            lon = pos[0] % 360.0

            sign_info = get_sign_info(lon)
            nak_info  = get_nakshatra_info(lon)
            house     = house_from_lagna(sign_info["sign_index"], lagna_sign_idx)

            is_pucca = house in LK_PUCCA_GHAR.get(name, [])

            result[name] = {
                "longitude":    round(lon, 4),
                "sign":         sign_info["sign"],
                "sign_index":   sign_info["sign_index"],
                "degree":       sign_info["degree"],
                "nakshatra":    nak_info["nakshatra"],
                "nak_lord":     nak_info["lord"],
                "pada":         nak_info["pada"],
                "house":        house,
                "lk_pucca":     is_pucca,
                "retrograde":   bool(pos[3] < 0),  # negative speed = retrograde
            }

        return result

    def _compute_rahu_ketu(self, jd_ut: float, lagna_sign_idx: int) -> dict:
        """Compute Rahu (mean north node) and Ketu (exactly opposite)."""
        pos, _ = swe.calc_ut(jd_ut, RAHU_ID, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        rahu_lon = pos[0] % 360.0
        ketu_lon = (rahu_lon + 180.0) % 360.0

        def _planet_dict(lon: float, name: str) -> dict:
            sign_info = get_sign_info(lon)
            nak_info  = get_nakshatra_info(lon)
            house     = house_from_lagna(sign_info["sign_index"], lagna_sign_idx)
            is_pucca  = house in LK_PUCCA_GHAR.get(name, [])
            return {
                "longitude":  round(lon, 4),
                "sign":       sign_info["sign"],
                "sign_index": sign_info["sign_index"],
                "degree":     sign_info["degree"],
                "nakshatra":  nak_info["nakshatra"],
                "nak_lord":   nak_info["lord"],
                "pada":       nak_info["pada"],
                "house":      house,
                "lk_pucca":  is_pucca,
                "retrograde": True,   # Rahu/Ketu are always retrograde by convention
            }

        return {
            "Rahu": _planet_dict(rahu_lon, "Rahu"),
            "Ketu": _planet_dict(ketu_lon, "Ketu"),
        }

    def _build_house_map(self, planets: dict, lagna: dict) -> dict[str, list[str]]:
        """
        Build a map of house number → list of planet names occupying that house.
        Includes Lagna marker in house 1.
        """
        house_map: dict[str, list[str]] = {str(h): [] for h in range(1, 13)}
        house_map["1"].append("Lagna")

        for name, data in planets.items():
            house_map[str(data["house"])].append(name)

        return house_map

    def _lal_kitab_overlay(self, planets: dict) -> dict:
        """
        Lal Kitab analysis overlay — expanded:
        Pucca Ghar, Rahu-Ketu axis, benefits, challenges, remedies.
        """
        pucca_planets = [
            {"planet": name, "house": data["house"]}
            for name, data in planets.items()
            if data.get("lk_pucca")
        ]

        rahu_house = planets["Rahu"]["house"]
        ketu_house = planets["Ketu"]["house"]

        # ── Per-planet house effects (Lal Kitab tradition) ────────────────
        # Format: planet -> house -> {benefit, challenge, remedy}
        LK_EFFECTS = {
            "Sun": {
                1:  ("Natural leadership, strong personality, good health in youth.", "Tendency toward ego and conflicts with authority figures.", "Avoid taking credit for others' work. Offer water to the rising sun daily."),
                2:  ("Wealth accumulation through own efforts, respected in family.", "Strained family relations, father may face difficulties.", "Keep a piece of copper with you. Respect elders at home."),
                3:  ("Brave, self-made, good relations with siblings.", "Younger siblings may face obstacles; short journeys bring fatigue.", "Donate wheat or jaggery on Sundays."),
                4:  ("Property benefits, comfortable home, mother is supportive.", "Heart-related health concerns possible; domestic tensions.", "Keep the home clean and bright. Offer water to a Shiva lingam."),
                5:  ("Intelligent children, speculative gains, good education.", "Delay in children or ego clashes with progeny.", "Recite Surya mantras. Keep gold with you."),
                6:  ("Victory over enemies, strong digestive health, good in service.", "Legal disputes possible; enemies work covertly.", "Feed wheat bread to dogs on Sundays."),
                7:  ("Charismatic partner, gains through marriage.", "Marital friction; spouse may be domineering.", "Keep fast on Sundays. Donate red clothes."),
                8:  ("Longevity supported; inheritance possible.", "Eye or bone health issues; sudden setbacks.", "Keep a copper coin in wallet. Offer arghya to Sun each morning."),
                9:  ("Fortunate, divine grace, father is well-placed in life.", "Conflicting views with father; religious differences.", "Serve your father with devotion. Visit a Vishnu temple on Sundays."),
                10: ("Career rises steadily; government or authority connections.", "Career obstacles if dharma is compromised.", "Keep a ruby or gold ring. Perform Surya namaskar daily."),
                11: ("Excellent for income gains; large social network.", "Over-reliance on others; elder siblings may cause strain.", "Donate wheat to a temple on Sundays."),
                12: ("Expenditure is controlled; spiritual gains abroad.", "Foreign travel may bring unexpected expenses.", "Keep fast on Sundays. Avoid ego in foreign dealings."),
            },
            "Moon": {
                1:  ("Attractive personality, popular, emotionally expressive.", "Mind can be unstable; overthinking leads to anxiety.", "Keep a silver ball or coin with you at all times."),
                2:  ("Family happiness, good wealth accumulation, sweet speech.", "Fluctuating income; family harmony may be disturbed.", "Drink water in a silver glass. Keep rice at home."),
                3:  ("Courageous, good at writing and communication, helpful siblings.", "Restless nature; short journeys may be tiring.", "Keep fasts on Mondays. Offer milk to Shiva."),
                4:  ("Excellent placement — strong mother bond, happiness at home, peace of mind.", "Emotional dependency on home; moving away from birthplace is difficult.", "Keep a pot of water in the southwest corner of your home."),
                5:  ("Intuitive, creative, blessed with children, good memory.", "Mood swings affect decision-making; romantic relationships are unstable.", "Meditate before making important decisions."),
                6:  ("Strong immunity, service-oriented, handles difficulties well.", "Maternal relatives may face health issues.", "Offer milk at a Shiva temple on Mondays."),
                7:  ("Romantic and devoted partner; gains through marriage.", "Spouse may be moody or emotionally demanding.", "Offer sugar to ants. Keep fast on Mondays."),
                8:  ("Intuitive, healing abilities, interest in occult.", "Mother's health needs attention; emotional crises possible.", "Keep silver with you. Donate milk on Mondays."),
                9:  ("Fortunate, spiritual, good relationship with mother.", "Conflicting beliefs with elders; over-reliance on luck.", "Worship Goddess Durga on Mondays."),
                10: ("Career in public life, fame, respect in society.", "Career linked to public mood — fluctuations are common.", "Offer water to the Moon on full moon nights."),
                11: ("Financial gains through networking; large social circle.", "Unreliable friends; income fluctuates with emotions.", "Keep fast on Mondays. Avoid alcohol."),
                12: ("Spiritual inclinations, intuitive dreams, gains from foreign lands.", "Sleep disturbances; excessive expenditure.", "Keep a white cloth under your pillow. Donate milk."),
            },
            "Mars": {
                1:  ("Energetic, courageous, physically strong.", "Aggression, accidents, conflicts with others.", "Donate blood on Mars-related days. Keep a red coral. Feed dogs sweet bread."),
                2:  ("Accumulates wealth through hard work and land.", "Family disputes over money; harsh speech.", "Donate sweets to children on Tuesdays."),
                3:  ("Excellent courage, brave siblings, good for sports and adventure.", "Pucca Ghar — delivers full results. Minor impulsiveness.", "Offer sweets at a Hanuman temple on Tuesdays."),
                4:  ("Property and real estate gains; strong domestic life.", "Mother's health or domestic tensions possible.", "Install a red coral at home. Plant a pomegranate tree."),
                5:  ("Intelligent, authoritative, strategic thinker.", "Delay in children; ego conflicts with progeny.", "Feed monkeys on Tuesdays. Offer red flowers to Ganesha."),
                6:  ("Powerful victory over enemies; exceptional stamina.", "Legal battles may arise; health issues related to blood.", "Donate blood. Keep fast on Tuesdays."),
                7:  ("Dynamic and passionate partner.", "Marital conflicts; partner may be aggressive.", "Offer red lentils (masoor dal) at a Hanuman temple on Tuesdays."),
                8:  ("Pucca Ghar — long life, inheritance, hidden wealth.", "Accidents or surgeries possible. Drive carefully.", "Keep a red coral. Avoid red meat on Tuesdays."),
                9:  ("Courageous, fortunate, father is strong.", "Father may face health challenges.", "Donate copper vessels to a temple on Tuesdays."),
                10: ("Strong career drive; leadership in profession.", "Workplace conflicts; impulsive decisions harm reputation.", "Offer jaggery to a cow on Tuesdays."),
                11: ("Excellent income; gains from land and property.", "Overconfidence leads to financial losses.", "Donate to a fire brigade or army relief fund."),
                12: ("Gains from foreign lands; good health abroad.", "Unnecessary expenses; legal issues in foreign countries.", "Keep fast on Tuesdays. Donate red cloth."),
            },
            "Mercury": {
                1:  ("Intelligent, witty, excellent communicator.", "Indecisiveness; tendency to overthink.", "Keep a green emerald or wear green on Wednesdays."),
                2:  ("Excellent for business, communication skills bring wealth.", "Speech may cause family disputes.", "Keep a bronze vessel at home. Respect your mother."),
                3:  ("Brilliant communicator, skilled writer, good siblings.", "Short-distance travels bring stress.", "Feed green fodder to cows on Wednesdays."),
                4:  ("Good education, intelligent mother, comfortable home.", "Overanalysis leads to domestic restlessness.", "Keep a pot of water in the north of your home."),
                5:  ("Sharp intellect, clever children, good at calculations.", "Children may be too analytical or stubborn.", "Donate green items to students on Wednesdays."),
                6:  ("Excellent for service and analytical work; victory over rivals.", "Enemies use words against you.", "Offer green bangles at a goddess temple on Wednesdays."),
                7:  ("Pucca Ghar — witty and intelligent partner; business partnerships thrive.", "Partner may be overly critical.", "Plant a tulsi plant at home."),
                8:  ("Interest in occult knowledge; longevity through awareness.", "Nervous system sensitivity; anxiety possible.", "Read religious texts. Keep a green tourmaline."),
                9:  ("Highly educated, philosophical mind.", "Conflict between logic and faith.", "Donate books to needy students on Wednesdays."),
                10: ("Pucca Ghar — excellent career in communication, media, IT, business.", "Changing careers too frequently.", "Keep a piece of copper or bronze at your workplace."),
                11: ("Large gains through communication and networks.", "Friends may misguide; overthinking reduces gains.", "Feed green vegetables to cows on Wednesdays."),
                12: ("Interest in spirituality, gains from foreign ideas.", "Excessive expenditure on books and education.", "Donate to a school or library."),
            },
            "Jupiter": {
                1:  ("Blessed, wise, respected, gains divine grace naturally.", "Weight gain; over-optimism leads to poor decisions.", "Offer yellow flowers to Lord Vishnu on Thursdays."),
                2:  ("Pucca Ghar — wealth, happy family, eloquent speech.", "Overindulgence in food; over-generosity.", "Keep turmeric at home. Feed yellow lentils to cows."),
                3:  ("Knowledge-sharing, wise siblings.", "May lack the courage to take risks.", "Donate yellow sweets at a temple on Thursdays."),
                4:  ("Comfortable home, educated mother, property gains.", "Overreliance on home and family.", "Keep a yellow sapphire or turmeric in puja."),
                5:  ("Highly intelligent, blessed with good children, speculative gains.", "Over-idealism in romance or investments.", "Offer prasad at a Vishnu temple. Keep fast on Thursdays."),
                6:  ("Defeats enemies through wisdom; good digestion.", "Overconfidence leads to overlooking real threats.", "Feed yellow dal (chana) to cows on Thursdays."),
                7:  ("Excellent, wise, and spiritual partner; blessed married life.", "Spouse may be preachy or overly idealistic.", "Offer turmeric water to Lord Vishnu on Thursdays."),
                8:  ("Gains through inheritance; interest in deep philosophy.", "Health issues related to liver or excess fat.", "Keep fast on Thursdays. Donate yellow clothes."),
                9:  ("Pucca Ghar — extremely fortunate, wise father, divine blessings.", "Over-reliance on luck; laziness.", "Offer bananas at a Vishnu temple on Thursdays."),
                10: ("Excellent career; rises to respected positions.", "May be too idealistic for practical career demands.", "Keep a yellow sapphire. Do charitable acts at work."),
                11: ("Large income gains; wise friends and elder siblings.", "Over-optimism leads to financial misjudgment.", "Feed yellow lentils to cows on Thursdays."),
                12: ("Spiritual liberation, gains from foreign lands.", "Excessive spending on religious causes.", "Keep fast on Thursdays. Donate to a temple abroad."),
            },
            "Venus": {
                1:  ("Attractive, charming, artistic, lucky in love.", "Vanity; over-indulgence in pleasures.", "Keep fast on Fridays. Keep a white handkerchief."),
                2:  ("Wealth through luxury, arts or partnerships; beautiful speech.", "Overspending on comfort and luxury.", "Donate white sweets on Fridays. Keep silver."),
                3:  ("Artistic communication, loving siblings.", "Short journeys for pleasure lead to expenses.", "Keep a white flower in your home on Fridays."),
                4:  ("Beautiful home, comfortable life, loving mother.", "Over-attachment to comfort may reduce ambition.", "Keep a white marble or crystal at home."),
                5:  ("Creative genius, loving children, lucky in romance.", "Unstable romantic life; speculation losses.", "Offer white flowers to Lakshmi on Fridays."),
                6:  ("Overcomes obstacles through charm; health through beauty routines.", "Legal disputes related to property or love.", "Feed cows on Fridays. Keep fast."),
                7:  ("Pucca Ghar — beautiful, devoted, artistic partner; blessed married life.", "Over-dependence on partner for happiness.", "Offer white flowers to goddess Lakshmi on Fridays."),
                8:  ("Gains through inheritance and spouse; interest in hidden arts.", "Overindulgence in sensual pleasures.", "Keep a piece of silver. Avoid excess alcohol."),
                9:  ("Fortunate in love; spiritual and creative mind.", "Conflict between pleasure and higher duties.", "Offer white sweets at a Lakshmi temple on Fridays."),
                10: ("Career in arts, beauty, luxury or entertainment.", "Career may suffer due to personal relationships.", "Keep a diamond or white sapphire."),
                11: ("Gains through creativity, networking, and charm.", "Friends may misuse your generosity.", "Donate white items to women on Fridays."),
                12: ("Enjoyment of foreign luxuries; spiritual love.", "Excessive private expenditure.", "Keep a white crystal under your pillow on Fridays."),
            },
            "Saturn": {
                1:  ("Disciplined, hard-working, long-lived, learns from challenges.", "Health issues in early life; slow start to success.", "Keep a black or blue sapphire. Light sesame oil lamp on Saturdays."),
                2:  ("Wealth built steadily through discipline and patience.", "Family life may be austere; speech is reserved.", "Feed crows on Saturdays. Keep an iron key at home."),
                3:  ("Disciplined communication; persevering despite obstacles.", "Siblings may face hardships.", "Offer sesame to Shani on Saturdays."),
                4:  ("Property gains through persistence; loyal to home.", "Mother's health needs attention; domestic life is serious.", "Plant a peepal tree or water one on Saturdays."),
                5:  ("Steady intellect; children who succeed through hard work.", "Delay in children; disciplinarian relationship with progeny.", "Feed black sesame to crows on Saturdays."),
                6:  ("Exceptional stamina; defeats enemies through persistence.", "Chronic health issues; prolonged legal battles.", "Offer black sesame and mustard oil to Shani on Saturdays."),
                7:  ("Mature, loyal, serious partner.", "Late marriage; partner may be reserved or older.", "Keep fast on Saturdays. Offer mustard oil to Shani."),
                8:  ("Pucca Ghar — long life, gains from hard work over time.", "Chronic health challenges; obstacles early in life.", "Light a sesame oil lamp under a peepal tree on Saturdays."),
                9:  ("Fortunate through hard work; father is disciplined.", "Father faces health challenges; fate requires effort.", "Offer black sesame to Shani on Saturdays. Serve the poor."),
                10: ("Steady, hard-earned career success; respect in old age.", "Career progress is slow; obstacles in middle age.", "Keep a blue sapphire or iron ring. Serve the elderly."),
                11: ("Gains come slowly but permanently; loyal elder siblings.", "Income is consistent but not spectacular.", "Feed black lentils (urad dal) to crows on Saturdays."),
                12: ("Spiritual liberation; learns through exile or isolation.", "Excessive expenditure; isolation from family.", "Keep fast on Saturdays. Donate black items to the poor."),
            },
            "Rahu": {
                1:  ("Fame, unconventional success, magnetic personality.", "Deception or confusion about identity; health can be erratic.", "Keep a piece of silver or lead. Avoid ego-driven decisions."),
                2:  ("Gains through unconventional methods; foreign wealth.", "Family disputes; speech may mislead others.", "Keep elephants (figurines) at home. Speak truthfully."),
                3:  ("Extremely courageous, bold, breaks conventions.", "Impulsive actions; strained relations with siblings.", "Donate milk to a Shiva temple on Saturdays."),
                4:  ("Gains of property through unusual means.", "Domestic unrest; mother's health may be affected.", "Keep a coconut at home. Water a peepal tree."),
                5:  ("Unconventional intelligence; gains through speculation.", "Progeny may be delayed or unconventional.", "Offer coconut to Lord Ganesha on Saturdays."),
                6:  ("Victory over enemies in unconventional ways; immunity strong.", "Hidden enemies; legal complications.", "Feed a black dog. Keep a small piece of coal at home."),
                7:  ("Foreign connections through marriage or business.", "Marital complications; partner may be deceptive.", "Donate copper on Saturdays. Keep fast."),
                8:  ("Interest in occult; sudden inheritance possible.", "Sudden reversals; hidden enemies.", "Keep a piece of lead. Donate to the needy on Saturdays."),
                9:  ("Foreign travel for knowledge; unconventional spirituality.", "Father's health or relationship may be challenging.", "Offer coconut at a Ganesha temple. Keep fast on Saturdays."),
                10: ("Sudden rise in career; fame through unconventional paths.", "Career instability; reputation risks from deception.", "Feed birds daily. Keep a piece of silver at workplace."),
                11: ("Very large gains through networks and foreign connections.", "Friends may deceive; elder siblings face challenges.", "Keep a silver ball. Donate black items on Saturdays."),
                12: ("Strong foreign karma; spiritual experiences abroad.", "Excessive expenditure; foreign-related legal issues.", "Keep a blue handkerchief. Donate at a mosque or dargah."),
            },
            "Ketu": {
                1:  ("Spiritual wisdom, past-life gifts, non-attachment.", "Physical health challenges; identity confusion.", "Keep a cat at home or feed cats. Worship Lord Ganesha."),
                2:  ("Intuitive wealth; spiritual family background.", "Family disputes; erratic finances.", "Donate blankets to the poor. Keep a cat."),
                3:  ("Spiritual courage; detached from material desires.", "Siblings may face unusual challenges.", "Offer coconut to Lord Ganesha. Keep a dog."),
                4:  ("Spiritual home; interest in occult from mother.", "Domestic instability; frequent change of residence.", "Keep a dog. Water a peepal tree on Saturdays."),
                5:  ("Highly intuitive; children may be spiritually inclined.", "Unconventional relationship with children.", "Worship Lord Ganesha. Offer coconut on Saturdays."),
                6:  ("Defeats enemies through spiritual means.", "Mysterious health issues; unknown enemies.", "Keep a dog. Feed black and white sesame to birds."),
                7:  ("Spiritually-oriented marriage; partner may be intuitive.", "Marital detachment; partner may be otherworldly.", "Donate a blanket to the poor on Saturdays."),
                8:  ("Deep occult knowledge; past-life healing abilities.", "Mysterious illnesses; sudden losses.", "Keep a cat. Worship Ganesh and Kali."),
                9:  ("Deep spirituality; past-life dharmic connections.", "Separation from father; unconventional religious path.", "Offer coconut at a Ganesha temple on Saturdays."),
                10: ("Sudden career changes; unconventional profession.", "Career instability; reputation suffers from past karma.", "Feed a dog. Keep a piece of iron at workplace."),
                11: ("Gains from past-life karma; spiritual networks.", "Friends may be unreliable; erratic income.", "Keep a dog. Donate blankets on Saturdays."),
                12: ("Liberation karma; strong spiritual gifts.", "Isolation; unexpected foreign losses.", "Keep a cat and a dog. Visit a Ganesha temple on Saturdays."),
            },
        }

        # ── Generate planet-level readings ────────────────────────────────
        # LK rule: retrograde planet gives results of the OPPOSITE house
        planet_readings = []
        for planet, data in planets.items():
            house      = data["house"]
            is_retro   = data.get("retrograde", False)
            # Opposite house for retrograde treatment (1↔7, 2↔8, 3↔9, etc.)
            lk_house   = ((house - 1 + 6) % 12) + 1 if is_retro else house
            retro_note = (
                f" [Retrograde — LK reads as House {lk_house}]" if is_retro else ""
            )
            effects = LK_EFFECTS.get(planet, {}).get(lk_house)
            if effects:
                benefit, challenge, remedy = effects
                planet_readings.append({
                    "planet":         planet,
                    "house":          house,      # actual house
                    "lk_house":       lk_house,   # effective LK house
                    "pucca":          data.get("lk_pucca", False),
                    "retrograde":     is_retro,
                    "benefit":        benefit + retro_note,
                    "challenge":      challenge + retro_note,
                    "remedy":         remedy,
                })

        # ── Rahu-Ketu axis reading ─────────────────────────────────────────
        RAHU_AXIS = {
            (9, 3):  "Rahu in 9th (foreign fortune, unconventional spirituality) — Ketu in 3rd (detachment from siblings, past-life communication gifts). You are fated to travel and seek higher meaning beyond borders.",
            (3, 9):  "Rahu in 3rd (bold self-expression, media, siblings) — Ketu in 9th (inherited wisdom, detachment from traditional religion). Courage and communication are your north star.",
            (12, 6): "Rahu in 12th (foreign lands, liberation, private matters) — Ketu in 6th (release from service debts). Foreign living is deeply supported by this axis.",
            (6, 12): "Rahu in 6th (victory over obstacles) — Ketu in 12th (spiritual detachment from foreign matters). You are here to conquer daily battles with unusual inner strength.",
            (1, 7):  "Rahu in 1st (unconventional identity) — Ketu in 7th (spiritual partnerships). You grow by developing a unique self while releasing dependency on partners.",
            (7, 1):  "Rahu in 7th (unconventional partnerships) — Ketu in 1st (releasing the old self). Foreign or unusual partnerships and business connections propel your destiny.",
            (10, 4): "Rahu in 10th (career through unconventional paths) — Ketu in 4th (detachment from home comforts). Public life and career ambition are your soul's growth direction.",
            (4, 10): "Rahu in 4th (unconventional home and property) — Ketu in 10th (releasing old career karma). Home, property and emotional security are your destined focus.",
            (2, 8):  "Rahu in 2nd (wealth through unconventional means) — Ketu in 8th (release from inherited debts and secrets). Financial growth through bold, original methods.",
            (8, 2):  "Rahu in 8th (transformation through hidden matters) — Ketu in 2nd (releasing family wealth karma). Deep transformation through research, inheritance or crisis leads to growth.",
            (5, 11): "Rahu in 5th (unconventional creativity) — Ketu in 11th (release from group gains). Creative intelligence and children or speculative matters are your growth path.",
            (11, 5): "Rahu in 11th (massive gains through networks) — Ketu in 5th (detachment from ego-creativity). Large income through associations, technology and foreign connections.",
        }

        axis_key = (rahu_house, ketu_house)
        axis_reading = RAHU_AXIS.get(
            axis_key,
            f"Rahu in House {rahu_house} — Ketu in House {ketu_house}. Your karmic axis drives growth through the themes of House {rahu_house} and releases attachment to House {ketu_house}."
        )

        # ── Full remedy guide per planet ───────────────────────────────────
        # Each planet has: mantra (beej + simple), how_to (steps), rules, when_to_avoid
        PLANET_REMEDY_GUIDE = {
            "Sun": {
                "mantra_beej":    "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
                "mantra_beej_roman": "Om Hraam Hreem Hraum Sah Suryaya Namaha",
                "mantra_simple":  "ॐ सूर्याय नमः",
                "mantra_simple_roman": "Om Suryaya Namaha",
                "mantra_meaning": "Salutations to the Sun, the source of all light and life energy.",
                "mantra_count":   "Simple mantra: 1, 3, or 7 times. Beej mantra: 11 times. Both chanted while pouring — not before.",
                "how_to": [
                    "Use a copper lota (vessel) — dedicated only to this purpose.",
                    "Fill with clean water. Optional: store overnight in copper. Add a few red hibiscus petals, a pinch of roli (red sandalwood powder), and a few unbroken rice grains (akshat).",
                    "Bathe fully before performing, or at minimum brush teeth and wash face and hands. Wear fresh clothes.",
                    "Go outside and face East toward the rising sun. Stand barefoot on earth, grass, or wood — not concrete.",
                    "Hold the lota with both hands at chest height.",
                    "Close your eyes briefly and set your silent sankalp (intention): who you are and what you are offering.",
                    "Open your eyes, look toward the sun, and begin pouring in a slow continuous stream. Begin chanting the mantra the moment water starts to flow.",
                    "Look through the arc of water toward the sun as you pour.",
                    "Complete the last syllable of the mantra as the last drop falls. The pour and the mantra are one unified act.",
                    "Do not speak to anyone from the moment you begin until you finish.",
                    "Water should fall on the earth or on a plant (tulsi is ideal) — not down a drain or on concrete.",
                ],
                "rules": [
                    "Must be performed within 1 hour of sunrise — never after 8 AM.",
                    "Perform before looking at your phone and before breakfast.",
                    "Full bath is ideal. If not possible: brush teeth, wash face and hands, fresh clothes as minimum.",
                    "Copper vessel only. No steel, brass, or plastic.",
                    "Silence from start to finish. Do not speak mid-ritual.",
                    "Consistency matters more than elaborateness. Once daily, every day, is more powerful than elaborate weekly sessions.",
                    "If you miss a day, simply resume the next day. Never try to double up.",
                ],
                "when_to_avoid": [
                    "Solar eclipse (Surya Grahan) — skip the entire day, before and after.",
                    "Death in the immediate family — skip for 13 days (full mourning period).",
                    "High fever or serious illness — rest fully, resume when recovered.",
                    "If you have not bathed at all and cannot do even the minimum (brush + wash hands).",
                    "If it is past the 1-hour sunrise window — skip that day entirely.",
                    "Heavy rain with no visibility of East direction — skip. Light overcast is fine.",
                    "Do not perform during menstruation (traditional rule; personal choice applies).",
                ],
            },
            "Moon": {
                "mantra_beej":    "ॐ श्रां श्रीं श्रौं सः चंद्राय नमः",
                "mantra_beej_roman": "Om Shraam Shreem Shraum Sah Chandraaya Namaha",
                "mantra_simple":  "ॐ चंद्राय नमः",
                "mantra_simple_roman": "Om Chandraaya Namaha",
                "mantra_meaning": "Salutations to the Moon, the ruler of the mind and emotions.",
                "mantra_count":   "11 times on Monday mornings. On full moon nights (Purnima), chant 108 times while looking at the moon.",
                "how_to": [
                    "On Mondays: offer raw milk (not boiled) or clean water at a Shiva lingam in the morning after bathing.",
                    "Keep a silver coin, silver ball, or any piece of silver with you at all times (in pocket or wallet).",
                    "On Purnima (full moon night): go outside, look at the moon, and chant the mantra 108 times.",
                    "Keep a small pot of water in the southwest corner of your home — change it weekly.",
                    "If fasting on Mondays: take only fruits and milk. Break fast after sunset.",
                    "Chant the mantra while offering milk or water — begin when the offering starts, complete when it ends.",
                ],
                "rules": [
                    "Monday is the primary day for Moon remedies.",
                    "Full moon (Purnima) amplifies Moon remedies significantly — do not skip Purnima practice.",
                    "Silver must touch the body — keeping it in a bag does not activate the remedy.",
                    "Consistency on Mondays matters more than intensity.",
                    "Offer with sincerity — the emotional quality of Moon remedies is as important as the physical act.",
                ],
                "when_to_avoid": [
                    "Lunar eclipse (Chandra Grahan) — skip on that day.",
                    "Death in immediate family — skip for 13 days.",
                    "Avoid offering milk if it is stale or mixed with anything commercial.",
                    "Do not perform if mentally very agitated — calm the mind first even briefly.",
                ],
            },
            "Mars": {
                "mantra_beej":    "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
                "mantra_beej_roman": "Om Kraam Kreem Kraum Sah Bhaumaaya Namaha",
                "mantra_simple":  "ॐ अंगारकाय नमः",
                "mantra_simple_roman": "Om Angarakaaya Namaha",
                "mantra_meaning": "Salutations to Mars (Angaraka), the planet of courage, energy and land.",
                "mantra_count":   "11 or 21 times on Tuesday mornings. Chant while offering sindoor or while lighting the ghee lamp.",
                "how_to": [
                    "Visit a Hanuman temple on Tuesdays. Offer sindoor (red vermilion) and a jasmine or red flower garland.",
                    "Light a pure ghee lamp (not oil) in front of Hanuman — chant the mantra as the lamp is lit.",
                    "Offer red lentils (masoor dal) or jaggery and wheat at the temple.",
                    "Feed sweet wheat bread (roti with jaggery) to dogs on Tuesday mornings.",
                    "If donating blood: do so on a Tuesday — this is the most powerful Mars remedy.",
                    "Chant the mantra 11 times as you make your offering or as you feed the dog.",
                ],
                "rules": [
                    "Tuesday is the primary day — all Mars remedies are strongest on Tuesdays.",
                    "Red is the color of Mars — wear something red on Tuesdays if possible.",
                    "Do not lend money to anyone on Tuesdays (or any day) — Mars in affliction worsens through financial entanglements.",
                    "Do not eat meat on Tuesdays for stronger effect.",
                    "Avoid arguments and conflict on Tuesdays — your Mars energy is most reactive on its own day.",
                ],
                "when_to_avoid": [
                    "Death in immediate family — skip for 13 days.",
                    "Skip blood donation if unwell or if medical conditions prevent it.",
                    "Do not visit the temple if you have not bathed.",
                    "Avoid performing during Rahu Kaal on Tuesdays (check your local Rahu Kaal timing).",
                ],
            },
            "Jupiter": {
                "mantra_beej":    "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
                "mantra_beej_roman": "Om Graam Greem Graum Sah Guruve Namaha",
                "mantra_simple":  "ॐ बृहस्पतये नमः",
                "mantra_simple_roman": "Om Brihaspataye Namaha",
                "mantra_meaning": "Salutations to Jupiter (Brihaspati), the teacher of the gods, bringer of wisdom and abundance.",
                "mantra_count":   "19 or 108 times on Thursday mornings, after bath, facing North or East.",
                "how_to": [
                    "On Thursdays: bathe, wear yellow or white, and visit a Vishnu temple.",
                    "Offer bananas, yellow sweets (besan laddoo or kesari), or turmeric water.",
                    "Light a ghee lamp and chant the mantra 19 times as you offer.",
                    "Feed yellow dal (chana dal) or bananas to cows on Thursdays.",
                    "Keep a small piece of raw turmeric or a yellow sapphire in your puja space.",
                    "Donate books, sweets, or yellow items to students or the poor on Thursdays.",
                    "If fasting: take only one meal, without salt, on Thursdays.",
                ],
                "rules": [
                    "Thursday is Jupiter's day — all remedies are strongest then.",
                    "Yellow is Jupiter's color — wear yellow on Thursdays, include yellow in offerings.",
                    "Never disrespect or argue with a teacher, guru, elder, or father — this directly weakens Jupiter.",
                    "Do not cut hair or nails on Thursdays.",
                    "Donate with a pure heart — Jupiter remedies are diluted by expectation of reward.",
                ],
                "when_to_avoid": [
                    "Death in immediate family — skip for 13 days.",
                    "Solar or lunar eclipse — skip on that day.",
                    "If you have eaten non-vegetarian food that day — wait until the next Thursday.",
                    "Do not perform if in a state of anger or ego — Jupiter does not respond to arrogance.",
                ],
            },
            "Saturn": {
                "mantra_beej":    "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
                "mantra_beej_roman": "Om Praam Preem Praum Sah Shanaischaraaya Namaha",
                "mantra_simple":  "ॐ शं शनैश्चराय नमः",
                "mantra_simple_roman": "Om Sham Shanaischaraaya Namaha",
                "mantra_meaning": "Salutations to Saturn (Shani), the lord of karma, time and discipline.",
                "mantra_count":   "19 or 23 times. Saturn mantra is chanted at dusk (sunset) on Saturdays — not in the morning.",
                "how_to": [
                    "On Saturdays at dusk (not morning): go to a peepal tree or a Shani temple.",
                    "Light a sesame oil (til ka tel) lamp at the base of the peepal tree or before the Shani idol.",
                    "Offer black sesame seeds (kala til) and mustard oil — pour a small amount on the Shani idol or the tree roots.",
                    "Chant the mantra 19 times as the lamp burns.",
                    "Feed black lentils (urad dal) or black sesame to crows on Saturday morning.",
                    "Serve the poor, the elderly, or disabled people on Saturdays — this is Saturn's most direct remedy.",
                    "Donate black items: black cloth, black sesame, iron, or black shoes to those in need.",
                ],
                "rules": [
                    "Saturday is Saturn's day — all remedies must be on Saturdays.",
                    "Saturn remedies are performed at dusk (evening), not in the morning. Morning is for Sun. Saturn belongs to the evening.",
                    "Black and blue are Saturn's colors — wearing dark colors on Saturdays helps.",
                    "Service to the underprivileged is more powerful than any material offering for Saturn.",
                    "Never disrespect laborers, servants, or those in humble positions — Saturn represents them.",
                    "Do not cut hair or nails on Saturdays.",
                    "Consistency over 43 Saturdays continuously is the traditional requirement for significant Saturn remedy results.",
                ],
                "when_to_avoid": [
                    "Death in immediate family — skip for 13 days.",
                    "Solar or lunar eclipse — skip on that day.",
                    "Do not light the sesame lamp if there is a strong wind that will blow it out immediately — it is inauspicious to have it extinguish.",
                    "If you are in Sade Sati (7.5-year Saturn transit): continue the remedy but also consult a proper jyotishi for additional guidance.",
                ],
            },
            "Venus": {
                "mantra_beej":    "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
                "mantra_beej_roman": "Om Draam Dreem Draum Sah Shukraaya Namaha",
                "mantra_simple":  "ॐ शुक्राय नमः",
                "mantra_simple_roman": "Om Shukraaya Namaha",
                "mantra_meaning": "Salutations to Venus (Shukra), the planet of love, beauty, abundance and artistic grace.",
                "mantra_count":   "16 or 108 times on Friday mornings. Chant while offering flowers to Goddess Lakshmi.",
                "how_to": [
                    "On Fridays: bathe, wear white or light-colored clothes, and offer white flowers (lotus, white rose, or jasmine) to Goddess Lakshmi.",
                    "Light a ghee lamp and chant the mantra 16 times while the lamp burns.",
                    "Keep a small piece of silver or a white crystal in your puja space.",
                    "Donate white sweets, white clothes, or dairy items (curd, kheer) to women or girls on Fridays.",
                    "Keep a white handkerchief with you on Fridays.",
                    "If fasting: take only one vegetarian meal, preferably dairy-based (curd rice or kheer).",
                ],
                "rules": [
                    "Friday is Venus's day — all remedies are strongest then.",
                    "White and light pink are Venus's colors for remedies.",
                    "Avoid quarreling with your spouse or partner on Fridays.",
                    "Do not consume alcohol on Fridays if performing Venus remedies — alcohol weakens Venus.",
                    "Treat women with respect — Venus is directly harmed by disrespect toward women.",
                ],
                "when_to_avoid": [
                    "Death in immediate family — skip for 13 days.",
                    "Avoid if you have consumed alcohol that day.",
                    "Do not perform if in a state of anger toward your partner.",
                ],
            },
            "Mercury": {
                "mantra_beej":    "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
                "mantra_beej_roman": "Om Braam Breem Braum Sah Budhaaya Namaha",
                "mantra_simple":  "ॐ बुधाय नमः",
                "mantra_simple_roman": "Om Budhaaya Namaha",
                "mantra_meaning": "Salutations to Mercury (Budha), the planet of intelligence, communication and commerce.",
                "mantra_count":   "17 or 108 times on Wednesday mornings, after bath.",
                "how_to": [
                    "On Wednesdays: feed green fodder (spinach, green grass) to a cow in the morning.",
                    "Donate green items: green vegetables, green clothes, or mung dal (green lentils) to students or the poor.",
                    "Offer green items at a Ganesha or Vishnu temple on Wednesdays.",
                    "Chant the mantra 17 times while feeding the cow or making the donation.",
                    "Keep a small green tourmaline, emerald, or piece of green glass in your work area.",
                    "Plant a tulsi plant at home and water it on Wednesdays.",
                ],
                "rules": [
                    "Wednesday is Mercury's day.",
                    "Green is Mercury's color — wear green on Wednesdays when possible.",
                    "Never mock or demean students, children, or those learning — this directly weakens Mercury.",
                    "Avoid lying or deception — Mercury governs communication and is weakened by dishonesty.",
                    "Do not cut hair or nails on Wednesdays.",
                ],
                "when_to_avoid": [
                    "Death in immediate family — skip for 13 days.",
                    "Avoid if in a state of dishonesty or deception that day.",
                ],
            },
            "Rahu": {
                "mantra_beej":    "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
                "mantra_beej_roman": "Om Bhraam Bhreem Bhraum Sah Raahave Namaha",
                "mantra_simple":  "ॐ राहवे नमः",
                "mantra_simple_roman": "Om Raahave Namaha",
                "mantra_meaning": "Salutations to Rahu, the north node, the planet of ambition, foreign connections and transformation.",
                "mantra_count":   "18 times on Saturdays, during the evening. Rahu Kaal (the daily 1.5-hour Rahu window) is actually a potent time to chant Rahu mantra specifically.",
                "how_to": [
                    "On Saturdays: feed a black dog. Give roti with mustard oil or black sesame mixed in.",
                    "Keep a small piece of silver or lead (sisa) with you — in wallet or pocket.",
                    "Donate at a mosque or dargah on Saturdays — Rahu connects strongly with this energy.",
                    "Keep a blue or black handkerchief with you.",
                    "Chant the mantra 18 times on Saturday evenings, facing South-West.",
                    "Avoid Rahu Kaal for all new beginnings and important tasks. However, for Rahu mantra chanting specifically, Rahu Kaal on Saturdays is powerful.",
                    "Offer coconut at a Ganesha temple on Saturdays — Ganesha pacifies Rahu's chaotic energy.",
                ],
                "rules": [
                    "Saturday is Rahu's primary remedy day (shared with Saturn).",
                    "Rahu Kaal (1.5-hour window daily) — check your local timing. Avoid starting new ventures during Rahu Kaal, but you CAN chant Rahu mantra during it.",
                    "Never disrespect foreigners, unconventional people, or those from different communities — Rahu represents them.",
                    "Avoid dishonesty and illusion — Rahu amplifies what you send out.",
                    "Blue, black, and dark colors are Rahu's colors.",
                ],
                "when_to_avoid": [
                    "Solar eclipse — Rahu causes eclipses; this is the most powerful time to NOT perform any ritual.",
                    "Death in immediate family — skip for 13 days.",
                    "Do not chant Rahu mantra during sunrise hours — Rahu is a shadow planet and operates best at dusk and nighttime.",
                ],
            },
            "Ketu": {
                "mantra_beej":    "ॐ स्त्रां स्त्रीं स्त्रौं सः केतवे नमः",
                "mantra_beej_roman": "Om Straam Streem Straum Sah Ketave Namaha",
                "mantra_simple":  "ॐ केतवे नमः",
                "mantra_simple_roman": "Om Ketave Namaha",
                "mantra_meaning": "Salutations to Ketu, the south node, the planet of liberation, past karma and spiritual wisdom.",
                "mantra_count":   "17 or 108 times on Saturdays, morning or evening.",
                "how_to": [
                    "Keep a dog and treat it with care — Ketu's most direct remedy is kindness to dogs.",
                    "Feed a cat on Saturdays — Ketu also governs cats.",
                    "Offer a coconut at a Ganesha temple on Saturdays — Ganesha governs Ketu.",
                    "Chant the mantra 17 times while offering the coconut or while feeding the dog.",
                    "Keep a piece of iron (small iron nail or iron ring) in your home.",
                    "Donate blankets to the poor on Saturdays.",
                    "Spend time in silence and meditation — Ketu responds more to inner practice than outer ritual.",
                ],
                "rules": [
                    "Saturday is Ketu's primary day.",
                    "Ketu is spiritual in nature — inner practice (meditation, silence, prayer) supplements outer remedies.",
                    "Never harm or mistreat animals, particularly dogs and cats — Ketu protects them and is angered by cruelty.",
                    "Grey, smoke-colored, and mixed colors are Ketu's colors.",
                    "Ketu remedies work slowly — consistency over months is required.",
                ],
                "when_to_avoid": [
                    "Solar eclipse — skip all rituals on eclipse day.",
                    "Death in immediate family — skip for 13 days.",
                    "Do not perform if you have harmed an animal recently — resolve that first.",
                ],
            },
        }

        # ── Compile top benefits and challenges ────────────────────────────
        top_benefits = []
        top_challenges = []
        top_remedies = []

        # Pucca Ghar planets always mentioned first
        for p in pucca_planets:
            top_benefits.append(f"{p['planet']} is in its Pucca Ghar (House {p['house']}) — this planet delivers its most permanent and reliable results in your lifetime.")

        # Add from planet readings (prioritise important planets)
        priority = ["Sun", "Moon", "Mars", "Jupiter", "Saturn", "Venus", "Mercury", "Rahu", "Ketu"]
        for planet in priority:
            pr = next((r for r in planet_readings if r["planet"] == planet), None)
            if pr:
                top_benefits.append(f"{planet} in House {pr['house']}: {pr['benefit']}")
                top_challenges.append(f"{planet} in House {pr['house']}: {pr['challenge']}")
                guide = PLANET_REMEDY_GUIDE.get(planet, {})
                top_remedies.append({
                    "planet":       planet,
                    "house":        pr["house"],
                    "challenge":    pr["challenge"],
                    "action":       pr["remedy"],
                    "mantra_beej":          guide.get("mantra_beej", ""),
                    "mantra_beej_roman":    guide.get("mantra_beej_roman", ""),
                    "mantra_simple":        guide.get("mantra_simple", ""),
                    "mantra_simple_roman":  guide.get("mantra_simple_roman", ""),
                    "mantra_meaning":       guide.get("mantra_meaning", ""),
                    "mantra_count":         guide.get("mantra_count", ""),
                    "how_to":               guide.get("how_to", []),
                    "rules":                guide.get("rules", []),
                    "when_to_avoid":        guide.get("when_to_avoid", []),
                })

        # Also attach guide to each planet_reading
        for pr in planet_readings:
            pr["remedy_guide"] = guide

        return {
            "pucca_ghar_planets":  pucca_planets,
            "rahu_ketu_axis":      f"Rahu in House {rahu_house} — Ketu in House {ketu_house}",
            "axis_reading":        axis_reading,
            "foreign_indicator":   rahu_house in [3, 9, 12] or ketu_house in [9, 12],
            "planet_readings":     planet_readings,
            "benefits":            top_benefits,
            "challenges":          top_challenges,
            "remedies":            top_remedies,
        }
