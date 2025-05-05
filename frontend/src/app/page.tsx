"use client"

import { useEffect, useState } from "react"

import { Navbar } from "./components/layout/navbar"
import { PlayerCard } from "./components/players/player-card"
import { PlayerModal } from "./components/players/player-modal"
import { Player } from "@/lib/data"

export default function Home() {
  const [originalData, setOriginalData] = useState<Player[] | null>(null)
  const [filteredData, setFilteredData] = useState<Player[] | null>(null)
  const [searchBarValue, setSearchBarValue] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://hoopmetrics-api.onrender.com/players');
        const data = await res.json();
        console.log('API response:', data);
        setOriginalData(data);
        setFilteredData(data); // Initialize filtered data with all players
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchBarValue(value);
    
    if (!originalData) return;
    
    if (value.trim() === '') {
      // If search is empty, show all players
      setFilteredData(originalData);
    } else {
      // Filter by player name (case insensitive)
      const filtered = originalData.filter(player => 
        player.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">

      <Navbar searchValue={searchBarValue} onSearchChange={handleSearchChange} />

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">NBA Players</h1>

        {filteredData?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{`Jugadores no encontrados con "${searchBarValue}"`}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredData?.map((player, i) => (
              <PlayerCard key={i} player={player} onClick={handlePlayerClick} />
            ))}
          </div>
        )}
      </main>

      {/* Player Details Modal */}
      <PlayerModal player={selectedPlayer} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}