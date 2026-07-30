import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plane, MapPin, Wallet, CalendarDays, UtensilsCrossed, Star,
  CheckCircle2, Circle, Plus, Trash2, ChevronRight, Clock,
  Ticket, Sparkles, X, Landmark
} from "lucide-react";

/* ---------------------------------------------------------------
   TRIP DATA
--------------------------------------------------------------- */

const CITIES = [
  { id: "athens", name: "Athens", country: "Greece", accent: "#2C5F7C", dates: "Aug 24 – 27", currency: "Euro (EUR)", weather: "~30–32°C, sunny & dry", weatherNote: "Peak summer heat — mornings for sightseeing, siesta midday" },
  { id: "ios", name: "Ios", country: "Greece", accent: "#E0703C", dates: "Aug 27 – 30", currency: "Euro (EUR)", weather: "~27–29°C, sunny, sea breeze", weatherNote: "Warm island evenings, light layer for boat rides" },
  { id: "paros", name: "Paros", country: "Greece", accent: "#2F8577", dates: "Aug 30 – Sep 2", currency: "Euro (EUR)", weather: "~26–28°C, sunny, can be breezy", weatherNote: "Meltemi winds possible early Sept — can affect ferries" },
  { id: "budapest", name: "Budapest", country: "Hungary", accent: "#9C3B3B", dates: "Sep 2 – 6", currency: "Hungarian Forint (HUF)", weather: "~22–25°C, mild, chance of rain", weatherNote: "Pack a light jacket for evenings" },
  { id: "prague", name: "Prague", country: "Czechia", accent: "#B4842A", dates: "Sep 6 – 9", currency: "Czech Koruna (CZK)", weather: "~18–22°C, mild, cooler evenings", weatherNote: "Layer up — mornings and nights get cool" },
  { id: "krumlov", name: "Český Krumlov", country: "Czechia", accent: "#4C6B44", dates: "Sep 9 – 10", currency: "Czech Koruna (CZK)", weather: "~16–20°C, mild, alpine air", weatherNote: "Comfortable shoes essential — cobblestones everywhere" },
  { id: "hallstatt", name: "Hallstatt", country: "Austria", accent: "#3F638F", dates: "Sep 10 – 11", currency: "Euro (EUR)", weather: "~14–18°C, cool, alpine, chance of rain", weatherNote: "Bring a proper jacket — lakeside can be chilly" },
  { id: "vienna", name: "Vienna", country: "Austria", accent: "#6B4A70", dates: "Sep 11 – 15", currency: "Euro (EUR)", weather: "~18–21°C, mild, some rain possible", weatherNote: "Light jacket for evenings, umbrella just in case" },
];

