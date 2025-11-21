import Image from 'next/image';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-auto', // 24px height
  sm: 'h-8 w-auto', // 32px height  
  md: 'h-12 w-auto', // 48px height
  lg: 'h-16 w-auto', // 64px height
  xl: 'h-20 w-auto', // 80px height
};

export default function Logo({ size = 'md', className = '', priority = false }: LogoProps) {
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image
        src="/logo.svg"
        alt="SafelyNotify"
        width={500}
        height={800}
        className="h-full w-auto object-contain"
        priority={priority}
      />
    </div>
  );
}