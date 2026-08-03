import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plane, MapPin, Wallet, CalendarDays, UtensilsCrossed, Star,
  CheckCircle2, Circle, Plus, Trash2, ChevronRight, ChevronLeft, Clock,
  Ticket, Sparkles, X, Landmark, ArrowLeftRight, RefreshCw, Luggage,
  Sun, Moon, Link2, CloudCheck, CloudAlert, FileText, Upload, Image, Eye,
  Camera, MessageCircle, LayoutGrid, Clapperboard, Bell, CalendarPlus
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getStoredTripId, clearStoredTripId, createSharedTrip, joinSharedTrip, fetchSharedTrip, updateSharedTrip,
  listDocuments, uploadDocument, deleteDocument, getDocumentUrl, parseReceiptWithGroq, askTripQuestion,
} from "./supabase";
import { refreshApp } from "./pwa.js";

/* ---------------------------------------------------------------
   TRIP DATA
--------------------------------------------------------------- */

const TRIP_YEAR = 2026;

const CITIES = [
  { id: "athens", name: "Athens", country: "Greece", accent: "#2C5F7C", dates: "Aug 24 – 27", currency: "Euro (EUR)", weather: "~30–32°C, sunny & dry", weatherNote: "Peak summer heat — mornings for sightseeing, siesta midday", lat: 37.9838, lng: 23.7275 },
  { id: "ios", name: "Ios", country: "Greece", accent: "#E0703C", dates: "Aug 27 – 30", currency: "Euro (EUR)", weather: "~27–29°C, sunny, sea breeze", weatherNote: "Warm island evenings, light layer for boat rides", lat: 36.7231, lng: 25.2802 },
  { id: "paros", name: "Paros", country: "Greece", accent: "#2F8577", dates: "Aug 30 – Sep 2", currency: "Euro (EUR)", weather: "~26–28°C, sunny, can be breezy", weatherNote: "Meltemi winds possible early Sept — can affect ferries", lat: 37.0856, lng: 25.1488 },
  { id: "budapest", name: "Budapest", country: "Hungary", accent: "#9C3B3B", dates: "Sep 2 – 6", currency: "Hungarian Forint (HUF)", weather: "~22–25°C, mild, chance of rain", weatherNote: "Pack a light jacket for evenings", lat: 47.4979, lng: 19.0402 },
  { id: "prague", name: "Prague", country: "Czechia", accent: "#B4842A", dates: "Sep 6 – 9", currency: "Czech Koruna (CZK)", weather: "~18–22°C, mild, cooler evenings", weatherNote: "Layer up — mornings and nights get cool", lat: 50.0755, lng: 14.4378 },
  { id: "krumlov", name: "Český Krumlov", country: "Czechia", accent: "#4C6B44", dates: "Sep 9 – 10", currency: "Czech Koruna (CZK)", weather: "~16–20°C, mild, alpine air", weatherNote: "Comfortable shoes essential — cobblestones everywhere", lat: 48.8127, lng: 14.3175 },
  { id: "hallstatt", name: "Hallstatt", country: "Austria", accent: "#3F638F", dates: "Sep 10 – 11", currency: "Euro (EUR)", weather: "~14–18°C, cool, alpine, chance of rain", weatherNote: "Bring a proper jacket — lakeside can be chilly", lat: 47.5622, lng: 13.6493 },
  { id: "vienna", name: "Vienna", country: "Austria", accent: "#6B4A70", dates: "Sep 11 – 15", currency: "Euro (EUR)", weather: "~18–21°C, mild, some rain possible", weatherNote: "Light jacket for evenings, umbrella just in case", lat: 48.2082, lng: 16.3738 },
];

