import 'react-native-gesture-handler';

import React from 'react';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="ic_menu_mylocation" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exam">
        <Label>Exam</Label>
        <Icon sf="doc.text.fill" drawable="ic_menu_agenda" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Label>Progress</Label>
        <Icon sf="chart.bar.fill" drawable="ic_menu_sort_by_size" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard">
        <Label>Leaderboard</Label>
        <Icon sf="trophy.fill" drawable="ic_menu_upload" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
