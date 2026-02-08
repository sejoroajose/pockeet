'use client'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} pockeet. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-xs text-gray-400">Built on</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-600">Sui</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-600">Arc</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-600">ENS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}