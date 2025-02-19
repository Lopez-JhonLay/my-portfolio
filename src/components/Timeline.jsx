export function Timeline() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        <div className="absolute h-full border-l-2 border-gray-300 left-1/2 transform -translate-x-1/2"></div>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-full md:w-1/2 md:pr-8">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold">All Ops Engineer</h3>
                <p className="text-gray-600">
                  Centre of Excellence for GenAI, Cambridge
                </p>
                <p className="text-gray-500">2025</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-8 mt-4 md:mt-0"></div>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-full md:w-1/2 md:pr-8"></div>
            <div className="w-full md:w-1/2 md:pl-8">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold">
                  Senior Full-Stack Developer
                </h3>
                <p className="text-gray-600">Core Technology, Cambridge</p>
                <p className="text-gray-500">2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
