interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Recipe Details
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Recipe ID: {id}</p>
      </header>

      <main>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Recipe Placeholder</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a placeholder page for individual recipe details. The full
            recipe display functionality will be implemented in later tasks.
          </p>
        </div>
      </main>
    </div>
  );
}
