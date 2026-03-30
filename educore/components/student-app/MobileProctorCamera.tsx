import Constants from 'expo-constants';
import { CameraView } from 'expo-camera';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/student-app/ui';

type MobileProctorCameraProps = {
  isEnabled: boolean;
  permissionGranted: boolean;
};

const isExpoGoEnvironment = () =>
  Constants.appOwnership === 'expo' || Constants.expoVersion != null;

export default function MobileProctorCamera({
  isEnabled,
  permissionGranted,
}: MobileProctorCameraProps) {
  if (!isEnabled) {
    return null;
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.card, styles.warningCard]} testID="mobile-proctor-camera">
        <View style={styles.header}>
          <Text style={styles.title}>Шалгалтын камер</Text>
          <Pill label="Зөвшөөрөл" tone="warning" />
        </View>
        <Text style={styles.message}>
          Камерын зөвшөөрөлгүй тул шалгалтыг энэ build дээр эхлүүлэх боломжгүй.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="mobile-proctor-camera">
      <View style={styles.header}>
        <Text style={styles.title}>Шалгалтын камер</Text>
        <Pill
          label={isExpoGoEnvironment() ? 'Expo Go preview' : 'Preview идэвхтэй'}
          tone={isExpoGoEnvironment() ? 'warning' : 'success'}
        />
      </View>
      <View style={styles.previewShell}>
        <CameraView
          style={StyleSheet.absoluteFill}
          active={isEnabled}
          facing="front"
          mirror
        />
      </View>
      <Text style={styles.message}>
        {isExpoGoEnvironment()
          ? 'Expo Go дээр одоогоор зөвхөн camera preview ажиллана. Live face detection нь development build шаардлагатай.'
          : 'Front camera preview шалгалтын үеэр идэвхтэй байна.'}
      </Text>
      <Text style={styles.debug}>
        Status: preview ready | mode: {isExpoGoEnvironment() ? 'expo-go' : 'native'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFCF5',
    borderRadius: 24,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E7DDCB',
  },
  warningCard: {
    borderColor: '#D8AA6B',
    backgroundColor: '#FFF7E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2A24',
  },
  previewShell: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#18211E',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E655D',
  },
  debug: {
    fontSize: 12,
    color: '#7A7A72',
  },
});
