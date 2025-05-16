import PlayersInfiniteList from "@/components/exotic/PlayersInfiniteList"

export default async function PlayersPage() {
    // Petición al endpoint para la página 1
    const res = await fetch('http://localhost:8000/players/sortedbyppg/1')
    const initialPlayers = await res.json()

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">NBA Players</h1>
            {/* Le pasamos initialPlayers como prop */}
            <PlayersInfiniteList dehydratedState={initialPlayers} />
        </div>
    )
}