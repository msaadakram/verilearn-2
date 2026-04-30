import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${
        hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : 'shadow-md'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`mb-2 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[var(--muted-foreground)] leading-relaxed ${className}`}>{children}</p>;
}
