export function DashboardSkeleton() {
  return (
    <div className="relative">
      {/* Loading Spinner Overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-safee-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>

      {/* Skeleton Content Behind */}
      <div className="max-w-[1400px] mx-auto p-6 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-5 w-64 bg-gray-100 rounded"></div>
        </div>

      {/* Module shortcuts skeleton */}
      <div className="flex gap-3 overflow-x-auto py-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[100px]">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-16 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 rounded-full"></div>
        ))}
      </div>

      {/* Widgets grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit & Loss Widget */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-100 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-gray-100 rounded-full"></div>
            <div className="h-3 w-full bg-gray-100 rounded-full"></div>
          </div>
        </div>

        {/* Expenses Widget */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-40 bg-gray-100 rounded"></div>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Bank Accounts Widget */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-100 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add widgets skeleton */}
      <div className="text-center py-8">
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto"></div>
      </div>

      {/* Smart suggestions skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-48 bg-gray-100 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                <div className="h-3 w-64 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
