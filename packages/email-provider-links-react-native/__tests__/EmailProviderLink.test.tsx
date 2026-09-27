import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, vi } from 'vitest';

const openURL = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('react-native', () => ({
  Linking: {
    openURL
  },
  Pressable: ({
    children,
    onPress
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => React.createElement('Pressable', { onPress }, children),
  Text: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('Text', null, children)
}));

import { EmailProviderLink } from '../src/EmailProviderLink';
import { useEmailProvider } from '../src/useEmailProvider';

describe('EmailProviderLink', () => {
  beforeEach(() => {
    openURL.mockReset();
    openURL.mockImplementation(async () => {});
  });

  test('opens the Gmail login URL', async () => {
    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(React.createElement(EmailProviderLink, { email: 'user@gmail.com' }));
    });

    const pressable = renderer?.root.findByType('Pressable');
    await act(async () => {
      pressable?.props.onPress();
    });

    expect(openURL).toHaveBeenCalledWith('https://mail.google.com/mail/');
    expect(renderer?.root.findByType('Text').props.children).toBe('Open Gmail');
  });

  test('renders the fallback when the domain is unknown', async () => {
    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(
        React.createElement(EmailProviderLink, {
          email: 'person@example.com',
          fallback: React.createElement('Text', null, 'No provider')
        })
      );
    });

    expect(renderer?.root.findAllByType('Pressable')).toHaveLength(0);
    expect(renderer?.root.findByType('Text').props.children).toBe('No provider');
  });

  test('renders the fallback when a known provider has no login URL', async () => {
    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(
        React.createElement(EmailProviderLink, {
          email: 'user@privaterelay.appleid.com',
          fallback: React.createElement('Text', null, 'No link')
        })
      );
    });

    expect(renderer?.root.findAllByType('Pressable')).toHaveLength(0);
    expect(renderer?.root.findByType('Text').props.children).toBe('No link');
    expect(openURL).not.toHaveBeenCalled();
  });

  test('renders custom children instead of the default label', async () => {
    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(
        React.createElement(EmailProviderLink, {
          email: 'user@gmail.com',
          children: React.createElement('Text', null, 'Inbox')
        })
      );
    });

    expect(renderer?.root.findByType('Text').props.children).toBe('Inbox');
  });

  test('passes the provider to a render-prop child', async () => {
    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(
        React.createElement(EmailProviderLink, {
          email: 'user@gmail.com',
          children: (state: { provider: { loginUrl: string | null } | null }) =>
            React.createElement('Text', null, state.provider?.loginUrl)
        })
      );
    });

    expect(renderer?.root.findByType('Text').props.children).toBe('https://mail.google.com/mail/');
  });

  test('swallows a Linking.openURL rejection', async () => {
    openURL.mockRejectedValueOnce(new Error('cannot open'));
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      let renderer: ReturnType<typeof create> | undefined;
      await act(async () => {
        renderer = create(React.createElement(EmailProviderLink, { email: 'user@gmail.com' }));
      });

      await act(async () => {
        renderer?.root.findByType('Pressable').props.onPress();
        await Promise.resolve();
      });

      expect(openURL).toHaveBeenCalledWith('https://mail.google.com/mail/');
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});

describe('useEmailProvider', () => {
  test('returns the normalized provider for a Gmail alias', () => {
    function Probe({ email }: { email: string }) {
      const state = useEmailProvider(email);
      return React.createElement('Text', { testID: 'email' }, state.email);
    }

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(React.createElement(Probe, { email: 'User.Name+tag@gmail.com' }));
    });

    expect(renderer?.root.findByType('Text').props.children).toBe('username@gmail.com');
  });

  test('openLogin returns false when the provider has no login URL', async () => {
    openURL.mockClear();
    let opened: boolean | undefined;
    function Probe({ email }: { email: string }) {
      const state = useEmailProvider(email);
      return React.createElement('Pressable', {
        onPress: () => {
          void state.openLogin().then((value) => {
            opened = value;
          });
        }
      });
    }

    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(React.createElement(Probe, { email: 'user@privaterelay.appleid.com' }));
    });

    await act(async () => {
      renderer?.root.findByType('Pressable').props.onPress();
    });

    expect(opened).toBe(false);
    expect(openURL).not.toHaveBeenCalled();
  });
});
