import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

// Animation directions for page transitions
type AnimationDirection = 'forward' | 'backward' | 'fade' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  location?: string; // Current location path
  className?: string; // Additional classes for the transition container
  duration?: number; // Animation duration in milliseconds
}

/**
 * PageTransition component
 * 
 * This component provides smooth transitions between pages in a single-page application.
 * It handles forward, backward, and fade transitions based on navigation direction.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  duration = 300, // Default animation duration: 300ms
}) => {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const [direction, setDirection] = useState<AnimationDirection>('none');
  const prevLocationRef = useRef(location);

  // Create the CSS variable for animation timing
  const transitionStyle = {
    ['--page-transition-duration' as string]: `${duration}ms`,
  };

  useEffect(() => {
    // Don't animate on first render
    if (prevLocationRef.current === location) return;

    // Determine animation direction based on navigation path
    // This is a simple heuristic - you can customize as needed
    const prev = prevLocationRef.current;
    let animDirection: AnimationDirection = 'forward';

    // If going back to a parent route
    if (location.split('/').length < prev.split('/').length) {
      animDirection = 'backward';
    } 
    // If going to an entirely different section
    else if (!location.includes(prev.split('/')[1]) && prev !== '/') {
      animDirection = 'fade';
    }

    setDirection(animDirection);
    setTransitionStage('fadeOut');

    // Store the new location as the previous location for next transition
    prevLocationRef.current = location;

    // After animation duration, update the displayed location and fade in
    const timeout = setTimeout(() => {
      setDisplayLocation(location);
      setTransitionStage('fadeIn');
    }, duration);

    return () => clearTimeout(timeout);
  }, [location, duration]);

  // Calculate animation classes based on transition stage and direction
  const getAnimationClass = () => {
    if (transitionStage === 'fadeOut') {
      switch (direction) {
        case 'forward': return 'animate-slide-out-left';
        case 'backward': return 'animate-slide-out-right';
        case 'fade': return 'animate-fade-out';
        default: return 'animate-fade-out';
      }
    } else {
      switch (direction) {
        case 'forward': return 'animate-slide-in-right';
        case 'backward': return 'animate-slide-in-left';
        case 'fade': return 'animate-fade-in';
        default: return 'animate-fade-in';
      }
    }
  };

  return (
    <div 
      className={`page-transition ${getAnimationClass()} ${className}`} 
      style={transitionStyle}
    >
      {/* Render the children with the current displayLocation */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Pass the displayLocation as a prop to the child
          return React.cloneElement(child, { key: displayLocation });
        }
        return child;
      })}
    </div>
  );
};

export default PageTransition;