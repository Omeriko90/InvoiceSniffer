import React from 'react';

export const getValidReactChildren = (children: React.ReactNode) =>
  React.Children.toArray(children).filter((child) => React.isValidElement(child));
