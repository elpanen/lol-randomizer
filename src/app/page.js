'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

function toRiotChampionId(name) {
  const map = {
    "Wukong": "MonkeyKing",
    "Nunu & Willump": "NunuWillump",
    "Dr. Mundo": "DrMundo",
    "K'Sante": "KSante",
    "Vel'Koz": "Velkoz",
    "Kai'Sa": "Kaisa",
    "Cho'Gath": "Chogath",
    "Kha'Zix": "Khazix",
    "Rek'Sai": "RekSai",
    "Bel'Veth": "Belveth",
    "LeBlanc": "Leblanc"
  }

  return map[name] || name.replace(/[^a-zA-Z]/g, '')
}

export default function Home() {
  const canvasRef = useRef(null)

  const [champions, setChampions] = useState([])
  const [runes, setRunes] = useState(null)

  const [champ, setChamp] = useState(null)
  const [primary, setPrimary] = useState([])
  const [secondary, setSecondary] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('champions').select('*')
      setChampions(data || [])
    }
    load()
  }, [])

  
  useEffect(() => {
    async function loadRunes() {
      const res = await fetch(
        'https://ddragon.leagueoflegends.com/cdn/14.23.1/data/en_US/runesReforged.json'
      )
      const data = await res.json()
      setRunes(data)
    }

    loadRunes()
  }, [])


  useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  let last = null
  let points = []

  function move(e) {
    if (!last) {
      last = { x: e.clientX, y: e.clientY }
      return
    }

    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    const dist = Math.hypot(dx, dy)

    const steps = Math.max(1, dist / 2)

    for (let i = 0; i < steps; i++) {
      points.push({
        x: last.x + (dx * i) / steps,
        y: last.y + (dy * i) / steps,
        life: 1,
        size: 2 + Math.min(dist * 0.08, 6)
      })
    }

    last = { x: e.clientX, y: e.clientY }
  }

  function draw() {
    // IMPORTANT: no background fill (keeps brightness)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      p.life -= 0.035

      if (p.life <= 0) {
        points.splice(i, 1)
        i--
        continue
      }

      const alpha = p.life

      ctx.shadowColor = 'rgba(0, 102, 255, 0.9)'
      ctx.shadowBlur = 10

      ctx.fillStyle = `rgba(0, 180, 255, ${alpha * 0.25})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0

      ctx.fillStyle = `rgba(72, 132, 223, 0.9 ${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }

    requestAnimationFrame(draw)
  }

  window.addEventListener('mousemove', move)
  draw()

  return () => window.removeEventListener('mousemove', move)
}, [])

 
  function pick() {
    if (!champions.length || !runes) return

    const champPick = champions[Math.floor(Math.random() * champions.length)]

    const primaryTree = runes[Math.floor(Math.random() * runes.length)]

    let secondaryTree = runes[Math.floor(Math.random() * runes.length)]
    while (secondaryTree.name === primaryTree.name) {
      secondaryTree = runes[Math.floor(Math.random() * runes.length)]
    }


    const keystone =
      primaryTree.slots[0].runes[
        Math.floor(Math.random() * primaryTree.slots[0].runes.length)
      ]

    const primaryOthers = primaryTree.slots
      .slice(1)
      .flatMap(s => s.runes)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)

    
    const secondary = secondaryTree.slots
      .slice(1)
      .flatMap(s => s.runes)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)

    const riotId = toRiotChampionId(champPick.name)

    setChamp({
      ...champPick,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${riotId}_0.jpg`
    })

    setPrimary([keystone, ...primaryOthers])
    setSecondary(secondary)
  }

 
  function getIcon(iconPath) {
    return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`
  }

  
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      />

      <div className="layout">
        <div className="sidebar left-bg" />

        <div className="main">
          <h1 className="header-title">LoL Randomizer</h1>

          <div className="content">
            <button onClick={pick}>RANDOMIZE</button>

            {champ && (
              <div className="champ-card">
                <h2>{champ.name}</h2>

                <img
                  src={champ.splash}
                  style={{ width: 420, borderRadius: 12 }}
                />

                {/* PRIMARY */}
                <div className="rune-primary">
                  <img
                    className="rune-keystone"
                    src={getIcon(primary[0].icon)}
                  />

                  {primary.slice(1).map(r => (
                    <img
                      key={r.name}
                      className="rune-primary-small"
                      src={getIcon(r.icon)}
                    />
                  ))}
                </div>

                {/* SECONDARY */}
                <div className="rune-secondary" style={{ marginTop: 12 }}>
                  {secondary.map(r => (
                    <img
                      key={r.name}
                      src={getIcon(r.icon)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar right-bg" />
      </div>
    </>
  )
}