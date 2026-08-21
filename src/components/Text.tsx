import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

export interface TextProps extends RNTextProps {}

// System-font pipeline: SF Pro on iOS, platform system font elsewhere.
// No custom fontFamily is ever set — numeric fontWeight passes through to the
// system font, which resolves genuine ultra-light…black weights natively.
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
        { letterSpacing } // SF Pro tracking only — font family and weight stay native
      ]}
    />
  );
};
