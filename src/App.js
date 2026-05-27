import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  deleteDoc, addDoc, query, orderBy, serverTimestamp, getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_ACTIVITIES, CATEGORIES } from "./activities";

const KIDS = ["Brooklyn", "Daphne"];
const COLORS = {
  Brooklyn: { bg: "#fde8f0", accent: "#e8548a", light: "#fdf0f5", text: "#c0356b", grad: "linear-gradient(135deg,#fde8f0,#ffd6e7)" },
  Daphne:   { bg: "#e8f0fd", accent: "#5480e8", light: "#f0f4fd", text: "#2f55c9", grad: "linear-gradient(135deg,#e8f0fd,#d6e4ff)" },
};
const SCREEN_FREE_IDS = ["screen_free_day", "screen_free_morning", "screen_free_evening"];

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) { return `$${Number(n).toFixed(2)}`; }
function today() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ── Sub-components ────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fffbf0" }}>
      <div style={{ fontSize:48, animation:"spin 1s linear infinite" }}>☀️</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
      background:"#1a1a1a", color:"#fff", borderRadius:40, padding:"12px 28px",
      fontFamily:"'DM Sans',sans-serif", fontSize:15, zIndex:1000, whiteSpace:"nowrap",
      boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"fadeup 0.3s ease"
    }}>{msg}
      <style>{`@keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

function CoinBurst({ visible }) {
  if (!visible) return null;
  const items = ["💰","⭐","✨","🌟","💛","🎉"];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:999 }}>
      {items.map((e,i) => (
        <span key={i} style={{
          position:"absolute", fontSize:32,
          left:`${30+i*8}%`, top:"45%",
          animation:`burst${i} 0.9s ease-out forwards`,
        }}>{e}</span>
      ))}
      <style>{items.map((_,i)=>`@keyframes burst${i}{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(${-120-i*20}px) translateX(${(i%2===0?1:-1)*30}px) scale(1.3)}}`).join("")}</style>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"#fff", border:"2px solid #e0d8c8", borderRadius:12,
      padding:"8px 16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
      fontSize:14, color:"#666", display:"flex", alignItems:"center", gap:6,
      transition:"all 0.15s"
    }}>← Back</button>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home|log|admin|history|manage
  const [selectedKid, setSelectedKid] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Data
  const [activities, setActivities] = useState([]);
  const [entries, setEntries] = useState([]);       // approved
  const [pending, setPending] = useState([]);       // awaiting approval
  const [paidOut, setPaidOut] = useState([]);       // paid

  // UI
  const [coinBurst, setCoinBurst] = useState(false);
  const [toast, setToast] = useState(null);

  // Admin manage state
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({ label:"", amount:"", category:"Learning", oneTime:false });
  const [showAddForm, setShowAddForm] = useState(false);

  const showToast = useCallback((msg, dur=2800) => {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  }, []);

  // ── Firebase listeners ──────────────────────────────────────
  useEffect(() => {
    // Activities
    const unsub1 = onSnapshot(collection(db, "activities"), async snap => {
      if (snap.empty) {
        // First run — seed defaults
        for (const act of DEFAULT_ACTIVITIES) {
          await setDoc(doc(db, "activities", act.id), act);
        }
      } else {
        setActivities(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }
    });

    // Entries
    const q2 = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, snap => {
      const all = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setEntries(all.filter(e => e.status === "approved"));
      setPending(all.filter(e => e.status === "pending"));
      setPaidOut(all.filter(e => e.status === "paid"));
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  // ── Derived ──────────────────────────────────────────────────
  const getBalance = (kid) => entries.filter(e => e.kid === kid).reduce((s,e) => s+e.amount, 0);
  const getPending = (kid) => pending.filter(e => e.kid === kid);

  // Screen-free stacking logic: on a given day, if "full day" is logged, morning+evening are blocked
  const getBlockedScreenFree = (kid) => {
    const key = todayKey();
    const todayEntries = [...entries, ...pending].filter(e => e.kid === kid && e.dayKey === key);
    const hasFullDay = todayEntries.some(e => e.activityId === "screen_free_day");
    const hasMorning = todayEntries.some(e => e.activityId === "screen_free_morning");
    const hasEvening = todayEntries.some(e => e.activityId === "screen_free_evening");
    const blocked = new Set();
    if (hasFullDay) { blocked.add("screen_free_morning"); blocked.add("screen_free_evening"); }
    if (hasMorning && hasEvening) blocked.add("screen_free_day"); // already got both halves
    return blocked;
  };

  // One-time activities already claimed by a kid
  const getClaimedOneTime = (kid) => {
    const all = [...entries, ...pending, ...paidOut];
    return new Set(all.filter(e => e.kid === kid).map(e => e.activityId));
  };

  // ── Actions ──────────────────────────────────────────────────
  const handleLogActivity = async () => {
    if (!selectedKid || !selectedActivityId) return;
    const act = activities.find(a => a.id === selectedActivityId);
    if (!act) return;

    await addDoc(collection(db, "entries"), {
      kid: selectedKid,
      activityId: act.id,
      activityLabel: act.label,
      amount: act.amount,
      status: "pending",
      date: today(),
      dayKey: todayKey(),
      createdAt: serverTimestamp(),
    });

    setSelectedActivityId(null);
    setView("home");
    showToast("Logged! Waiting for Mom's approval ⏳");
  };

  const handleApprove = async (entry) => {
    await updateDoc(doc(db, "entries", entry.id), { status: "approved" });
    setCoinBurst(true);
    setTimeout(() => setCoinBurst(false), 1000);
    showToast(`✓ Approved ${fmt(entry.amount)} for ${entry.kid}!`);
  };

  const handleReject = async (entry) => {
    await updateDoc(doc(db, "entries", entry.id), { status: "rejected" });
    showToast("Entry rejected.");
  };

  const handlePayout = async (kid) => {
    const bal = getBalance(kid);
    if (bal === 0) return;
    const toUpdate = entries.filter(e => e.kid === kid);
    await Promise.all(toUpdate.map(e => updateDoc(doc(db, "entries", e.id), { status: "paid" })));
    showToast(`💸 Paid out ${fmt(bal)} to ${kid}!`);
  };

  // ── Activity Management ──────────────────────────────────────
  const handleSaveActivity = async () => {
    if (!newActivity.label.trim() || !newActivity.amount) return;
    const id = `custom_${Date.now()}`;
    await setDoc(doc(db, "activities", id), {
      id, label: newActivity.label.trim(),
      amount: parseFloat(newActivity.amount),
      category: newActivity.category,
      oneTime: newActivity.oneTime,
      sharedMeal: false,
    });
    setNewActivity({ label:"", amount:"", category:"Learning", oneTime:false });
    setShowAddForm(false);
    showToast("Activity added! 🎉");
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    await updateDoc(doc(db, "activities", editingActivity.id), {
      label: editingActivity.label,
      amount: parseFloat(editingActivity.amount),
      category: editingActivity.category,
      oneTime: editingActivity.oneTime,
    });
    setEditingActivity(null);
    showToast("Updated!");
  };

  const handleDeleteActivity = async (id) => {
    await deleteDoc(doc(db, "activities", id));
    showToast("Removed.");
  };

  // ── Render ────────────────────────────────────────────────────
  if (loading) return <Spinner />;

  const categories = ["All", ...CATEGORIES, ...Array.from(new Set(activities.map(a=>a.category))).filter(c=>!CATEGORIES.includes(c))];

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#fffbef 0%,#fff9f0 60%,#f5f0ff 100%)",
      fontFamily:"'DM Sans','Helvetica Neue',sans-serif",
      padding:"16px 16px 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;border:none;outline:none;font-family:inherit}
        input,select,textarea{font-family:inherit;outline:none}
        .btn{transition:all 0.15s ease}
        .btn:hover{transform:translateY(-1px);filter:brightness(1.04)}
        .btn:active{transform:scale(0.97)}
        .fade{animation:fadeIn 0.35s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tag{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.3px}
      `}</style>

      <CoinBurst visible={coinBurst} />
      <Toast msg={toast} />

      {/* ── HEADER ── */}
      <div style={{ textAlign:"center", marginBottom:22, paddingTop:8 }}>
        <div style={{ fontSize:40, lineHeight:1 }}>☀️</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:"#1a1a1a", marginTop:6, letterSpacing:"-0.5px" }}>
          Summer Earnings
        </h1>
        <p style={{ color:"#aaa", fontSize:13, marginTop:3 }}>Brooklyn & Daphne · {new Date().getFullYear()}</p>
      </div>

      {/* ══════════════════════════ HOME ══════════════════════════ */}
      {view === "home" && (
        <div className="fade">
          {/* Kid cards */}
          <div style={{ display:"flex", gap:14, marginBottom:16 }}>
            {KIDS.map(kid => {
              const c = COLORS[kid];
              const bal = getBalance(kid);
              const pend = getPending(kid);
              return (
                <div key={kid} style={{
                  flex:1, borderRadius:24, padding:"20px 16px",
                  background: c.grad, border:`2px solid ${c.accent}25`,
                  position:"relative", overflow:"hidden"
                }}>
                  {/* Decorative circle */}
                  <div style={{ position:"absolute", top:-20, right:-20, width:90, height:90, borderRadius:"50%", background:c.accent, opacity:0.08 }} />
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:c.text, marginBottom:2 }}>{kid}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:900, color:c.accent, lineHeight:1.1 }}>
                    {fmt(bal)}
                  </div>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:2, marginBottom:12 }}>available balance</div>
                  {pend.length > 0 && (
                    <div style={{ background:"#fff8", borderRadius:10, padding:"5px 10px", fontSize:12, color:c.text, marginBottom:10 }}>
                      ⏳ {pend.length} pending
                    </div>
                  )}
                  <button className="btn" onClick={() => { setSelectedKid(kid); setView("log"); }}
                    style={{ width:"100%", padding:"11px 0", borderRadius:14, background:c.accent, color:"#fff", fontSize:14, fontWeight:700 }}>
                    + Log Activity
                  </button>
                </div>
              );
            })}
          </div>

          {/* Nav row */}
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn" onClick={() => setView("history")}
              style={{ flex:1, padding:"12px 0", borderRadius:14, background:"#fff", border:"2px solid #ede5d8", fontSize:14, fontWeight:600, color:"#555" }}>
              📋 History
            </button>
            <button className="btn" onClick={() => setView("admin")}
              style={{ flex:1, padding:"12px 0", borderRadius:14, background:"#fffbea", border:"2px solid #f0d060", fontSize:14, fontWeight:600, color:"#9a7a00" }}>
              ⚙️ Parent Zone
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════ LOG ACTIVITY ══════════════════════════ */}
      {view === "log" && selectedKid && (() => {
        const c = COLORS[selectedKid];
        const blocked = getBlockedScreenFree(selectedKid);
        const claimedOneTime = getClaimedOneTime(selectedKid);
        const filteredActivities = activities.filter(a =>
          selectedCategory === "All" ? true : a.category === selectedCategory
        );

        return (
          <div className="fade">
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <BackBtn onClick={() => { setView("home"); setSelectedActivityId(null); }} />
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:c.text }}>{selectedKid}'s Activities</h2>
            </div>

            {/* Category filter */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:14 }}>
              {categories.map(cat => (
                <button key={cat} className="btn" onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding:"6px 14px", borderRadius:20, whiteSpace:"nowrap",
                    background: selectedCategory===cat ? c.accent : "#fff",
                    color: selectedCategory===cat ? "#fff" : "#666",
                    border: `2px solid ${selectedCategory===cat ? c.accent : "#e0d8c8"}`,
                    fontSize:13, fontWeight:600
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Activity list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {filteredActivities.map(act => {
                const isSelected = selectedActivityId === act.id;
                const isBlocked = blocked.has(act.id);
                const isClaimedOnce = act.oneTime && claimedOneTime.has(act.id);
                const disabled = isBlocked || isClaimedOnce;

                return (
                  <button key={act.id} className={disabled ? "" : "btn"}
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedActivityId(isSelected ? null : act.id)}
                    style={{
                      textAlign:"left", padding:"13px 16px", borderRadius:14,
                      background: disabled ? "#f5f5f5" : isSelected ? c.bg : "#fff",
                      border:`2px solid ${disabled ? "#e8e8e8" : isSelected ? c.accent : "#ede5d8"}`,
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      opacity: disabled ? 0.5 : 1,
                    }}>
                    <div style={{ flex:1, paddingRight:12 }}>
                      <div style={{ fontSize:14, color: disabled ? "#aaa" : "#333", lineHeight:1.4 }}>{act.label}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
                        <span className="tag" style={{ background:`${c.accent}18`, color:c.text }}>{act.category}</span>
                        {act.oneTime && <span className="tag" style={{ background:"#fff3cd", color:"#856404" }}>one-time</span>}
                        {isClaimedOnce && <span className="tag" style={{ background:"#e8e8e8", color:"#999" }}>✓ done</span>}
                        {isBlocked && <span className="tag" style={{ background:"#ffe4e4", color:"#c0392b" }}>blocked today</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:disabled?"#ccc":c.accent, whiteSpace:"nowrap" }}>
                      {fmt(act.amount)}
                    </div>
                  </button>
                );
              })}
              {filteredActivities.length === 0 && (
                <div style={{ textAlign:"center", color:"#bbb", padding:32, fontSize:14 }}>No activities in this category yet.</div>
              )}
            </div>

            <button className="btn" onClick={handleLogActivity} disabled={!selectedActivityId}
              style={{
                width:"100%", padding:"16px 0", borderRadius:16,
                background: selectedActivityId ? c.accent : "#ddd",
                color:"#fff", fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700,
                boxShadow: selectedActivityId ? `0 4px 20px ${c.accent}50` : "none",
                transition:"all 0.2s"
              }}>
              Submit for Approval ✓
            </button>
          </div>
        );
      })()}

      {/* ══════════════════════════ ADMIN ══════════════════════════ */}
      {view === "admin" && (
        <div className="fade">
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <BackBtn onClick={() => setView("home")} />
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>Parent Zone</h2>
          </div>

          {/* Pending */}
          <h3 style={{ fontSize:16, fontWeight:700, color:"#555", marginBottom:10 }}>
            ⏳ Pending Approval
            {pending.length > 0 && <span style={{ marginLeft:8, background:"#ff5252", color:"#fff", borderRadius:20, padding:"2px 8px", fontSize:12 }}>{pending.length}</span>}
          </h3>
          {pending.length === 0 ? (
            <div style={{ background:"#fff", borderRadius:16, padding:"20px", textAlign:"center", color:"#bbb", fontSize:14, marginBottom:20 }}>All clear! 🌟</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {pending.map(e => {
                const c = COLORS[e.kid];
                return (
                  <div key={e.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", border:`2px solid ${c.accent}30` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <span style={{ fontWeight:700, color:c.text, fontSize:14 }}>{e.kid}</span>
                        <div style={{ color:"#555", fontSize:13, marginTop:2, lineHeight:1.4 }}>{e.activityLabel}</div>
                        <div style={{ color:"#bbb", fontSize:11, marginTop:2 }}>{e.date}</div>
                      </div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:c.accent }}>{fmt(e.amount)}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn" onClick={() => handleApprove(e)}
                        style={{ flex:1, padding:"10px 0", borderRadius:12, background:"#4caf50", color:"#fff", fontSize:14, fontWeight:700 }}>
                        ✓ Approve
                      </button>
                      <button className="btn" onClick={() => handleReject(e)}
                        style={{ flex:1, padding:"10px 0", borderRadius:12, background:"#ff5252", color:"#fff", fontSize:14, fontWeight:700 }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pay Out */}
          <h3 style={{ fontSize:16, fontWeight:700, color:"#555", marginBottom:10 }}>💸 Pay Out</h3>
          <div style={{ display:"flex", gap:12, marginBottom:28 }}>
            {KIDS.map(kid => {
              const c = COLORS[kid];
              const bal = getBalance(kid);
              return (
                <div key={kid} style={{ flex:1, background:c.grad, borderRadius:20, padding:"16px", textAlign:"center", border:`2px solid ${c.accent}25` }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:c.text }}>{kid}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:32, color:c.accent, margin:"8px 0" }}>{fmt(bal)}</div>
                  <button className="btn" onClick={() => handlePayout(kid)} disabled={bal===0}
                    style={{ width:"100%", padding:"10px 0", borderRadius:12, background:bal>0?c.accent:"#ddd", color:"#fff", fontSize:13, fontWeight:700 }}>
                    Mark as Paid
                  </button>
                </div>
              );
            })}
          </div>

          {/* Manage Activities */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"#555" }}>🎯 Manage Activities</h3>
            <button className="btn" onClick={() => setView("manage")}
              style={{ padding:"8px 16px", borderRadius:12, background:"#f0c84a", fontSize:13, fontWeight:700, color:"#7a5c00" }}>
              Edit List →
            </button>
          </div>
          <div style={{ background:"#fffbea", borderRadius:14, padding:"12px 16px", color:"#9a7a00", fontSize:13 }}>
            Add, remove, or edit activities and amounts. Changes go live immediately on all devices.
          </div>
        </div>
      )}

      {/* ══════════════════════════ MANAGE ACTIVITIES ══════════════════════════ */}
      {view === "manage" && (
        <div className="fade">
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <BackBtn onClick={() => setView("admin")} />
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>Manage Activities</h2>
          </div>

          {/* Add new */}
          <button className="btn" onClick={() => setShowAddForm(!showAddForm)}
            style={{ width:"100%", padding:"13px 0", borderRadius:14, background: showAddForm ? "#eee" : "#4caf50", color: showAddForm ? "#666" : "#fff", fontSize:15, fontWeight:700, marginBottom:14 }}>
            {showAddForm ? "✕ Cancel" : "+ Add New Activity"}
          </button>

          {showAddForm && (
            <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"2px solid #e0f0e0", marginBottom:16 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input value={newActivity.label} onChange={e => setNewActivity(p=>({...p,label:e.target.value}))}
                  placeholder="Activity name (e.g. 🎸 Practice guitar 30 min)"
                  style={{ padding:"10px 14px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14 }} />
                <div style={{ display:"flex", gap:10 }}>
                  <input type="number" value={newActivity.amount} onChange={e => setNewActivity(p=>({...p,amount:e.target.value}))}
                    placeholder="Amount $"
                    style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14 }} />
                  <select value={newActivity.category} onChange={e => setNewActivity(p=>({...p,category:e.target.value}))}
                    style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14, background:"#fff" }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, color:"#555", cursor:"pointer" }}>
                  <input type="checkbox" checked={newActivity.oneTime} onChange={e => setNewActivity(p=>({...p,oneTime:e.target.checked}))} />
                  One-time only (can only be claimed once per kid)
                </label>
                <button className="btn" onClick={handleSaveActivity}
                  style={{ padding:"11px 0", borderRadius:12, background:"#4caf50", color:"#fff", fontSize:15, fontWeight:700 }}>
                  Save Activity
                </button>
              </div>
            </div>
          )}

          {/* Activity list grouped by category */}
          {CATEGORIES.concat(Array.from(new Set(activities.map(a=>a.category))).filter(c=>!CATEGORIES.includes(c))).map(cat => {
            const catActivities = activities.filter(a => a.category === cat);
            if (catActivities.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom:18 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#aaa", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{cat}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {catActivities.map(act => (
                    <div key={act.id}>
                      {editingActivity?.id === act.id ? (
                        <div style={{ background:"#fff", borderRadius:14, padding:"14px", border:"2px solid #5480e8" }}>
                          <input value={editingActivity.label} onChange={e => setEditingActivity(p=>({...p,label:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14, marginBottom:8 }} />
                          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                            <input type="number" value={editingActivity.amount} onChange={e => setEditingActivity(p=>({...p,amount:e.target.value}))}
                              style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14 }} />
                            <select value={editingActivity.category} onChange={e => setEditingActivity(p=>({...p,category:e.target.value}))}
                              style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"2px solid #e0d8c8", fontSize:14, background:"#fff" }}>
                              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#555", marginBottom:10, cursor:"pointer" }}>
                            <input type="checkbox" checked={editingActivity.oneTime} onChange={e => setEditingActivity(p=>({...p,oneTime:e.target.checked}))} />
                            One-time only
                          </label>
                          <div style={{ display:"flex", gap:8 }}>
                            <button className="btn" onClick={handleUpdateActivity}
                              style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#5480e8", color:"#fff", fontSize:13, fontWeight:700 }}>Save</button>
                            <button className="btn" onClick={() => setEditingActivity(null)}
                              style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#eee", color:"#666", fontSize:13, fontWeight:700 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background:"#fff", borderRadius:14, padding:"12px 14px", border:"2px solid #ede5d8", display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, color:"#333", lineHeight:1.4 }}>{act.label}</div>
                            <div style={{ display:"flex", gap:6, marginTop:4 }}>
                              {act.oneTime && <span className="tag" style={{ background:"#fff3cd", color:"#856404" }}>one-time</span>}
                            </div>
                          </div>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:"#888", marginRight:8 }}>{fmt(act.amount)}</div>
                          <button className="btn" onClick={() => setEditingActivity({...act})}
                            style={{ padding:"6px 12px", borderRadius:10, background:"#f0f4fd", color:"#5480e8", fontSize:12, fontWeight:700 }}>Edit</button>
                          <button className="btn" onClick={() => handleDeleteActivity(act.id)}
                            style={{ padding:"6px 12px", borderRadius:10, background:"#fff0f0", color:"#ff5252", fontSize:12, fontWeight:700 }}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════ HISTORY ══════════════════════════ */}
      {view === "history" && (
        <div className="fade">
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <BackBtn onClick={() => setView("home")} />
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>History</h2>
          </div>

          {/* Totals */}
          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            {KIDS.map(kid => {
              const c = COLORS[kid];
              const total = [...entries, ...paidOut].filter(e=>e.kid===kid).reduce((s,e)=>s+e.amount,0);
              return (
                <div key={kid} style={{ flex:1, background:c.grad, borderRadius:18, padding:"14px", textAlign:"center", border:`2px solid ${c.accent}25` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:c.text }}>{kid}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:c.accent }}>{fmt(total)}</div>
                  <div style={{ fontSize:11, color:"#aaa" }}>total earned</div>
                </div>
              );
            })}
          </div>

          {[...entries, ...paidOut].length === 0 ? (
            <div style={{ textAlign:"center", color:"#bbb", padding:40, fontSize:15 }}>Nothing yet — get earning! 🌻</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[...entries, ...paidOut].map(e => {
                const c = COLORS[e.kid];
                const isPaid = e.status === "paid";
                return (
                  <div key={e.id} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"12px 16px", borderRadius:14, background:"#fff",
                    border:`2px solid ${isPaid ? "#f0f0f0" : c.accent+"30"}`
                  }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:isPaid?"#ccc":c.text }}>{e.kid}</div>
                      <div style={{ fontSize:13, color:isPaid?"#ccc":"#555", marginTop:1, lineHeight:1.3 }}>{e.activityLabel}</div>
                      <div style={{ fontSize:11, color:"#ccc", marginTop:1 }}>{e.date}{isPaid?" · paid out":""}</div>
                    </div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:isPaid?"#ccc":c.accent }}>
                      {fmt(e.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
