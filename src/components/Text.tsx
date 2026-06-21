import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

export interface TextProps extends RNTextProps {}

export const Text: React.FC<TextProps> = (props) => {
  const { style, ...rest } = props;
  
  // Resolve styles into a flat object
  const flatStyle = React.useMemo(() => {
    if (!style) return {};
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return style as TextStyle;
  }, [style]);

  // Map font weights to specific Inter fonts for cross-platform compatibility
  let fontFamily = 'Inter_500Medium'; // Made bolder by default per user request
  const weight = flatStyle.fontWeight;
  
  if (weight === 'bold' || weight === '700') {
    fontFamily = 'Inter_700Bold';
  } else if (weight === 'normal' || weight === '400') {
    fontFamily = 'Inter_500Medium'; // Mapped normal to 500 Medium for better readability
  } else if (weight === '100' || weight === '200' || weight === '300') {
    fontFamily = 'Inter_300Light';
  } else if (weight === '500') {
    fontFamily = 'Inter_500Medium';
  } else if (weight === '600') {
    fontFamily = 'Inter_600SemiBold'; 
  } else if (weight === '800') {
    fontFamily = 'Inter_800ExtraBold';
  } else if (weight === '900' || weight === 'black') {
    fontFamily = 'Inter_900Black';
  }

  // Also handle font-family overrides if they were explicitly provided
  if (flatStyle.fontFamily && flatStyle.fontFamily.includes('Inter')) {
    fontFamily = flatStyle.fontFamily;
  }

  // Apply Apple SF Pro tracking table dynamically based on font size if not explicitly set
  let letterSpacing = flatStyle.letterSpacing;
  if (letterSpacing === undefined && flatStyle.fontSize !== undefined) {
    const size = flatStyle.fontSize;
    if (size <= 11) letterSpacing = 0.07;
    else if (size === 12) letterSpacing = 0;
    else if (size === 13) letterSpacing = -0.08;
    else if (size === 14) letterSpacing = -0.15;
    else if (size === 15) letterSpacing = -0.23;
    else if (size === 16) letterSpacing = -0.31;
    else if (size === 17) letterSpacing = -0.41;
    else if (size >= 18 && size < 20) letterSpacing = -0.45;
    else if (size >= 20 && size < 24) letterSpacing = -0.5;
    else if (size >= 24 && size < 28) letterSpacing = -0.6;
    else if (size >= 28 && size < 34) letterSpacing = -0.75;
    else if (size >= 34) letterSpacing = -0.9;
  }

  return (
    <RNText 
      {...rest} 
      style={[
        style, 
        { fontFamily, fontWeight: undefined, letterSpacing } // clear fontWeight to avoid Android crashes/fallbacks, apply tracking
      ]} 
    />
  );
};
