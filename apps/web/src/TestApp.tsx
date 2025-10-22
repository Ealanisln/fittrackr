export function TestApp() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">FitTrack Test Page</h1>
      <p className="text-lg">If you can see this, React and Vite are working! ✅</p>

      <div className="mt-8 bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">API Test</h2>
        <button
          onClick={async () => {
            const response = await fetch('http://localhost:3001/api/workouts');
            const data = await response.json();
            console.log('API Response:', data);
            alert(`Got ${data.data?.length || 0} workouts!`);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Test API Connection
        </button>
      </div>
    </div>
  );
}
