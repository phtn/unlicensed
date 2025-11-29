interface BadgeProps {
  text: string
  bgColor: string
  shadowColor: string
}

// The Badge component is highly reusable and mimics the design style from the image.
const Badge = ({text, bgColor, shadowColor}: BadgeProps) => {
  // Custom class for the neon text effect (subtle dark shadow/outline for pop)
  const neonTextClass = 'text-black text-shadow-dark-sm'

  return (
    <div
      className={`
        // Base styling for the pill shape and typography
        ${bgColor}
        px-10 py-5 mx-4 my-4 w-64
        rounded-[3rem] shadow-xl
        font-['Bebas_Neue'] font-extrabold text-5xl uppercase
        select-none cursor-default
        // Custom classes for the glow/pop effect
        badge-pop
      `}
      style={{
        boxShadow: `0 8px 15px -3px ${shadowColor}`, // Default box shadow
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      // Add hover effect for a modern interactive touch
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 12px 20px -5px ${shadowColor}`
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 8px 15px -3px ${shadowColor}`
      }}>
      {/* Increased font size to 5xl to accommodate the new condensed font */}
      <span className={neonTextClass}>{text}</span>
    </div>
  )
}

// Main application component
export const GBadges = () => {
  // Define the colors based on the image provided
  const badgesData = [
    {text: 'NEW', bgColor: 'bg-[#FF33CC]', shadowColor: '#FF33CC', key: 1}, // Bright Pink/Magenta
    {text: 'FEATURED', bgColor: 'bg-[#00A3FF]', shadowColor: '#00A3FF', key: 2}, // Bright Blue/Cyan
    {text: 'SALE', bgColor: 'bg-[#7A00FF]', shadowColor: '#7A00FF', key: 3}, // Bright Purple/Violet
    {text: 'LIMITED', bgColor: 'bg-[#99FF00]', shadowColor: '#99FF00', key: 4}, // Bright Lime Green/Chartreuse
  ]

  return (
    <div className='min-h-screen bg-black flex items-center justify-center p-8 w-fit'>
      {/* This style block contains custom CSS, including the import for the new 'Bebas Neue' font. */}
      <style>{`
        /* Import the new, modern display font */
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        /* Custom text shadow for the bold black text to pop */
        .text-shadow-dark-sm {
          text-shadow:
            1px 1px 0 #333,
            -1px -1px 0 #333,
            1px -1px 0 #333,
            -1px 1px 0 #333,
            0 0 5px rgba(0, 0, 0, 0.5);
        }

        /* Subtle gradient overlay for the 3D-like 'pop' effect on the badge */
        .badge-pop {
          position: relative;
          overflow: hidden; /* Ensures gradient doesn't spill over */
        }

        /* Adds a subtle white-to-transparent gradient on top for a 'glossy' feel */
        .badge-pop::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 3rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(0, 0, 0, 0.05) 100%
          );
          pointer-events: none; /* Allows clicks to pass through to the div */
        }
      `}</style>

      {/* Container for the 2x2 grid layout */}
      <div className='grid grid-cols-2 md:grid-cols-2 gap-4'>
        {badgesData.map((badge) => (
          <Badge
            key={badge.key}
            text={badge.text}
            bgColor={badge.bgColor}
            shadowColor={badge.shadowColor}
          />
        ))}
      </div>
    </div>
  )
}
