import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withText?: boolean;
  className?: string;
  variant?: 'default' | 'circle' | 'square' | 'minimal';
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  withText = true,
  className = '',
  variant = 'default',
  theme = 'light'
}) => {
  // Determine logo size
  const logoSizes = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  // Determine text size
  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  // Colors based on theme
  const colors = {
    light: {
      primary: '#1E40AF', // Blue-800
      secondary: '#3B82F6', // Blue-500
      text: 'text-gray-800',
      gradient: 'from-blue-600 to-blue-800'
    },
    dark: {
      primary: '#60A5FA', // Blue-400
      secondary: '#93C5FD', // Blue-300
      text: 'text-white',
      gradient: 'from-blue-400 to-blue-500'
    }
  };

  const themeColors = colors[theme];

  // Render different logo variants
  const renderLogo = () => {
    switch (variant) {
      case 'circle':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`${logoSizes[size]} ${className}`}
          >
            {/* Circle background */}
            <circle cx="12" cy="12" r="11" fill={themeColors.primary} />
            
            {/* Stylized C */}
            <path 
              d="M16.5 8.5C15.5 7.5 14 7 12.5 7C9.5 7 7 9.5 7 12.5C7 15.5 9.5 18 12.5 18C14 18 15.5 17.5 16.5 16.5" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Accent line */}
            <path 
              d="M16.5 8.5L17.5 7.5" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
            
            <path 
              d="M16.5 16.5L17.5 17.5" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </svg>
        );
        
      case 'square':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`${logoSizes[size]} ${className}`}
          >
            {/* Square with rounded corners */}
            <rect x="2" y="2" width="20" height="20" rx="4" fill={themeColors.primary} />
            
            {/* Gradient overlay */}
            <rect 
              x="2" 
              y="2" 
              width="20" 
              height="20" 
              rx="4" 
              fill={`url(#gradient-${theme})`} 
              fillOpacity="0.6"
            />
            
            {/* Stylized C */}
            <path 
              d="M16 8C15 7 13.5 6.5 12 6.5C9 6.5 6.5 9 6.5 12C6.5 15 9 17.5 12 17.5C13.5 17.5 15 17 16 16" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Accent dot */}
            <circle cx="17" cy="12" r="1.5" fill="white" />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`gradient-${theme}`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor={themeColors.secondary} />
                <stop offset="1" stopColor={themeColors.primary} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        );
        
      case 'minimal':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`${logoSizes[size]} ${className}`}
          >
            {/* Stylized C with gradient */}
            <path 
              d="M18 8C16.5 6.5 14.5 5.5 12 5.5C8 5.5 5 8.5 5 12.5C5 16.5 8 19.5 12 19.5C14.5 19.5 16.5 18.5 18 17" 
              stroke={`url(#minimal-gradient-${theme})`}
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Accent line */}
            <path 
              d="M18 8L19.5 6.5" 
              stroke={themeColors.secondary}
              strokeWidth="3" 
              strokeLinecap="round"
            />
            
            <path 
              d="M18 17L19.5 18.5" 
              stroke={themeColors.secondary}
              strokeWidth="3" 
              strokeLinecap="round"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`minimal-gradient-${theme}`} x1="5" y1="12" x2="19" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor={themeColors.primary} />
                <stop offset="1" stopColor={themeColors.secondary} />
              </linearGradient>
            </defs>
          </svg>
        );
        
      default: // 'default'
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`${logoSizes[size]} ${className}`}
          >
            {/* Background shape - slightly rounded square */}
            <rect 
              x="2" 
              y="2" 
              width="20" 
              height="20" 
              rx="6" 
              fill={`url(#default-gradient-${theme})`}
            />
            
            {/* Stylized C */}
            <path 
              d="M16.5 8C15.5 7 13.5 6.5 12 6.5C9 6.5 6.5 9 6.5 12C6.5 15 9 17.5 12 17.5C13.5 17.5 15.5 17 16.5 16" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Digital marketing accent - small nodes connected */}
            <circle cx="16.5" cy="8" r="1" fill="white" />
            <circle cx="16.5" cy="16" r="1" fill="white" />
            <circle cx="19" cy="12" r="1" fill="white" />
            
            <line x1="16.5" y1="8" x2="19" y2="12" stroke="white" strokeWidth="0.75" />
            <line x1="19" y1="12" x2="16.5" y2="16" stroke="white" strokeWidth="0.75" />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`default-gradient-${theme}`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor={themeColors.secondary} />
                <stop offset="1" stopColor={themeColors.primary} />
              </linearGradient>
            </defs>
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {renderLogo()}
      
      {withText && (
        <div className={`ml-2 font-bold ${textSizes[size]} ${themeColors.text}`}>
          <span className="bg-gradient-to-r bg-clip-text text-transparent font-extrabold tracking-tight whitespace-nowrap">
            <span className={`bg-gradient-to-r ${themeColors.gradient} bg-clip-text`}>
              Cdiscount
            </span>
            <span className="text-blue-600 dark:text-blue-400">Ads</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
