const placeholderSections = [
  "Popular Courses",
  "Recent Questions",
  "Useful Resources",
  "Upcoming Study Groups",
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-red-950 sm:text-5xl">
            TXST Study Hub
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            Find questions, experiences, resources, and study groups for your
            TXST courses.
          </p>
        </div>

        <div className="mt-8 max-w-2xl">
          <label
            htmlFor="course-search"
            className="text-sm font-medium text-slate-700"
          >
            Search for a course
          </label>
          <input
            id="course-search"
            type="search"
            placeholder="Try CS 3358, MATH 2471, BIO 1330..."
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {placeholderSections.map((title) => (
          <div
            key={title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              This section is ready for real content in a later step.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

