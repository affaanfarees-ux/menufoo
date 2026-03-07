import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import StarRating from '../components/StarRating'

function computeAvgRating(lunch) {
  const vals = Object.values(lunch.ratings || {}).map((r) => r.overall).filter(Boolean)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeComponentInsights(lunches, allUsers) {
  // Aggregate per-component average ratings across all lunches
  const insights = {}
  lunches.forEach((lunch) => {
    ;(lunch.components || []).forEach((comp) => {
      const key = comp.name.toLowerCase()
      if (!insights[key]) insights[key] = { name: comp.name, ratings: [], count: 0 }
      Object.values(lunch.ratings || {}).forEach((r) => {
        const val = r.components?.[comp.id]
        if (val) {
          insights[key].ratings.push(val)
          insights[key].count++
        }
      })
    })
  })
  return Object.values(insights)
    .map((item) => ({
      ...item,
      avg: item.ratings.length ? item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length : 0,
    }))
    .sort((a, b) => b.avg - a.avg)
}

export default function Recommendations() {
  const [lunches, setLunches] = useState([])
  const [allUsers, setAllUsers] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'lunches'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
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

  const ranked = [...lunches]
    .filter((l) => Object.keys(l.ratings || {}).length > 0)
    .map((l) => ({ ...l, avg: computeAvgRating(l) }))
    .sort((a, b) => b.avg - a.avg)

  const unrated = lunches.filter((l) => Object.keys(l.ratings || {}).length === 0)

  const componentInsights = computeComponentInsights(lunches, allUsers)
  const loved = componentInsights.filter((c) => c.avg >= 4)
  const disliked = componentInsights.filter((c) => c.avg > 0 && c.avg < 3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-2">Recommendations</h1>
      <p className="text-green-300/60 text-sm mb-8">
        Lunches ranked by combined star ratings from everyone.
      </p>

      {ranked.length === 0 && (
        <div className="text-center py-12 text-green-300/40">
          <p className="text-5xl mb-3">⭐</p>
          <p className="font-semibold">No rated lunches yet. Start rating in the Lunch Log!</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-10">
        {ranked.map((lunch, i) => (
          <div key={lunch.id} className="bg-[#0f3460] rounded-2xl border border-green-400/20 p-4 flex gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-400/10 text-green-400 font-black text-lg flex-shrink-0">
              {i + 1}
            </div>
            {lunch.imageUrl && (
              <img src={lunch.imageUrl} alt={lunch.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold truncate">{lunch.name}</h3>
              {(lunch.components || []).length > 0 && (
                <p className="text-green-300/60 text-xs mt-0.5">
                  {lunch.components.map((c) => c.name).join(' · ')}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <StarRating value={Math.round(lunch.avg)} readonly size="sm" />
                <span className="text-yellow-400 text-sm font-black">{lunch.avg.toFixed(1)}</span>
                <span className="text-green-300/40 text-xs">
                  {Object.keys(lunch.ratings).length} rating{Object.keys(lunch.ratings).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Object.entries(lunch.ratings).map(([uid, r]) => (
                  <span key={uid} className="text-xs bg-[#16213e] rounded-full px-2 py-0.5 text-green-300/70">
                    {allUsers[uid]?.displayName || 'Unknown'}: {r.overall}★
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Component insights */}
      {componentInsights.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {loved.length > 0 && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-2xl p-4">
              <h3 className="text-green-400 font-black text-sm mb-3">Pack more of this 👍</h3>
              <ul className="flex flex-col gap-1.5">
                {loved.map((c) => (
                  <li key={c.name} className="flex justify-between text-sm">
                    <span className="text-white">{c.name}</span>
                    <span className="text-yellow-400 font-bold">{c.avg.toFixed(1)}★</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {disliked.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <h3 className="text-red-400 font-black text-sm mb-3">Maybe skip these 👎</h3>
              <ul className="flex flex-col gap-1.5">
                {disliked.map((c) => (
                  <li key={c.name} className="flex justify-between text-sm">
                    <span className="text-white">{c.name}</span>
                    <span className="text-red-400 font-bold">{c.avg.toFixed(1)}★</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
