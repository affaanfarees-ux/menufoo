export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          className={`${sizes[size]} transition-transform ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'
          } ${star <= (value || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
          style={{ background: 'none', border: 'none', padding: '0 1px' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}
