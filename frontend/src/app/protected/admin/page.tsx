export default function AdminPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl">Panel de administrador</h1>
            <p>Solo usuarios con rol <strong>admin</strong> pueden ver esta página.</p>
        </div>
    );
}