import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import StarRating from '../components/StarRating'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getLunchDate(lunch) {
  if (!lunch.date) return null
  return lunch.date.toDate ? lunch.date.toDate() : new Date(lunch.date)
}

function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function computeAvg(lunch) {
  const vals = Object.values(lunch.ratings || {}).map((r) => r.overall).filter(Boolean)
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function LunchPill({ lunch, onClick }) {
  const avg = computeAvg(lunch)
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#16213e] hover:bg-green-400/10 border border-green-400/20 rounded-lg p-1.5 transition-colors"
    >
      {lunch.imageUrl && (
        <img src={lunch.imageUrl} alt="" className="w-full h-12 object-cover rounded mb-1" />
      )}
      <p className="text-white text-xs font-semibold truncate leading-tight">{lunch.name}</p>
      {avg && (
        <p className="text-yellow-400 text-xs font-black mt-0.5">{avg}★</p>
      )}
    </button>
  )
}

function LunchModal({ lunch, allUsers, onClose }) {
  if (!lunch) return null
  const avg = computeAvg(lunch)

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f3460] rounded-2xl border border-green-400/30 max-w-sm w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {lunch.imageUrl && (
          <img src={lunch.imageUrl} alt={lunch.name} className="w-full h-48 object-cover rounded-t-2xl" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-black text-white">{lunch.name}</h2>
            <button onClick={onClose} className="text-green-300/50 hover:text-green-300 text-lg ml-2">✕</button>
          </div>
          {lunch.date && (
            <p className="text-green-300/50 text-xs mb-4">
              {getLunchDate(lunch)?.toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}

          {(lunch.components || []).length > 0 && (
            <div className="mb-4">
              <h3 className="text-green-400 font-bold text-sm mb-2">Food Items</h3>
              <div className="flex flex-wrap gap-1.5">
                {lunch.components.map((c) => (
                  <span key={c.id} className="bg-green-400/10 text-green-300 text-xs px-2 py-1 rounded-full">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(lunch.ratings || {}).length > 0 && (
            <div>
              <h3 className="text-green-400 font-bold text-sm mb-2">
                Ratings {avg && <span className="text-yellow-400">· {avg}★ avg</span>}
              </h3>
              {Object.entries(lunch.ratings).map(([uid, r]) => (
                <div key={uid} className="flex items-center gap-3 mb-1.5">
                  <span className="text-green-300/60 text-xs w-24 truncate">
                    {allUsers[uid]?.displayName || 'Unknown'}
                  </span>
                  <StarRating value={r.overall || 0} readonly size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [lunches, setLunches] = useState([])
  const [allUsers, setAllUsers] = useState({})
  const [selectedLunch, setSelectedLunch] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lunches'), (snap) => {
      setLunches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.id] = d.data() })
      setAllUsers(map)
    })
    return unsub
  }, [])

  // Build a map: "YYYY-MM-DD" → [lunch, ...]
  const lunchByDay = {}
  lunches.forEach((lunch) => {
    const d = getLunchDate(lunch)
    if (!d) return
    const key = toKey(d.getFullYear(), d.getMonth(), d.getDate())
    if (!lunchByDay[key]) lunchByDay[key] = []
    lunchByDay[key].push(lunch)
  })

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-[#0f3460] border border-green-400/20 text-green-400 hover:bg-green-400/20 font-bold transition-colors"
          >
            ‹
          </button>
          <span className="text-white font-black text-lg w-44 text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-[#0f3460] border border-green-400/20 text-green-400 hover:bg-green-400/20 font-bold transition-colors"
          >
            ›
          </button>
          <button
            onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
            className="ml-2 px-3 py-1.5 rounded-xl bg-green-400/10 text-green-400 border border-green-400/20 text-sm font-bold hover:bg-green-400/20 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-green-300/50 text-xs font-bold py-2">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - firstDay + 1
          const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
          const dayKey = isCurrentMonth ? toKey(year, month, dayNum) : null
          const dayLunches = dayKey ? (lunchByDay[dayKey] || []) : []
          const isToday = dayKey === todayKey

          return (
            <div
              key={i}
              className={`min-h-24 rounded-xl p-1.5 border transition-colors ${
                !isCurrentMonth
                  ? 'border-transparent'
                  : isToday
                  ? 'bg-green-400/10 border-green-400/40'
                  : 'bg-[#0f3460] border-green-400/10 hover:border-green-400/30'
              }`}
            >
              {isCurrentMonth && (
                <>
                  <p className={`text-xs font-black mb-1 ${isToday ? 'text-green-400' : 'text-green-300/50'}`}>
                    {dayNum}
                  </p>
                  <div className="flex flex-col gap-1">
                    {dayLunches.map((lunch) => (
                      <LunchPill
                        key={lunch.id}
                        lunch={lunch}
                        onClick={() => setSelectedLunch(lunch)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <LunchModal
        lunch={selectedLunch}
        allUsers={allUsers}
        onClose={() => setSelectedLunch(null)}
      />
    </div>
  )
}
