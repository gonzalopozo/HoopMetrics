import PlayersInfiniteList from "@/components/exotic/PlayersInfiniteList"
import axios from "axios"


export default async function PlayersPage() {
    // Petición al endpoint para la página 1
    const res = await axios.get(`${process.env.NEXT_PUBLIC_NEXT_PUBLIC_NEXT_PUBLIC_API_URL}/players/sortedbyppg/1`)
    const initialPlayers = res.data
    
    // Pasar la URL base como prop
    const apiUrl = process.env.NEXT_PUBLIC_NEXT_PUBLIC_API_URL!

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">NBA Players</h1>
            <PlayersInfiniteList 
                dehydratedState={initialPlayers} 
                apiUrl={apiUrl} 
            />
        </div>
    )
}