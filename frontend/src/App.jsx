import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, MapPin, Search, Sparkles, Users, X } from 'lucide-react'

const API = (import.meta.env.VITE_API_BASE_URL || 'https://ai-workshop-o9fd.onrender.com').replace(/\/$/, '')
const colors = ['lavender', 'peach', 'blue', 'green']

function guestId() {
  let id = localStorage.getItem('gather_guest_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('gather_guest_id', id)
  }
  return id
}

function textValue(value, fallback = '') {
  if (value == null) return fallback
  return String(value)
}

function EventCard({ event, index, onOpen }) {
  const date = event.date || event.starts_at || event.start_time || event.event_date
  const prettyDate = date && !Number.isNaN(Date.parse(date))
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
    : 'Date to be announced'
  const capacity = Number(event.capacity)
  return <button className="event-card" onClick={() => onOpen(event)}>
    <div className={`card-art ${colors[index % colors.length]}`}>
      <div className="art-grid" />
      <span className="category-tag"><Sparkles size={13} /> COMMUNITY PICK</span>
      <ArrowDownRight className="art-mark" size={35} strokeWidth={1.5} />
      <div className="art-orbit" />
    </div>
    <div className="card-content">
      <div className="card-date"><CalendarDays size={14} /> {prettyDate}</div>
      <h3>{textValue(event.title, 'Untitled event')}</h3>
      <p className="card-summary">{textValue(event.description || event.summary, 'A good reason to get out, meet people, and learn something new.')}</p>
      <div className="card-meta">
        <span><MapPin size={14} /> {textValue(event.location || event.venue, 'Location to be announced')}</span>
        {Number.isFinite(capacity) && <span><Users size={14} /> {capacity} spots</span>}
      </div>
      <div className="card-footer"><span>Explore event</span><span className="round-arrow"><ArrowRight size={16} /></span></div>
    </div>
  </button>
}

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All events')
  const [selected, setSelected] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [notice, setNotice] = useState('')
  const [registered, setRegistered] = useState(() => JSON.parse(localStorage.getItem('gather_registered') || '[]'))

  async function loadEvents() {
    setLoading(true); setError('')
    try {
      const response = await fetch(`${API}/api/events`)
      if (!response.ok) throw new Error(`Events could not be loaded (${response.status}).`)
      const payload = await response.json()
      if (!Array.isArray(payload)) throw new Error('The events endpoint returned an unexpected response.')
      setEvents(payload)
    } catch (e) {
      setError(`${e.message} Check that the backend is awake and reachable.`)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadEvents() }, [])

  const filtered = useMemo(() => events.filter(event => {
    const needle = query.trim().toLowerCase()
    const matchesQuery = !needle || [event.title, event.description, event.location, event.venue, event.status].some(value => String(value || '').toLowerCase().includes(needle))
    const matchesFilter = filter === 'All events' || String(event.status || '').toLowerCase() === filter.toLowerCase()
    return matchesQuery && matchesFilter
  }), [events, query, filter])

  async function register(event) {
    setRegistering(true); setNotice('')
    try {
      const response = await fetch(`${API}/api/registrations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: guestId(), event_id: event.id }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || `Registration failed (${response.status}).`)
      const next = [...new Set([...registered, event.id])]
      setRegistered(next); localStorage.setItem('gather_registered', JSON.stringify(next))
      setNotice('You’re on the list! Your registration was saved.')
    } catch (e) { setNotice(e.message) }
    finally { setRegistering(false) }
  }

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-icon"><span /></span> gather<span className="brand-period">.</span></a>
      <nav><a href="#discover" className="nav-active">Discover</a><a href="#about">About</a></nav>
      <a className="host-link" href="#discover">Find your people <ArrowRight size={15} /></a>
    </header>
    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> MAKE ROOM FOR SOMETHING GOOD</div>
          <h1>Good things<br />happen <em>together.</em></h1>
          <p>Small gatherings, fresh ideas, and the people you haven’t met yet. Find your next favorite thing.</p>
          <a className="hero-cta" href="#discover">Explore what’s on <ArrowDownRight size={17} /></a>
          <div className="hero-note"><span className="note-avatars"><i>J</i><i>M</i><i>A</i></span><span>Good people. Good plans.</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-sun" /><div className="hero-card card-one"><div className="mini-top"><span>01 / OPEN STUDIO</span><ArrowDownRight size={17}/></div><div className="scribble">Make<br/><i>something.</i></div><div className="mini-bottom"><span>Ideas in good company</span><span>✳</span></div></div>
          <div className="hero-card card-two"><span className="mini-label">NEXT UP</span><div className="mini-title">A little<br/>more local.</div><div className="mini-stamp">G<br/>✳</div></div>
          <div className="hero-caption"><span>01</span><span className="caption-line"/><span>YOUR CITY, YOUR PEOPLE</span></div>
        </div>
        <div className="hero-side-note">MEET HERE · GO ANYWHERE</div>
      </section>
      <section className="ticker" aria-label="Gather"><div>COME AS YOU ARE <b>✳</b> LEAVE WITH A STORY <b>✳</b> GOOD THINGS HAPPEN TOGETHER <b>✳</b> COME AS YOU ARE <b>✳</b> LEAVE WITH A STORY <b>✳</b></div></section>
      <section className="discover" id="discover">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> THE GOOD STUFF</div><h2>Find your <em>next thing.</em></h2></div><p>A reason to get out there.<br/>A place to start.</p></div>
        <div className="toolbar"><div className="result-count">UPCOMING <span>{String(events.length).padStart(2, '0')}</span></div><div className="controls"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events" /></label><label className="select-box"><select value={filter} onChange={e => setFilter(e.target.value)}><option>All events</option>{[...new Set(events.map(e => e.status).filter(Boolean))].map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={15}/></label></div></div>
        {error && <div className="error-box"><span>{error}</span><button onClick={loadEvents}>Try again <ArrowRight size={14}/></button></div>}
        {loading ? <div className="loading-grid">{[0,1,2].map(i => <div className="skeleton" key={i}/>)}</div> : filtered.length ? <div className="event-grid">{filtered.map((event, index) => <EventCard key={event.id || index} event={event} index={index} onOpen={setSelected}/>)}</div> : !error && <div className="empty-state"><span className="empty-star">✳</span><h3>No plans found. Yet.</h3><p>Try another search, or check back soon for more gatherings.</p><button onClick={() => {setQuery(''); setFilter('All events')}}>Clear filters <ArrowRight size={14}/></button></div>}
        <div className="more-row"><span>THERE’S ALWAYS ROOM FOR ONE MORE</span><span className="more-spark">✳</span></div>
      </section>
      <section className="about" id="about"><div className="about-mark">g<span>✳</span></div><div><div className="eyebrow"><span className="eyebrow-dot" /> A LITTLE MORE HUMAN</div><h2>Make a plan.<br/><em>Make a friend.</em></h2><p>Gather is for the curious, the creative, and anyone ready to turn “we should” into “see you there.”</p></div><a href="#discover" className="about-link">See what’s happening <ArrowRight size={16}/></a></section>
    </main>
    <footer><a className="brand" href="#top"><span className="brand-icon"><span /></span> gather<span className="brand-period">.</span></a><span>GOOD THINGS HAPPEN TOGETHER.</span><span>MADE FOR SHOWING UP <b>✳</b></span></footer>

    {selected && <div className="modal-backdrop" onClick={() => {setSelected(null); setNotice('')}}><section className="event-modal" onClick={e => e.stopPropagation()}>
      <button className="close-button" aria-label="Close" onClick={() => {setSelected(null); setNotice('')}}><X size={19}/></button>
      <div className={`modal-art ${colors[events.indexOf(selected) % colors.length]}`}><span>GATHERING DETAILS</span><Sparkles size={30}/></div>
      <div className="modal-body"><div className="eyebrow"><span className="eyebrow-dot"/> YOU’RE INVITED</div><h2>{textValue(selected.title, 'Untitled event')}</h2><p>{textValue(selected.description || selected.summary, 'Come spend a little time with good people.')}</p>
        <div className="modal-facts"><span><CalendarDays size={16}/>{textValue(selected.date || selected.starts_at || selected.start_time || selected.event_date, 'Date to be announced')}</span><span><MapPin size={16}/>{textValue(selected.location || selected.venue, 'Location to be announced')}</span><span><Clock3 size={16}/>{textValue(selected.status, 'Open to everyone')}</span></div>
        {notice && <div className={`notice ${notice.startsWith('You’re') ? 'success' : ''}`}>{notice.startsWith('You’re') && <Check size={15}/>} {notice}</div>}
        <button className="register-button" disabled={registering || registered.includes(selected.id)} onClick={() => register(selected)}>{registering ? 'Saving your spot…' : registered.includes(selected.id) ? 'You’re registered' : 'Save me a spot'}{!registering && <ArrowRight size={17}/>}</button>
        <div className="guest-note">No account needed. Your browser keeps a private guest ID for this registration.</div>
      </div>
    </section></div>}
  </div>
}

export default App
