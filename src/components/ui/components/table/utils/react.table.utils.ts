export function mapAlignToFlex(align: 'center' | 'right' | 'left' | undefined) {
  switch (align) {
    case 'center':
      return 'justify-center';
    case 'right':
      return 'justify-end';
    case 'left':
      return 'justify-start';
  }
}