const ITINERARY = [
  { date: "Aug 23", city: null, title: "Depart Sydney", items: [
    { time: "2:50 PM", text: "Flight 8400 · Sydney → Doha", booked: true, icon: "flight" },
    { time: "3h 40m", text: "Layover in Doha", booked: false },
    { time: "2:20 AM", text: "Flight 211 · Doha → Athens", booked: true, icon: "flight" },
  ]},
  { date: "Aug 24", city: "athens", title: "Arrive in Athens", items: [
    { time: "7:00 AM", text: "Land in Athens, check in", booked: true, icon: "flight" },
    { time: "", text: "Explore Plaka neighbourhood", booked: false },
    { time: "", text: "Explore Psyrri neighbourhood", booked: false },
    { time: "", text: "Monastiraki flea market", booked: false },
  ]},
  { date: "Aug 25", city: "athens", title: "Ancient Athens", items: [
    { time: "", text: "Acropolis Museum", booked: false },
    { time: "", text: "Ancient Agora", booked: false },
    { time: "6:00 PM", text: "Acropolis", booked: true },
  ]},
  { date: "Aug 26", city: "athens", title: "City walk + the coast", items: [
    { time: "Morning", text: "Walking tour of the city", booked: false },
    { time: "3:00 PM", text: "Lake Vouliagmeni", booked: true, note: "Booking time 3PM. How to reach — Public Transit (Metro + Bus), most cost-effective: 1) Take Metro Line 2 (Red Line) from Syntagma or Omonia to the final southern stop, Elliniko. 2) Outside Elliniko station, catch Bus 122 (Elliniko–Saronida). 3) Ride ~30 min and get off at the \"Limni\" (Lake) stop, steps from the entrance. 4) Cost: a standard 90-minute integrated transit ticket is €1.20. — Or Taxi/Ride-share (fastest): hail a yellow taxi at Monastiraki Square or use Uber/FreeNow. ~35–45 min depending on traffic, €20–€30 one-way." },
  ]},
  { date: "Aug 27", city: "ios", title: "On to Ios", items: [
    { time: "9:00 AM", text: "Ferry from Athens · Olympic Champion Jet", booked: true, icon: "ferry", note: "From Monastiraki (Airbnb) to Piraeus port: take Metro Line 1 (Green) or Line 3 (Blue), both direct, no transfer, ~17-20 min, €1.20. SeaJets ferries depart from Gate E9, a 15-20 min walk from the metro station — be at the gate 30 min before departure. For a 9:00 AM ferry: be at the gate by 8:30 AM, leave the metro station by ~8:10 AM, catch the metro at Monastiraki by ~7:45-7:50 AM. Note: this metro line is a known pickpocket hotspot, especially during busy travel times." },
    { time: "4h 20m", text: "Journey time to Ios", booked: false },
    { time: "1:20 PM", text: "Arrive in Ios", booked: true, icon: "ferry", note: "Arrival at port of Ios. To reach hotel via bus or taxi right outside of port. Bus will cost €2.20 and taxi €10." },
    { time: "", text: "Check in — Hotel Petradi", booked: true, note: "Address: Mylopotas 840 01, Greece" },
    { time: "Sunset", text: "Panagia Gremiotissa Church for sunset", booked: false },
    { time: "9:30 PM", text: "Dinner at Katogi Greek Tapas", booked: false },
  ]},
  { date: "Aug 28", city: "ios", title: "Beach club day", items: [
    { time: "Morning", text: "Mylopotas Beach", booked: false },
    { time: "6:00 PM", text: "Far Out Beach Club", booked: true },
  ]},
  { date: "Aug 29", city: "ios", title: "Manganari Beach & dinner", items: [
    { time: "Morning", text: "Manganari Beach", booked: false },
    { time: "7:00 PM", text: "Ios Club — sunset dinner", booked: true, note: "Booking confirmed. Table AR2." },
    { time: "Late", text: "Pathos (optional, if up for it)", booked: false, note: "Taxi from Chora, ~5-7 min, roughly €5-8. No booking needed." },
  ]},
  { date: "Aug 30", city: "paros", title: "On to Paros", items: [
    { time: "3:00 PM", text: "Ferry to Paros", booked: true, icon: "ferry" },
    { time: "55m", text: "Travel time", booked: false },
    { time: "4:00 PM", text: "Arrive at Paros port, check in", booked: true, icon: "ferry" },
    { time: "", text: "Check in — Irene Rooms", booked: true, note: "Address: Vounali, Naoussa, Paros 84401, Greece. — By Public Bus (cheapest): catch it at the Parikia Intercity Bus Terminal, right beside the ferry port (~1 min walk from the central windmill). Runs every ~20 min in peak summer, aligned with ferry arrivals; trip takes ~20 min. Cost €2.20 — card only, buy at the terminal kiosk before boarding to avoid a higher fare with the driver. Get off at the final stop in Naoussa; Irene Rooms is a 5-minute walk uphill toward Vounali/Piperi beach. — By Taxi (fastest): taxi rank directly outside the port exit. ~10-15 min drive, €15-25 depending on luggage/season." },
    { time: "7:00 PM", text: "Lunaz — dinner (booked)", booked: true },
    { time: "Night", text: "Come Back cocktail bar", booked: false },
  ]},
  { date: "Aug 31", city: "paros", title: "Beach + shopping", items: [
    { time: "", text: "Cabana Beach Club", booked: false },
    { time: "", text: "Shopping in Parikia", booked: false },
  ]},
  { date: "Sep 1", city: "paros", title: "Boat tour", items: [
    { time: "3:30 PM", text: "Boat tour (4 hours)", booked: true, note: "Getting to Aliki from Naoussa — By bus (cheapest, slower): Naoussa → Parikia (~20 min, €2), change to Parikia → Aliki (~35 min, €2-3). Total with transfer: ~1h45m-1h55m. — By taxi (faster, pricier): direct, ~20-25 min, around €22-27 one-way." },
  ]},
  { date: "Sep 2", city: "budapest", title: "On to Budapest", items: [
    { time: "10:40 AM", text: "Leave Paros (ferry to Athens)", booked: true, icon: "ferry", note: "Getting to Parikia (Paros Port) from Naoussa — By bus: direct, no transfer, ~20 min, €2-3. Runs roughly every 3 hours, so check timing against the ferry. By taxi: faster, ~11 min, €11-14 — safer bet given the ferry departure, less risk of cutting it close." },
    { time: "1:50 PM", text: "Arrival in Athens", booked: true, icon: "ferry" },
    { time: "6:15 PM", text: "Flight from Athens to Budapest", booked: true, icon: "flight", note: "Getting from Piraeus port to the airport — Metro (Blue Line 3, direct, no transfer): ~58 min-1 hr, €9pp, every ~30 min. X96 Express Bus (cheapest): ~1h30m, €6pp, every 20-30 min, 24/7. Taxi (fastest): ~40 min, €50-70. You land at 1:50 PM with a 6:15 PM flight, so there's comfortable buffer — metro is a solid, cheap option here." },
    { time: "7:20 PM", text: "Arrive in Budapest", booked: true, icon: "flight", note: "Getting there from Budapest Airport: By public transport (cheapest) — 100E Airport Express Bus into the city (to Deák Ferenc tér), then a short metro/tram or walk; Metro lines 3 & 4 stop within a 4-min walk of the hotel. ~45-60 min total, a few euros. By taxi (easiest) — use the official Főtaxi rank only (avoid unofficial drivers in the terminal); ~30-45 min, around €25-35. Hotel also offers an airport shuttle for a surcharge if you'd rather pre-book door-to-door." },
    { time: "", text: "Check in — Amber Terrace Studios Downtown", booked: true, note: "Address: Veres Pálné utca 7, District V (Belváros-Lipótváros), Budapest 1053." },
    { time: "Night", text: "Dinner near the Danube / harbour", booked: false },
  ]},
  { date: "Sep 3", city: "budapest", title: "Pest side highlights", items: [
    { time: "Morning", text: "Walking tour of the city", booked: false },
    { time: "", text: "St. Stephen's Basilica", booked: false },
    { time: "", text: "Gerbeaud Café", booked: false, note: "Historic café on Vörösmarty tér — a short walk from the Basilica, good spot for coffee/pastries during the walking tour." },
    { time: "", text: "Chain Bridge", booked: false },
    { time: "5:45 PM", text: "Hungarian Parliament Building (booked)", booked: true },
    { time: "Night", text: "Szimpla Kert (ruin bar)", booked: false },
  ]},
  { date: "Sep 4", city: "budapest", title: "Buda side highlights", items: [
    { time: "", text: "Buda Castle", booked: false },
    { time: "", text: "Fisherman's Bastion", booked: false },
    { time: "8:30 PM", text: "Danube river cruise — Purpleliner (booked)", booked: true, note: "Meeting point: Batthyány tér, Dock 1/B." },
    { time: "Night", text: "White Raven Rooftop Bar", booked: false },
  ]},
  { date: "Sep 5", city: "budapest", title: "Sparty night", items: [
    { time: "Morning", text: "Chill day / shopping", booked: false },
    { time: "Evening", text: "High Note Rooftop Bar", booked: false },
    { time: "9:30 PM", text: "Sparty (booked)", booked: true },
  ]},
  { date: "Sep 6", city: "prague", title: "Side-trip tour: Budapest → Prague", items: [
    { time: "8:00 AM", text: "Leave Budapest — Side Trip Tour to Prague", booked: true, icon: "bus", note: "Meeting point is near Deák Ferenc tér metro station. 9-10 hour journey with stops along the way." },
    { time: "Stop 1", text: "Győr", booked: false },
    { time: "Stop 2", text: "Bratislava", booked: false },
    { time: "Stop 3", text: "Lednice Palace", booked: false },
    { time: "6–7 PM", text: "Arrive in Prague", booked: true, icon: "flight" },
    { time: "", text: "Check in — The Charles", booked: true },
  ]},
  { date: "Sep 7", city: "prague", title: "Old Town & river", items: [
    { time: "", text: "Old Town Square + Astronomical Clock", booked: false },
    { time: "", text: "Charles Bridge", booked: false },
    { time: "", text: "Wenceslas Square", booked: false },
    { time: "Afternoon", text: "Franz Kafka Rotating Head", booked: false, note: "Near Národní třída / Quadrio, a short walk from Wenceslas Square." },
    { time: "", text: "Dancing House", booked: false },
    { time: "", text: "(A)void Café", booked: false, note: "Right underneath Dancing House on the riverside embankment (Náplavka). Known for its giant rotating porthole door." },
    { time: "Night", text: "Dog Bar", booked: false, note: "Multi-room nightlife spot near Charles Bridge — foosball, live music, quirky rooms, and a resident dog." },
  ]},
  { date: "Sep 8", city: "prague", title: "Castle side", items: [
    { time: "", text: "Prague Castle + St. Vitus Cathedral", booked: false },
    { time: "", text: "Lesser Town (Malá Strana)", booked: false },
    { time: "", text: "Petřín Hill / Lookout Tower", booked: false },
    { time: "Night", text: "Karlovy Lázně", booked: false, note: "Biggest club in Central Europe — 5 floors, each with a different music genre." },
  ]},
  { date: "Sep 9", city: "krumlov", title: "Last Prague morning → Krumlov", items: [
    { time: "9:30 AM", text: "Taxi to Florenc Bus Station", booked: false, note: "From The Charles hotel, ~10-15 min by taxi, around 200-300 CZK. Alternative: metro — change trains once (Line A to Náměstí Republiky, then Line B to Florenc) and about a 10 min walk overall." },
    { time: "10:00 AM", text: "FlixBus to Český Krumlov", booked: true, icon: "bus", note: "Departs from Prague Florenc Central Bus Station. Journey time 3h15m." },
    { time: "1:15 PM", text: "Arrive in Český Krumlov", booked: true, icon: "bus" },
    { time: "", text: "Check in — Arcadie Hotel & Apartment", booked: true },
    { time: "Afternoon", text: "Wander the old town + castle grounds", booked: false },
  ]},
  { date: "Sep 10", city: "hallstatt", title: "Krumlov morning → Hallstatt", items: [
    { time: "9:00 AM", text: "Pickup by private car from our hotel", booked: true, icon: "bus" },
    { time: "1:00 PM", text: "Arrive in Hallstatt", booked: true, icon: "bus" },
    { time: "", text: "Check in — Pension Bergfried", booked: true },
    { time: "Afternoon", text: "Lakeside walk through the village", booked: false },
  ]},
  { date: "Sep 11", city: "vienna", title: "Hallstatt morning → Vienna", items: [
    { time: "10:15 AM", text: "Ferry across the lake to the train station", booked: false, note: "The train station is on the opposite side of the lake, reached only by ferry. Walk to the town ferry dock (by the Evangelische Pfarrkirche, near Market Square). Crossing takes ~10-15 min, €4 one-way, cash only. Ferry timing is synced to the train." },
    { time: "11:09 AM", text: "Train REX 70 from Hallstatt train station", booked: true, icon: "bus", note: "Catch REX 70 from Platform 1 in Hallstatt. Arrive in Attnang on Platform 1, then go to Platform 2 to catch IC 645." },
    { time: "3:00 PM", text: "Arrive in Vienna", booked: true, icon: "bus", note: "Getting to the hotel: taxi from Wien Hauptbahnhof, roughly 15-20 min, around €15-20." },
    { time: "", text: "Check in — Four Points Flex by Sheraton Vienna Mariahilf", booked: true },
    { time: "Evening", text: "Stroll the Innere Stadt", booked: false },
  ]},
  { date: "Sep 12", city: "vienna", title: "Palaces & markets", items: [
    { time: "", text: "Schönbrunn Palace", booked: false },
    { time: "", text: "Naschmarkt", booked: false },
  ]},
  { date: "Sep 13", city: "vienna", title: "Cathedral & art", items: [
    { time: "", text: "St. Stephen's Cathedral", booked: false },
    { time: "", text: "Belvedere Palace", booked: false },
    { time: "", text: "Graben shopping street", booked: false },
  ]},
  { date: "Sep 14", city: "vienna", title: "Free day", items: [
    { time: "", text: "Vienna State Opera / last-minute shopping", booked: false },
    { time: "", text: "Pack up", booked: false },
  ]},
  { date: "Sep 15", city: null, title: "Fly home", items: [
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

/* ---------------------------------------------------------------
   REEL / CONTENT-SHOOT IDEAS
--------------------------------------------------------------- */

const REEL_IDEAS = {
  athens: {
    landmark: [
      { title: "Acropolis at golden hour", desc: "Arrive right at open or late afternoon light — the classic shot, worth prioritizing over a midday visit." },
      { title: "Mount Lycabettus sunset panorama", desc: "Slow pan/reveal over the whole city as the sun goes down — one of the best wide shots in Athens." },
      { title: "Monastiraki flea market walk-through", desc: "Handheld POV weaving through the stalls — good b-roll for a market-chaos montage." },
    ],
    food: [
      { title: "Souvlaki/gyro rapid montage", desc: "Quick cuts across a few Plaka stands, one bite per clip, fast cuts." },
      { title: "Loukoumades close-up", desc: "Honey-drenched Greek donuts — an easy ASMR-style bite shot." },
      { title: "Freddo cappuccino \"how Greeks actually drink coffee\"", desc: "A quick explainer/reaction bit — freddo culture reads as genuinely novel to most viewers." },
    ],
    vlog: [{ title: "A day in ancient Athens", desc: "Acropolis → Ancient Agora → Plaka lunch → Monastiraki, stitched as one narrated day." }],
    duo: [
      { title: "Silhouette at the Parthenon, sunset", desc: "Classic couple silhouette against the columns." },
      { title: "Rating the souvlaki stands", desc: "A light duo bit — reacting to and ranking a few stands together." },
    ],
  },
  ios: {
    landmark: [
      { title: "Pathos sunset", desc: "The single most iconic Cyclades sunset shot on this leg — worth a tripod if you have one." },
      { title: "Chora windmills, golden hour", desc: "Slow walk past the windmills as the light turns warm." },
    ],
    food: [
      { title: "Fresh seafood by the port", desc: "A plated close-up shot — port-side seafood is very visual." },
      { title: "Far Out Beach Club snacks/drinks", desc: "Quick beach-club-day montage clip." },
    ],
    vlog: [{ title: "24 hours in Ios", desc: "Beach club day → windmill sunset → port dinner, one continuous day arc." }],
    duo: [
      { title: "Jump shot / silhouette at Pathos", desc: "Timed right at sunset for the best light." },
      { title: "Beach club POV day", desc: "Handheld, candid, low-effort — the setting does the work." },
    ],
  },
  paros: {
    landmark: [
      { title: "Naoussa fishing village walk", desc: "Colorful boats, whitewashed streets — very reel-native visually." },
      { title: "Boat tour on-water clips", desc: "Onboard POV shots throughout the day — even without a drone, movement + water reads well." },
    ],
    food: [
      { title: "Fresh seafood in Naoussa", desc: "Plated shot with the harbor in the background." },
      { title: "Cocktails at Come Back", desc: "Golden-hour drink shot to close out the Naoussa evening." },
    ],
    vlog: [{ title: "Boat day in Paros", desc: "Boat tour → Naoussa lunch → Cabana Beach Club evening." }],
    duo: [{ title: "Parikia shopping street outfit walk", desc: "The narrow whitewashed lanes are a natural walk-and-talk backdrop." }],
  },
  budapest: {
    landmark: [
      { title: "Fisherman's Bastion at sunset", desc: "POV walk up through the turrets ending on a still shot over the Danube/Parliament skyline." },
      { title: "Chain Bridge crossing, transition cut", desc: "Outfit or angle transition mid-bridge, landing on Buda Castle or the funicular." },
      { title: "Parliament Building, blue hour", desc: "Arrive right as the lights turn on for a slow pan/reveal — a classic Budapest format." },
    ],
    food: [
      { title: "\"What we ate in Budapest\" montage", desc: "Goulash, langos, Gerbeaud pastries, a drink at Szimpla — one clip per bite, fast cuts." },
      { title: "Szimpla Kert \"come with me\"", desc: "Handheld walk-through of the mismatched ruin-bar decor and courtyard." },
    ],
    vlog: [{ title: "A day in Pest", desc: "Parliament → St. Stephen's Basilica → Chain Bridge → dinner along the Danube, one narrated day." }],
    duo: [
      { title: "Danube river cruise, night shot", desc: "Lit-up Parliament from the water — worth a steady/tripod shot over handheld." },
      { title: "Rating the ruin bars", desc: "A duo reaction bit — ties naturally into Sparty night already on the itinerary." },
      { title: "Széchenyi Thermal Bath GRWU", desc: "The yellow bathhouse architecture and steam are visually rich even before getting in." },
    ],
  },
  prague: {
    landmark: [
      { title: "Charles Bridge at sunrise", desc: "Already a mustgo on the itinerary — go early for the empty-bridge shot before crowds arrive." },
      { title: "Astronomical Clock chiming", desc: "Film the crowd's reaction on the hour, not just the clock itself." },
    ],
    food: [
      { title: "Trdelník street-stand ASMR", desc: "Close-up on the cinnamon-sugar pastry being rolled and grilled." },
      { title: "Traditional pub goulash & dumplings", desc: "Cozy interior shot — a good contrast to the outdoor landmark clips." },
    ],
    vlog: [{ title: "A day in Old Town Prague", desc: "Astronomical Clock → Charles Bridge → Castle → dinner." }],
    duo: [
      { title: "Charles Bridge sunrise, just the two of you", desc: "The payoff for the early wake-up — an empty bridge is rare otherwise." },
      { title: "Dancing House quirky photo op", desc: "A fun, less-posed contrast to the classic landmark shots." },
    ],
  },
  krumlov: {
    landmark: [
      { title: "Castle Tower viewpoint", desc: "The overhead shot of the whole fairytale town — the single best frame in Krumlov." },
      { title: "River raft/canoe POV", desc: "On-water clips floating right through the old town." },
    ],
    food: [{ title: "Riverside café shot", desc: "Frame the castle in the background while you sit." }],
    vlog: [{ title: "Fairytale town in a day", desc: "Castle climb → old town wander → river float — it's a short stop, so keep this tight." }],
    duo: [{ title: "Couple shot from the Castle Tower", desc: "Overlooking the town — the view does the work here." }],
  },
  hallstatt: {
    landmark: [
      { title: "Hallstatt Skywalk", desc: "The single most iconic lake-village overhead shot in Austria." },
      { title: "Classic lakeside photo spot", desc: "Church + lake reflection — recreate the postcard shot everyone knows." },
    ],
    food: [{ title: "Lakeside café with the view", desc: "Let the lake do the background work while you eat." }],
    vlog: [{ title: "Why everyone's obsessed with Hallstatt", desc: "Skywalk → salt mine → lakeside walk." }],
    duo: [{ title: "Recreate the postcard photo, together", desc: "Same lakeside spot everyone shoots — worth doing anyway, it's iconic for a reason." }],
  },
  vienna: {
    landmark: [
      { title: "Schönbrunn Palace gardens, wide shot", desc: "The symmetry of the gardens reads very well in a single wide frame." },
      { title: "St. Stephen's Cathedral roof tiles, close-up", desc: "The patterned tile roof is an underrated detail shot most people miss." },
    ],
    food: [
      { title: "Sachertorte + coffee at a classic café", desc: "The quintessential Vienna food reel — plate + café interior." },
      { title: "Naschmarkt stall montage", desc: "Quick cuts across a few market stalls." },
    ],
    vlog: [{ title: "Last stop: Vienna — trip wrap-up", desc: "Since this is the final city, a highlight-reel style recap of the whole trip closes out naturally here." }],
    duo: [{ title: "Palace garden walk", desc: "A calm, wide walk-and-talk shot to end the trip's content on." }],
  },
};

/* ---------------------------------------------------------------
   MAP DATA
   Landmark/area coordinates are accurate; hotel and small-venue
   pins are best-effort approximations — verify before navigating.
--------------------------------------------------------------- */

const CITY_MAP = {
  athens: {
    center: [37.965, 23.735],
    zoom: 12,
    pins: [
      { name: "Acropolis & Parthenon", lat: 37.9715, lng: 23.7267, type: "sight" },
      { name: "Acropolis Museum", lat: 37.9684, lng: 23.7287, type: "sight" },
      { name: "Ancient Agora", lat: 37.9755, lng: 23.7222, type: "sight" },
      { name: "Plaka neighbourhood", lat: 37.9722, lng: 23.7297, type: "area" },
      { name: "Psyrri neighbourhood", lat: 37.9788, lng: 23.7239, type: "area" },
      { name: "Monastiraki flea market", lat: 37.9765, lng: 23.7256, type: "area" },
      { name: "Lake Vouliagmeni", lat: 37.8168, lng: 23.7778, type: "sight" },
      { name: "Panathenaic Stadium", lat: 37.9686, lng: 23.7414, type: "sight" },
      { name: "Mount Lycabettus", lat: 37.9779, lng: 23.7444, type: "sight" },
    ],
  },
  ios: {
    center: [36.722, 25.28],
    zoom: 12,
    pins: [
      { name: "Hotel Petradi", lat: 36.713, lng: 25.2845, type: "hotel" },
      { name: "Far Out Beach Club", lat: 36.7104, lng: 25.2833, type: "beach" },
      { name: "Mylopotas Beach", lat: 36.7115, lng: 25.285, type: "beach" },
      { name: "Chora village + windmills", lat: 36.7217, lng: 25.2822, type: "area" },
      { name: "Pathos (sunset spot)", lat: 36.7239, lng: 25.28, type: "sight" },
      { name: "Homer's Tomb", lat: 36.7601, lng: 25.2419, type: "sight" },
    ],
  },
  paros: {
    center: [37.09, 25.19],
    zoom: 11,
    pins: [
      { name: "Irene Rooms", lat: 37.124, lng: 25.2378, type: "hotel" },
      { name: "Parikia old town", lat: 37.0844, lng: 25.1489, type: "area" },
      { name: "Naoussa fishing village", lat: 37.1246, lng: 25.2372, type: "area" },
      { name: "Lefkes mountain village", lat: 37.0397, lng: 25.1878, type: "area" },
      { name: "Cabana Beach Club", lat: 37.091, lng: 25.152, type: "beach" },
    ],
  },
  budapest: {
    center: [47.5, 19.045],
    zoom: 12,
    pins: [
      { name: "Amber Terrace Studios Downtown", lat: 47.4925, lng: 19.0567, type: "hotel" },
      { name: "Hungarian Parliament Building", lat: 47.5076, lng: 19.0458, type: "sight" },
      { name: "St. Stephen's Basilica", lat: 47.5006, lng: 19.0532, type: "sight" },
      { name: "Chain Bridge", lat: 47.4979, lng: 19.0402, type: "sight" },
      { name: "Buda Castle", lat: 47.4964, lng: 19.0398, type: "sight" },
      { name: "Fisherman's Bastion", lat: 47.5022, lng: 19.0347, type: "sight" },
      { name: "Széchenyi Thermal Bath", lat: 47.5189, lng: 19.0827, type: "sight" },
      { name: "Szimpla Kert (ruin bar)", lat: 47.4973, lng: 19.0625, type: "food" },
    ],
  },
  prague: {
    center: [50.086, 14.415],
    zoom: 13,
    pins: [
      { name: "The Charles (hotel, approx.)", lat: 50.0879, lng: 14.4041, type: "hotel" },
      { name: "Old Town Square", lat: 50.087, lng: 14.4207, type: "sight" },
      { name: "Charles Bridge", lat: 50.0865, lng: 14.4114, type: "sight" },
      { name: "Wenceslas Square", lat: 50.081, lng: 14.4266, type: "sight" },
      { name: "Prague Castle + St. Vitus Cathedral", lat: 50.091, lng: 14.4009, type: "sight" },
      { name: "Lesser Town (Malá Strana)", lat: 50.0879, lng: 14.4041, type: "area" },
      { name: "Petřín Hill", lat: 50.0837, lng: 14.395, type: "sight" },
      { name: "Jewish Quarter", lat: 50.0913, lng: 14.4187, type: "area" },
      { name: "Dancing House", lat: 50.0752, lng: 14.4136, type: "sight" },
      { name: "Karlovy Lázně", lat: 50.0862, lng: 14.4133, type: "food" },
    ],
  },
  krumlov: {
    center: [48.812, 14.315],
    zoom: 15,
    pins: [
      { name: "Český Krumlov Castle", lat: 48.8115, lng: 14.3151, type: "sight" },
      { name: "Old town", lat: 48.8127, lng: 14.3175, type: "area" },
      { name: "Egon Schiele Art Centrum", lat: 48.8109, lng: 14.3134, type: "sight" },
    ],
  },
  hallstatt: {
    center: [47.561, 13.645],
    zoom: 15,
    pins: [
      { name: "Village square + church", lat: 47.5622, lng: 13.6493, type: "area" },
      { name: "Hallstatt Skywalk", lat: 47.5601, lng: 13.6437, type: "sight" },
      { name: "Hallstatt Salt Mine", lat: 47.5591, lng: 13.642, type: "sight" },
      { name: "Lakeside promenade", lat: 47.5615, lng: 13.65, type: "area" },
    ],
  },
  vienna: {
    center: [48.198, 16.36],
    zoom: 12,
    pins: [
      { name: "Four Points Flex by Sheraton (hotel, approx.)", lat: 48.1963, lng: 16.3489, type: "hotel" },
      { name: "Schönbrunn Palace", lat: 48.1847, lng: 16.3122, type: "sight" },
      { name: "St. Stephen's Cathedral", lat: 48.2085, lng: 16.3731, type: "sight" },
      { name: "Belvedere Palace", lat: 48.1917, lng: 16.3805, type: "sight" },
      { name: "Naschmarkt", lat: 48.1974, lng: 16.3651, type: "area" },
      { name: "Graben shopping street", lat: 48.2089, lng: 16.3696, type: "area" },
      { name: "Vienna State Opera", lat: 48.2035, lng: 16.3691, type: "sight" },
      { name: "Museumsquartier", lat: 48.2036, lng: 16.3591, type: "sight" },
    ],
  },
};

const CATEGORIES = ["Flights", "Accommodation", "Food", "Activities", "Transport", "Shopping", "Other"];
const CURRENCIES = ["AUD", "EUR", "HUF", "CZK", "USD"];
const CURRENCY_SYMBOL = { AUD: "$", EUR: "€", HUF: "Ft", CZK: "Kč", USD: "$" };

const EXPENSE_CATEGORY_KEYWORDS = {
  Flights: ["flight", "airline", "airfare", "boarding"],
  Accommodation: ["hotel", "hostel", "airbnb", "accommodation", "room", "stay", "check-in", "checkin"],
  Food: ["food", "lunch", "dinner", "breakfast", "restaurant", "cafe", "café", "coffee", "snack", "meal", "taverna", "drinks", "bar", "brunch"],
  Transport: ["taxi", "uber", "train", "bus", "tram", "metro", "ferry", "fuel", "petrol", "parking", "transport", "transfer"],
  Activities: ["museum", "tour", "ticket", "activity", "entrance", "attraction", "show", "cruise", "excursion"],
  Shopping: ["shop", "souvenir", "shopping", "market", "store", "clothes", "gift"],
};

const EXPENSE_CURRENCY_HINTS = [
  { re: /\busd\b|us dollars?|american dollars?/i, currency: "USD" },
  { re: /\baud\b|australian dollars?/i, currency: "AUD" },
  { re: /€|\beur\b|euros?/i, currency: "EUR" },
  { re: /\bhuf\b|forints?/i, currency: "HUF" },
  { re: /\bczk\b|korunas?|crowns?/i, currency: "CZK" },
  { re: /\$/, currency: "AUD" },
];

const EXPENSE_CITY_HINTS = [
  { re: /athens/i, id: "athens" },
  { re: /\bios\b/i, id: "ios" },
  { re: /paros/i, id: "paros" },
  { re: /budapest/i, id: "budapest" },
  { re: /prague/i, id: "prague" },
  { re: /(cesky|český)?\s*krumlov/i, id: "krumlov" },
  { re: /hallstatt/i, id: "hallstatt" },
  { re: /vienna/i, id: "vienna" },
];

function detectCurrency(text) {
  for (const hint of EXPENSE_CURRENCY_HINTS) {
    if (hint.re.test(text)) return hint.currency;
  }
  return "AUD";
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(EXPENSE_CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "Other";
}

function detectCity(text) {
  for (const hint of EXPENSE_CITY_HINTS) {
    if (hint.re.test(text)) return hint.id;
  }
  return "";
}

function parseExpenseLocal(text) {
  const amountMatch = text.match(/\d+(?:[.,]\d+)?/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(",", ".")) : 0;
  return {
    description: text.trim(),
    amount,
    currency: detectCurrency(text),
    category: detectCategory(text),
    city: detectCity(text),
  };
}

const CATEGORY_COLOR_VAR = {
  Flights: "var(--cat-flights)",
  Accommodation: "var(--cat-accommodation)",
  Food: "var(--cat-food)",
  Activities: "var(--cat-activities)",
  Transport: "var(--cat-transport)",
  Shopping: "var(--cat-shopping)",
  Other: "var(--cat-other)",
};

// Approximate rates (1 AUD = ...), used only until a live fetch succeeds or as an offline fallback.
const FX_FALLBACK_RATES = { AUD: 1, EUR: 0.6, HUF: 236, CZK: 14.6, USD: 0.65 };
const FX_STORAGE_KEY = "europe-trip-fx-rates";
// CDN-backed mirrors of the same free, keyless dataset — tried in order so one host
// being unreachable (blocked network, regional outage) doesn't take the feature down.
const FX_API_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aud.json",
  "https://latest.currency-api.pages.dev/v1/currencies/aud.json",
];

/* ---------------------------------------------------------------
   PACKING LIST
   Quantities are per person — pack two of everything listed as
   "per person" for you and your wife. Spans ~30°C Greek island
   heat down to ~14°C alpine evenings in Hallstatt.
--------------------------------------------------------------- */

const PACKING_LIST = [
  {
    id: "clothing",
    title: "Clothing (2 people)",
    items: [
      "Breathable T-shirts/tops — 6-7 per person",
      "Shorts — 3-4 per person, for Athens/Ios/Paros heat",
      "Light trousers or jeans — 2 per person, for Budapest/Prague/Krumlov/Hallstatt/Vienna",
      "One smart-casual outfit each — for Ios Club, Lunaz, the Danube river cruise",
      "Light cardigan or jumper — 1-2 per person, for cooler evenings from Budapest onward",
      "Packable rain jacket / windbreaker — 1 per person, for Hallstatt drizzle and Meltemi winds in Paros",
      "Swimwear — 2 sets per person, for Ios and Paros beach days",
      "Sarong or beach cover-up",
      "Sleepwear",
      "Underwear & socks — 10-12 pairs per person",
      "A shoulders/knees-covering layer each — for churches in Athens, Budapest, Prague, Vienna",
    ],
  },
  {
    id: "footwear",
    title: "Footwear (2 people)",
    items: [
      "Comfortable closed, grippy walking shoes — essential for the Acropolis' slippery marble and the cobblestones in Krumlov and Prague",
      "Sandals or flip-flops — for beach days and boat trips",
      "One pair of smart-casual shoes each — for dinners out",
    ],
  },
  {
    id: "documents",
    title: "Documents & money",
    items: [
      "Both passports — check 6+ months validity",
      "Printed or offline copies of flight/ferry/train tickets and hotel confirmations",
      "Travel insurance details for both of you",
      "Driver's licences, if renting a car anywhere",
      "Cash — Euro, Hungarian Forint, Czech Koruna (small notes for Ios/Paros beach bars and Český Krumlov, which are often cash-preferred)",
      "Two payment cards each, in case one gets blocked",
      "Digital or photocopied backups of both passports, stored separately from the originals",
    ],
  },
  {
    id: "electronics",
    title: "Electronics",
    items: [
      "Phone chargers for both of you, plus a shared power bank",
      "EU-style Type C/F plug adapters — covers Greece, Hungary, Czechia, and Austria",
      "Headphones",
      "Camera, if you're not just shooting on your phones",
      "Offline maps and entertainment downloaded ahead of the ferry/train legs",
    ],
  },
  {
    id: "health",
    title: "Toiletries & health",
    items: [
      "High-SPF sunscreen — the Athens/island sun is intense in late August",
      "After-sun or aloe vera gel",
      "Insect repellent",
      "Basic first-aid kit and any prescription medication for both of you, packed with a few spare days' buffer",
      "Motion sickness tablets — for the Athens–Ios–Paros ferries",
      "Shared and individual toiletry bags — toothbrush/paste, deodorant, skincare",
      "Hand sanitiser and tissues",
    ],
  },
  {
    id: "extras",
    title: "Extras & travel gear",
    items: [
      "Reusable water bottle each",
      "A day bag or small backpack for excursions",
      "Packing cubes — makes the 8-city hop much easier to live out of",
      "Travel-size laundry detergent and a universal sink plug — handy for a 3-week trip",
      "Sunglasses and a sun hat each",
      "Neck pillow and eye mask each — for the long Sydney–Doha–Athens flights",
      "A small luggage padlock each",
    ],
  },
];

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

function resizeImageToBase64(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// iOS-style edge-swipe-back: a rightward drag starting within a thin strip
// at the left edge of the screen triggers onBack. Scoped to the edge (not
// the whole screen) so it never fights normal scrolling, the cities rail,
// or the map's own drag/pan.
function useEdgeSwipeBack(onBack, enabled) {
  const startRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const EDGE = 24;
    const THRESHOLD = 70;
    const MAX_VERTICAL = 60;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      startRef.current = t.clientX <= EDGE ? { x: t.clientX, y: t.clientY } : null;
      firedRef.current = false;
    };
    const onTouchMove = (e) => {
      if (!startRef.current || firedRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = Math.abs(t.clientY - startRef.current.y);
      if (dy > MAX_VERTICAL) {
        startRef.current = null;
        return;
      }
      if (dx > THRESHOLD) {
        firedRef.current = true;
        onBack();
      }
    };
    const onTouchEnd = () => {
      startRef.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onBack, enabled]);
}

/* ---------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------- */

export default function App() {
  const [homePhase, setHomePhase] = useState("home"); // "home" | "folding" | "app"
  const [tab, setTab] = useState("hub");
  const [budget, setBudget] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [theme, setTheme] = useState(
    () => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light")
  );
  const [cloudTripId, setCloudTripId] = useState(() => getStoredTripId());
  const [tripCode, setTripCode] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [reelsCity, setReelsCity] = useState(null);

  const handleSwipeBack = useCallback(() => {
    if (tab === "reels" && reelsCity) {
      setReelsCity(null);
      return;
    }
    if (tab !== "hub") setTab("hub");
  }, [tab, reelsCity]);

  useEdgeSwipeBack(handleSwipeBack, homePhase === "app");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("europe-trip-theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Load from the cloud if paired, otherwise from local storage; fall back to
  // the local cache if a paired device happens to load with no connection.
  useEffect(() => {
    (async () => {
      if (cloudTripId) {
        setSyncStatus("syncing");
        try {
          const trip = await fetchSharedTrip(cloudTripId);
          setBudget(trip.budget || []);
          setChecklist(trip.checklist || {});
          setTripCode(trip.code || null);
          setSyncStatus("synced");
        } catch (e) {
          const b = loadFromStorage("europe-trip-budget");
          if (b) setBudget(b);
          const c = loadFromStorage("europe-trip-checklist");
          if (c) setChecklist(c);
          setSyncStatus("error");
        }
      } else {
        const b = loadFromStorage("europe-trip-budget");
        if (b) setBudget(b);
        const c = loadFromStorage("europe-trip-checklist");
        if (c) setChecklist(c);
      }
      setLoaded(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!loaded || !cloudTripId) return;
    updateSharedTrip(cloudTripId, { budget }).then(
      () => setSyncStatus("synced"),
      () => setSyncStatus("error")
    );
  }, [budget, loaded, cloudTripId]);

  useEffect(() => {
    if (!loaded || !cloudTripId) return;
    updateSharedTrip(cloudTripId, { checklist }).then(
      () => setSyncStatus("synced"),
      () => setSyncStatus("error")
    );
  }, [checklist, loaded, cloudTripId]);

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [customCrossCityIdeas, setCustomCrossCityIdeas] = useState(
    () => loadFromStorage("europe-trip-reel-ideas-custom") || []
  );
  useEffect(() => {
    saveToStorage("europe-trip-reel-ideas-custom", customCrossCityIdeas);
  }, [customCrossCityIdeas]);
  const addCrossCityIdea = (title) => {
    setCustomCrossCityIdeas((prev) => [...prev, { id: `custom-${Date.now()}`, title, desc: "" }]);
  };
  const removeCrossCityIdea = (id) => {
    setCustomCrossCityIdeas((prev) => prev.filter((idea) => idea.id !== id));
  };

  const [customPerCityIdeas, setCustomPerCityIdeas] = useState(
    () => loadFromStorage("europe-trip-reel-ideas-percity-custom") || {}
  );
  useEffect(() => {
    saveToStorage("europe-trip-reel-ideas-percity-custom", customPerCityIdeas);
  }, [customPerCityIdeas]);
  const addPerCityIdea = (cityId, title) => {
    setCustomPerCityIdeas((prev) => ({
      ...prev,
      [cityId]: [...(prev[cityId] || []), { id: `custom-${Date.now()}`, title, desc: "" }],
    }));
  };
  const removePerCityIdea = (cityId, id) => {
    setCustomPerCityIdeas((prev) => ({
      ...prev,
      [cityId]: (prev[cityId] || []).filter((idea) => idea.id !== id),
    }));
  };

  const [reminders, setReminders] = useState(() => loadFromStorage("europe-trip-reminders") || []);
  useEffect(() => {
    saveToStorage("europe-trip-reminders", reminders);
  }, [reminders]);
  const addReminder = (reminder) => {
    setReminders((prev) => [...prev, { ...reminder, id: `rem-${Date.now()}`, addedToCalendar: false }]);
  };
  const removeReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };
  const markReminderAdded = (id) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, addedToCalendar: true } : r)));
  };

  const addExpense = (entry) => {
    setBudget((prev) => [...prev, { ...entry, id: Date.now().toString() }]);
  };
  const removeExpense = (id) => {
    setBudget((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCreateTrip = async () => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const { id, code } = await createSharedTrip(budget, checklist);
      setCloudTripId(id);
      setTripCode(code);
      setSyncStatus("synced");
    } catch (e) {
      setSyncError(e?.message || String(e));
      setSyncStatus("error");
    }
  };

  const handleJoinTrip = async (code) => {
    const trip = await joinSharedTrip(code); // lets SyncPanel show its own error on failure
    setCloudTripId(trip.id);
    setBudget(trip.budget || []);
    setChecklist(trip.checklist || {});
    setTripCode(code.trim().toUpperCase());
    setSyncStatus("synced");
  };

  const handleLeaveSync = () => {
    clearStoredTripId();
    setCloudTripId(null);
    setTripCode(null);
    setSyncStatus("idle");
  };

  const activeCity = CITIES.find((c) => c.id === tab);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content { animation: fadeInUp 220ms ease-out; }

        @keyframes checkPop {
          0% { transform: scale(0.7); }
          60% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        .check-pop { animation: checkPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1); }

        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-backdrop { animation: modalFadeIn 180ms ease-out; }
        .modal-panel { animation: modalPanelIn 220ms cubic-bezier(0.22, 1, 0.36, 1); }

        .route-glow {
          background: linear-gradient(90deg, transparent, var(--text-primary), transparent);
          background-size: 200% 100%;
          opacity: 0.45;
          animation: routeTravel 6s linear infinite;
        }
        @keyframes routeTravel {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        @keyframes homeFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .home-screen {
          animation: homeFadeIn 400ms ease-out;
          transform-origin: top center;
          backface-visibility: hidden;
        }

        @keyframes foldAway {
          0% { transform: rotateX(0deg) scale(1); opacity: 1; }
          100% { transform: rotateX(-100deg) scale(0.92); opacity: 0; }
        }
        .home-folding { animation: foldAway 650ms cubic-bezier(0.55, 0, 0.1, 1) forwards; }

        @media (prefers-reduced-motion: reduce) {
          .tab-content, .check-pop { animation: none !important; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {homePhase !== "app" && (
        <HomeScreen
          onEnter={() => setHomePhase("folding")}
          folding={homePhase === "folding"}
          onFoldEnd={() => setHomePhase("app")}
        />
      )}

      {homePhase !== "home" && (
        <>
          <div className="sticky top-0 z-20 bg-[var(--bg)]">
            <div className="bg-[var(--surface)]" style={{ boxShadow: "0 2px 6px rgba(0,0,0,.06)" }}>
              <Header
                saveState={saveState}
                theme={theme}
                toggleTheme={toggleTheme}
                cloudTripId={cloudTripId}
                syncStatus={syncStatus}
                onOpenSync={() => setSyncPanelOpen(true)}
              />
              <TabBar tab={tab} setTab={setTab} />
            </div>
            <div
              aria-hidden="true"
              className="h-[10px] w-full"
              style={{
                background: "var(--surface)",
                clipPath:
                  "polygon(0 0,100% 0,100% 30%,97% 100%,94% 30%,91% 100%,88% 30%,85% 100%,82% 30%,79% 100%,76% 30%,73% 100%,70% 30%,67% 100%,64% 30%,61% 100%,58% 30%,55% 100%,52% 30%,49% 100%,46% 30%,43% 100%,40% 30%,37% 100%,34% 30%,31% 100%,28% 30%,25% 100%,22% 30%,19% 100%,16% 30%,13% 100%,10% 30%,7% 100%,4% 30%,1% 100%,0 30%)",
              }}
            />
          </div>

          <main className="max-w-3xl mx-auto px-4 pb-24 pt-5">
            <div key={tab} className="tab-content">
              {tab === "overview" && (
                <OverviewTab checklist={checklist} toggleCheck={toggleCheck} />
              )}
              {tab === "budget" && (
                <BudgetTab budget={budget} addExpense={addExpense} removeExpense={removeExpense} />
              )}
              {tab === "convert" && <ConverterTab />}
              {tab === "pack" && <PackingTab checklist={checklist} toggleCheck={toggleCheck} />}
              {tab === "docs" && (
                <DocsTab cloudTripId={cloudTripId} onOpenSync={() => setSyncPanelOpen(true)} />
              )}
              {tab === "ask" && <AskTab />}
              {tab === "reels" && (
                <ReelsTab
                  selectedCityId={reelsCity}
                  setSelectedCityId={setReelsCity}
                  customCrossCityIdeas={customCrossCityIdeas}
                  customPerCityIdeas={customPerCityIdeas}
                  checklist={checklist}
                  toggleCheck={toggleCheck}
                  onAddIdea={addCrossCityIdea}
                  onRemoveIdea={removeCrossCityIdea}
                  onAddPerCityIdea={addPerCityIdea}
                  onRemovePerCityIdea={removePerCityIdea}
                />
              )}
              {tab === "reminders" && (
                <RemindersTab
                  reminders={reminders}
                  onAdd={addReminder}
                  onRemove={removeReminder}
                  onMarkAdded={markReminderAdded}
                />
              )}
              {activeCity && (
                <CityTab city={activeCity} checklist={checklist} toggleCheck={toggleCheck} />
              )}
            </div>
          </main>

          {syncPanelOpen && (
            <SyncPanel
              onClose={() => setSyncPanelOpen(false)}
              cloudTripId={cloudTripId}
              tripCode={tripCode}
              syncStatus={syncStatus}
              syncError={syncError}
              onCreate={handleCreateTrip}
              onJoin={handleJoinTrip}
              onLeave={handleLeaveSync}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   TRIP STATUS
--------------------------------------------------------------- */

function parseTripDate(dateStr) {
  return new Date(`${dateStr}, ${TRIP_YEAR}`);
}

function getTripStatus() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseTripDate(ITINERARY[0].date);
  const end = parseTripDate(ITINERARY[ITINERARY.length - 1].date);
  const totalDays = ITINERARY.length;

  if (today < start) {
    const daysUntil = Math.round((start - today) / 86400000);
    return { phase: "before", daysUntil };
  }
  if (today > end) {
    return { phase: "after" };
  }
  const dayIndex = Math.round((today - start) / 86400000);
  const todayEntry = ITINERARY[dayIndex];
  const city = todayEntry?.city ? CITIES.find((c) => c.id === todayEntry.city) : null;
  return { phase: "during", dayOfTrip: dayIndex + 1, totalDays, cityName: city ? city.name : null };
}

function tripStatusText(status) {
  if (status.phase === "before") {
    return status.daysUntil === 1 ? "1 day until departure" : `${status.daysUntil} days until departure`;
  }
  if (status.phase === "during") {
    return `Day ${status.dayOfTrip} of ${status.totalDays}${status.cityName ? ` — in ${status.cityName}` : ""}`;
  }
  return "Trip complete — hope it was amazing! ✈️";
}

// The first itinerary item's own time (the Sydney departure flight) gives the
// live countdown a real target instant, not just a midnight date boundary.
function getDepartureInstant() {
  const day = ITINERARY[0];
  const flightTime = day.items[0]?.time;
  const base = parseTripDate(day.date);
  if (!flightTime) return base;
  const match = flightTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return base;
  let [, h, m, ampm] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (/pm/i.test(ampm) && h !== 12) h += 12;
  if (/am/i.test(ampm) && h === 12) h = 0;
  base.setHours(h, m, 0, 0);
  return base;
}

function getCountdownParts(target, now) {
  const diffMs = target - now;
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ---------------------------------------------------------------
   SWIPE TO ENTER
--------------------------------------------------------------- */

const SWIPE_THUMB = 52;
const SWIPE_TRACK_PAD = 4;
const SWIPE_THRESHOLD = 0.8;

function SwipeToEnter({ onEnter }) {
  const trackRef = useRef(null);
  const maxXRef = useRef(0);
  const startXRef = useRef(0);
  const draggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const width = track.getBoundingClientRect().width - SWIPE_THUMB - SWIPE_TRACK_PAD * 2;
    maxXRef.current = Math.max(0, width);
    return maxXRef.current;
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const complete = useCallback(() => {
    if (triggered) return;
    setTriggered(true);
    setDragging(false);
    setDragX(maxXRef.current || measure());
    onEnter();
  }, [triggered, onEnter, measure]);

  const cancel = useCallback(() => {
    setDragging(false);
    setDragX(0);
  }, []);

  const handlePointerDown = (e) => {
    if (triggered) return;
    measure();
    draggedRef.current = false;
    startXRef.current = e.clientX - dragX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging || triggered) return;
    const raw = e.clientX - startXRef.current;
    if (Math.abs(raw) > 6) draggedRef.current = true;
    setDragX(Math.max(0, Math.min(raw, maxXRef.current)));
  };

  // A real drag that falls short must snap back and swallow the trailing
  // synthetic click; a plain tap (no meaningful movement) leaves the click
  // to fire naturally so mouse/keyboard users get a working fallback.
  const handlePointerUp = () => {
    if (triggered) return;
    const max = maxXRef.current;
    if (max > 0 && dragX / max >= SWIPE_THRESHOLD) {
      complete();
    } else if (draggedRef.current) {
      cancel();
      suppressClickRef.current = true;
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    complete();
  };

  const progress = maxXRef.current > 0 ? dragX / maxXRef.current : 0;

  return (
    <div
      ref={trackRef}
      className="relative w-full rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden select-none"
      style={{ height: SWIPE_THUMB + SWIPE_TRACK_PAD * 2, touchAction: "pan-y" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary-bg)]"
        style={{
          width: `${SWIPE_THUMB + SWIPE_TRACK_PAD * 2 + dragX}px`,
          transition: dragging ? "none" : "width 300ms ease",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        <span
          className="text-sm font-semibold text-[var(--text-tertiary)] truncate"
          style={{ opacity: Math.max(0, 1 - progress * 1.6) }}
        >
          Swipe to enter trip planner
        </span>
      </div>
      <button
        type="button"
        aria-label="Swipe or press to enter trip planner"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancel}
        className="absolute flex items-center justify-center rounded-full bg-[var(--primary-text)] shadow-lg cursor-grab active:cursor-grabbing"
        style={{
          top: SWIPE_TRACK_PAD,
          left: SWIPE_TRACK_PAD,
          width: SWIPE_THUMB,
          height: SWIPE_THUMB,
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 300ms ease",
        }}
      >
        <Plane size={20} className="text-[var(--primary-bg)]" style={{ transform: "rotate(45deg)" }} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   HOME SCREEN
--------------------------------------------------------------- */

function HomeScreen({ onEnter, folding, onFoldEnd }) {
  const now = useLiveClock();
  const status = getTripStatus();
  const departure = useMemo(() => getDepartureInstant(), []);
  const parts = status.phase === "before" ? getCountdownParts(departure, now) : null;

  return (
    <div className="fixed inset-0 z-50" style={{ perspective: "1400px" }}>
      <div
        className={`home-screen w-full h-full bg-[var(--bg)] flex flex-col items-center justify-center px-6 overflow-y-auto ${folding ? "home-folding" : ""}`}
        onAnimationEnd={(e) => {
          if (e.animationName === "foldAway") onFoldEnd?.();
        }}
      >
      <div
        aria-hidden="true"
        className="absolute top-6 right-6 w-[68px] h-[68px] rounded-full flex items-center justify-center text-center pointer-events-none"
        style={{
          border: "2px dashed var(--stamp)",
          color: "var(--stamp)",
          transform: "rotate(-9deg)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "8px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          lineHeight: 1.35,
        }}
      >
        SYD ⇄ ATH
        <br />★ 2026 ★
      </div>
      <div className="w-full max-w-sm py-12 flex flex-col items-center text-center gap-8">
        <div>
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-mono mb-3">
            <Plane size={12} strokeWidth={2} />
            <span>Trip Planner</span>
          </div>
          <h1
            className="font-display text-6xl leading-none"
            style={{ fontWeight: 800, letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            EUROPE 2026
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-4 leading-relaxed">
            Sydney → Athens → Ios → Paros → Budapest → Prague → Český Krumlov → Hallstatt → Vienna → Sydney
          </p>
        </div>

        <div className="w-full relative h-10 flex items-center justify-between">
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px bg-[var(--border)]" />
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px route-glow" />
          {CITIES.map((c) => (
            <span
              key={c.id}
              className="relative z-10 w-2.5 h-2.5 rounded-full ring-4 ring-[var(--bg)]"
              style={{ background: c.accent, boxShadow: `0 0 10px ${c.accent}99` }}
            />
          ))}
        </div>

        {status.phase === "before" && parts && (
          <div className="grid grid-cols-4 gap-2 w-full">
            {[
              ["Days", parts.days],
              ["Hrs", parts.hours],
              ["Min", parts.minutes],
              ["Sec", parts.seconds],
            ].map(([label, val]) => (
              <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-3">
                <div className="font-display text-2xl font-700 tabular-nums" style={{ fontWeight: 700 }}>
                  {String(val).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {status.phase === "during" && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-4 px-6 w-full">
            <div className="font-display text-2xl font-700" style={{ fontWeight: 700 }}>
              Day {status.dayOfTrip} of {status.totalDays}
            </div>
            {status.cityName && (
              <div className="text-sm text-[var(--text-secondary)] mt-1">Currently in {status.cityName}</div>
            )}
          </div>
        )}

        {status.phase === "after" && (
          <div className="font-display text-xl font-700" style={{ fontWeight: 700 }}>
            Trip complete — hope it was amazing! ✈️
          </div>
        )}

        <SwipeToEnter onEnter={onEnter} />
      </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   HEADER
--------------------------------------------------------------- */

function SyncStatusIcon({ cloudTripId, syncStatus }) {
  if (!cloudTripId) return <Link2 size={14} />;
  if (syncStatus === "syncing") return <RefreshCw size={14} className="animate-spin" />;
  if (syncStatus === "error") return <CloudAlert size={14} />;
  return <CloudCheck size={14} />;
}

function Header({ saveState, theme, toggleTheme, cloudTripId, syncStatus, onOpenSync }) {
  const status = useMemo(() => getTripStatus(), []);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    refreshApp();
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-mono min-w-0">
            <Plane size={13} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Sydney → Athens → Vienna → Sydney</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenSync}
              aria-label="Sync across devices"
              className={`p-1.5 rounded-full border border-[var(--border)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all ${
                cloudTripId && syncStatus !== "error" ? "text-[#2F8577]" : "text-[var(--text-muted)]"
              }`}
            >
              <SyncStatusIcon cloudTripId={cloudTripId} syncStatus={syncStatus} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh app to latest version"
              className="p-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-0.5">
          <h1 className="font-display text-2xl font-700" style={{ fontWeight: 700, textWrap: "balance" }}>
            Europe & Greek Islands
          </h1>
          <div className="text-right shrink-0">
            <div
              className="inline-block font-mono text-[10.5px] px-2 py-0.5 rounded-full"
              style={{ border: "1px dashed var(--stamp)", color: "var(--stamp)" }}
            >
              {tripStatusText(status)}
            </div>
            <div className={`text-[11px] mt-1 transition-opacity ${saveState === "idle" ? "opacity-0" : "opacity-100"}`}>
              {saveState === "saving" ? "Saving…" : "Saved ✓"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SYNC PANEL
--------------------------------------------------------------- */

function SyncPanel({ onClose, cloudTripId, tripCode, syncStatus, syncError, onCreate, onJoin, onLeave }) {
  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const handleJoinClick = async () => {
    if (!codeInput.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      await onJoin(codeInput);
      setCodeInput("");
    } catch (e) {
      setJoinError("That code doesn't match any trip — double-check it and try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 modal-backdrop" onClick={onClose}>
      <div
        className="bg-[var(--bg)] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4 modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-display font-700 text-lg" style={{ fontWeight: 700 }}>
            Sync across devices
          </span>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform text-[var(--text-tertiary)]">
            <X size={18} />
          </button>
        </div>

        {cloudTripId ? (
          <>
            <div className="flex items-center gap-2 text-sm text-[#2F8577]">
              <CloudCheck size={16} /> Synced across devices
            </div>
            {tripCode && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">Share this code</div>
                <div className="font-mono text-2xl font-700 tracking-widest" style={{ fontWeight: 700 }}>
                  {tripCode}
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--text-muted)]">
              Enter this code on your other device (tap the sync icon → Join with code) to see the same budget and
              checklist there.
            </p>
            <button
              onClick={onLeave}
              className="w-full text-sm text-[#c9463f] py-2 hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              Stop syncing this device
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Share your budget and checklist progress with another device — e.g. your partner's phone.
            </p>
            <button
              onClick={onCreate}
              disabled={syncStatus === "syncing"}
              className="w-full bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-lg py-2.5 text-sm font-medium hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60"
            >
              {syncStatus === "syncing" ? "Setting up…" : "Create shared trip"}
            </button>
            {syncStatus === "error" && (
              <p className="text-xs text-[#c9463f] font-mono">Sync failed: {syncError || "unknown error"}</p>
            )}

            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <div className="flex-1 h-px bg-[var(--border)]" /> OR <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <div className="space-y-2">
              <input
                placeholder="Enter code from other device"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none uppercase tracking-widest text-center font-mono"
                maxLength={8}
              />
              {joinError && <p className="text-xs text-[#c9463f]">{joinError}</p>}
              <button
                onClick={handleJoinClick}
                disabled={joining || !codeInput.trim()}
                className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg py-2.5 text-sm font-medium hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-50"
              >
                {joining ? "Joining…" : "Join with code"}
              </button>
              <p className="text-xs text-[var(--text-muted)]">
                Joining replaces this device's current budget and checklist with the shared trip's data.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   TAB BAR
--------------------------------------------------------------- */

const TOOL_DEFS = [
  { id: "overview", label: "Itinerary", icon: CalendarDays, color: "var(--cat-flights)" },
  { id: "budget", label: "Budget", icon: Wallet, color: "var(--cat-accommodation)" },
  { id: "convert", label: "Convert", icon: ArrowLeftRight, color: "var(--cat-food)" },
  { id: "pack", label: "Pack", icon: Luggage, color: "var(--cat-activities)" },
  { id: "docs", label: "Docs", icon: FileText, color: "var(--cat-transport)" },
  { id: "ask", label: "Ask", icon: MessageCircle, color: "var(--cat-shopping)" },
  { id: "reels", label: "Reels", icon: Clapperboard, color: "var(--cat-other)" },
  { id: "reminders", label: "Reminders", icon: Bell, color: "var(--stamp)" },
];

function TabBar({ tab, setTab }) {
  const isHub = tab === "hub" || CITIES.some((c) => c.id === tab);
  return isHub ? <HubNav tab={tab} setTab={setTab} /> : <ToolPageHeader tab={tab} setTab={setTab} />;
}

function HubNav({ tab, setTab }) {
  return (
    <div className="border-b border-[var(--border)]">
      {/* Cities rail — visually distinct band, its own horizontal scroll */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-2">
          <span className="sticky left-0 bg-[var(--surface)] pr-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-mono shrink-0 z-10">
            Cities
          </span>
          {CITIES.map((c) => {
            const active = tab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setTab(c.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] shrink-0 border hover:scale-105 active:scale-95"
                style={
                  active
                    ? { background: c.accent, borderColor: c.accent, color: "white" }
                    : { background: "var(--bg)", borderColor: "var(--border)", color: "var(--text-tertiary)" }
                }
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "white" : c.accent }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools grid — 3x3, no scrolling needed regardless of item count */}
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {TOOL_DEFS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 border transition-transform hover:scale-[1.03] active:scale-95"
                style={{
                  background: active ? t.color : "var(--surface)",
                  borderColor: active ? t.color : "var(--border)",
                }}
              >
                <Icon size={18} color={active ? "#fff" : t.color} />
                <span className="text-[11px] font-medium" style={{ color: active ? "#fff" : "var(--text-secondary)" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ToolPageHeader({ tab, setTab }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const def = TOOL_DEFS.find((t) => t.id === tab);
  if (!def) return null;
  const Icon = def.icon;

  return (
    <div className="border-b border-[var(--border)] relative">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-3 flex items-center justify-between">
        <button
          onClick={() => setTab("hub")}
          className="flex items-center gap-1 -ml-1 px-1 py-1 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronLeft size={18} /> Home
        </button>
        <div className="flex items-center gap-1.5 font-display text-base font-700" style={{ fontWeight: 700, color: def.color }}>
          <Icon size={16} /> {def.label}
        </div>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Jump to another tool"
          className="p-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all"
        >
          <LayoutGrid size={15} />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-4 top-14 z-40 bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-2 shadow-lg grid grid-cols-3 gap-1.5 w-52">
            {TOOL_DEFS.map((t) => {
              const TIcon = t.icon;
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setMenuOpen(false); }}
                  className="flex flex-col items-center gap-1 rounded-xl py-2 hover:bg-[var(--surface)] transition-colors"
                >
                  <TIcon size={16} color={active ? t.color : "var(--text-muted)"} />
                  <span className="text-[10px]" style={{ color: active ? t.color : "var(--text-secondary)" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
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
  const status = useMemo(() => getTripStatus(), []);
  const highlightIdx = status.phase === "during" ? status.dayOfTrip - 1 : status.phase === "before" ? 0 : -1;
  const highlightLabel = status.phase === "during" ? "Today" : "Next up";
  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-5">
        Tap any activity to check it off as you go. Everything's saved automatically.
      </p>
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--border)]" />
        <div className="space-y-3">
          {ITINERARY.map((day, idx) => {
            const city = CITIES.find((c) => c.id === day.city);
            const dotColor = city ? city.accent : "var(--text-muted)";
            const isHighlighted = idx === highlightIdx;
            return (
              <div key={idx} className="relative">
                <span
                  className="absolute -left-[19px] top-[18px] w-3 h-3 rounded-full ring-4 ring-[var(--bg)] z-10"
                  style={{ background: dotColor }}
                />
                {isHighlighted && (
                  <div
                    aria-hidden="true"
                    className="absolute -top-2.5 left-5 w-20 h-6 z-20 flex items-center justify-center text-[9px] font-bold tracking-wide uppercase pointer-events-none"
                    style={{
                      background: "color-mix(in srgb, var(--tape) 82%, transparent)",
                      color: "var(--text-primary)",
                      transform: "rotate(-4deg)",
                      boxShadow: "0 2px 3px rgba(0,0,0,.18)",
                    }}
                  >
                    {highlightLabel}
                  </div>
                )}
                <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-2.5" style={{ background: city ? city.accent + "14" : "transparent" }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {parseTripDate(day.date).toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span
                          className="font-display text-lg font-700"
                          style={{ fontWeight: 700, color: city ? city.accent : "var(--text-primary)" }}
                        >
                          {day.date}
                        </span>
                      </div>
                      {city && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold shrink-0" style={{ color: city.accent }}>
                          {city.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-sm text-[var(--text-tertiary)] mb-2">{day.title}</div>
                    <div className="space-y-1.5">
                      {day.items.map((item, i) => {
                        const key = `overview-${idx}-${i}`;
                        const checked = !!checklist[key];
                        return (
                          <div key={i}>
                            <button
                              onClick={() => toggleCheck(key)}
                              className="flex items-start gap-2 w-full text-left group active:scale-[0.98] transition-transform"
                            >
                              {checked ? (
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2F8577] check-pop" />
                              ) : (
                                <Circle size={16} className="mt-0.5 shrink-0 text-[var(--icon-empty)]" />
                              )}
                              <span className={`text-[13.5px] flex-1 ${checked ? "line-through text-[var(--text-faint)]" : "text-[var(--text-body)]"}`}>
                                {item.time && <span className="font-mono text-[11px] text-[var(--text-muted)] mr-1.5">{item.time}</span>}
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
                                className="ml-6 mt-1 mb-1 text-[12px] text-[var(--text-tertiary)] bg-[var(--bg)] border-l-2 rounded-r-md px-2.5 py-1.5"
                                style={{ borderColor: city ? city.accent : "var(--text-primary)" }}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   CITY MAP
--------------------------------------------------------------- */

const PIN_TYPE_META = {
  sight: { color: "#2C5F7C", label: "Sight" },
  area: { color: "#6B4A70", label: "Area" },
  beach: { color: "#2F8577", label: "Beach" },
  food: { color: "#E0703C", label: "Food & drink" },
  hotel: { color: "#C9463F", label: "Hotel" },
};

function CityMap({ mapData }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !mapData) return;

    const map = L.map(containerRef.current, {
      center: mapData.center,
      zoom: mapData.zoom,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    requestAnimationFrame(() => map.invalidateSize());

    mapData.pins.forEach((pin) => {
      const color = PIN_TYPE_META[pin.type]?.color || "var(--text-primary)";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([pin.lat, pin.lng], { icon }).addTo(map).bindPopup(`<strong>${pin.name}</strong>`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapData]);

  const typesPresent = useMemo(() => {
    if (!mapData) return [];
    return [...new Set(mapData.pins.map((p) => p.type))];
  }, [mapData]);

  return (
    <div>
      <div ref={containerRef} className="relative isolate w-full h-72 rounded-xl border border-[var(--border)] overflow-hidden" />
      <div className="flex flex-wrap gap-3 mt-2">
        {typesPresent.map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIN_TYPE_META[t]?.color }} />
            <span className="text-[11px] text-[var(--text-secondary)]">{PIN_TYPE_META[t]?.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-2">
        Landmark pins are accurate; hotel and small-venue pins are approximate — verify before navigating.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------
   WEATHER FORECAST (live, falls back to static seasonal text)
--------------------------------------------------------------- */

const WEATHER_CODE_LABELS = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Foggy",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorms", 96: "Thunderstorms", 99: "Severe thunderstorms",
};
function weatherLabel(code) {
  return WEATHER_CODE_LABELS[code] || "Mixed conditions";
}

const WEATHER_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function summarizeForecast(matched) {
  const maxes = matched.map((d) => d.max);
  const mins = matched.map((d) => d.min);
  const freq = {};
  matched.forEach((d) => { freq[d.code] = (freq[d.code] || 0) + 1; });
  const modeCode = Number(Object.keys(freq).reduce((a, b) => (freq[a] >= freq[b] ? a : b)));
  return {
    range: `${Math.round(Math.min(...mins))}–${Math.round(Math.max(...maxes))}°C`,
    label: weatherLabel(modeCode),
  };
}

function WeatherCard({ city, days }) {
  const [summary, setSummary] = useState(null); // null while unresolved -> falls back to static text

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `europe-trip-weather-${city.id}`;
    const tripDates = days.map((d) => parseTripDate(d.date).toISOString().slice(0, 10));

    const applyDaily = (daily) => {
      if (!daily?.time) return false;
      const matched = daily.time
        .map((t, i) => ({ date: t, max: daily.temperature_2m_max[i], min: daily.temperature_2m_min[i], code: daily.weathercode[i] }))
        .filter((d) => tripDates.includes(d.date));
      if (!matched.length) return false;
      if (!cancelled) setSummary(summarizeForecast(matched));
      return true;
    };

    const cached = loadFromStorage(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_TTL) {
      applyDaily(cached.daily);
      return;
    }

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("weather fetch failed"))))
      .then((data) => {
        saveToStorage(cacheKey, { fetchedAt: Date.now(), daily: data.daily });
        applyDaily(data.daily);
      })
      .catch(() => {
        if (cached) applyDaily(cached.daily);
      });

    return () => { cancelled = true; };
  }, [city.id, city.lat, city.lng, days]);

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)] flex items-center gap-1.5">
        Weather
        {summary && <span className="text-[var(--cat-food)] normal-case tracking-normal">• forecast</span>}
      </div>
      <div className="font-display font-700 text-base mt-0.5" style={{ fontWeight: 700 }}>
        {summary ? summary.range : city.weather}
      </div>
      <div className="text-[11px] text-[var(--text-secondary)] mt-1">
        {summary ? summary.label : city.weatherNote}
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
        <WeatherCard city={city} days={days} />
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Currency</div>
          <div className="font-display font-700 text-base mt-0.5" style={{ fontWeight: 700 }}>{city.currency}</div>
        </div>
      </div>

      <Section icon={<MapPin size={15} />} title="Map" accent={city.accent}>
        <CityMap mapData={CITY_MAP[city.id]} />
      </Section>

      <Section icon={<Sparkles size={15} />} title="Good to know" accent={city.accent}>
        <div className="space-y-1.5">
          {guide.tips.map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: city.accent }} />
              <span className="text-sm text-[var(--text-body)]">{t}</span>
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
            <div key={idx} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {parseTripDate(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="font-display font-600 text-sm" style={{ fontWeight: 600 }}>{d.date}</span>
                <span className="text-xs text-[var(--text-secondary)]">— {d.title}</span>
              </div>
              <ul className="text-[13px] text-[var(--text-tertiary)] space-y-0.5 ml-1">
                {d.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {iconFor(it.icon)}
                    {it.time && <span className="font-mono text-[11px] text-[var(--text-muted)]">{it.time}</span>}
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
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 hover:border-[var(--text-faint)] active:scale-[0.98] transition-[transform,border-color]"
    >
      {checked ? (
        <CheckCircle2 size={16} style={{ color: accent }} className="shrink-0 check-pop" />
      ) : (
        <Circle size={16} className="text-[var(--icon-empty)] shrink-0" />
      )}
      <span className={`text-sm ${checked ? "line-through text-[var(--text-faint)]" : "text-[var(--text-body)]"}`}>{text}</span>
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
   SMART ADD (voice / receipt scan, AI-parsed)
--------------------------------------------------------------- */

function SmartAddModal({ onClose, onParsed }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleParseText = () => {
    if (!text.trim()) return;
    onParsed(parseExpenseLocal(text.trim()));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const base64 = await resizeImageToBase64(file);
      const parsed = await parseReceiptWithGroq(base64, "image/jpeg");
      onParsed(parsed);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 modal-backdrop" onClick={onClose}>
      <div
        className="bg-[var(--bg)] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-3 modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-display font-700 text-lg" style={{ fontWeight: 700 }}>Smart add</span>
          <button onClick={onClose} className="hover:scale-110 active:scale-90 transition-transform text-[var(--text-tertiary)]">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Type it, or tap the mic on your keyboard to speak it — we'll pick out the amount and category instantly, no
          internet needed.
        </p>

        <div className="flex gap-2">
          <input
            placeholder="e.g. 40 euros lunch in Athens"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParseText()}
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none"
          />
          <button
            onClick={handleParseText}
            disabled={!text.trim()}
            aria-label="Use this text"
            className="bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-lg px-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <div className="flex-1 h-px bg-[var(--border)]" /> OR <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <Camera size={16} /> Scan receipt
        </button>
        <p className="text-[11px] text-[var(--text-muted)] text-center">
          Scanning a receipt uses AI and needs a connection.
        </p>

        {busy && <p className="text-xs text-[var(--text-muted)] text-center">Reading…</p>}
        {error && <p className="text-xs text-[#c9463f] font-mono">{error}</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   BUDGET TAB
--------------------------------------------------------------- */

function BudgetTab({ budget, addExpense, removeExpense }) {
  const [showForm, setShowForm] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", currency: "AUD", category: "Activities", city: "",
  });

  const applyParsed = (parsed) => {
    setForm({
      description: parsed.description || "",
      amount: parsed.amount ? String(parsed.amount) : "",
      currency: parsed.currency || "AUD",
      category: parsed.category || "Activities",
      city: parsed.city || "",
    });
    setSmartOpen(false);
    setShowForm(true);
  };

  const totals = useMemo(() => {
    const t = {};
    budget.forEach((e) => {
      const amt = parseFloat(e.amount) || 0;
      t[e.currency] = (t[e.currency] || 0) + amt;
    });
    return t;
  }, [budget]);

  const categoryTotals = useMemo(() => {
    const rates = loadFromStorage(FX_STORAGE_KEY)?.rates || FX_FALLBACK_RATES;
    const t = {};
    budget.forEach((e) => {
      const amt = parseFloat(e.amount) || 0;
      const aud = e.currency === "AUD" ? amt : amt / (rates[e.currency] || 1);
      t[e.category] = (t[e.category] || 0) + aud;
    });
    return t;
  }, [budget]);

  const sortedCategories = useMemo(
    () => CATEGORIES.filter((c) => categoryTotals[c] > 0).sort((a, b) => categoryTotals[b] - categoryTotals[a]),
    [categoryTotals]
  );
  const maxCategoryTotal = Math.max(0, ...Object.values(categoryTotals));

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
          <div className="col-span-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-muted)] text-center">
            No expenses logged yet
          </div>
        )}
        {Object.entries(totals).map(([cur, amt]) => (
          <div key={cur} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
            <div className="font-mono text-[11px] text-[var(--text-muted)]">{cur} total</div>
            <div className="font-display text-xl font-700" style={{ fontWeight: 700 }}>
              {CURRENCY_SYMBOL[cur]}{amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {sortedCategories.length > 0 && (
        <Section icon={<Wallet size={15} />} title="By category (≈ AUD)" accent="var(--text-primary)">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 space-y-3">
            {sortedCategories.map((cat) => {
              const amt = categoryTotals[cat];
              const pct = maxCategoryTotal > 0 ? (amt / maxCategoryTotal) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <span className="text-sm text-[var(--text-tertiary)]">{cat}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">
                      ≈${amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%`, background: CATEGORY_COLOR_VAR[cat] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <button
        onClick={() => setSmartOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl py-3 text-sm font-medium mb-2 hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        <Sparkles size={16} /> Smart add — speak or scan a receipt
      </button>

      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-4 text-base font-bold mb-5 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
        style={{ background: "linear-gradient(135deg, #E0703C, #C9463F)", boxShadow: "0 4px 14px rgba(224,112,60,0.5)" }}
      >
        <Plus size={20} strokeWidth={3} /> ADD EXPENSE
      </button>

      {smartOpen && <SmartAddModal onClose={() => setSmartOpen(false)} onParsed={applyParsed} />}

      <div className="space-y-2">
        {[...budget].reverse().map((e) => (
          <div key={e.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-3 py-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">{e.description}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                {e.category}{e.city ? ` · ${CITIES.find(c => c.id === e.city)?.name || e.city}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-sm font-medium">
                {CURRENCY_SYMBOL[e.currency]}{parseFloat(e.amount).toLocaleString()}
              </span>
              <button
                onClick={() => removeExpense(e.id)}
                className="text-[#c9463f] hover:scale-110 active:scale-90 transition-transform"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-[var(--bg)] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-3 modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-700 text-lg" style={{ fontWeight: 700 }}>New expense</span>
              <button
                onClick={() => setShowForm(false)}
                className="hover:scale-110 active:scale-90 transition-transform text-[var(--text-tertiary)]"
              >
                <X size={18} />
              </button>
            </div>

            <input
              placeholder="What was it for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none"
            />

            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none"
              />
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 text-sm outline-none"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              <option value="">No city / general</option>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <button
              onClick={submit}
              className="w-full bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-lg py-2.5 text-sm font-medium mt-1 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Add expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   CURRENCY CONVERTER
--------------------------------------------------------------- */

function ConverterTab() {
  const cached = loadFromStorage(FX_STORAGE_KEY);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("AUD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState(cached?.rates || FX_FALLBACK_RATES);
  const [updatedAt, setUpdatedAt] = useState(cached?.date || null);
  const [status, setStatus] = useState("loading"); // loading | live | cached | offline
  const [errorDetail, setErrorDetail] = useState(null);

  const fetchRates = useCallback(async () => {
    setStatus("loading");
    setErrorDetail(null);
    const attempts = [];
    for (const url of FX_API_URLS) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const aud = data.aud || {};
        const newRates = { AUD: 1, EUR: aud.eur, HUF: aud.huf, CZK: aud.czk, USD: aud.usd };
        if (!newRates.EUR || !newRates.HUF || !newRates.CZK || !newRates.USD) {
          throw new Error("unexpected response shape");
        }
        const date = data.date || new Date().toISOString().slice(0, 10);
        setRates(newRates);
        setUpdatedAt(date);
        saveToStorage(FX_STORAGE_KEY, { rates: newRates, date });
        setStatus("live");
        return;
      } catch (e) {
        attempts.push(e?.message || String(e));
      }
    }
    setErrorDetail(attempts.join(" / "));
    setStatus(updatedAt ? "cached" : "offline");
  }, [updatedAt]);

  useEffect(() => { fetchRates(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const converted = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const inAud = from === "AUD" ? amt : amt / (rates[from] || 1);
    return to === "AUD" ? inAud : inAud * (rates[to] || 1);
  }, [amount, from, to, rates]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const quickAmounts = [10, 20, 50, 100];
  const foreignCurrencies = CURRENCIES.filter((c) => c !== "AUD");

  const statusText = {
    loading: "Fetching latest rates…",
    live: `Live rates as of ${updatedAt}.`,
    cached: `Offline — showing rates last updated ${updatedAt}.`,
    offline: "Offline — showing approximate rates.",
  }[status];

  return (
    <div>
      <p className={`text-sm text-[var(--text-secondary)] ${errorDetail ? "mb-1" : "mb-5"}`}>{statusText}</p>
      {errorDetail && (
        <p className="text-[11px] font-mono text-[#c9463f] mb-5">Fetch failed: {errorDetail}</p>
      )}

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-lg font-mono outline-none mt-1"
            />
          </div>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-2.5 text-sm outline-none"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex justify-center my-1">
          <button
            onClick={swap}
            aria-label="Swap currencies"
            className="bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-full p-2 mt-1"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Converted</label>
            <div className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-lg font-mono font-700 mt-1" style={{ fontWeight: 700 }}>
              {CURRENCY_SYMBOL[to]}{converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-2.5 text-sm outline-none"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={fetchRates}
          disabled={status === "loading"}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-3 mx-auto"
        >
          <RefreshCw size={12} className={status === "loading" ? "animate-spin" : ""} />
          Refresh rates
        </button>
      </div>

      <Section icon={<Wallet size={15} />} title="Quick reference (→ AUD)" accent="var(--text-primary)">
        <div className="space-y-2">
          {foreignCurrencies.map((cur) => (
            <div key={cur} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
              <div className="font-mono text-xs text-[var(--text-muted)] mb-2">{cur}</div>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <div key={amt} className="text-center">
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">{CURRENCY_SYMBOL[cur]}{amt}</div>
                    <div className="text-sm font-medium font-mono">
                      ${(amt / (rates[cur] || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------
   PACKING LIST TAB
--------------------------------------------------------------- */

function ProgressRing({ pct, size = 64, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary-bg)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-medium text-[var(--text-primary)]">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function PackingTab({ checklist, toggleCheck }) {
  const totalItems = useMemo(
    () => PACKING_LIST.reduce((sum, cat) => sum + cat.items.length, 0),
    []
  );
  const checkedCount = useMemo(() => {
    let count = 0;
    PACKING_LIST.forEach((cat) => {
      cat.items.forEach((_, i) => {
        if (checklist[`pack-${cat.id}-${i}`]) count++;
      });
    });
    return count;
  }, [checklist]);

  const pct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        For two — quantities are per person unless noted. Covers everything from Athens heat to Hallstatt evenings.
      </p>
      <div className="flex items-center gap-4 mb-5">
        <ProgressRing pct={pct} />
        <div>
          <div className="font-display text-xl font-700" style={{ fontWeight: 700 }}>
            {checkedCount} / {totalItems} packed
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Tap items below to check them off.</div>
        </div>
      </div>

      {PACKING_LIST.map((cat) => (
        <Section key={cat.id} icon={<Luggage size={15} />} title={cat.title} accent="var(--text-primary)">
          <div className="space-y-1.5">
            {cat.items.map((item, i) => {
              const key = `pack-${cat.id}-${i}`;
              const checked = !!checklist[key];
              return (
                <ChecklistRow key={i} checked={checked} onClick={() => toggleCheck(key)} text={item} accent="var(--text-primary)" />
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   DOCUMENTS TAB
--------------------------------------------------------------- */

const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

function DocsTab({ cloudTripId, onOpenSync }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!cloudTripId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listDocuments(cloudTripId);
      setDocs(list);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [cloudTripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_DOC_SIZE) {
      setError("That file is over 20MB — try a smaller scan or photo.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(cloudTripId, file);
      await refresh();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (filename) => {
    try {
      const url = await getDocumentUrl(cloudTripId, filename);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const handleDelete = async (filename) => {
    try {
      await deleteDocument(cloudTripId, filename);
      setDocs((prev) => prev.filter((d) => d.name !== filename));
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  if (!cloudTripId) {
    return (
      <div className="text-center py-10">
        <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
          Documents live in your shared trip, so everyone paired with you can see them. Set up sync first to use
          this.
        </p>
        <button
          onClick={onOpenSync}
          className="bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-lg px-4 py-2.5 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Set up sync
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-5">
        Tickets, passport scans, booking confirmations — stored securely and visible to everyone synced to this
        trip.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-xl py-4 text-base font-bold mb-5 hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60"
      >
        <Upload size={18} /> {uploading ? "Uploading…" : "Upload document"}
      </button>

      {error && <p className="text-xs text-[#c9463f] font-mono mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-muted)] text-center">
          No documents yet
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const isImage = /\.(png|jpe?g|gif|webp|heic)$/i.test(doc.name);
            const displayName = doc.name.replace(/^\d+_/, "");
            const sizeKb = doc.metadata?.size ? Math.round(doc.metadata.size / 1024) : null;
            return (
              <div
                key={doc.name}
                className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isImage ? (
                    <Image size={18} className="text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <FileText size={18} className="text-[var(--text-muted)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</div>
                    {sizeKb != null && <div className="text-[11px] text-[var(--text-muted)] font-mono">{sizeKb} KB</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleView(doc.name)}
                    aria-label={`View ${displayName}`}
                    className="text-[var(--text-tertiary)] hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.name)}
                    aria-label={`Delete ${displayName}`}
                    className="text-[#c9463f] hover:scale-110 active:scale-90 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   ASK (trip Q&A via Groq)
--------------------------------------------------------------- */

const ASK_EXAMPLES = [
  "Best restaurants in Budapest?",
  "What should we do on a rainy day in Vienna?",
  "Any day trips from Prague worth it?",
];

function AskTab() {
  const [messages, setMessages] = useState([]); // { question, answer? , error? }
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const ask = async (q) => {
    const text = q.trim();
    if (!text || busy) return;
    setQuestion("");
    setBusy(true);
    setMessages((prev) => [...prev, { question: text }]);
    try {
      const answer = await askTripQuestion(text);
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, answer } : m)));
    } catch (e) {
      setMessages((prev) =>
        prev.map((m, i) => (i === prev.length - 1 ? { ...m, error: e?.message || String(e) } : m))
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col pb-20">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-xs mx-auto">
            Ask anything about the trip — restaurants, things to do, day trips. Powered by AI, aware of your route
            and dates.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            {ASK_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => ask(ex)}
                className="text-left text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 mb-4">
          {messages.map((m, i) => (
            <div key={i}>
              <div className="flex justify-end mb-1.5">
                <div className="bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm max-w-[85%]">
                  {m.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap">
                  {m.answer ? (
                    m.answer
                  ) : m.error ? (
                    <span className="text-[#c9463f] font-mono text-xs">{m.error}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Thinking…</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}

      {/* Fixed to the viewport bottom, same proven pattern as the New
          expense / Smart add modals — not sitting in normal page flow,
          so mobile browsers position it above the keyboard correctly. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-[var(--bg)] border-t border-[var(--border)] px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            placeholder="Ask about the trip…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(question)}
            disabled={busy}
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none disabled:opacity-60"
          />
          <button
            onClick={() => ask(question)}
            disabled={busy || !question.trim()}
            aria-label="Ask"
            className="bg-[var(--primary-bg)] text-[var(--primary-text)] rounded-lg px-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   REELS (content-shoot ideas per city)
--------------------------------------------------------------- */

const REEL_CATEGORIES = [
  { key: "landmark", label: "Landmark & scenery" },
  { key: "food", label: "Food" },
  { key: "vlog", label: "Mini vlog" },
  { key: "duo", label: "Duo / couple" },
];

const CROSS_CITY_REEL_IDEAS = [
  { id: "outfit", title: "Outfit check, every city", desc: "Same transition pose or spin, new outfit and backdrop each time — cut them together at the end." },
  { id: "coffee", title: "Rate the coffee", desc: "One coffee order plus an on-camera rating in each city, Sydney to Vienna." },
  { id: "intro", title: "\"We're in ___\" intro", desc: "A 3-second to-camera clip naming the city and day number — doubles as your recap timeline." },
  { id: "golden-hour", title: "Golden hour, every city", desc: "One sunset or golden-hour shot per stop, same framing style, cut into a single montage." },
  { id: "sweet-treat", title: "Local sweet treat taste-test", desc: "Baklava in Athens, loukoumades on the islands, dobos torte in Budapest, trdelník in Prague, apple strudel in Vienna — rate each on camera." },
  { id: "transition-door", title: "Door / window reveal transition", desc: "Push open a door, shutter, or curtain into the next city — a classic whip-transition template." },
  { id: "balcony-view", title: "Balcony or room-view rating", desc: "A quick pan across the view from wherever you're staying, each city." },
  { id: "walk-toward", title: "Same walk-toward-camera", desc: "Walk toward the lens down a street, beach, or alley in each city — great transition material." },
  { id: "local-drink", title: "Local specialty drink", desc: "Ouzo in Greece, a spritz in Vienna, a local beer in Prague or Č. Krumlov — one clink-and-sip clip per stop." },
  { id: "market-walk", title: "Market or grocery store walk", desc: "60 seconds wandering a local market or supermarket — produce, prices, and packaging all look different." },
  { id: "street-sign", title: "Street sign / welcome sign selfie", desc: "Find the city-name sign, welcome mural, or station platform sign and grab a selfie with it." },
  { id: "weather-compare", title: "Outfit-for-the-weather comparison", desc: "Beachwear in Ios/Paros vs. layers in Hallstatt — a literal before/after as the climate flips." },
  { id: "silhouette", title: "Couple silhouette against a landmark", desc: "A backlit silhouette shot with one recognizable landmark per city — Acropolis, Fisherman's Bastion, Charles Bridge, Schönbrunn." },
  { id: "transport-bit", title: "Rate the public transport", desc: "A quick bit rating the ferry, metro, tram, or train in each place — surprisingly good recurring joke." },
  { id: "bag-flatlay", title: "What's in the day bag", desc: "The same flatlay or dump shot of that day's bag contents, once per city — fun to see what changes." },
  { id: "one-sec-a-day", title: "One-second-a-day clip", desc: "Grab exactly one second of footage daily, no matter what — stitches into a short trip recap at the end." },
];

function ReelIdeaRow({ title, desc, checked, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2.5 w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-3 hover:border-[var(--text-faint)] active:scale-[0.98] transition-[transform,border-color]"
    >
      {checked ? (
        <CheckCircle2 size={17} style={{ color: accent }} className="shrink-0 mt-0.5 check-pop" />
      ) : (
        <Circle size={17} className="text-[var(--icon-empty)] shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <div className={`text-sm font-medium ${checked ? "line-through text-[var(--text-faint)]" : "text-[var(--text-primary)]"}`}>
          {title}
        </div>
        {desc && (
          <div className={`text-[12px] mt-0.5 ${checked ? "text-[var(--text-faint)]" : "text-[var(--text-secondary)]"}`}>
            {desc}
          </div>
        )}
      </div>
    </button>
  );
}

function CrossCityCategory({ cityId, accent, customIdeas, checklist, toggleCheck, onAddIdea, onRemoveIdea }) {
  const [newTitle, setNewTitle] = useState("");
  const allIdeas = [...CROSS_CITY_REEL_IDEAS, ...customIdeas];
  const doneCount = allIdeas.filter((idea) => checklist[`reel-cross-${idea.id}-${cityId}`]).length;

  return (
    <Section icon={<Clapperboard size={15} />} title={`Cross city (${doneCount}/${allIdeas.length})`} accent={accent}>
      <p className="text-[12px] text-[var(--text-secondary)] mb-2.5 -mt-1">
        One clip from every city for these — cross each off once you've shot it here, so you don't get to the end
        and realize you missed one.
      </p>
      <div className="space-y-2">
        {allIdeas.map((idea) => {
          const key = `reel-cross-${idea.id}-${cityId}`;
          const checked = !!checklist[key];
          const isCustom = customIdeas.some((c) => c.id === idea.id);
          return (
            <div key={idea.id} className="relative">
              <ReelIdeaRow title={idea.title} desc={idea.desc} checked={checked} onClick={() => toggleCheck(key)} accent={accent} />
              {isCustom && (
                <button
                  onClick={() => onRemoveIdea(idea.id)}
                  aria-label={`Remove ${idea.title}`}
                  className="absolute top-2.5 right-2.5 text-[var(--text-faint)] hover:text-[var(--stamp)] transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          onAddIdea(newTitle.trim());
          setNewTitle("");
        }}
        className="flex items-center gap-2 mt-2.5"
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add your own idea…"
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--stamp)]"
        />
        <button
          type="submit"
          aria-label="Add idea"
          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus size={16} />
        </button>
      </form>
    </Section>
  );
}

function PerCityCustomSection({ cityId, accent, customIdeas, checklist, toggleCheck, onAddIdea, onRemoveIdea }) {
  const [newTitle, setNewTitle] = useState("");
  return (
    <Section icon={<Clapperboard size={15} />} title="Your ideas" accent={accent}>
      <p className="text-[12px] text-[var(--text-secondary)] mb-2.5 -mt-1">
        Anything else worth shooting here — either of you can jot it down.
      </p>
      {customIdeas.length > 0 && (
        <div className="space-y-2 mb-2.5">
          {customIdeas.map((idea) => {
            const key = `reel-custom-${cityId}-${idea.id}`;
            const checked = !!checklist[key];
            return (
              <div key={idea.id} className="relative">
                <ReelIdeaRow title={idea.title} desc={idea.desc} checked={checked} onClick={() => toggleCheck(key)} accent={accent} />
                <button
                  onClick={() => onRemoveIdea(cityId, idea.id)}
                  aria-label={`Remove ${idea.title}`}
                  className="absolute top-2.5 right-2.5 text-[var(--text-faint)] hover:text-[var(--stamp)] transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          onAddIdea(cityId, newTitle.trim());
          setNewTitle("");
        }}
        className="flex items-center gap-2"
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add your own idea…"
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--stamp)]"
        />
        <button
          type="submit"
          aria-label="Add idea"
          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus size={16} />
        </button>
      </form>
    </Section>
  );
}

function ReelsTab({
  selectedCityId,
  setSelectedCityId,
  customCrossCityIdeas,
  customPerCityIdeas,
  checklist,
  toggleCheck,
  onAddIdea,
  onRemoveIdea,
  onAddPerCityIdea,
  onRemovePerCityIdea,
}) {
  const selectedCity = CITIES.find((c) => c.id === selectedCityId);

  if (!selectedCity) {
    return (
      <div>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Pick a city to see its reel ideas — landmark shots, food clips, a mini vlog outline, duo-specific ideas,
          and the cross-city list (shot in every city, so open each city as you go and cross it off there).
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCityId(c.id)}
              className="flex flex-col items-start gap-2 rounded-2xl border p-4 text-left hover:scale-[1.02] active:scale-95 transition-transform"
              style={{ background: c.accent + "14", borderColor: c.accent + "40" }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.accent }} />
              <span className="font-display text-base font-700" style={{ fontWeight: 700, color: c.accent }}>
                {c.name}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{c.dates}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ideas = REEL_IDEAS[selectedCity.id];
  const allCrossCityIdeas = [...CROSS_CITY_REEL_IDEAS, ...customCrossCityIdeas];
  const cityCustomIdeas = customPerCityIdeas[selectedCity.id] || [];
  const cityIdeaCount =
    REEL_CATEGORIES.reduce((sum, cat) => sum + (ideas?.[cat.key]?.length || 0), 0) +
    allCrossCityIdeas.length +
    cityCustomIdeas.length;
  const cityDoneCount =
    REEL_CATEGORIES.reduce((sum, cat) => {
      const items = ideas?.[cat.key] || [];
      return sum + items.filter((_, i) => checklist[`reel-idea-${selectedCity.id}-${cat.key}-${i}`]).length;
    }, 0) +
    allCrossCityIdeas.filter((idea) => checklist[`reel-cross-${idea.id}-${selectedCity.id}`]).length +
    cityCustomIdeas.filter((idea) => checklist[`reel-custom-${selectedCity.id}-${idea.id}`]).length;
  const cityPct = cityIdeaCount > 0 ? (cityDoneCount / cityIdeaCount) * 100 : 0;

  return (
    <div>
      <button
        onClick={() => setSelectedCityId(null)}
        className="flex items-center gap-1 -ml-1 px-1 py-1 mb-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> All cities
      </button>

      <div
        className="rounded-2xl p-4 mb-5 text-white flex items-center gap-4"
        style={{ background: selectedCity.accent }}
      >
        <ProgressRing pct={cityPct} size={48} strokeWidth={5} />
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest opacity-80">{selectedCity.country}</div>
          <div className="font-display text-xl font-700" style={{ fontWeight: 700 }}>{selectedCity.name} — reel ideas</div>
          <div className="font-mono text-[11px] opacity-80 mt-0.5">{cityDoneCount} / {cityIdeaCount} shot</div>
        </div>
      </div>

      <CrossCityCategory
        cityId={selectedCity.id}
        accent={selectedCity.accent}
        customIdeas={customCrossCityIdeas}
        checklist={checklist}
        toggleCheck={toggleCheck}
        onAddIdea={onAddIdea}
        onRemoveIdea={onRemoveIdea}
      />

      {REEL_CATEGORIES.map((cat) => {
        const items = ideas?.[cat.key];
        if (!items?.length) return null;
        return (
          <Section key={cat.key} icon={<Clapperboard size={15} />} title={cat.label} accent={selectedCity.accent}>
            <div className="space-y-2">
              {items.map((idea, i) => {
                const key = `reel-idea-${selectedCity.id}-${cat.key}-${i}`;
                const checked = !!checklist[key];
                return (
                  <ReelIdeaRow
                    key={i}
                    title={idea.title}
                    desc={idea.desc}
                    checked={checked}
                    onClick={() => toggleCheck(key)}
                    accent={selectedCity.accent}
                  />
                );
              })}
            </div>
          </Section>
        );
      })}

      <PerCityCustomSection
        cityId={selectedCity.id}
        accent={selectedCity.accent}
        customIdeas={cityCustomIdeas}
        checklist={checklist}
        toggleCheck={toggleCheck}
        onAddIdea={onAddPerCityIdea}
        onRemoveIdea={onRemovePerCityIdea}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   REMINDERS (phone calendar reminders via .ics)
--------------------------------------------------------------- */

const SUGGESTED_REMINDERS = [
  {
    label: "Ferry check-in — Athens → Ios",
    title: "Ferry check-in — Athens → Ios (SeaJets, Gate E9)",
    date: "2026-08-27",
    time: "08:30",
    notes:
      "Be at Gate E9 (Piraeus) by 8:30 AM for the 9:00 AM SeaJets ferry. Leave Monastiraki via Metro Line 1 or 3 by ~7:45–7:50 AM — it's a 15–20 min walk from the metro to the gate.",
  },
  {
    label: "Ferry check-in — Ios → Paros",
    title: "Ferry check-in — Ios → Paros",
    date: "2026-08-30",
    time: "14:00",
    notes: "Ferry to Paros departs Ios port at 3:00 PM — aim to be at the port by 2:00 PM.",
  },
];

const ALARM_OPTIONS = [
  { label: "At the time", value: "PT0S" },
  { label: "15 minutes before", value: "-PT15M" },
  { label: "30 minutes before", value: "-PT30M" },
  { label: "1 hour before", value: "-PT1H" },
  { label: "2 hours before", value: "-PT2H" },
  { label: "1 day before", value: "-P1D" },
];

function escapeICSText(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildICS(reminder) {
  const dtStart = `${reminder.date.replace(/-/g, "")}T${reminder.time.replace(":", "")}00`;
  const [h, m] = reminder.time.split(":").map(Number);
  const endMinutes = h * 60 + m + 30;
  const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
  const endM = String(endMinutes % 60).padStart(2, "0");
  const dtEnd = `${reminder.date.replace(/-/g, "")}T${endH}${endM}00`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//europe-trip-app//reminders//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${reminder.id}@europe-trip-app`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(reminder.title)}`,
    reminder.notes ? `DESCRIPTION:${escapeICSText(reminder.notes)}` : null,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICSText(reminder.title)}`,
    `TRIGGER:${reminder.alarm || "-PT30M"}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function downloadICS(reminder) {
  const ics = buildICS(reminder);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reminder.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "reminder"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatReminderWhen(reminder) {
  const dt = new Date(`${reminder.date}T${reminder.time}:00`);
  const dateStr = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function RemindersTab({ reminders, onAdd, onRemove, onMarkAdded }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [alarm, setAlarm] = useState("-PT30M");

  const applySuggestion = (s) => {
    setTitle(s.title);
    setDate(s.date);
    setTime(s.time);
    setNotes(s.notes);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    onAdd({ title: title.trim(), date, time, notes: notes.trim(), alarm });
    setTitle("");
    setDate("");
    setTime("");
    setNotes("");
  };

  const sorted = [...reminders].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Set a reminder here and add it to your phone's own calendar — it'll notify you like any other calendar
        event, even with the app closed.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {SUGGESTED_REMINDERS.map((s) => (
          <button
            key={s.label}
            onClick={() => applySuggestion(s)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--stamp)] hover:text-[var(--stamp)] transition-colors"
          >
            + {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 mb-6 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the reminder?"
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--stamp)]"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--stamp)]"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--stamp)]"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--stamp)] resize-none"
        />
        <select
          value={alarm}
          onChange={(e) => setAlarm(e.target.value)}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--stamp)]"
        >
          {ALARM_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              Remind me {a.label.toLowerCase()}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full bg-[var(--stamp)] text-white rounded-xl py-2.5 text-sm font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          Create reminder
        </button>
      </form>

      {sorted.length > 0 && (
        <div className="space-y-2.5">
          {sorted.map((r) => (
            <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</div>
                  <div className="font-mono text-[11px] text-[var(--stamp)] mt-0.5">{formatReminderWhen(r)}</div>
                  {r.notes && <div className="text-[12px] text-[var(--text-secondary)] mt-1">{r.notes}</div>}
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  aria-label={`Remove ${r.title}`}
                  className="text-[var(--text-faint)] hover:text-[var(--stamp)] transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
              <button
                onClick={() => {
                  downloadICS(r);
                  onMarkAdded(r.id);
                }}
                className="flex items-center gap-1.5 mt-3 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors"
                style={
                  r.addedToCalendar
                    ? { borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg)" }
                    : { borderColor: "var(--stamp)", color: "var(--stamp)", background: "var(--stamp)" + "12" }
                }
              >
                <CalendarPlus size={13} />
                {r.addedToCalendar ? "Added — tap to add again" : "Add to phone calendar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
