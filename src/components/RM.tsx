
interface Props {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function RM({ amount, size = 'md', className = '' }: Props) {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-bold',
    xl: 'text-3xl font-bold',
  }[size];

  return (
    <span className={`text-amber-400 font-mono ${sizeClass} ${className}`}>
      RM{amount.toLocaleString()}
    </span>
  );
}
