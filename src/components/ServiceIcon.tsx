import React from 'react';
import {
  Paintbrush,
  ShieldAlert,
  Grid,
  Layers,
  Home,
  KeyRound,
  Wind,
  Wrench,
  Trash2,
  Sparkles,
  Droplets,
  Headset,
  Hammer,
  HelpCircle,
  LucideProps
} from 'lucide-react';

interface ServiceIconProps extends LucideProps {
  name: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Paintbrush':
      return <Paintbrush {...props} />;
    case 'ShieldAlert':
      return <ShieldAlert {...props} />;
    case 'Grid':
      return <Grid {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'KeyRound':
      return <KeyRound {...props} />;
    case 'Wind':
      return <Wind {...props} />;
    case 'Wrench':
      return <Wrench {...props} />;
    case 'Trash2':
      return <Trash2 {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Droplets':
      return <Droplets {...props} />;
    case 'Headset':
      return <Headset {...props} />;
    case 'Hammer':
      return <Hammer {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
};
