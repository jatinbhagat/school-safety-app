import Image from 'next/image';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
  showText?: boolean;
}

const sizeClasses = {
  xs: 'h-8 w-5', // 32px height, proportional width
  sm: 'h-10 w-6', // 40px height, proportional width  
  md: 'h-14 w-9', // 56px height, proportional width
  lg: 'h-20 w-12', // 80px height, proportional width
  xl: 'h-24 w-16', // 96px height, proportional width
};

const textSizeClasses = {
  xs: 'text-lg font-bold',
  sm: 'text-xl font-bold',
  md: 'text-2xl font-bold',
  lg: 'text-3xl font-bold',
  xl: 'text-4xl font-bold',
};

export default function Logo({ size = 'md', className = '', priority = false, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={sizeClasses[size]}>
        <Image
          src="/logo.png"
          alt="SafelyNotify"
          width={500}
          height={800}
          className="h-full w-full object-contain"
          priority={priority}
        />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} text-blue-600`}>
          SafelyNotify
        </span>
      )}
    </div>
  );
}