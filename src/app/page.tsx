export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Recipe Management System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Organize, categorize, and manage your recipes with ease
        </p>
      </header>

      <main>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome to your Recipe Collection
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your recipe management system is ready! This is a placeholder page
            that will be replaced with the full recipe list and folder
            organization system in the next implementation tasks.
          </p>
        </div>
      </main>
    </div>
  );
}
