import { controls, typography } from '@lib/styles';

export const Field = ({ id, label, as: Control = 'input', className = '', children, ...props }) => {
  const controlClass = Control === 'select' ? controls.select : controls.input;

  return (
    <div className={className}>
      <label htmlFor={id} className={typography.fieldLabel}>
        {label}
      </label>
      <Control id={id} className={controlClass} {...props}>
        {children}
      </Control>
    </div>
  );
};
