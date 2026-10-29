import React from 'react';
import {
  Bike,
  Building2,
  Car,
  Coffee,
  Cookie,
  Film,
  Fuel,
  Gift,
  Heart,
  Hotel,
  MoreHorizontal,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';

export interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({
  name,
  className = 'h-5 w-5',
}: CategoryIconProps) {
  switch (name) {
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'Cookie':
      return <Cookie className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Bike':
      return <Bike className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Hotel':
      return <Hotel className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Fuel':
      return <Fuel className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
}
