import { type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { useEmailProvider, type UseEmailProviderResult } from './useEmailProvider';

export interface EmailProviderLinkProps {
  email: string;
  children?: ReactNode | ((state: UseEmailProviderResult) => ReactNode);
  fallback?: ReactNode;
}

/**
 * Renders a control that opens the detected provider's login URL.
 * Renders `fallback` when the address is unknown or has no login URL.
 */
export function EmailProviderLink({
  email,
  children,
  fallback = null
}: EmailProviderLinkProps) {
  const state = useEmailProvider(email);
  const loginUrl = state.provider?.loginUrl;

  if (!loginUrl || !state.provider) {
    return <>{fallback}</>;
  }

  const content = typeof children === 'function'
    ? children(state)
    : children ?? <Text>{`Open ${state.provider.companyProvider}`}</Text>;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        void state.openLogin().catch(() => undefined);
      }}
    >
      {content}
    </Pressable>
  );
}
