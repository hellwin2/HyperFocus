import clsx from 'clsx';

export function Button({ children, variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx('btn', variant === 'primary' ? 'btn-primary' : 'btn-outline', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }) {
  return <input className={clsx('input', className)} {...props} />;
}

export function Card({ children, className }) {
  return <div className={clsx('card', className)}>{children}</div>;
}
