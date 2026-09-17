import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Stats from "./components/Stats";
import SearchBar from "./components/SearchBar";
import Dashboard from "./components/Dashboard";
import ReportForm from "./components/ReportForm";
import MatchSystem from "./components/MatchSystem";
import MapPanel from "./components/MapPanel";
import Footer from "./components/Footer";
import { initialItems } from "./data/dummyData";

function App() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("retrivium-items");
      return saved ? JSON.parse(saved) : initialItems;
    } catch {
      return initialItems;
    }
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem("retrivium-items", JSON.stringify(items));
  }, [items]);

  const addItem = (item) => setItems([item, ...items]);
  const markFound = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, status: "Found" } : i)));

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Hero ── */}
        <section className="fade-in" style={{ marginBottom: "52px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px", marginBottom: "20px",
            background: "rgba(6,182,212,0.08)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: "999px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "var(--cyan)", animation: "pulse-dot 2s infinite",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--cyan)", fontWeight: 600, letterSpacing: "0.1em" }}>
              CAMPUS RECOVERY NETWORK
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(52px, 7vw, 80px)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #e0f7fa 0%, var(--cyan) 40%, var(--blue) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "16px",
          }}>
            RETRIVIUM
          </h1>

          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "17px",
            color: "var(--text-secondary)",
            maxWidth: "480px",
            lineHeight: 1.65,
            fontWeight: 400,
          }}>
            Intelligent lost & found management for your campus community.
            Report, track, and recover items with smart match detection.
          </p>
        </section>

        {/* ── Stats ── */}
        <section className="fade-in fade-in-1" style={{ marginBottom: "28px" }}>
          <Stats items={items} />
        </section>

        {/* ── Search ── */}
        <section className="fade-in fade-in-2" style={{ marginBottom: "24px" }}>
          <SearchBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />
        </section>

        {/* ── Main 3-column grid ── */}
        <section className="fade-in fade-in-3" style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr 340px",
          gap: "20px",
          alignItems: "start",
          marginBottom: "40px",
        }}>
          <ReportForm addItem={addItem} />
          <Dashboard items={filteredItems} markFound={markFound} />
          <MapPanel items={items} />
        </section>

        {/* ── Smart Match ── */}
        <section className="fade-in fade-in-4">
          <MatchSystem items={items} />
        </section>

      </main>

      <Footer />
    </>
  );
}

export default App;
