import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Icon, type IconName } from './Icon';
import { Spinner } from './States';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  block?: boolean;
  children?: ReactNode;
}

function classes({ variant = 'secondary', size = 'md', block }: CommonProps, extra?: string) {
  return ['btn', `btn-${variant}`, `btn-${size}`, block ? 'btn-block' : '', extra ?? ''].filter(Boolean).join(' ');
}

export interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Shows a spinner, disables the button and sets aria-busy (prevents double submits). */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconEnd, block, loading, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes({ variant, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children != null && <span className="btn-label">{children}</span>}
      {iconEnd && !loading ? <Icon name={iconEnd} size={size === 'sm' ? 16 : 18} /> : null}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: IconName;
  /** Accessible name (required — icon-only buttons need a label). */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }, ref) {
  return (
    <Button ref={ref} variant={variant} size={size} className={`btn-icon ${className ?? ''}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </Button>
  );
});

export function LinkButton({ variant, size, icon, iconEnd, block, children, className, ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={classes({ variant, size, block }, className)} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children != null && <span className="btn-label">{children}</span>}
      {iconEnd ? <Icon name={iconEnd} size={size === 'sm' ? 16 : 18} /> : null}
    </Link>
  );
}
