// export default function Page() {
//     return (
//         <div>

import PlayersInfiniteList from "@/components/exotic/PlayersInfiniteList"



//             {/* Loading indicator (placeholder for infinite scroll) */}
//             {/* <div className="mt-8 flex justify-center">
//                 <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
//             </div> */}
//         </div>
//     )
// }


// export default async function Page() {

//     const request = await fetch(`http://localhost:8000/players/sortedbyppg/1`);
//     const response = await request.json();

//     return (
//         <div>
//             {/* Players Grid - Bento Layout with better tablet support */}
//             <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
//                 {/* <PlayersList initialData={response} /> */}
//             </div>
//         </div>
//     )

//     //   return;
// }


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