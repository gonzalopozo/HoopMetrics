import PlayersInfiniteList from "@/components/exotic/PlayersInfiniteList"
import axios from "axios"


export default async function PlayersPage() {
    // Petición al endpoint para la página 1
    const res = await axios.get(`${process.env.NEXT_PUBLIC_NEXT_PUBLIC_NEXT_PUBLIC_API_URL}/players/sortedbyppg/1`)
    const initialPlayers = res.data

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">NBA Players</h1>
            {/* Le pasamos initialPlayers como prop */}
            <PlayersInfiniteList dehydratedState={initialPlayers} />
        </div>
    )
}