const ITINERARY = [
  { date: "Aug 23", day: "Sat", city: null, title: "Depart Sydney", items: [
    { time: "2:50 PM", text: "Flight 8400 · Sydney → Doha", booked: true, icon: "flight" },
    { time: "3h 40m", text: "Layover in Doha", booked: false },
    { time: "2:20 AM", text: "Flight 211 · Doha → Athens", booked: true, icon: "flight" },
  ]},
  { date: "Aug 24", day: "Sun", city: "athens", title: "Arrive in Athens", items: [
    { time: "7:00 AM", text: "Land in Athens, check in", booked: true, icon: "flight" },
    { time: "", text: "Explore Plaka neighbourhood", booked: false },
    { time: "", text: "Explore Psyrri neighbourhood", booked: false },
    { time: "", text: "Monastiraki flea market", booked: false },
  ]},
  { date: "Aug 25", day: "Mon", city: "athens", title: "Ancient Athens", items: [
    { time: "", text: "Acropolis Museum", booked: false },
    { time: "", text: "Ancient Agora", booked: false },
    { time: "6:00 PM", text: "Acropolis", booked: true },
  ]},
  { date: "Aug 26", day: "Tue", city: "athens", title: "City walk + the coast", items: [
    { time: "Morning", text: "Walking tour of the city", booked: false },
    { time: "3:00 PM", text: "Lake Vouliagmeni", booked: true, note: "Booking time 3PM. How to reach — Public Transit (Metro + Bus), most cost-effective: 1) Take Metro Line 2 (Red Line) from Syntagma or Omonia to the final southern stop, Elliniko. 2) Outside Elliniko station, catch Bus 122 (Elliniko–Saronida). 3) Ride ~30 min and get off at the \"Limni\" (Lake) stop, steps from the entrance. 4) Cost: a standard 90-minute integrated transit ticket is €1.20. — Or Taxi/Ride-share (fastest): hail a yellow taxi at Monastiraki Square or use Uber/FreeNow. ~35–45 min depending on traffic, €20–€30 one-way." },
  ]},
  { date: "Aug 27", day: "Wed", city: "ios", title: "On to Ios", items: [
    { time: "9:00 AM", text: "Ferry from Athens · Olympic Champion Jet", booked: true, icon: "ferry", note: "From Monastiraki (Airbnb) to Piraeus port: take Metro Line 1 (Green) or Line 3 (Blue), both direct, no transfer, ~17-20 min, €1.20. SeaJets ferries depart from Gate E9, a 15-20 min walk from the metro station — be at the gate 30 min before departure. For a 9:00 AM ferry: be at the gate by 8:30 AM, leave the metro station by ~8:10 AM, catch the metro at Monastiraki by ~7:45-7:50 AM. Note: this metro line is a known pickpocket hotspot, especially during busy travel times." },
    { time: "4h 20m", text: "Journey time to Ios", booked: false },
    { time: "1:20 PM", text: "Arrive in Ios", booked: true, icon: "ferry", note: "Arrival at port of Ios. To reach hotel via bus or taxi right outside of port. Bus will cost €2.20 and taxi €10." },
    { time: "", text: "Check in — Hotel Petradi", booked: true, note: "Address: Mylopotas 840 01, Greece" },
    { time: "Sunset", text: "Panagia Gremiotissa Church for sunset", booked: false },
    { time: "9:30 PM", text: "Dinner at Katogi Greek Tapas", booked: false },
  ]},
  { date: "Aug 28", day: "Thu", city: "ios", title: "Beach club day", items: [
    { time: "Morning", text: "Mylopotas Beach", booked: false },
    { time: "6:00 PM", text: "Far Out Beach Club", booked: true },
  ]},
  { date: "Aug 29", day: "Fri", city: "ios", title: "Manganari Beach & dinner", items: [
    { time: "Morning", text: "Manganari Beach", booked: false },
    { time: "7:00 PM", text: "Ios Club — sunset dinner", booked: true, note: "Booking confirmed. Table AR2." },
    { time: "Late", text: "Pathos (optional, if up for it)", booked: false, note: "Taxi from Chora, ~5-7 min, roughly €5-8. No booking needed." },
  ]},
  { date: "Aug 30", day: "Sat", city: "paros", title: "On to Paros", items: [
    { time: "3:00 PM", text: "Ferry to Paros", booked: true, icon: "ferry" },
    { time: "55m", text: "Travel time", booked: false },
    { time: "4:00 PM", text: "Arrive at Paros port, check in", booked: true, icon: "ferry" },
    { time: "", text: "Check in — Irene Rooms", booked: true, note: "Address: Vounali, Naoussa, Paros 84401, Greece. — By Public Bus (cheapest): catch it at the Parikia Intercity Bus Terminal, right beside the ferry port (~1 min walk from the central windmill). Runs every ~20 min in peak summer, aligned with ferry arrivals; trip takes ~20 min. Cost €2.20 — card only, buy at the terminal kiosk before boarding to avoid a higher fare with the driver. Get off at the final stop in Naoussa; Irene Rooms is a 5-minute walk uphill toward Vounali/Piperi beach. — By Taxi (fastest): taxi rank directly outside the port exit. ~10-15 min drive, €15-25 depending on luggage/season." },
    { time: "7:00 PM", text: "Lunaz — dinner (booked)", booked: true },
    { time: "Night", text: "Come Back cocktail bar", booked: false },
  ]},
  { date: "Aug 31", day: "Sun", city: "paros", title: "Beach + shopping", items: [
    { time: "", text: "Cabana Beach Club", booked: false },
    { time: "", text: "Shopping in Parikia", booked: false },
  ]},
  { date: "Sep 1", day: "Mon", city: "paros", title: "Boat tour", items: [
    { time: "3:30 PM", text: "Boat tour (4 hours)", booked: true, note: "Getting to Aliki from Naoussa — By bus (cheapest, slower): Naoussa → Parikia (~20 min, €2), change to Parikia → Aliki (~35 min, €2-3). Total with transfer: ~1h45m-1h55m. — By taxi (faster, pricier): direct, ~20-25 min, around €22-27 one-way." },
  ]},
  { date: "Sep 2", day: "Tue", city: "budapest", title: "On to Budapest", items: [
    { time: "10:40 AM", text: "Leave Paros (ferry to Athens)", booked: true, icon: "ferry", note: "Getting to Parikia (Paros Port) from Naoussa — By bus: direct, no transfer, ~20 min, €2-3. Runs roughly every 3 hours, so check timing against the ferry. By taxi: faster, ~11 min, €11-14 — safer bet given the ferry departure, less risk of cutting it close." },
    { time: "1:50 PM", text: "Arrival in Athens", booked: true, icon: "ferry" },
    { time: "6:15 PM", text: "Flight from Athens to Budapest", booked: true, icon: "flight", note: "Getting from Piraeus port to the airport — Metro (Blue Line 3, direct, no transfer): ~58 min-1 hr, €9pp, every ~30 min. X96 Express Bus (cheapest): ~1h30m, €6pp, every 20-30 min, 24/7. Taxi (fastest): ~40 min, €50-70. You land at 1:50 PM with a 6:15 PM flight, so there's comfortable buffer — metro is a solid, cheap option here." },
    { time: "7:20 PM", text: "Arrive in Budapest", booked: true, icon: "flight", note: "Getting there from Budapest Airport: By public transport (cheapest) — 100E Airport Express Bus into the city (to Deák Ferenc tér), then a short metro/tram or walk; Metro lines 3 & 4 stop within a 4-min walk of the hotel. ~45-60 min total, a few euros. By taxi (easiest) — use the official Főtaxi rank only (avoid unofficial drivers in the terminal); ~30-45 min, around €25-35. Hotel also offers an airport shuttle for a surcharge if you'd rather pre-book door-to-door." },
    { time: "", text: "Check in — Amber Terrace Studios Downtown", booked: true, note: "Address: Veres Pálné utca 7, District V (Belváros-Lipótváros), Budapest 1053." },
    { time: "Night", text: "Dinner near the Danube / harbour", booked: false },
  ]},
  { date: "Sep 3", day: "Wed", city: "budapest", title: "Pest side highlights", items: [
    { time: "Morning", text: "Walking tour of the city", booked: false },
    { time: "", text: "St. Stephen's Basilica", booked: false },
    { time: "", text: "Gerbeaud Café", booked: false, note: "Historic café on Vörösmarty tér — a short walk from the Basilica, good spot for coffee/pastries during the walking tour." },
    { time: "", text: "Chain Bridge", booked: false },
    { time: "5:45 PM", text: "Hungarian Parliament Building (booked)", booked: true },
    { time: "Night", text: "Szimpla Kert (ruin bar)", booked: false },
  ]},
  { date: "Sep 4", day: "Thu", city: "budapest", title: "Buda side highlights", items: [
    { time: "", text: "Buda Castle", booked: false },
    { time: "", text: "Fisherman's Bastion", booked: false },
    { time: "8:30 PM", text: "Danube river cruise — Purpleliner (booked)", booked: true, note: "Meeting point: Batthyány tér, Dock 1/B." },
    { time: "Night", text: "White Raven Rooftop Bar", booked: false },
  ]},
  { date: "Sep 5", day: "Fri", city: "budapest", title: "Sparty night", items: [
    { time: "Morning", text: "Chill day / shopping", booked: false },
    { time: "Evening", text: "High Note Rooftop Bar", booked: false },
    { time: "9:30 PM", text: "Sparty (booked)", booked: true },
  ]},
  { date: "Sep 6", day: "Sat", city: "prague", title: "Side-trip tour: Budapest → Prague", items: [
    { time: "8:00 AM", text: "Leave Budapest — Side Trip Tour to Prague", booked: true, icon: "bus", note: "Meeting point is near Deák Ferenc tér metro station. 9-10 hour journey with stops along the way." },
    { time: "Stop 1", text: "Győr", booked: false },
    { time: "Stop 2", text: "Bratislava", booked: false },
    { time: "Stop 3", text: "Lednice Palace", booked: false },
    { time: "6–7 PM", text: "Arrive in Prague", booked: true, icon: "flight" },
    { time: "", text: "Check in — The Charles", booked: true },
  ]},
  { date: "Sep 7", day: "Sun", city: "prague", title: "Old Town & river", items: [
    { time: "", text: "Old Town Square + Astronomical Clock", booked: false },
    { time: "", text: "Charles Bridge", booked: false },
    { time: "", text: "Wenceslas Square", booked: false },
    { time: "Afternoon", text: "Franz Kafka Rotating Head", booked: false, note: "Near Národní třída / Quadrio, a short walk from Wenceslas Square." },
    { time: "", text: "Dancing House", booked: false },
    { time: "", text: "(A)void Café", booked: false, note: "Right underneath Dancing House on the riverside embankment (Náplavka). Known for its giant rotating porthole door." },
    { time: "Night", text: "Dog Bar", booked: false, note: "Multi-room nightlife spot near Charles Bridge — foosball, live music, quirky rooms, and a resident dog." },
  ]},
  { date: "Sep 8", day: "Mon", city: "prague", title: "Castle side", items: [
    { time: "", text: "Prague Castle + St. Vitus Cathedral", booked: false },
    { time: "", text: "Lesser Town (Malá Strana)", booked: false },
    { time: "", text: "Petřín Hill / Lookout Tower", booked: false },
    { time: "Night", text: "Karlovy Lázně", booked: false, note: "Biggest club in Central Europe — 5 floors, each with a different music genre." },
  ]},
  { date: "Sep 9", day: "Tue", city: "krumlov", title: "Last Prague morning → Krumlov", items: [
    { time: "9:30 AM", text: "Taxi to Florenc Bus Station", booked: false, note: "From The Charles hotel, ~10-15 min by taxi, around 200-300 CZK. Alternative: metro — change trains once (Line A to Náměstí Republiky, then Line B to Florenc) and about a 10 min walk overall." },
    { time: "10:00 AM", text: "FlixBus to Český Krumlov", booked: true, icon: "bus", note: "Departs from Prague Florenc Central Bus Station. Journey time 3h15m." },
    { time: "1:15 PM", text: "Arrive in Český Krumlov", booked: true, icon: "bus" },
    { time: "", text: "Check in — Arcadie Hotel & Apartment", booked: true },
    { time: "Afternoon", text: "Wander the old town + castle grounds", booked: false },
  ]},
  { date: "Sep 10", day: "Wed", city: "hallstatt", title: "Krumlov morning → Hallstatt", items: [
    { time: "9:00 AM", text: "Pickup by private car from our hotel", booked: true, icon: "bus" },
    { time: "1:00 PM", text: "Arrive in Hallstatt", booked: true, icon: "bus" },
    { time: "", text: "Check in — Pension Bergfried", booked: true },
    { time: "Afternoon", text: "Lakeside walk through the village", booked: false },
  ]},
  { date: "Sep 11", day: "Thu", city: "vienna", title: "Hallstatt morning → Vienna", items: [
    { time: "10:15 AM", text: "Ferry across the lake to the train station", booked: false, note: "The train station is on the opposite side of the lake, reached only by ferry. Walk to the town ferry dock (by the Evangelische Pfarrkirche, near Market Square). Crossing takes ~10-15 min, €4 one-way, cash only. Ferry timing is synced to the train." },
    { time: "11:09 AM", text: "Train REX 70 from Hallstatt train station", booked: true, icon: "bus", note: "Catch REX 70 from Platform 1 in Hallstatt. Arrive in Attnang on Platform 1, then go to Platform 2 to catch IC 645." },
    { time: "3:00 PM", text: "Arrive in Vienna", booked: true, icon: "bus", note: "Getting to the hotel: taxi from Wien Hauptbahnhof, roughly 15-20 min, around €15-20." },
    { time: "", text: "Check in — Four Points Flex by Sheraton Vienna Mariahilf", booked: true },
    { time: "Evening", text: "Stroll the Innere Stadt", booked: false },
  ]},
  { date: "Sep 12", day: "Fri", city: "vienna", title: "Palaces & markets", items: [
    { time: "", text: "Schönbrunn Palace", booked: false },
    { time: "", text: "Naschmarkt", booked: false },
  ]},
  { date: "Sep 13", day: "Sat", city: "vienna", title: "Cathedral & art", items: [
    { time: "", text: "St. Stephen's Cathedral", booked: false },
    { time: "", text: "Belvedere Palace", booked: false },
    { time: "", text: "Graben shopping street", booked: false },
  ]},
  { date: "Sep 14", day: "Sun", city: "vienna", title: "Free day", items: [
    { time: "", text: "Vienna State Opera / last-minute shopping", booked: false },
    { time: "", text: "Pack up", booked: false },
  ]},
  { date: "Sep 15", day: "Mon", city: null, title: "Fly home", items: [
    { time: "", text: "Flight back to Sydney", booked: true, icon: "flight" },
  ]},
];

