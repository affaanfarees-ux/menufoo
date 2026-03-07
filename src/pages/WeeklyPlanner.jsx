import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import StarRating from '../components/StarRating'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function computeAvgRating(lunch) {
  const vals = Object.values(lunch.ratings || {}).map((r) => r.overall).filter(Boolean)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getWeekKey() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export default function WeeklyPlanner() {
  const [lunches, setLunches] = useState([])
  const [plan, setPlan] = useState({})
  const weekKey = getWeekKey()
  const planRef = doc(db, 'weeklyPlans', weekKey)

  useEffect(() => {
    const q = query(collection(db, 'lunches'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setLunches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    getDoc(planRef).then((snap) => {
      if (snap.exists()) setPlan(snap.data())
    })
    const unsub = onSnapshot(planRef, (snap) => {
      if (snap.exists()) setPlan(snap.data())
    })
    return unsub
  }, [weekKey])

  const ranked = [...lunches]
    .filter((l) => Object.keys(l.ratings || {}).length > 0)
    .map((l) => ({ ...l, avg: computeAvgRating(l) }))
    .sort((a, b) => b.avg - a.avg)

  async function assignLunch(day, lunchId) {
    const updated = { ...plan, [day]: lunchId }
    setPlan(updated)
    await setDoc(planRef, updated)
  }

  async function clearDay(day) {
    const updated = { ...plan }
    delete updated[day]
    setPlan(updated)
    await setDoc(planRef, updated)
  }

  function getLunch(lunchId) {
    return lunches.find((l) => l.id === lunchId)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-2">Weekly Planner</h1>
      <p className="text-green-300/60 text-sm mb-8">
        Week of {weekKey} — pick lunches for each day from the ranked list.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day slots */}
        <div>
          <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-3">This Week</h2>
          <div className="flex flex-col gap-3">
            {DAYS.map((day) => {
              const lunch = getLunch(plan[day])
              return (
                <div key={day} className="bg-[#0f3460] rounded-xl border border-green-400/20 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-green-300 font-bold text-sm">{day}</span>
                    {plan[day] && (
                      <button
                        onClick={() => clearDay(day)}
                        className="text-red-400/60 hover:text-red-400 text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {lunch ? (
                    <div className="flex items-center gap-2">
                      {lunch.imageUrl && (
                        <img src={lunch.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-white text-sm font-semibold">{lunch.name}</p>
                        {(lunch.components || []).length > 0 && (
                          <p className="text-green-300/50 text-xs">
                            {lunch.components.map((c) => c.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-green-300/30 text-xs italic">Not assigned</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ranked lunch picker */}
        <div>
          <h2 className="text-green-400 font-black text-sm uppercase tracking-widest mb-3">Top Lunches</h2>
          {ranked.length === 0 && (
            <p className="text-green-300/40 text-sm">No rated lunches yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {ranked.map((lunch) => (
              <div key={lunch.id} className="bg-[#0f3460] rounded-xl border border-green-400/20 p-3">
                <div className="flex items-start gap-3">
                  {lunch.imageUrl && (
                    <img src={lunch.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{lunch.name}</p>
                    {(lunch.components || []).length > 0 && (
                      <p className="text-green-300/50 text-xs mt-0.5">
                        {lunch.components.map((c) => c.name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <StarRating value={Math.round(lunch.avg)} readonly size="sm" />
                      <span className="text-yellow-400 text-xs font-black">{lunch.avg.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => assignLunch(day, lunch.id)}
                      className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${
                        plan[day] === lunch.id
                          ? 'bg-green-400 text-[#0f3460]'
                          : 'bg-green-400/10 text-green-300 hover:bg-green-400/30'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
