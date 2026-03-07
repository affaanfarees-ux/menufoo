import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function getWeekKey() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export default function ShoppingList() {
  const [lunches, setLunches] = useState([])
  const [plan, setPlan] = useState({})
  const [checked, setChecked] = useState({})
  const weekKey = getWeekKey()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lunches'), (snap) => {
      setLunches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'weeklyPlans', weekKey), (snap) => {
      if (snap.exists()) setPlan(snap.data())
    })
    return unsub
  }, [weekKey])

  function getLunch(id) {
    return lunches.find((l) => l.id === id)
  }

  // Aggregate ingredients from planned lunches
  const ingredientMap = {}
  DAYS.forEach((day) => {
    const lunch = getLunch(plan[day])
    if (!lunch) return
    ;(lunch.components || []).forEach((comp) => {
      const key = comp.name.toLowerCase()
      if (!ingredientMap[key]) {
        ingredientMap[key] = { name: comp.name, days: [] }
      }
      ingredientMap[key].days.push(day.slice(0, 3))
    })
  })

  const items = Object.values(ingredientMap).sort((a, b) => a.name.localeCompare(b.name))

  function toggleCheck(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function clearChecked() {
    setChecked({})
  }

  const uncheckedCount = items.filter((i) => !checked[i.name.toLowerCase()]).length

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black text-white">Shopping List</h1>
        {Object.keys(checked).length > 0 && (
          <button
            onClick={clearChecked}
            className="text-green-400 text-sm font-bold hover:text-green-300"
          >
            Clear checks
          </button>
        )}
      </div>
      <p className="text-green-300/60 text-sm mb-8">
        Aggregated ingredients for week of {weekKey} · {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining
      </p>

      {items.length === 0 && (
        <div className="text-center py-16 text-green-300/40">
          <p className="text-5xl mb-3">🛒</p>
          <p className="font-semibold">
            No items yet. Assign lunches in the Weekly Planner first.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const key = item.name.toLowerCase()
          const done = !!checked[key]
          return (
            <button
              key={key}
              onClick={() => toggleCheck(key)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                done
                  ? 'bg-green-400/5 border-green-400/10 opacity-50'
                  : 'bg-[#0f3460] border-green-400/20 hover:border-green-400/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  done ? 'bg-green-400 border-green-400' : 'border-green-400/40'
                }`}
              >
                {done && <span className="text-[#0f3460] text-xs font-black">✓</span>}
              </div>
              <div className="flex-1">
                <span className={`font-semibold text-sm ${done ? 'line-through text-green-300/40' : 'text-white'}`}>
                  {item.name}
                </span>
                <span className="ml-2 text-xs text-green-300/40">
                  {item.days.join(', ')}
                </span>
              </div>
              <span className="text-xs text-green-300/30">
                ×{item.days.length}
              </span>
            </button>
          )
        })}
      </div>

      {items.length > 0 && (
        <div className="mt-6 p-4 bg-[#0f3460] rounded-xl border border-green-400/20">
          <h3 className="text-green-400 font-black text-sm mb-2">This week's lunches</h3>
          <div className="flex flex-col gap-1">
            {DAYS.map((day) => {
              const lunch = getLunch(plan[day])
              return (
                <div key={day} className="flex gap-2 text-sm">
                  <span className="text-green-300/60 w-24">{day}</span>
                  <span className="text-white">{lunch ? lunch.name : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