const CITY_GUIDE = {
  athens: {
    todo: ["Acropolis & Parthenon", "Acropolis Museum", "Ancient Agora", "Plaka neighbourhood", "Psyrri neighbourhood", "Monastiraki flea market", "Lake Vouliagmeni", "Panathenaic Stadium", "Mount Lycabettus at sunset"],
    eat: ["Souvlaki from a Plaka stand", "Fresh seafood in Piraeus", "Traditional taverna in Psyrri", "Greek coffee in Monastiraki", "Spanakopita", "Gyros", "Saganaki", "Greek salad", "Freddo cappuccino", "Loukoumades"],
    mustgo: ["Acropolis at golden hour", "Monastiraki flea market for souvenirs"],
    restaurants: ["Korres", "A for Athens", "Attic Rooftop", "Ergon House", "Thissio", "Electra", "Couleur"],
    tips: ["Wear grippy, closed shoes — the Acropolis marble is slippery", "Dress modestly if visiting churches (shoulders/knees covered)", "Tap water is drinkable", "Watch bags closely around Monastiraki, a known pickpocket spot", "Many small shops close for an afternoon break — plan errands around it"],
  },
  ios: {
    todo: ["Far Out Beach Club", "Pathos for sunset", "Mylopotas Beach", "Chora village + windmills", "Homer's Tomb"],
    eat: ["Fresh seafood by the port", "Beach bar snacks at Far Out", "Sunset drinks at Pathos"],
    mustgo: ["Far Out Beach Club", "Pathos sunset"],
    tips: ["Carry cash — smaller beach bars/tavernas may not take card", "Book sunbeds ahead in peak season", "Roads to Chora are steep — comfortable shoes help"],
  },
  paros: {
    todo: ["Parikia old town", "Cabana Beach Club", "Naoussa fishing village", "Lefkes mountain village", "Boat tour around the island"],
    eat: ["Lunaz for dinner", "Cocktails at Come Back", "Fresh seafood in Naoussa"],
    mustgo: ["Boat tour", "Cabana Beach Club", "Parikia shopping street"],
    tips: ["Meltemi winds can delay/cancel ferries in late Aug/Sept — keep an eye on forecasts around travel days", "Cash preferred at smaller boutiques in Parikia", "Book the boat tour operator's meeting point the day before"],
  },
  budapest: {
    todo: ["Hungarian Parliament Building", "St. Stephen's Basilica", "Chain Bridge", "Buda Castle", "Fisherman's Bastion", "Danube river cruise", "Sparty (booked)", "Széchenyi Thermal Bath", "Szimpla Kert (ruin bar)", "White Raven Rooftop Bar"],
    eat: ["Dinner along the Danube", "Goulash at a traditional bistro", "Ruin bar in the Jewish Quarter", "Gerbeaud Café"],
    mustgo: ["Parliament Building", "Fisherman's Bastion at sunset", "Sparty"],
    tips: ["Validate metro/tram tickets in the machines before boarding — an unvalidated ticket counts as invalid and can mean a fine", "Watch for restaurants near tourist spots adding unrequested extra charges — check the bill", "Tipping ~10% is customary", "Ticket inspectors do random checks — always keep your validated ticket on you"],
  },
  prague: {
    todo: ["Old Town Square + Astronomical Clock", "Charles Bridge", "Wenceslas Square", "Prague Castle + St. Vitus Cathedral", "Lesser Town (Malá Strana)", "Petřín Hill", "Jewish Quarter", "Vltava river walk", "Franz Kafka Rotating Head", "Dancing House", "(A)void Café", "Karlovy Lázně"],
    eat: ["Trdelník from a street stand", "Traditional Czech pub for goulash & dumplings", "Café with a Charles Bridge view"],
    mustgo: ["Charles Bridge at sunrise", "Prague Castle"],
    tips: ["Validate tram/metro tickets in the yellow machines on board or at the station", "Avoid currency exchange booths advertising '0% commission' — rates are usually poor; use a bank or ATM instead", "Charles Bridge and trams are pickpocket hotspots — stay alert", "Czechia uses Koruna, not Euro, despite being in the EU"],
  },
  krumlov: {
    todo: ["Český Krumlov Castle", "Old town wander", "Vltava river raft/canoe", "Egon Schiele Art Centrum", "Castle Tower viewpoint"],
    eat: ["Riverside café in the old town", "Traditional Czech tavern"],
    mustgo: ["Castle Tower viewpoint over the old town"],
    tips: ["Small town — many places are cash-preferred", "Cobblestones everywhere, wear proper shoes", "It's a short stop — plan the castle + old town loop efficiently"],
  },
  hallstatt: {
    todo: ["Hallstatt Skywalk", "Lakeside promenade", "Hallstatt Salt Mine", "Village square + church"],
    eat: ["Lakeside café with the classic Hallstatt view", "Austrian schnitzel"],
    mustgo: ["Hallstatt Skywalk viewpoint", "Classic lakeside photo spot"],
    tips: ["Very small village, gets crowded with day-trippers around midday", "Limited ATMs — carry some cash", "Book the Skywalk/salt mine ticket ahead if possible", "Back in Euro territory here (Austria)"],
  },
  vienna: {
    todo: ["Schönbrunn Palace", "St. Stephen's Cathedral", "Belvedere Palace", "Naschmarkt", "Graben shopping street", "Vienna State Opera", "Museumsquartier"],
    eat: ["Sachertorte + coffee at a classic café", "Naschmarkt food stalls", "Wiener schnitzel"],
    mustgo: ["Schönbrunn Palace", "Graben for shopping"],
    tips: ["Public transport works on an honour system but is randomly checked — always carry a valid ticket", "Most museums are closed on Mondays — plan around it", "Tipping ~10% is customary, usually rounded up when paying"],
  },
};

