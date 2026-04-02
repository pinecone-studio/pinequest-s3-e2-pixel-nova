import 'react-native-gesture-handler';

import React from 'react';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Нүүр</Label>
        <Icon sf="house.fill" drawable="ic_menu_mylocation" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exam">
        <Label>Шалгалт</Label>
        <Icon sf="doc.text.fill" drawable="ic_menu_agenda" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Label>Ахиц</Label>
        <Icon sf="chart.bar.fill" drawable="ic_menu_sort_by_size" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Профайл</Label>
        <Icon sf="person.fill" drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
