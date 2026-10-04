type IconProps = { readonly size?: number; readonly color?: string; readonly strokeWidth?: number };

const Svg: React.FC<IconProps & { readonly children: React.ReactNode }> = ({ size = 48, color = "currentColor", strokeWidth = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const ShieldCheck: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Svg>
);

export const Contract: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 12h6M10 16h6" />
  </Svg>
);

export const Bolt: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </Svg>
);

export const Check: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);

export const Code: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
  </Svg>
);