const CATEGORIES = ["Flights", "Accommodation", "Food", "Activities", "Transport", "Shopping", "Other"];
const CURRENCIES = ["AUD", "EUR", "HUF", "CZK", "USD"];
const CURRENCY_SYMBOL = { AUD: "$", EUR: "€", HUF: "Ft", CZK: "Kč", USD: "$" };

/* ---------------------------------------------------------------
   LOCAL STORAGE HELPERS
--------------------------------------------------------------- */

function loadFromStorage(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveToStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

/* ---------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------- */

export default function App() {
  const [tab, setTab] = useState("overview");
  const [budget, setBudget] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  // Load from storage on mount
  useEffect(() => {
    const b = loadFromStorage("europe-trip-budget");
    if (b) setBudget(b);
    const c = loadFromStorage("europe-trip-checklist");
    if (c) setChecklist(c);
    setLoaded(true);
  }, []);

  const persist = useCallback((key, value) => {
    setSaveState("saving");
    try {
      saveToStorage(key, value);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (e) {
      setSaveState("idle");
    }
  }, []);

  useEffect(() => { if (loaded) persist("europe-trip-budget", budget); }, [budget, loaded, persist]);
  useEffect(() => { if (loaded) persist("europe-trip-checklist", checklist); }, [checklist, loaded, persist]);

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addExpense = (entry) => {
    setBudget((prev) => [...prev, { ...entry, id: Date.now().toString() }]);
  };
  const removeExpense = (id) => {
    setBudget((prev) => prev.filter((e) => e.id !== id));
  };

  const activeCity = CITIES.find((c) => c.id === tab);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#F6F3EC] text-[#20232B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d8d2c2; border-radius: 4px; }
      `}</style>

      <Header saveState={saveState} />
      <TabBar tab={tab} setTab={setTab} activeCity={activeCity} />

      <main className="max-w-3xl mx-auto px-4 pb-24 pt-5">
        {tab === "overview" && (
          <OverviewTab checklist={checklist} toggleCheck={toggleCheck} />
        )}
        {tab === "budget" && (
          <BudgetTab budget={budget} addExpense={addExpense} removeExpense={removeExpense} />
        )}
        {activeCity && (
          <CityTab city={activeCity} checklist={checklist} toggleCheck={toggleCheck} />
        )}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------
   HEADER
--------------------------------------------------------------- */

function Header({ saveState }) {
  return (
    <div className="border-b border-[#e4ded0] bg-[#F6F3EC] sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8c8570] font-mono">
            <Plane size={13} strokeWidth={2} />
            <span>Sydney → Athens → Vienna → Sydney</span>
          </div>
          <h1 className="font-display text-2xl font-700 mt-0.5" style={{ fontWeight: 700 }}>
            Europe & Greek Islands
          </h1>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-[#8c8570]">23 Aug – 15 Sep</div>
          <div className={`text-[11px] mt-0.5 transition-opacity ${saveState === "idle" ? "opacity-0" : "opacity-100"}`}>
            {saveState === "saving" ? "Saving…" : "Saved ✓"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   TAB BAR
--------------------------------------------------------------- */

function TabBar({ tab, setTab, activeCity }) {
  const primaryTabs = [
    { id: "overview", label: "Itinerary", icon: CalendarDays },
    { id: "budget", label: "Budget", icon: Wallet },
  ];
  return (
    <div className="bg-[#F6F3EC] border-b border-[#e4ded0] sticky top-[72px] z-20">
      <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-thin py-2.5">
        {primaryTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0
                ${active ? "bg-[#20232B] text-white" : "bg-white text-[#4a4636] border border-[#e4ded0]"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
        <div className="w-px bg-[#e4ded0] mx-1 shrink-0" />
        {CITIES.map((c) => {
          const active = tab === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setTab(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 border"
              style={
                active
                  ? { background: c.accent, borderColor: c.accent, color: "white" }
                  : { background: "white", borderColor: "#e4ded0", color: "#4a4636" }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "white" : c.accent }} />
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OVERVIEW / DAY-BY-DAY
--------------------------------------------------------------- */

function iconFor(type) {
  if (type === "flight") return <Plane size={13} />;
  if (type === "ferry") return <MapPin size={13} />;
  if (type === "bus") return <MapPin size={13} />;
  return <Circle size={6} className="fill-current" />;
}

function OverviewTab({ checklist, toggleCheck }) {
  return (
    <div>
      <p className="text-sm text-[#6b6656] mb-5">
        Tap any activity to check it off as you go. Everything's saved automatically.
      </p>
      <div className="space-y-3">
        {ITINERARY.map((day, idx) => {
          const city = CITIES.find((c) => c.id === day.city);
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#e4ded0] overflow-hidden relative"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: city ? city.accent : "#20232B" }}
              />
              <div className="pl-4 pr-4 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#8c8570]">{day.day}</span>
                    <span className="font-display font-600 text-[15px]" style={{ fontWeight: 600 }}>
                      {day.date}
                    </span>
                  </div>
                  {city && (
                    <span
                      className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full"
                      style={{ background: city.accent + "1a", color: city.accent }}
                    >
                      {city.name}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#4a4636] mb-2">{day.title}</div>
                <div className="space-y-1.5">
                  {day.items.map((item, i) => {
                    const key = `overview-${idx}-${i}`;
                    const checked = !!checklist[key];
                    return (
                      <div key={i}>
                        <button
                          onClick={() => toggleCheck(key)}
                          className="flex items-start gap-2 w-full text-left group"
                        >
                          {checked ? (
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2F8577]" />
                          ) : (
                            <Circle size={16} className="mt-0.5 shrink-0 text-[#c9c3b0]" />
                          )}
                          <span className={`text-[13.5px] flex-1 ${checked ? "line-through text-[#a8a291]" : "text-[#31302a]"}`}>
                            {item.time && <span className="font-mono text-[11px] text-[#8c8570] mr-1.5">{item.time}</span>}
                            {item.text}
                          </span>
                          {item.booked && (
                            <span className="flex items-center gap-1 text-[10px] text-[#2F8577] font-medium shrink-0 mt-0.5">
                              <Ticket size={11} /> booked
                            </span>
                          )}
                        </button>
                        {item.note && (
                          <div
                            className="ml-6 mt-1 mb-1 text-[12px] text-[#4a4636] bg-[#F6F3EC] border-l-2 rounded-r-md px-2.5 py-1.5"
                            style={{ borderColor: city ? city.accent : "#20232B" }}
                          >
                            {item.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   CITY TAB
--------------------------------------------------------------- */

function CityTab({ city, checklist, toggleCheck }) {
  const guide = CITY_GUIDE[city.id];
  const days = ITINERARY.filter((d) => d.city === city.id);

  return (
    <div>
      <div
        className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{ background: city.accent }}
      >
        <div className="font-mono text-[11px] uppercase tracking-widest opacity-80">{city.country}</div>
        <div className="font-display text-2xl font-700 mt-0.5" style={{ fontWeight: 700 }}>{city.name}</div>
        <div className="text-sm opacity-90 mt-1">{city.dates}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-white rounded-xl border border-[#e4ded0] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-[#8c8570]">Weather</div>
          <div className="font-display font-700 text-base mt-0.5" style={{ fontWeight: 700 }}>{city.weather}</div>
          <div className="text-[11px] text-[#6b6656] mt-1">{city.weatherNote}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e4ded0] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-[#8c8570]">Currency</div>
          <div className="font-display font-700 text-base mt-0.5" style={{ fontWeight: 700 }}>{city.currency}</div>
        </div>
      </div>

      <Section icon={<Sparkles size={15} />} title="Good to know" accent={city.accent}>
        <div className="space-y-1.5">
          {guide.tips.map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-white border border-[#e4ded0] rounded-lg px-3 py-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: city.accent }} />
              <span className="text-sm text-[#31302a]">{t}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Star size={15} />} title="Must-go" accent={city.accent}>
        <div className="flex flex-wrap gap-2">
          {guide.mustgo.map((m, i) => (
            <span
              key={i}
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: city.accent + "1a", color: city.accent }}
            >
              {m}
            </span>
          ))}
        </div>
      </Section>

      <Section icon={<Landmark size={15} />} title="Things to do" accent={city.accent}>
        <div className="space-y-1.5">
          {guide.todo.map((t, i) => {
            const key = `todo-${city.id}-${i}`;
            const checked = !!checklist[key];
            return (
              <ChecklistRow key={i} checked={checked} onClick={() => toggleCheck(key)} text={t} accent={city.accent} />
            );
          })}
        </div>
      </Section>

      <Section icon={<UtensilsCrossed size={15} />} title="Things to eat" accent={city.accent}>
        <div className="space-y-1.5">
          {guide.eat.map((t, i) => {
            const key = `eat-${city.id}-${i}`;
            const checked = !!checklist[key];
            return (
              <ChecklistRow key={i} checked={checked} onClick={() => toggleCheck(key)} text={t} accent={city.accent} />
            );
          })}
        </div>
      </Section>

      {guide.restaurants && (
        <Section icon={<Star size={15} />} title="Restaurants & Bars" accent={city.accent}>
          <div className="space-y-1.5">
            {guide.restaurants.map((t, i) => {
              const key = `resto-${city.id}-${i}`;
              const checked = !!checklist[key];
              return (
                <ChecklistRow key={i} checked={checked} onClick={() => toggleCheck(key)} text={t} accent={city.accent} />
              );
            })}
          </div>
        </Section>
      )}

      <Section icon={<CalendarDays size={15} />} title="Day-by-day here" accent={city.accent}>
        <div className="space-y-2">
          {days.map((d, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-[#e4ded0] p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs text-[#8c8570]">{d.day}</span>
                <span className="font-display font-600 text-sm" style={{ fontWeight: 600 }}>{d.date}</span>
                <span className="text-xs text-[#6b6656]">— {d.title}</span>
              </div>
              <ul className="text-[13px] text-[#4a4636] space-y-0.5 ml-1">
                {d.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {iconFor(it.icon)}
                    {it.time && <span className="font-mono text-[11px] text-[#8c8570]">{it.time}</span>}
                    <span>{it.text}</span>
                    {it.booked && <Ticket size={11} className="text-[#2F8577]" />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ChecklistRow({ checked, onClick, text, accent }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 w-full text-left bg-white border border-[#e4ded0] rounded-lg px-3 py-2">
      {checked ? (
        <CheckCircle2 size={16} style={{ color: accent }} className="shrink-0" />
      ) : (
        <Circle size={16} className="text-[#c9c3b0] shrink-0" />
      )}
      <span className={`text-sm ${checked ? "line-through text-[#a8a291]" : "text-[#31302a]"}`}>{text}</span>
    </button>
  );
}

function Section({ icon, title, children, accent }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2" style={{ color: accent }}>
        {icon}
        <span className="font-display text-sm font-600" style={{ fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   BUDGET TAB
--------------------------------------------------------------- */

function BudgetTab({ budget, addExpense, removeExpense }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", currency: "AUD", category: "Activities", city: "",
  });

  const totals = useMemo(() => {
    const t = {};
    budget.forEach((e) => {
      const amt = parseFloat(e.amount) || 0;
      t[e.currency] = (t[e.currency] || 0) + amt;
    });
    return t;
  }, [budget]);

  const submit = () => {
    if (!form.description || !form.amount) return;
    addExpense(form);
    setForm({ description: "", amount: "", currency: form.currency, category: form.category, city: "" });
    setShowForm(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {Object.keys(totals).length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-[#e4ded0] p-4 text-sm text-[#8c8570] text-center">
            No expenses logged yet
          </div>
        )}
        {Object.entries(totals).map(([cur, amt]) => (
          <div key={cur} className="bg-white rounded-xl border border-[#e4ded0] p-3">
            <div className="font-mono text-[11px] text-[#8c8570]">{cur} total</div>
            <div className="font-display text-xl font-700" style={{ fontWeight: 700 }}>
              {CURRENCY_SYMBOL[cur]}{amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-4 text-base font-bold mb-5 shadow-lg"
        style={{ background: "linear-gradient(135deg, #E0703C, #C9463F)", boxShadow: "0 4px 14px rgba(224,112,60,0.5)" }}
      >
        <Plus size={20} strokeWidth={3} /> ADD EXPENSE
      </button>

      <div className="space-y-2">
        {[...budget].reverse().map((e) => (
          <div key={e.id} className="bg-white rounded-xl border border-[#e4ded0] px-3 py-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#20232B] truncate">{e.description}</div>
              <div className="text-[11px] text-[#8c8570] font-mono">
                {e.category}{e.city ? ` · ${CITIES.find(c => c.id === e.city)?.name || e.city}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-sm font-medium">
                {CURRENCY_SYMBOL[e.currency]}{parseFloat(e.amount).toLocaleString()}
              </span>
              <button onClick={() => removeExpense(e.id)} className="text-[#c9463f]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div
            className="bg-[#F6F3EC] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-700 text-lg" style={{ fontWeight: 700 }}>New expense</span>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            <input
              autoFocus
              placeholder="What was it for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white border border-[#e4ded0] rounded-lg px-3 py-2.5 text-sm outline-none"
            />

            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="flex-1 bg-white border border-[#e4ded0] rounded-lg px-3 py-2.5 text-sm outline-none"
              />
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="bg-white border border-[#e4ded0] rounded-lg px-2 text-sm outline-none"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-white border border-[#e4ded0] rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-white border border-[#e4ded0] rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              <option value="">No city / general</option>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <button
              onClick={submit}
              className="w-full bg-[#20232B] text-white rounded-lg py-2.5 text-sm font-medium mt-1"
            >
              Add expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
