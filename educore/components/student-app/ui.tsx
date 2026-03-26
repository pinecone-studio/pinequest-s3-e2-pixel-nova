import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AppScreen({
  children,
  scroll = false,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenInner, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenInner, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.buttonPrimary,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !(disabled || loading) && styles.buttonPressed,
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFF8E8" />
      ) : (
        <Text style={styles.buttonPrimaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonSecondaryText}>{label}</Text>
    </Pressable>
  );
}

export function InputField({
  label,
  multiline,
  ...props
}: TextInputProps & {
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, props.style]}
        placeholderTextColor="#7A7A72"
      />
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

export const uiStyles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE6D4',
  },
  statLabel: {
    fontSize: 13,
    color: '#6A655B',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A1F',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  keyboard: {
    flex: 1,
  },
  screenInner: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFCF5',
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    shadowColor: '#5A4630',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionHeader: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1D2A24',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5E655D',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#274336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCCFB6',
    backgroundColor: '#FFF9ED',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2A1F',
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  buttonPrimary: {
    backgroundColor: '#2D6A4F',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#FFF8E8',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonSecondary: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDBFA7',
    backgroundColor: '#FFF8EA',
  },
  buttonSecondaryText: {
    color: '#6B5642',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  errorText: {
    color: '#A13131',
    fontSize: 14,
    lineHeight: 20,
  },
});
