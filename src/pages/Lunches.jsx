import { useState, useEffect } from 'react'
import {
  collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'

function toDateInputValue(firestoreDate) {
  if (!firestoreDate) return ''
  const d = firestoreDate.toDate ? firestoreDate.toDate() : new Date(firestoreDate)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(firestoreDate) {
  if (!firestoreDate) return ''
  const d = firestoreDate.toDate ? firestoreDate.toDate() : new Date(firestoreDate)
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function LunchCard({ lunch, currentUser, userProfile, allUsers }) {
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [newName, setNewName] = useState(lunch.name)
  const [newDate, setNewDate] = useState(toDateInputValue(lunch.date))
  const [newComponent, setNewComponent] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  const isParent = userProfile?.role === 'parent'
  const isCreator = lunch.createdBy === currentUser.uid
  const canEdit = isCreator || isParent
  const lunchRef = doc(db, 'lunches', lunch.id)

  async function saveName() {
    if (!newName.trim()) return
    await updateDoc(lunchRef, { name: newName.trim() })
    setEditingName(false)
  }

  async function saveDate() {
    if (!newDate) return
    await updateDoc(lunchRef, { date: Timestamp.fromDate(new Date(newDate + 'T12:00:00')) })
    setEditingDate(false)
  }

  async function addComponent() {
    if (!newComponent.trim()) return
    const components = [...(lunch.components || []), { id: Date.now().toString(), name: newComponent.trim() }]
    await updateDoc(lunchRef, { components })
    setNewComponent('')
  }

  async function removeComponent(id) {
    const components = (lunch.components || []).filter((c) => c.id !== id)
    await updateDoc(lunchRef, { components })
  }

  async function rateOverall(stars) {
    const ratings = { ...(lunch.ratings || {}) }
    ratings[currentUser.uid] = { ...(ratings[currentUser.uid] || {}), overall: stars }
    await updateDoc(lunchRef, { ratings })
  }

  async function rateComponent(componentId, stars) {
    const ratings = { ...(lunch.ratings || {}) }
    ratings[currentUser.uid] = {
      ...(ratings[currentUser.uid] || {}),
      components: {
        ...((ratings[currentUser.uid] || {}).components || {}),
        [componentId]: stars,
      },
    }
    await updateDoc(lunchRef, { ratings })
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `lunches/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const imageUrl = await getDownloadURL(storageRef)
      await updateDoc(lunchRef, { imageUrl })
    } catch (err) {
      console.error(err)
    }
    setUploadingPhoto(false)
  }

  async function deleteLunch() {
    if (window.confirm('Delete this lunch entry?')) {
      await deleteDoc(lunchRef)
    }
  }

  const myRating = lunch.ratings?.[currentUser.uid]?.overall || 0

  const avgRating = (() => {
    const vals = Object.values(lunch.ratings || {}).map((r) => r.overall).filter(Boolean)
    if (!vals.length) return null
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  })()

  const displayImage = photoPreview || lunch.imageUrl

  return (
    <div className="bg-[#0f3460] rounded-2xl border border-green-400/20 overflow-hidden">
      {displayImage && (
        <img
          src={displayImage}
          alt={lunch.name}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        />
      )}
      <div className="p-4">
        {/* Name row */}
        <div className="flex items-center justify-between mb-1">
          {editingName && canEdit ? (
            <div className="flex gap-2 flex-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-[#16213e] border border-green-400/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
              />
              <button onClick={saveName} className="text-green-400 font-bold text-sm px-2">Save</button>
              <button onClick={() => setEditingName(false)} className="text-gray-400 text-sm px-1">✕</button>
            </div>
          ) : (
            <h3
              className={`text-lg font-bold text-white ${canEdit ? 'cursor-pointer hover:text-green-300' : ''}`}
              onClick={() => canEdit && setEditingName(true)}
              title={canEdit ? 'Click to rename' : ''}
            >
              {lunch.name}
              {canEdit && <span className="ml-1 text-xs text-green-500 opacity-50">✎</span>}
            </h3>
          )}
        </div>

        {/* Date row */}
        {editingDate ? (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-[#16213e] border border-green-400/50 rounded px-2 py-1 text-white text-xs focus:outline-none"
            />
            <button onClick={saveDate} className="text-green-400 font-bold text-xs">Save</button>
            <button onClick={() => setEditingDate(false)} className="text-gray-400 text-xs">✕</button>
          </div>
        ) : (
          <p
            className={`text-green-300/50 text-xs mb-3 ${canEdit ? 'cursor-pointer hover:text-green-300/80' : ''}`}
            onClick={() => canEdit && setEditingDate(true)}
            title={canEdit ? 'Click to change date' : ''}
          >
            {formatDisplayDate(lunch.date)}
            {canEdit && <span className="ml-1 opacity-40">✎</span>}
          </p>
        )}

        {/* Ratings */}
        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-xs text-green-300/60 mb-0.5">Your rating</p>
            <StarRating value={myRating} onChange={rateOverall} />
          </div>
          {avgRating && (
            <div className="ml-auto text-right">
              <p className="text-xs text-green-300/60 mb-0.5">Avg</p>
              <span className="text-yellow-400 font-black text-lg">{avgRating}★</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-green-400 text-sm font-semibold hover:text-green-300 transition-colors"
        >
          {expanded ? '▲ Hide details' : '▼ Show details'}
        </button>

        {expanded && (
          <div className="mt-4 border-t border-green-400/10 pt-4">

            {/* Photo upload */}
            <div className="mb-4">
              <h4 className="text-green-300 font-bold text-sm mb-2">Photo</h4>
              <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-bold transition-colors ${
                uploadingPhoto
                  ? 'bg-green-400/10 border-green-400/20 text-green-300/50'
                  : 'bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20'
              }`}>
                {uploadingPhoto ? '⏳ Uploading...' : lunch.imageUrl ? '📷 Change Photo' : '📷 Add Photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <h4 className="text-green-300 font-bold text-sm mb-2">Food Items</h4>
            {(lunch.components || []).length === 0 && (
              <p className="text-green-300/40 text-xs mb-2">No items yet.</p>
            )}
            <div className="flex flex-col gap-2 mb-3">
              {(lunch.components || []).map((comp) => (
                <div key={comp.id} className="bg-[#16213e] rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-semibold">{comp.name}</span>
                    {canEdit && (
                      <button
                        onClick={() => removeComponent(comp.id)}
                        className="text-red-400/60 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {Object.entries(lunch.ratings || {}).map(([uid, r]) => (
                      <div key={uid} className="flex items-center gap-2">
                        <span className="text-xs text-green-300/50 w-20 truncate">
                          {allUsers[uid]?.displayName || 'Unknown'}
                        </span>
                        <StarRating
                          value={r.components?.[comp.id] || 0}
                          onChange={uid === currentUser.uid ? (s) => rateComponent(comp.id, s) : undefined}
                          readonly={uid !== currentUser.uid}
                          size="sm"
                        />
                      </div>
                    ))}
                    {!lunch.ratings?.[currentUser.uid] && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-300/50 w-20 truncate">
                          {userProfile?.displayName}
                        </span>
                        <StarRating
                          value={0}
                          onChange={(s) => rateComponent(comp.id, s)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-1">
              <input
                value={newComponent}
                onChange={(e) => setNewComponent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComponent()}
                className="flex-1 bg-[#16213e] border border-green-400/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                placeholder="Add item (e.g. chips)"
              />
              <button
                onClick={addComponent}
                className="bg-green-400/20 text-green-400 border border-green-400/30 rounded-lg px-3 py-2 text-sm font-bold hover:bg-green-400/30"
              >
                + Add
              </button>
            </div>

            {Object.keys(lunch.ratings || {}).length > 0 && (
              <div className="mt-4 border-t border-green-400/10 pt-3">
                <h4 className="text-green-300 font-bold text-sm mb-2">All Ratings</h4>
                {Object.entries(lunch.ratings).map(([uid, r]) => (
                  <div key={uid} className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-green-300/60 w-24 truncate">
                      {allUsers[uid]?.displayName || 'Unknown'}
                    </span>
                    <StarRating value={r.overall || 0} readonly size="sm" />
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <button
                onClick={deleteLunch}
                className="mt-4 text-red-400/60 hover:text-red-400 text-xs"
              >
                Delete lunch entry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Lunches() {
  const { currentUser, userProfile } = useAuth()
  const [lunches, setLunches] = useState([])
  const [allUsers, setAllUsers] = useState({})
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      let imageUrl = null
      if (image) {
        const storageRef = ref(storage, `lunches/${Date.now()}_${image.name}`)
        await uploadBytes(storageRef, image)
        imageUrl = await getDownloadURL(storageRef)
      }
      await addDoc(collection(db, 'lunches'), {
        name: name.trim(),
        imageUrl,
        components: [],
        ratings: {},
        createdBy: currentUser.uid,
        date: Timestamp.fromDate(new Date(date + 'T12:00:00')),
      })
      setName('')
      setDate(new Date().toISOString().split('T')[0])
      setImage(null)
      setImagePreview(null)
      setShowForm(false)
    } catch (err) {
      console.error(err)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Lunch Log</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-400 text-[#0f3460] font-black px-4 py-2 rounded-xl hover:bg-green-300 transition-colors text-sm"
        >
          {showForm ? '✕ Cancel' : '+ New Lunch'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#0f3460] rounded-2xl p-5 border border-green-400/30 mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Log a Lunch</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-1">Lunch Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400"
                placeholder="e.g. PB&J Tuesday"
              />
            </div>
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#16213e] border border-green-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-2">Photo (optional)</label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 font-bold text-sm cursor-pointer hover:bg-green-400/20">
                📷 Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg h-40 object-cover w-full" />
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-400 text-[#0f3460] font-black py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Lunch'}
            </button>
          </div>
        </form>
      )}

      {lunches.length === 0 && (
        <div className="text-center py-16 text-green-300/40">
          <p className="text-5xl mb-3">🍱</p>
          <p className="font-semibold">No lunches yet. Log your first one!</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {lunches.map((lunch) => (
          <LunchCard
            key={lunch.id}
            lunch={lunch}
            currentUser={currentUser}
            userProfile={userProfile}
            allUsers={allUsers}
          />
        ))}
      </div>
    </div>
  )
}
