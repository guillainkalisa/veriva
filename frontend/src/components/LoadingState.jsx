import Spinner from './Spinner'

export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 text-sm animate-fade-in">
      <Spinner size={24} className="text-brand-500" />
      {label}
    </div>
  )
}
