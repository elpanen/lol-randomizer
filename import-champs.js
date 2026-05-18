import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log("Fetching champions...")

  const res = await fetch(
    "https://ddragon.leagueoflegends.com/cdn/14.1.1/data/en_US/champion.json"
  )

  const json = await res.json()

 const champs = Object.values(json.data).map((c) => ({
  name: c.name
}))

  console.log(`Found ${champs.length} champions`)

  const { error } = await supabase
    .from("champions")
    .insert(champs)

  if (error) {
    console.error("ERROR:", error)
  } else {
    console.log("DONE: inserted champions")
  }
}

run()