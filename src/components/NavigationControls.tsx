import { ArrowLeft, ArrowRight, RotateCw, X, Minus, Square } from 'lucide-react';

function handleBack() {
  // No-op
}
function handleForward() {
  // No-op
}
function handleRefresh() {
  // No-op
}
function handleMinimize() {
  // No-op
}
function handleMaximize() {
  // No-op
}
function handleClose() {
  // No-op
}

export function NavigationControls() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 backdrop-blur-md border-b border-gray-700 text-white shadow-lg">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleForward}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowRight size={18} />
        </button>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <RotateCw size={18} />
        </button>
      </div>

      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Search or enter address"
          className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-200 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <Minus size={18} />
        </button>
        <button
          onClick={handleMaximize}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <Square size={18} />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-600 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
