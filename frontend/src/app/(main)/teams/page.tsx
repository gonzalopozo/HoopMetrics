import type React from "react"

// import { useState, useEffect } from "react"
import { TeamCard } from "@/components/cards/team-card"
import axios from "axios"
import { Team } from "@/types"
import { getNBALogo } from "@/lib/utils"
// import { TeamsLoading } from "@/components/loading/teams-loading"
// import { Search, Filter } from "lucide-react"

export default async function TeamsPage() {
    // const [teams, setTeams] = useState<typeof SAMPLE_TEAMS>([])
    // const [loading, setLoading] = useState(true)
    // const [filter, setFilter] = useState({
    //     conference: "all",
    //     division: "all",
    //     search: "",
    // })

    // Simulate loading data
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setTeams(SAMPLE_TEAMS)
    //         setLoading(false)
    //     }, 1500) // 1.5 second delay to show skeleton

    //     return () => clearTimeout(timer)
    // }, [])

    // Filter teams based on search, conference, and division
    // const filteredTeams = teams.filter((team) => {
    //     const matchesSearch =
    //         team.name.toLowerCase().includes(filter.search.toLowerCase()) ||
    //         team.abbreviation.toLowerCase().includes(filter.search.toLowerCase())

    //     const matchesConference =
    //         filter.conference === "all" || team.conference.toLowerCase() === filter.conference.toLowerCase()

    //     const matchesDivision = filter.division === "all" || team.division.toLowerCase() === filter.division.toLowerCase()

    //     return matchesSearch && matchesConference && matchesDivision
    // })

    // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setFilter({ ...filter, search: e.target.value })
    // }

    // const handleConferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //     setFilter({ ...filter, conference: e.target.value })
    // }

    // const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //     setFilter({ ...filter, division: e.target.value })
    // }

    // if (loading) {
    //     return <TeamsLoading />
    // }

    const teamsRequest = await axios.get<Team[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/teams`
    )
    const teams = teamsRequest.data

    teams.forEach((team) => {
        team.logo = getNBALogo(team.name, { width: 120, height: 120, className: "h-auto max-h-full w-auto max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110" })
    })

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-foreground">NBA Teams</h1>

            {/* Filters and Search */}
            {/* <div className="mb-6 flex flex-wrap gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm"
                        value={filter.search}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm"
                            value={filter.conference}
                            onChange={handleConferenceChange}
                        >
                            <option value="all">All Conferences</option>
                            <option value="eastern">Eastern</option>
                            <option value="western">Western</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm"
                            value={filter.division}
                            onChange={handleDivisionChange}
                        >
                            <option value="all">All Divisions</option>
                            <option value="atlantic">Atlantic</option>
                            <option value="central">Central</option>
                            <option value="southeast">Southeast</option>
                            <option value="northwest">Northwest</option>
                            <option value="pacific">Pacific</option>
                            <option value="southwest">Southwest</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
            </div> */}

            {/* Teams Grid - Bento Layout */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teams.length > 0 ? (
                    teams.map((team) => <TeamCard key={team.id} {...team} />)
                ) : (
                    <div className="col-span-full rounded-lg border border-border bg-card p-12 text-center">
                        <h3 className="text-lg font-medium">No teams found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    )
}
